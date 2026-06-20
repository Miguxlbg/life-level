// ===================================================
// LIFE LEVEL — Core game logic (XP, levels, attributes)
// ===================================================

export const ATTRIBUTE_KEYS = [
  'corpo', 'mente', 'emocional', 'social', 'proposito',
  'financas', 'energia', 'disciplina', 'foco', 'consistencia'
] as const

export type AttributeKey = typeof ATTRIBUTE_KEYS[number]

export const ATTRIBUTE_META: Record<AttributeKey, { label: string; icon: string; color: string; subs: string[] }> = {
  corpo:        { label: 'Corpo',        icon: '🏋️', color: '#10b981', subs: ['Treino', 'Alimentação', 'Sono', 'Hidratação', 'Mobilidade', 'Resistência'] },
  mente:        { label: 'Mente',        icon: '🧠', color: '#2563eb', subs: ['Estudo', 'Foco', 'Criatividade', 'Memória', 'Leitura', 'Raciocínio'] },
  emocional:    { label: 'Emocional',    icon: '❤️', color: '#7c3aed', subs: ['Equilíbrio', 'Autoconhecimento', 'Resiliência', 'Gratidão', 'Regulação'] },
  social:       { label: 'Social',       icon: '👥', color: '#06b6d4', subs: ['Relações', 'Presença', 'Comunicação', 'Empatia', 'Networking'] },
  proposito:    { label: 'Propósito',    icon: '🎯', color: '#f59e0b', subs: ['Missão de Vida', 'Carreira', 'Valores', 'Clareza', 'Impacto'] },
  financas:     { label: 'Finanças',     icon: '💰', color: '#059669', subs: ['Poupança', 'Investimento', 'Controle', 'Renda', 'Liberdade'] },
  energia:      { label: 'Energia',      icon: '⚡', color: '#f97316', subs: ['Vitalidade', 'Disposição', 'Consistência de Sono', 'Recuperação'] },
  disciplina:   { label: 'Disciplina',   icon: '🔥', color: '#ef4444', subs: ['Constância', 'Comprometimento', 'Resistência à Distração', 'Execução'] },
  foco:         { label: 'Foco',         icon: '🎯', color: '#8b5cf6', subs: ['Concentração', 'Flow', 'Anti-procrastinação', 'Deep Work'] },
  consistencia: { label: 'Consistência', icon: '♻️', color: '#6366f1', subs: ['Streak', 'Missões cumpridas', 'Regularidade', 'Retorno após falha'] },
}

// Radar shows 6 main attributes
export const RADAR_KEYS: AttributeKey[] = ['corpo', 'mente', 'emocional', 'social', 'proposito', 'financas']

export function calculateXpToNext(level: number): number {
  if (level <= 5) return 100
  if (level <= 10) return 250
  if (level <= 20) return 500
  if (level <= 35) return 1000
  if (level <= 50) return 2500
  if (level <= 75) return 5000
  if (level <= 99) return 10000
  return 25000
}

export function getTitleForLevel(level: number): string {
  if (level <= 5) return 'Iniciado'
  if (level <= 10) return 'Aprendiz'
  if (level <= 20) return 'Evoluído'
  if (level <= 35) return 'Desperto'
  if (level <= 50) return 'Vanguarda'
  if (level <= 75) return 'Mestre'
  if (level <= 99) return 'Soberano'
  return 'Lenda'
}

export function getClassForLevel(level: number): string {
  if (level <= 5) return 'Recruta'
  if (level <= 20) return 'Operador'
  if (level <= 50) return 'Estrategista'
  return 'Comandante'
}

export interface NextMilestone {
  level: number
  title: string
  label: string
  progress: number // 0-100
}

export function getNextMilestone(level: number, xp: number, xpToNext: number): NextMilestone {
  const milestones = [
    { level: 6, title: 'Aprendiz', label: 'Despertar do Aprendiz' },
    { level: 11, title: 'Evoluído', label: 'A Evolução Começa' },
    { level: 21, title: 'Desperto', label: 'O Despertar' },
    { level: 36, title: 'Vanguarda', label: 'Mestre da Rotina' },
    { level: 51, title: 'Mestre', label: 'O Mestre Emerge' },
    { level: 76, title: 'Soberano', label: 'Ascensão Soberana' },
    { level: 100, title: 'Lenda', label: 'Tornar-se Lenda' },
  ]
  const next = milestones.find(m => m.level > level) || milestones[milestones.length - 1]
  const progress = Math.min(100, Math.round((xp / xpToNext) * 100))
  return { ...next, progress }
}

export function calculateBMI(heightCm: number, weightKg: number): { bmi: number; bmiClass: string } {
  const h = heightCm / 100
  const bmi = Math.round((weightKg / (h * h)) * 10) / 10
  let bmiClass = 'Normal'
  if (bmi < 18.5) bmiClass = 'Abaixo do peso'
  else if (bmi < 25) bmiClass = 'Peso saudável'
  else if (bmi < 30) bmiClass = 'Sobrepeso'
  else bmiClass = 'Obesidade'
  return { bmi, bmiClass }
}

export function getLifePhase(age: number): string {
  if (age <= 17) return 'Adolescente'
  if (age <= 25) return 'Jovem Adulto'
  if (age <= 40) return 'Adulto'
  if (age <= 60) return 'Adulto Maduro'
  return 'Sênior'
}

export function overallScore(attrs: Record<string, number>): number {
  const sum = ATTRIBUTE_KEYS.reduce((acc, k) => acc + (attrs[k] || 0), 0)
  return Math.round((sum / ATTRIBUTE_KEYS.length) * 10) / 10
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}
