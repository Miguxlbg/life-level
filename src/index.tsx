import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getPlayerId, createSession, setSessionCookie, clearSession, requireAuth, hashPassword, verifyPassword } from './lib/auth'
import { startGoogleOAuth, handleGoogleCallback } from './lib/google-oauth'
import { analyzeAssessment, attributesFromAnalysis } from './procedural/analyzer'
import {
  getPlayer, getPlayerByNick, getAttributes, getAttributeMap, initAttributes,
  addAttributeGains, addXpAndCoins, createNotification, upsertSnapshot, incrementSnapshotMissions,
  addSkillGains
} from './lib/db'
import { ACHIEVEMENTS, RARITY_META, checkAchievements } from './lib/achievements'
import { getPlayerGuild, getGuildMembers, listGuilds, recomputeGuild, addGuildContribution } from './lib/guilds'
import {
  ATTRIBUTE_KEYS, ATTRIBUTE_META, calculateBMI, getLifePhase, getNextMilestone, todayStr
} from './lib/game'
import { ProceduralEngine, generateInsight, getInitialAttributesFromAssessment, detectCritical, PlayerCtx } from './procedural/engine'
import { checkDeathConditions, processDeath } from './lib/death'
import { renderApp } from './app-html'

type Bindings = { DB: D1Database; ANTHROPIC_API_KEY?: string }
export const app = new Hono<{ Bindings: Bindings; Variables: { playerId: string } }>()

// Injeta o banco Turso (libSQL) como c.env.DB quando rodando fora do
// Cloudflare (ex: Vercel/Node). No Cloudflare o binding nativo já existe
// e este middleware é no-op. Registrado PRIMEIRO para valer em todas as rotas.
app.use('*', async (c, next) => {
  // Detecta ausência de binding nativo (Cloudflare injeta c.env.DB).
  const hasNativeDb = c.env && (c.env as any).DB
  if (!hasNativeDb && typeof process !== 'undefined' && process.env?.TURSO_DATABASE_URL) {
    const { getDb } = await import('./lib/d1-adapter')
    if (!c.env) (c as any).env = {}
    ;(c.env as any).DB = getDb()
  }
  await next()
})

app.use('/api/*', cors())

// ============ AUTH ============
// Demo login — creates/loads a player without real Google (works in sandbox).
// In production, this is replaced by the Google OAuth callback.
app.post('/api/auth/demo', async (c) => {
  const db = c.env.DB
  const body = await c.req.json().catch(() => ({})) as any
  const email = (body.email || `player_${crypto.randomUUID().slice(0, 8)}@lifelvl.app`).toLowerCase()

  let player = await db.prepare('SELECT * FROM players WHERE email = ?').bind(email).first<any>()
  if (!player) {
    const id = crypto.randomUUID()
    await db.prepare(`INSERT INTO players (id, google_id, email, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)`)
      .bind(id, 'demo_' + id, email, body.name || 'Novo Jogador', body.picture || null).run()
    player = await getPlayer(db, id)
  }
  // update last login
  await db.prepare(`UPDATE players SET last_login_at = datetime('now'), is_online = 1 WHERE id = ?`).bind(player.id).run()

  const token = await createSession(db, player.id)
  setSessionCookie(c, token)

  return c.json({
    ok: true,
    redirect: player.onboarding_completed ? (player.assessment_completed ? '/app/status' : '/assessment') : '/onboarding',
    is_dead: player.is_dead,
  })
})

