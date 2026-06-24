// ===================================================
// LIFE LEVEL — Helpers de consulta ao banco (Turso/libSQL)
// ===================================================
import type { Database } from './types'
import { ATTRIBUTE_KEYS, calculateXpToNext, getTitleForLevel, getClassForLevel, overallScore, todayStr } from './game'

export async function getPlayer(db: Database, id: string): Promise<any> {
  return await db.prepare('SELECT * FROM players WHERE id = ?').bind(id).first()
}

export async function getPlayerByNick(db: Database, nick: string): Promise<any> {
  return await db.prepare('SELECT * FROM players WHERE nick = ? COLLATE NOCASE').bind(nick).first()
}

export async function getAttributes(db: Database, playerId: string): Promise<any[]> {
  const { results } = await db.prepare('SELECT * FROM player_attributes WHERE player_id = ?').bind(playerId).all()
  return results || []
}

export async function getAttributeMap(db: Database, playerId: string): Promise<Record<string, number>> {
  const attrs = await getAttributes(db, playerId)
  const map: Record<string, number> = {}
  for (const a of attrs) map[a.attribute_key] = a.value
  for (const k of ATTRIBUTE_KEYS) if (map[k] === undefined) map[k] = 0
  return map
}

export async function initAttributes(db: Database, playerId: string, base: Record<string, number>) {
  for (const key of ATTRIBUTE_KEYS) {
    const val = base[key] ?? 30
    await db.prepare(`INSERT INTO player_attributes (id, player_id, attribute_key, value, base_value, max_value)
      VALUES (?, ?, ?, ?, ?, 100)
      ON CONFLICT(player_id, attribute_key) DO UPDATE SET value = excluded.value, base_value = excluded.base_value`)
      .bind(crypto.randomUUID(), playerId, key, val, val).run()
  }
}

export async function addAttributeGains(db: Database, playerId: string, gains: Record<string, number>) {
  for (const [key, amount] of Object.entries(gains)) {
    if (!ATTRIBUTE_KEYS.includes(key as any)) continue
    await db.prepare(`UPDATE player_attributes
      SET value = MIN(max_value, value + ?), delta_week = delta_week + ?, last_updated = datetime('now')
      WHERE player_id = ? AND attribute_key = ?`)
      .bind(amount, amount, playerId, key).run()
  }
}

// Add XP, handle level-up. Returns level-up info if leveled.
export async function addXpAndCoins(db: Database, player: any, xp: number, coins: number): Promise<{
  leveledUp: boolean; newLevel?: number; newTitle?: string; bonusCoins?: number
}> {
  let curLevel = player.level
  let curXp = player.xp + xp
  let xpToNext = player.xp_to_next
  let totalCoins = player.coins + coins
  let leveledUp = false
  let newTitle = player.title
  let bonusCoins = 0

  while (curXp >= xpToNext) {
    curXp -= xpToNext
    curLevel += 1
    xpToNext = calculateXpToNext(curLevel)
    const lb = 25 * curLevel
    bonusCoins += lb
    totalCoins += lb
    leveledUp = true
    newTitle = getTitleForLevel(curLevel)
  }

  const maxLevel = Math.max(player.max_level_reached || 1, curLevel)

  await db.prepare(`UPDATE players SET xp = ?, level = ?, xp_to_next = ?, coins = ?, title = ?, class = ?, max_level_reached = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(curXp, curLevel, xpToNext, totalCoins, newTitle, getClassForLevel(curLevel), maxLevel, player.id).run()

  if (leveledUp) {
    await db.prepare('INSERT INTO notifications (id, player_id, type, title, message) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), player.id, 'level_up', `🎮 NÍVEL ${curLevel} DESBLOQUEADO`, `Título: ${newTitle}. Bônus: +${bonusCoins} moedas. O mundo vê uma versão diferente de você agora.`).run()
  }

  return { leveledUp, newLevel: curLevel, newTitle, bonusCoins }
}

// Progresso de skills: cada skill ganha XP; 100 XP = +1 nível de skill
export async function addSkillGains(db: Database, playerId: string, gains: Record<string, number>) {
  for (const [cat, amount] of Object.entries(gains)) {
    if (!amount) continue
    const existing = await db.prepare('SELECT * FROM player_skills WHERE player_id = ? AND skill_category = ?').bind(playerId, cat).first<any>()
    if (existing) {
      let xp = (existing.xp_in_skill || 0) + amount
      let level = existing.skill_level || 0
      while (xp >= 100) { xp -= 100; level += 1 }
      await db.prepare(`UPDATE player_skills SET xp_in_skill = ?, skill_level = ?, last_practiced = datetime('now') WHERE id = ?`)
        .bind(xp, level, existing.id).run()
    } else {
      let xp = amount, level = 0
      while (xp >= 100) { xp -= 100; level += 1 }
      await db.prepare(`INSERT INTO player_skills (id, player_id, skill_category, skill_name, skill_level, xp_in_skill, unlocked_at, last_practiced)
        VALUES (?,?,?,?,?,?,datetime('now'),datetime('now'))`)
        .bind(crypto.randomUUID(), playerId, cat, cat, level, xp).run()
    }
  }
}

export async function createNotification(db: Database, playerId: string, type: string, title: string, message: string) {
  await db.prepare('INSERT INTO notifications (id, player_id, type, title, message) VALUES (?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), playerId, type, title, message).run()
}

// Upsert today's snapshot
export async function upsertSnapshot(db: Database, player: any, attrs: Record<string, number>, notableEvent?: string, notableLabel?: string) {
  const date = todayStr()
  const score = overallScore(attrs)
  const existing = await db.prepare('SELECT id, missions_completed_today FROM player_daily_snapshots WHERE player_id = ? AND snapshot_date = ?')
    .bind(player.id, date).first<any>()

  if (existing) {
    await db.prepare(`UPDATE player_daily_snapshots SET overall_score=?, corpo_value=?, mente_value=?, emocional_value=?, social_value=?, proposito_value=?, financas_value=?, energia_value=?, disciplina_value=?, foco_value=?, consistencia_value=?, xp_total=?, level_at_date=?, streak_at_date=?,
      notable_event = COALESCE(?, notable_event), notable_event_label = COALESCE(?, notable_event_label)
      WHERE id = ?`)
      .bind(score, attrs.corpo, attrs.mente, attrs.emocional, attrs.social, attrs.proposito, attrs.financas, attrs.energia, attrs.disciplina, attrs.foco, attrs.consistencia, player.xp, player.level, player.streak_days, notableEvent || null, notableLabel || null, existing.id).run()
  } else {
    await db.prepare(`INSERT INTO player_daily_snapshots (id, player_id, snapshot_date, overall_score, corpo_value, mente_value, emocional_value, social_value, proposito_value, financas_value, energia_value, disciplina_value, foco_value, consistencia_value, xp_total, level_at_date, missions_completed_today, streak_at_date, notable_event, notable_event_label)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?)`)
      .bind(crypto.randomUUID(), player.id, date, score, attrs.corpo, attrs.mente, attrs.emocional, attrs.social, attrs.proposito, attrs.financas, attrs.energia, attrs.disciplina, attrs.foco, attrs.consistencia, player.xp, player.level, player.streak_days, notableEvent || null, notableLabel || null).run()
  }
}

export async function incrementSnapshotMissions(db: Database, playerId: string) {
  const date = todayStr()
  await db.prepare(`UPDATE player_daily_snapshots SET missions_completed_today = missions_completed_today + 1 WHERE player_id = ? AND snapshot_date = ?`)
    .bind(playerId, date).run()
}
