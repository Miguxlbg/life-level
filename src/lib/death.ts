// ===================================================
// LIFE LEVEL — Death & Reset system
// ===================================================
import type { Database } from './types'
import { getAttributeMap, createNotification } from './db'

export interface DeathCheck {
  shouldDie: boolean
  cause?: string
  daysOffline?: number
}

export async function checkDeathConditions(db: Database, player: any): Promise<DeathCheck> {
  const lastLogin = new Date(player.last_login_at).getTime()
  const hoursOffline = (Date.now() - lastLogin) / 3600000
  const daysOffline = Math.floor(hoursOffline / 24)

  // Cause 1: Absence (72h+)
  if (hoursOffline >= 72) {
    return { shouldDie: true, cause: 'absence', daysOffline }
  }

  const attrs = await getAttributeMap(db, player.id)
  // Cause 2: Sedentarism
  if ((attrs.corpo || 0) === 0 && (attrs.energia || 0) === 0) {
    return { shouldDie: true, cause: 'sedentarism', daysOffline }
  }
  // Cause 4: Mental collapse
  if ((attrs.mente || 0) + (attrs.emocional || 0) < 10) {
    return { shouldDie: true, cause: 'mental_collapse', daysOffline }
  }
  return { shouldDie: false }
}

const CAUSE_LABELS: Record<string, string> = {
  absence: 'Ausência Prolongada',
  sedentarism: 'Sedentarismo Total',
  starvation: 'Inanição Digital',
  mental_collapse: 'Colapso Mental',
}

export async function processDeath(db: Database, player: any, cause: string, daysOffline: number) {
  const attrs = await getAttributeMap(db, player.id)
  // Snapshot
  await db.prepare(`INSERT INTO death_log (id, player_id, cause, stats_at_death, days_offline, level_at_death) VALUES (?,?,?,?,?,?)`)
    .bind(crypto.randomUUID(), player.id, cause, JSON.stringify(attrs), daysOffline, player.level).run()

  // Reset level/xp, keep 50% coins
  await db.prepare(`UPDATE players SET level = 1, xp = 0, xp_to_next = 100, coins = ?, is_dead = 1, death_count = death_count + 1, title = 'Renascido', streak_days = 0, updated_at = datetime('now') WHERE id = ?`)
    .bind(Math.floor(player.coins * 0.5), player.id).run()

  // Snapshot with death event
  const today = new Date().toISOString().slice(0, 10)
  await db.prepare(`INSERT INTO player_daily_snapshots (id, player_id, snapshot_date, overall_score, corpo_value, mente_value, emocional_value, social_value, proposito_value, financas_value, energia_value, disciplina_value, foco_value, consistencia_value, xp_total, level_at_date, missions_completed_today, streak_at_date, notable_event, notable_event_label)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,1,0,0,'death','RESET — Morte por ' || ?)
    ON CONFLICT(player_id, snapshot_date) DO UPDATE SET notable_event='death', notable_event_label='RESET'`)
    .bind(crypto.randomUUID(), player.id, today, 0, attrs.corpo, attrs.mente, attrs.emocional, attrs.social, attrs.proposito, attrs.financas, attrs.energia, attrs.disciplina, attrs.foco, attrs.consistencia, CAUSE_LABELS[cause]).run()

  await createNotification(db, player.id, 'death', '⚠ SISTEMA INTERROMPIDO',
    `Você morreu por ${CAUSE_LABELS[cause]}. O sistema não perdoa inércia. Mas o Arquiteto concede uma nova chance.`)
}

export function getCauseLabel(cause: string): string {
  return CAUSE_LABELS[cause] || cause
}
