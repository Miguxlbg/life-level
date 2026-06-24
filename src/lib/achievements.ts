// ===================================================
// LIFE LEVEL — Sistema de Conquistas (badges)
// ===================================================
import type { Database } from './types'

export interface Achievement {
  key: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const ACHIEVEMENTS: Achievement[] = [
  { key: 'first_steps', name: 'Primeiros Passos', description: 'Complete sua primeira missão', icon: '👣', rarity: 'common' },
  { key: 'awakening', name: 'O Despertar', description: 'Alcance o nível 5', icon: '🌅', rarity: 'common' },
  { key: 'apprentice', name: 'Aprendiz', description: 'Alcance o nível 10', icon: '📚', rarity: 'rare' },
  { key: 'evolved', name: 'Evoluído', description: 'Alcance o nível 15', icon: '⚡', rarity: 'rare' },
  { key: 'awakened', name: 'Desperto', description: 'Alcance o nível 20', icon: '🔮', rarity: 'epic' },
  { key: 'master', name: 'Mestre', description: 'Alcance o nível 30', icon: '👑', rarity: 'legendary' },
  { key: 'dedicated', name: 'Dedicado', description: 'Complete 10 missões', icon: '🎯', rarity: 'common' },
  { key: 'relentless', name: 'Implacável', description: 'Complete 50 missões', icon: '🔥', rarity: 'rare' },
  { key: 'unstoppable', name: 'Imparável', description: 'Complete 100 missões', icon: '💪', rarity: 'epic' },
  { key: 'streak_7', name: 'Semana de Ferro', description: 'Mantenha 7 dias de streak', icon: '📅', rarity: 'rare' },
  { key: 'streak_30', name: 'Mês Lendário', description: 'Mantenha 30 dias de streak', icon: '🗓️', rarity: 'legendary' },
  { key: 'survivor', name: 'Sobrevivente', description: 'Renasça após a morte', icon: '🦅', rarity: 'epic' },
  { key: 'guild_founder', name: 'Fundador', description: 'Crie uma guilda', icon: '🏰', rarity: 'rare' },
  { key: 'guild_member', name: 'Companheiro', description: 'Entre em uma guilda', icon: '🤝', rarity: 'common' },
  { key: 'balanced', name: 'Equilíbrio', description: 'Tenha todos os 6 atributos principais acima de 50', icon: '☯️', rarity: 'epic' },
  { key: 'specialist', name: 'Especialista', description: 'Alcance nível 5 em qualquer habilidade', icon: '🎓', rarity: 'rare' },
  { key: 'rich', name: 'Próspero', description: 'Acumule 1000 moedas', icon: '💰', rarity: 'rare' },
  { key: 'collector', name: 'Colecionador', description: 'Compre 5 itens na loja', icon: '🎁', rarity: 'epic' },
]

export const RARITY_META: Record<string, { color: string; label: string }> = {
  common: { color: '#94a3b8', label: 'Comum' },
  rare: { color: '#2563eb', label: 'Raro' },
  epic: { color: '#a855f7', label: 'Épico' },
  legendary: { color: '#f59e0b', label: 'Lendário' },
}

// Verifica e desbloqueia conquistas com base no estado atual. Retorna as novas desbloqueadas.
export async function checkAchievements(db: Database, playerId: string): Promise<Achievement[]> {
  const player = await db.prepare('SELECT * FROM players WHERE id = ?').bind(playerId).first<any>()
  if (!player) return []

  const { results: ownedRows } = await db.prepare('SELECT achievement_key FROM player_achievements WHERE player_id = ?').bind(playerId).all()
  const owned = new Set((ownedRows || []).map((r: any) => r.achievement_key))

  const { results: attrs } = await db.prepare('SELECT attribute_key, value FROM player_attributes WHERE player_id = ?').bind(playerId).all()
  const attrMap: Record<string, number> = {}
  for (const a of (attrs || []) as any[]) attrMap[a.attribute_key] = a.value

  const skillTop = await db.prepare('SELECT MAX(skill_level) as m FROM player_skills WHERE player_id = ?').bind(playerId).first<any>()
  const guildCount = await db.prepare('SELECT COUNT(*) as c FROM guild_members WHERE player_id = ?').bind(playerId).first<any>()
  const ownedGuild = await db.prepare("SELECT COUNT(*) as c FROM guilds WHERE owner_id = ?").bind(playerId).first<any>()
  const invCount = await db.prepare('SELECT COUNT(*) as c FROM player_inventory WHERE player_id = ?').bind(playerId).first<any>()

  const missions = player.missions_completed_total || 0
  const radar6 = ['corpo', 'mente', 'emocional', 'social', 'proposito', 'financas']
  const balanced = radar6.every(k => (attrMap[k] || 0) > 50)

  const conds: Record<string, boolean> = {
    first_steps: missions >= 1,
    dedicated: missions >= 10,
    relentless: missions >= 50,
    unstoppable: missions >= 100,
    awakening: player.level >= 5,
    apprentice: player.level >= 10,
    evolved: player.level >= 15,
    awakened: player.level >= 20,
    master: player.level >= 30,
    streak_7: player.streak_days >= 7,
    streak_30: player.streak_days >= 30,
    survivor: player.death_count >= 1,
    guild_founder: (ownedGuild?.c || 0) >= 1,
    guild_member: (guildCount?.c || 0) >= 1,
    balanced,
    specialist: (skillTop?.m || 0) >= 5,
    rich: player.coins >= 1000,
    collector: (invCount?.c || 0) >= 5,
  }

  const newly: Achievement[] = []
  for (const ach of ACHIEVEMENTS) {
    if (conds[ach.key] && !owned.has(ach.key)) {
      await db.prepare('INSERT OR IGNORE INTO player_achievements (id, player_id, achievement_key) VALUES (?,?,?)')
        .bind(crypto.randomUUID(), playerId, ach.key).run()
      await db.prepare('INSERT INTO notifications (id, player_id, type, title, message) VALUES (?,?,?,?,?)')
        .bind(crypto.randomUUID(), playerId, 'achievement', `🏆 CONQUISTA: ${ach.name}`, `${ach.icon} ${ach.description}`).run()
      newly.push(ach)
    }
  }
  return newly
}