// ---- REGISTRO (criar conta com nome, nick, email, senha) ----
app.post('/api/auth/register', async (c) => {
  const db = c.env.DB
  const b = await c.req.json().catch(() => ({})) as any
  const name = (b.name || '').trim()
  const nick = (b.nick || '').trim()
  const email = (b.email || '').trim().toLowerCase()
  const password = b.password || ''

  // validações
  if (name.length < 2) return c.json({ error: 'Nome muito curto' }, 400)
  if (nick.length < 3) return c.json({ error: 'Codinome precisa de no mínimo 3 caracteres' }, 400)
  if (!/^[a-zA-Z0-9_]+$/.test(nick)) return c.json({ error: 'Codinome só pode ter letras, números e _' }, 400)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return c.json({ error: 'Email inválido' }, 400)
  if (password.length < 6) return c.json({ error: 'Senha precisa de no mínimo 6 caracteres' }, 400)

  // unicidade
  const emailExists = await db.prepare('SELECT id FROM players WHERE email = ?').bind(email).first()
  if (emailExists) return c.json({ error: 'Este email já está cadastrado. Faça login.' }, 400)
  const nickExists = await getPlayerByNick(db, nick)
  if (nickExists) return c.json({ error: 'Este codinome já está em uso' }, 400)

  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(password)
  const birthDate = (b.birth_date && /^\d{4}-\d{2}-\d{2}$/.test(b.birth_date)) ? b.birth_date : null
  await db.prepare(`INSERT INTO players (id, email, nick, display_name, password_hash, birth_date) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(id, email, nick, name, passwordHash, birthDate).run()
  await db.prepare(`UPDATE players SET last_login_at = datetime('now'), is_online = 1 WHERE id = ?`).bind(id).run()

  const token = await createSession(db, id)
  setSessionCookie(c, token)
  // novo usuário sempre vai para onboarding (nick já definido será confirmado lá)
  return c.json({ ok: true, redirect: '/onboarding', is_dead: 0 })
})

// ---- LOGIN (email + senha) ----
app.post('/api/auth/login', async (c) => {
  const db = c.env.DB
  const b = await c.req.json().catch(() => ({})) as any
  const email = (b.email || '').trim().toLowerCase()
  const password = b.password || ''
  if (!email || !password) return c.json({ error: 'Informe email e senha' }, 400)

  const player = await db.prepare('SELECT * FROM players WHERE email = ?').bind(email).first<any>()
  if (!player || !player.password_hash) return c.json({ error: 'Email ou senha incorretos' }, 401)
  const valid = await verifyPassword(password, player.password_hash)
  if (!valid) return c.json({ error: 'Email ou senha incorretos' }, 401)

  await db.prepare(`UPDATE players SET last_login_at = datetime('now'), is_online = 1 WHERE id = ?`).bind(player.id).run()
  await applyDailyStreak(db, player)

  const token = await createSession(db, player.id)
  setSessionCookie(c, token)
  return c.json({
    ok: true,
    redirect: player.onboarding_completed ? (player.assessment_completed ? (player.is_dead ? '/app/death' : '/app/status') : '/assessment') : '/onboarding',
    is_dead: player.is_dead,
  })
})

app.post('/api/auth/logout', async (c) => {
  await clearSession(c)
  return c.json({ ok: true })
})

// ---- GOOGLE OAUTH ----
app.get('/api/auth/google', (c) => startGoogleOAuth(c))
app.get('/api/auth/google/callback', (c) => handleGoogleCallback(c))
app.get('/api/auth/google/status', (c) => {
  const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  return c.json({ configured })
})

// ============ CALENDÁRIO ============
app.use('/api/calendar', requireAuth)
app.use('/api/calendar/*', requireAuth)

// Lista eventos (opcionalmente por mês: ?month=YYYY-MM)
app.get('/api/calendar', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const month = c.req.query('month') // YYYY-MM
  let rows
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const r = await db.prepare(`SELECT * FROM calendar_events WHERE player_id = ? AND substr(event_date,1,7) = ? ORDER BY event_date ASC, event_time ASC`).bind(id, month).all()
    rows = r.results
  } else {
    const r = await db.prepare(`SELECT * FROM calendar_events WHERE player_id = ? ORDER BY event_date ASC, event_time ASC LIMIT 200`).bind(id).all()
    rows = r.results
  }
  return c.json({ events: rows || [] })
})

// Cria evento/anotação
app.post('/api/calendar', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const b = await c.req.json() as any
  const title = (b.title || '').trim()
  const date = (b.event_date || '').trim()
  if (!title) return c.json({ error: 'Título obrigatório' }, 400)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return c.json({ error: 'Data inválida' }, 400)
  const eid = crypto.randomUUID()
  await db.prepare(`INSERT INTO calendar_events (id, player_id, title, notes, event_date, event_time, category, color, reminder, done)
    VALUES (?,?,?,?,?,?,?,?,?,0)`)
    .bind(eid, id, title, b.notes || '', date, b.event_time || null, b.category || 'nota', b.color || '#7c3aed', b.reminder ? 1 : 0).run()
  return c.json({ ok: true, id: eid })
})

// Atualiza evento (editar / marcar como feito)
app.patch('/api/calendar/:id', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const eid = c.req.param('id')
  const b = await c.req.json() as any
  const ev = await db.prepare('SELECT * FROM calendar_events WHERE id = ? AND player_id = ?').bind(eid, id).first<any>()
  if (!ev) return c.json({ error: 'Evento não encontrado' }, 404)
  await db.prepare(`UPDATE calendar_events SET title=?, notes=?, event_date=?, event_time=?, category=?, color=?, reminder=?, done=? WHERE id=?`)
    .bind(
      b.title ?? ev.title, b.notes ?? ev.notes, b.event_date ?? ev.event_date,
      b.event_time ?? ev.event_time, b.category ?? ev.category, b.color ?? ev.color,
      (b.reminder ?? ev.reminder) ? 1 : 0, (b.done ?? ev.done) ? 1 : 0, eid
    ).run()
  return c.json({ ok: true })
})

// Deleta evento
app.delete('/api/calendar/:id', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  await db.prepare('DELETE FROM calendar_events WHERE id = ? AND player_id = ?').bind(c.req.param('id'), id).run()
  return c.json({ ok: true })
})

// ============ PROTECTED ============
app.use('/api/player/*', requireAuth)
app.use('/api/attributes/*', requireAuth)
app.use('/api/attributes', requireAuth)
app.use('/api/missions/*', requireAuth)
app.use('/api/missions', requireAuth)
app.use('/api/activities', requireAuth)
app.use('/api/activities/*', requireAuth)
app.use('/api/snapshots/*', requireAuth)
app.use('/api/snapshots', requireAuth)
app.use('/api/skills', requireAuth)
app.use('/api/skills/*', requireAuth)
app.use('/api/shop/*', requireAuth)
app.use('/api/notifications', requireAuth)
app.use('/api/notifications/*', requireAuth)
app.use('/api/onboarding/*', requireAuth)
app.use('/api/assessment/*', requireAuth)
app.use('/api/death/*', requireAuth)
app.use('/api/guilds', requireAuth)
app.use('/api/guilds/*', requireAuth)
app.use('/api/achievements', requireAuth)
app.use('/api/achievements/*', requireAuth)

// ---- PLAYER ----
app.get('/api/player/me', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const player = await getPlayer(db, id)
  if (!player) return c.json({ error: 'Jogador não encontrado' }, 404)

  // touch last login & check death
  await db.prepare(`UPDATE players SET last_login_at = datetime('now'), is_online = 1 WHERE id = ?`).bind(id).run()
  await checkAchievements(db, id)

  const attrs = await getAttributes(db, id)
  const attrMap = await getAttributeMap(db, id)
  const milestone = getNextMilestone(player.level, player.xp, player.xp_to_next)
  const insight = generateInsight({
    nick: player.nick || 'Operador', level: player.level, focus_area: player.focus_area,
    streak_days: player.streak_days, attributes: attrMap, recentTemplateIds: []
  })

  const { results: notifs } = await db.prepare('SELECT * FROM notifications WHERE player_id = ? AND read = 0 ORDER BY created_at DESC LIMIT 20').bind(id).all()
  const guild = await getPlayerGuild(db, id)
  const achCount = await db.prepare('SELECT COUNT(*) as c FROM player_achievements WHERE player_id = ?').bind(id).first<any>()

  return c.json({ player, attributes: attrs, attributeMap: attrMap, milestone, insight, notifications: notifs || [], meta: ATTRIBUTE_META, guild, achievementCount: achCount?.c || 0 })
})

app.get('/api/player/check-nick', async (c) => {
  const nick = c.req.query('nick') || ''
  if (nick.length < 3) return c.json({ available: false, reason: 'Mínimo 3 caracteres' })
  const existing = await getPlayerByNick(c.env.DB, nick)
  // o próprio nick do jogador conta como disponível
  if (existing && existing.id === c.get('playerId')) return c.json({ available: true })
  return c.json({ available: !existing })
})

app.get('/api/player/profile/:nick', async (c) => {
  const db = c.env.DB
  const player = await getPlayerByNick(db, c.req.param('nick'))
  if (!player) return c.json({ error: 'not found' }, 404)
  const attrMap = await getAttributeMap(db, player.id)
  const guild = await getPlayerGuild(db, player.id)
  const { results: achRows } = await db.prepare('SELECT achievement_key FROM player_achievements WHERE player_id = ?').bind(player.id).all()
  const achKeys = (achRows || []).map((r: any) => r.achievement_key)
  // public-safe subset
  return c.json({
    nick: player.nick, title: player.title, level: player.level, xp: player.xp,
    avatar_url: player.avatar_url, avatar_emoji: player.avatar_emoji, focus_area: player.focus_area, streak_days: player.streak_days,
    death_count: player.death_count, attributeMap: attrMap, meta: ATTRIBUTE_META,
    created_at: player.created_at, guild, achievements: achKeys, missions_completed_total: player.missions_completed_total || 0
  })
})

// ---- AVATAR ----
app.post('/api/player/avatar', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const b = await c.req.json() as any
  // emoji avatar OR url avatar (mutually exclusive)
  if (b.avatar_emoji) {
    await db.prepare(`UPDATE players SET avatar_emoji = ?, avatar_url = NULL, updated_at = datetime('now') WHERE id = ?`).bind(String(b.avatar_emoji).slice(0, 4), id).run()
  } else if (b.avatar_url) {
    const url = String(b.avatar_url)
    if (!/^https?:\/\//.test(url)) return c.json({ error: 'URL inválida' }, 400)
    await db.prepare(`UPDATE players SET avatar_url = ?, avatar_emoji = NULL, updated_at = datetime('now') WHERE id = ?`).bind(url, id).run()
  } else {
    await db.prepare(`UPDATE players SET avatar_url = NULL, avatar_emoji = NULL, updated_at = datetime('now') WHERE id = ?`).bind(id).run()
  }
  return c.json({ ok: true })
})

// ---- GUILDS ----
app.get('/api/guilds', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const guilds = await listGuilds(db)
  const myGuild = await getPlayerGuild(db, id)
  let members: any[] = []
  if (myGuild) members = await getGuildMembers(db, myGuild.id)
  return c.json({ guilds, myGuild, members })
})

app.post('/api/guilds/create', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const b = await c.req.json() as any
  const name = (b.name || '').trim()
  if (name.length < 3) return c.json({ error: 'Nome muito curto (mín. 3)' }, 400)
  const existing = await getPlayerGuild(db, id)
  if (existing) return c.json({ error: 'Você já pertence a uma guilda' }, 400)
  const dup = await db.prepare('SELECT id FROM guilds WHERE name = ? COLLATE NOCASE').bind(name).first()
  if (dup) return c.json({ error: 'Nome de guilda já existe' }, 400)
  const gid = crypto.randomUUID()
  await db.prepare(`INSERT INTO guilds (id, name, description, emblem, emblem_color, owner_id, member_count, total_xp) VALUES (?,?,?,?,?,?,1,0)`)
    .bind(gid, name, b.description || '', b.emblem || '🛡️', b.emblem_color || '#7c3aed', id).run()
  await db.prepare(`INSERT INTO guild_members (guild_id, player_id, role) VALUES (?,?,'owner')`).bind(gid, id).run()
  await db.prepare('UPDATE players SET guild_id = ? WHERE id = ?').bind(gid, id).run()
  await checkAchievements(db, id)
  await createNotification(db, id, 'guild', '🏰 GUILDA FUNDADA', `Você fundou a guilda "${name}". Recrute aliados e domine o ranking.`)
  return c.json({ ok: true, guildId: gid })
})

app.post('/api/guilds/:id/join', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const gid = c.req.param('id')
  const existing = await getPlayerGuild(db, id)
  if (existing) return c.json({ error: 'Você já pertence a uma guilda' }, 400)
  const guild = await db.prepare('SELECT * FROM guilds WHERE id = ?').bind(gid).first<any>()
  if (!guild) return c.json({ error: 'Guilda não encontrada' }, 404)
  const player = await getPlayer(db, id)
  await db.prepare(`INSERT INTO guild_members (guild_id, player_id, role, contributed_xp) VALUES (?,?,'member',?)`).bind(gid, id, player.xp || 0).run()
  await db.prepare('UPDATE players SET guild_id = ? WHERE id = ?').bind(gid, id).run()
  await recomputeGuild(db, gid)
  await checkAchievements(db, id)
  await createNotification(db, id, 'guild', '🤝 GUILDA', `Você entrou na guilda "${guild.name}".`)
  return c.json({ ok: true })
})

app.post('/api/guilds/leave', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const myGuild = await getPlayerGuild(db, id)
  if (!myGuild) return c.json({ error: 'Você não está em uma guilda' }, 400)
  await db.prepare('DELETE FROM guild_members WHERE player_id = ? AND guild_id = ?').bind(id, myGuild.id).run()
  await db.prepare('UPDATE players SET guild_id = NULL WHERE id = ?').bind(id).run()
  // if owner left and members remain, promote next; if empty, delete guild
  const remaining = await getGuildMembers(db, myGuild.id)
  if (remaining.length === 0) {
    await db.prepare('DELETE FROM guilds WHERE id = ?').bind(myGuild.id).run()
  } else {
    if (myGuild.role === 'owner') {
      const next = await db.prepare('SELECT player_id FROM guild_members WHERE guild_id = ? ORDER BY contributed_xp DESC LIMIT 1').bind(myGuild.id).first<any>()
      if (next) {
        await db.prepare("UPDATE guild_members SET role = 'owner' WHERE guild_id = ? AND player_id = ?").bind(myGuild.id, next.player_id).run()
        await db.prepare('UPDATE guilds SET owner_id = ? WHERE id = ?').bind(next.player_id, myGuild.id).run()
      }
    }
    await recomputeGuild(db, myGuild.id)
  }
  return c.json({ ok: true })
})

// ---- ACHIEVEMENTS ----
app.get('/api/achievements', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  await checkAchievements(db, id) // refresh
  const { results } = await db.prepare('SELECT achievement_key, unlocked_at FROM player_achievements WHERE player_id = ?').bind(id).all()
  const unlocked = new Map((results || []).map((r: any) => [r.achievement_key, r.unlocked_at]))
  const all = ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlocked.has(a.key), unlocked_at: unlocked.get(a.key) || null, rarityMeta: RARITY_META[a.rarity] }))
  return c.json({ achievements: all, unlockedCount: unlocked.size, total: ACHIEVEMENTS.length })
})

// ---- ONBOARDING ----
app.post('/api/onboarding/complete', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const b = await c.req.json() as any
  const { bmi, bmiClass } = calculateBMI(b.height_cm, b.weight_kg)
  // idade a partir da data de nascimento (se enviada), senão usa age direto
  let age = Number(b.age) || 0
  let birthDate: string | null = null
  if (b.birth_date) {
    birthDate = String(b.birth_date)
    const bd = new Date(birthDate)
    if (!isNaN(bd.getTime())) {
      const diff = Date.now() - bd.getTime()
      age = Math.floor(diff / (365.25 * 86400000))
    }
  }
  const lifePhase = getLifePhase(age)

  // verify nick available
  const existing = await getPlayerByNick(db, b.nick)
  if (existing && existing.id !== id) return c.json({ error: 'Nick já em uso' }, 400)

  await db.prepare(`UPDATE players SET nick=?, display_name=?, age=?, birth_date=?, life_phase=?, biological_sex=?, height_cm=?, weight_kg=?, bmi=?, bmi_class=?, onboarding_completed=1, updated_at=datetime('now') WHERE id=?`)
    .bind(b.nick, b.nick, age, birthDate, lifePhase, b.biological_sex, b.height_cm, b.weight_kg, bmi, bmiClass, id).run()

  return c.json({ ok: true, bmi, bmiClass, lifePhase, age })
})

// ---- ASSESSMENT ----
app.post('/api/assessment/complete', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const a = await c.req.json() as any

  // ANÁLISE PROCEDURAL FORTE: interpreta respostas próprias (texto livre)
  const analysis = analyzeAssessment(a)
  const baseAttrs = attributesFromAnalysis(analysis)
  const focusArea = analysis.focusAreas[0] || a.primary_goal_area || 'mente'
  const primaryGoal = analysis.customGoals[0] || a.primary_goal || null

  await db.prepare(`INSERT INTO assessment_responses (id, player_id, satisfaction_score, critical_attribute, strongest_attribute, dopamine_drains, sleep_quality, discipline_level, trains_body, studies_consistently, finances_organized, social_life_healthy, primary_goal_area, raw_answers)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(crypto.randomUUID(), id, a.satisfaction_score ?? null, analysis.focusAreas[0] || a.critical_attribute || null, a.strongest_attribute || null,
      JSON.stringify(a.dopamine_drains || []), a.sleep_quality ? 1 : 0, a.discipline_level || null,
      a.trains_body ? 1 : 0, a.studies_consistently ? 1 : 0, a.finances_organized ? 1 : 0,
      a.social_life_healthy ? 1 : 0, focusArea, JSON.stringify({ ...a, _analysis: analysis })).run()

  await initAttributes(db, id, baseAttrs)

  // salva temas/metas/tom procedurais para reuso na geração de missões
  await db.prepare(`UPDATE players SET assessment_completed=1, focus_area=?, primary_goal=?, procedural_profile=?, updated_at=datetime('now') WHERE id=?`)
    .bind(focusArea, primaryGoal, JSON.stringify({
      themes: analysis.detectedThemes, customGoals: analysis.customGoals,
      toneTags: analysis.toneTags, intensity: analysis.intensity
    }), id).run()

  // generate first missions + snapshot
  const player = await getPlayer(db, id)
  await generateMissionsForPlayer(db, player)
  await upsertSnapshot(db, player, await getAttributeMap(db, id))
  await createNotification(db, id, 'welcome', 'SISTEMA ONLINE', `Bem-vindo, ${player.nick}. O Arquiteto analisou suas respostas e mapeou sua progressão. Cada escolha agora é registrada.`)

  return c.json({ ok: true, baseAttributes: baseAttrs, analysis })
})

// ---- ATTRIBUTES ----
app.get('/api/attributes', async (c) => {
  const attrs = await getAttributes(c.env.DB, c.get('playerId'))
  return c.json({ attributes: attrs, meta: ATTRIBUTE_META })
})

// ---- MISSIONS ----
app.get('/api/missions', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const { results } = await db.prepare(`SELECT * FROM missions WHERE player_id = ? AND status = 'active' ORDER BY
    CASE type WHEN 'event' THEN 0 WHEN 'daily' THEN 1 WHEN 'weekly' THEN 2 ELSE 3 END, created_at DESC`).bind(id).all()
  return c.json({ missions: results || [] })
})

