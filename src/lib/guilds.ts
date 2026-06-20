// ===================================================
// LIFE LEVEL — Sistema de Guildas
// ===================================================

export async function getPlayerGuild(db: D1Database, playerId: string): Promise<any | null> {
  const membership = await db.prepare(`
    SELECT g.*, gm.role, gm.contributed_xp, gm.joined_at
    FROM guild_members gm JOIN guilds g ON g.id = gm.guild_id
    WHERE gm.player_id = ?`).bind(playerId).first<any>()
  return membership || null
}

export async function getGuildMembers(db: D1Database, guildId: string): Promise<any[]> {
  const { results } = await db.prepare(`
    SELECT p.nick, p.title, p.level, p.avatar_url, p.avatar_emoji, p.focus_area, gm.role, gm.contributed_xp
    FROM guild_members gm JOIN players p ON p.id = gm.player_id
    WHERE gm.guild_id = ? ORDER BY gm.contributed_xp DESC`).bind(guildId).all()
  return results || []
}

export async function recomputeGuild(db: D1Database, guildId: string) {
  const agg = await db.prepare(`
    SELECT COUNT(*) as members, COALESCE(SUM(gm.contributed_xp),0) as total_xp
    FROM guild_members gm WHERE gm.guild_id = ?`).bind(guildId).first<any>()
  await db.prepare('UPDATE guilds SET member_count = ?, total_xp = ? WHERE id = ?')
    .bind(agg?.members || 0, agg?.total_xp || 0, guildId).run()
}

export async function listGuilds(db: D1Database): Promise<any[]> {
  const { results } = await db.prepare(`
    SELECT * FROM guilds WHERE is_public = 1 ORDER BY total_xp DESC LIMIT 50`).all()
  return (results || []).map((g: any, i: number) => ({ ...g, rank: i + 1 }))
}

// Adiciona XP contribuído pelo jogador à guilda (chamado quando completa missão)
export async function addGuildContribution(db: D1Database, playerId: string, xp: number) {
  const m = await db.prepare('SELECT guild_id FROM guild_members WHERE player_id = ?').bind(playerId).first<any>()
  if (!m) return
  await db.prepare('UPDATE guild_members SET contributed_xp = contributed_xp + ? WHERE player_id = ? AND guild_id = ?')
    .bind(xp, playerId, m.guild_id).run()
  await db.prepare('UPDATE guilds SET total_xp = total_xp + ? WHERE id = ?').bind(xp, m.guild_id).run()
}