app.post('/api/missions/:id/complete', async (c) => {
  const db = c.env.DB
  const playerId = c.get('playerId')
  const missionId = c.req.param('id')
  const mission = await db.prepare('SELECT * FROM missions WHERE id = ? AND player_id = ?').bind(missionId, playerId).first<any>()
  if (!mission) return c.json({ error: 'Missão não encontrada' }, 404)
  if (mission.status === 'completed') return c.json({ error: 'Já concluída' }, 400)

  await db.prepare(`UPDATE missions SET status='completed', completed_at=datetime('now') WHERE id=?`).bind(missionId).run()

  const gains = JSON.parse(mission.attribute_gains || '{}')
  await addAttributeGains(db, playerId, gains)
  const skillGains = JSON.parse(mission.skill_gains || '{}')
  await addSkillGains(db, playerId, skillGains)

  let player = await getPlayer(db, playerId)
  const lvl = await addXpAndCoins(db, player, mission.xp_reward, mission.coins_reward)

  // consistency boost + mission counter + guild contribution + snapshot
  await addAttributeGains(db, playerId, { consistencia: 2 })
  await db.prepare('UPDATE players SET missions_completed_total = missions_completed_total + 1 WHERE id = ?').bind(playerId).run()
  await incrementSnapshotMissions(db, playerId)
  await addGuildContribution(db, playerId, mission.xp_reward)
  player = await getPlayer(db, playerId)
  const attrMap = await getAttributeMap(db, playerId)
  let notableEvent, notableLabel
  if (lvl.leveledUp) { notableEvent = 'level_up'; notableLabel = `Nível ${lvl.newLevel} — ${lvl.newTitle}` }
  if (mission.type === 'event') { notableEvent = notableEvent || 'challenge_done'; notableLabel = notableLabel || 'Desafio concluído' }
  await upsertSnapshot(db, player, attrMap, notableEvent, notableLabel)

  const newAchievements = await checkAchievements(db, playerId)

  return c.json({ ok: true, levelUp: lvl, xp: mission.xp_reward, coins: mission.coins_reward, gains, skillGains, player, newAchievements })
})

app.post('/api/missions/manual', async (c) => {
  const db = c.env.DB
  const playerId = c.get('playerId')
  const b = await c.req.json() as any
  const gains: Record<string, number> = {}
  if (b.category && ATTRIBUTE_KEYS.includes(b.category)) gains[b.category] = 5
  await db.prepare(`INSERT INTO missions (id, player_id, title, description, category, type, difficulty, xp_reward, coins_reward, attribute_gains, generated_by, frequency, due_date)
    VALUES (?,?,?,?,?,'manual',?,?,?,?,'user','once',?)`)
    .bind(crypto.randomUUID(), playerId, b.title, b.description || '', b.category || 'disciplina', b.difficulty || 'medium',
      b.xp_reward || 15, b.coins_reward || 2, JSON.stringify(gains), endOfDay()).run()
  return c.json({ ok: true })
})

app.post('/api/missions/generate', async (c) => {
  const db = c.env.DB
  const player = await getPlayer(db, c.get('playerId'))
  await generateMissionsForPlayer(db, player, true)
  return c.json({ ok: true })
})

// ---- ACTIVITIES ----
app.post('/api/activities', async (c) => {
  const db = c.env.DB
  const playerId = c.get('playerId')
  const b = await c.req.json() as any
  const duration = Number(b.duration_minutes || 30)
  const map: Record<string, number> = {}
  // basic XP model from duration & type
  let xp = Math.round(duration / 2)
  const gains: Record<string, number> = {}
  if (b.activity_type === 'treino') { gains.corpo = Math.min(15, Math.round(duration / 4)); gains.disciplina = 4; gains.energia = 3 }
  else if (b.activity_type === 'estudo') { gains.mente = Math.min(15, Math.round(duration / 4)); gains.foco = 3; gains.consistencia = 2 }
  else if (b.activity_type === 'meditacao') { gains.emocional = 5; gains.foco = 3 }
  else if (b.activity_type === 'social') { gains.social = 6 }
  else { gains[b.category || 'disciplina'] = 4 }

  await db.prepare(`INSERT INTO activities (id, player_id, activity_type, description, duration_minutes, intensity, xp_earned, coins_earned, attribute_impacts)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(crypto.randomUUID(), playerId, b.activity_type, b.description || '', duration, b.intensity || 'medium', xp, 2, JSON.stringify(gains)).run()

  await addAttributeGains(db, playerId, gains)
  let player = await getPlayer(db, playerId)
  const lvl = await addXpAndCoins(db, player, xp, 2)
  player = await getPlayer(db, playerId)
  await upsertSnapshot(db, player, await getAttributeMap(db, playerId))
  return c.json({ ok: true, xp, gains, levelUp: lvl })
})

app.get('/api/activities', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM activities WHERE player_id = ? ORDER BY logged_at DESC LIMIT 30').bind(c.get('playerId')).all()
  return c.json({ activities: results || [] })
})

// ---- SNAPSHOTS ----
app.get('/api/snapshots', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const period = c.req.query('period') || '30'
  let limit = 365
  if (period === '7') limit = 7
  else if (period === '30') limit = 30
  else if (period === '90') limit = 90
  const { results } = await db.prepare('SELECT * FROM player_daily_snapshots WHERE player_id = ? ORDER BY snapshot_date DESC LIMIT ?').bind(id, limit).all()
  const snaps = (results || []).reverse()
  return c.json({ snapshots: snaps })
})

app.get('/api/snapshots/summary', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const period = Number(c.req.query('period') || '30')
  const { results } = await db.prepare('SELECT * FROM player_daily_snapshots WHERE player_id = ? ORDER BY snapshot_date DESC LIMIT ?').bind(id, period).all()
  const snaps = (results || []) as any[]
  if (snaps.length < 2) return c.json({ topGain: null, topLoss: null, activeDays: snaps.length, totalDays: period })
  const first = snaps[snaps.length - 1], last = snaps[0]
  let topGain = { key: '', delta: -999 }, topLoss = { key: '', delta: 999 }
  for (const k of ATTRIBUTE_KEYS) {
    const d = (last[`${k}_value`] || 0) - (first[`${k}_value`] || 0)
    if (d > topGain.delta) topGain = { key: k, delta: d }
    if (d < topLoss.delta) topLoss = { key: k, delta: d }
  }
  const activeDays = snaps.filter(s => (s.missions_completed_today || 0) > 0).length
  return c.json({ topGain, topLoss, activeDays, totalDays: period })
})

// ---- SKILLS ----
app.get('/api/skills', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM player_skills WHERE player_id = ?').bind(c.get('playerId')).all()
  return c.json({ skills: results || [] })
})

// ---- RANKING (public) ----
app.get('/api/ranking/global', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare(`SELECT nick, title, level, xp, avatar_url, streak_days, focus_area FROM players WHERE onboarding_completed = 1 AND nick IS NOT NULL ORDER BY xp DESC LIMIT 100`).all()
  const players = (results || []).map((p: any, i: number) => ({ ...p, rank: i + 1 }))

  // include current player's rank if logged in
  let myRank = null
  const myId = await getPlayerId(c)
  if (myId) {
    const me = await getPlayer(db, myId)
    if (me?.nick) {
      const idx = players.findIndex((p: any) => p.nick === me.nick)
      if (idx >= 0) myRank = players[idx]
      else {
        const higher = await db.prepare('SELECT COUNT(*) as c FROM players WHERE xp > ? AND onboarding_completed = 1').bind(me.xp).first<any>()
        myRank = { nick: me.nick, title: me.title, level: me.level, xp: me.xp, avatar_url: me.avatar_url, streak_days: me.streak_days, focus_area: me.focus_area, rank: (higher?.c || 0) + 1 }
      }
    }
  }
  return c.json({ players, myRank, updatedAt: new Date().toISOString() })
})

app.get('/api/ranking/category/:cat', async (c) => {
  const db = c.env.DB
  const cat = c.req.param('cat')
  if (cat === 'streak') {
    const { results } = await db.prepare(`SELECT nick, title, level, streak_days as score, avatar_url FROM players WHERE onboarding_completed=1 AND nick IS NOT NULL ORDER BY streak_days DESC LIMIT 50`).all()
    return c.json({ players: (results || []).map((p: any, i: number) => ({ ...p, rank: i + 1 })) })
  }
  if (!ATTRIBUTE_KEYS.includes(cat as any)) return c.json({ players: [] })
  const { results } = await db.prepare(`SELECT p.nick, p.title, p.level, p.avatar_url, pa.value as score
    FROM players p JOIN player_attributes pa ON pa.player_id = p.id
    WHERE pa.attribute_key = ? AND p.onboarding_completed = 1 AND p.nick IS NOT NULL
    ORDER BY pa.value DESC LIMIT 50`).bind(cat).all()
  return c.json({ players: (results || []).map((p: any, i: number) => ({ ...p, rank: i + 1 })) })
})

// ---- SHOP ----
app.get('/api/shop/items', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const { results: items } = await db.prepare('SELECT * FROM shop_items WHERE is_active = 1 ORDER BY price_coins ASC').all()
  const { results: inv } = await db.prepare('SELECT item_id, equipped FROM player_inventory WHERE player_id = ?').bind(id).all()
  const owned = new Set((inv || []).map((i: any) => i.item_id))
  const equipped = new Set((inv || []).filter((i: any) => i.equipped).map((i: any) => i.item_id))
  return c.json({ items: (items || []).map((it: any) => ({ ...it, owned: owned.has(it.id), equipped: equipped.has(it.id) })) })
})

app.post('/api/shop/purchase/:itemId', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const itemId = c.req.param('itemId')
  const item = await db.prepare('SELECT * FROM shop_items WHERE id = ?').bind(itemId).first<any>()
  const player = await getPlayer(db, id)
  if (!item) return c.json({ error: 'Item não encontrado' }, 404)
  const existing = await db.prepare('SELECT * FROM player_inventory WHERE player_id=? AND item_id=?').bind(id, itemId).first()
  if (existing) return c.json({ error: 'Você já possui este item' }, 400)
  if (player.level < item.price_level_required) return c.json({ error: `Requer nível ${item.price_level_required}` }, 400)
  if (player.coins < item.price_coins) return c.json({ error: 'Moedas insuficientes' }, 400)
  await db.prepare('UPDATE players SET coins = coins - ? WHERE id = ?').bind(item.price_coins, id).run()
  await db.prepare('INSERT INTO player_inventory (id, player_id, item_id) VALUES (?,?,?)').bind(crypto.randomUUID(), id, itemId).run()
  return c.json({ ok: true })
})

// ---- NOTIFICATIONS ----
app.get('/api/notifications', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM notifications WHERE player_id = ? ORDER BY created_at DESC LIMIT 50').bind(c.get('playerId')).all()
  return c.json({ notifications: results || [] })
})

app.patch('/api/notifications/:id/read', async (c) => {
  await c.env.DB.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND player_id = ?').bind(c.req.param('id'), c.get('playerId')).run()
  return c.json({ ok: true })
})

app.post('/api/notifications/read-all', async (c) => {
  await c.env.DB.prepare('UPDATE notifications SET read = 1 WHERE player_id = ?').bind(c.get('playerId')).run()
  return c.json({ ok: true })
})

// ---- DEATH / REBIRTH ----
app.get('/api/death/status', async (c) => {
  const db = c.env.DB
  const player = await getPlayer(db, c.get('playerId'))
  const death = await db.prepare('SELECT * FROM death_log WHERE player_id = ? ORDER BY died_at DESC LIMIT 1').bind(player.id).first<any>()
  return c.json({ is_dead: player.is_dead, death, player })
})

app.post('/api/death/rebirth', async (c) => {
  const db = c.env.DB
  const id = c.get('playerId')
  const player = await getPlayer(db, id)
  if (!player.is_dead) return c.json({ error: 'Você está vivo' }, 400)
  // Reset attributes to assessment base
  const { results } = await db.prepare('SELECT attribute_key, base_value FROM player_attributes WHERE player_id = ?').bind(id).all()
  for (const a of (results || []) as any[]) {
    await db.prepare(`UPDATE player_attributes SET value = ?, delta_week = 0 WHERE player_id = ? AND attribute_key = ?`).bind(a.base_value, id, a.attribute_key).run()
  }
  await db.prepare(`UPDATE players SET is_dead = 0, streak_days = 0, last_login_at = datetime('now') WHERE id = ?`).bind(id).run()
  // expire old missions, generate new
  await db.prepare(`UPDATE missions SET status = 'expired' WHERE player_id = ? AND status = 'active'`).bind(id).run()
  const refreshed = await getPlayer(db, id)
  await generateMissionsForPlayer(db, refreshed)
  await createNotification(db, id, 'rebirth', '🔥 RENASCIMENTO', `Você renasceu, ${player.nick}. O Arquiteto está te observando novamente. Não falhe de novo.`)
  return c.json({ ok: true })
})

// Simulate death for testing/demo
app.post('/api/death/simulate', async (c) => {
  const db = c.env.DB
  const player = await getPlayer(db, c.get('playerId'))
  await processDeath(db, player, 'absence', 3)
  return c.json({ ok: true })
})

// ============ Mission generation helper ============
async function generateMissionsForPlayer(db: D1Database, player: any, force = false) {
  // skip if active daily missions exist today and not forced
  if (!force) {
    const existing = await db.prepare(`SELECT COUNT(*) as c FROM missions WHERE player_id = ? AND type = 'daily' AND status = 'active' AND date(created_at) = date('now')`).bind(player.id).first<any>()
    if (existing && existing.c > 0) return
  } else {
    await db.prepare(`UPDATE missions SET status='expired' WHERE player_id=? AND status='active' AND type IN ('daily','event')`).bind(player.id).run()
  }
  const attrMap = await getAttributeMap(db, player.id)
  // recent completed templates to avoid repetition
  const { results: recent } = await db.prepare(`SELECT metadata FROM missions WHERE player_id=? AND status='completed' ORDER BY completed_at DESC LIMIT 6`).bind(player.id).all()
  const recentIds: string[] = []

  let proc: any = {}
  try { proc = JSON.parse(player.procedural_profile || '{}') } catch {}
  const ctx: PlayerCtx = {
    nick: player.nick || 'Operador', level: player.level, focus_area: player.focus_area,
    streak_days: player.streak_days, attributes: attrMap,
    location_lat: player.location_lat, location_lng: player.location_lng, recentTemplateIds: recentIds,
    themes: proc.themes || [], customGoals: proc.customGoals || [], toneTags: proc.toneTags || []
  }
  const engine = new ProceduralEngine()
  const pkg = await engine.generateDailyPackage(ctx)
  const due = endOfDay()
  const all = [...pkg.daily.map(m => ({ m, type: 'daily', freq: 'daily' })), { m: pkg.challenge, type: 'event', freq: 'once' }]
  if (pkg.weekly) all.push({ m: pkg.weekly, type: 'weekly', freq: 'weekly' })

  for (const { m, type, freq } of all) {
    await db.prepare(`INSERT INTO missions (id, player_id, title, description, category, type, difficulty, xp_reward, coins_reward, attribute_gains, skill_gains, frequency, due_date, generated_by, metadata)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'system',?)`)
      .bind(crypto.randomUUID(), player.id, m.title, m.description, m.category, type, m.difficulty,
        m.xp_reward, m.coins_reward, JSON.stringify(m.attribute_gains), JSON.stringify(m.skill_gains),
        freq, freq === 'weekly' ? endOfWeek() : due, JSON.stringify({ ...m.metadata, template_id: m.template_id })).run()
  }
}

// Atualiza streak de dias consecutivos de login
async function applyDailyStreak(db: D1Database, player: any) {
  const today = todayStr()
  const last = player.last_streak_date
  if (last === today) return // já contou hoje
  let newStreak = 1
  if (last) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (last === yesterday) newStreak = (player.streak_days || 0) + 1
  }
  await db.prepare(`UPDATE players SET streak_days = ?, last_streak_date = ? WHERE id = ?`)
    .bind(newStreak, today, player.id).run()
}

function endOfDay(): string {
  const d = new Date(); d.setUTCHours(23, 59, 59, 0); return d.toISOString()
}
function endOfWeek(): string {
  const d = new Date(); d.setUTCDate(d.getUTCDate() + 7); return d.toISOString()
}

// ============ FRONTEND (SPA) ============
// O catch-all e o serveStatic são definidos pelos entrypoints de cada
// plataforma (entry-cloudflare.tsx / entry-vercel.ts) para manter este
// módulo portável. A rota raiz do SPA fica aqui como fallback.
export { renderApp }
