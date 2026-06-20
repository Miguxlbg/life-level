// ===================================================
// LIFE LEVEL — Analisador Procedural de Respostas Livres
// "Técnica forte" para interpretar respostas próprias do jogador
// (texto livre via opção "Outro") além das pré-configuradas.
// Mapeia linguagem natural -> pesos de atributos, foco, tags e
// afinidade de missões, alimentando a geração procedural.
// ===================================================
import { ATTRIBUTE_KEYS } from '../lib/game'

export interface AssessmentAnalysis {
  attributeWeights: Record<string, number> // -100..+100 por atributo
  focusAreas: string[]                      // atributos prioritários (ordenados)
  detectedThemes: string[]                  // temas extraídos do texto
  customGoals: string[]                     // metas livres digitadas
  intensity: number                          // 0..1 quão "urgente"/intenso é o perfil
  toneTags: string[]                         // ex: 'ansioso', 'motivado', 'exausto'
  rawTextSignals: number                     // quantos sinais foram extraídos do texto livre
}

// Léxico pt-BR: palavras-chave -> atributo afetado e direção (peso)
// Direção positiva = jogador já é forte nisso; negativa = ponto fraco/dor
const LEXICON: { words: string[]; attr: string; weight: number; theme: string }[] = [
  // CORPO
  { words: ['academia', 'treino', 'musculação', 'correr', 'corrida', 'esporte', 'malhar', 'gym', 'exercício', 'exercicio'], attr: 'corpo', weight: 18, theme: 'fitness' },
  { words: ['sedentário', 'sedentario', 'fora de forma', 'gordo', 'acima do peso', 'sem energia física', 'dor nas costas'], attr: 'corpo', weight: -22, theme: 'sedentarismo' },
  { words: ['dieta', 'alimentação', 'alimentacao', 'comer bem', 'nutrição', 'nutricao'], attr: 'corpo', weight: 12, theme: 'nutrição' },
  { words: ['fast food', 'junk', 'doces', 'refrigerante', 'como mal', 'alimentação ruim'], attr: 'corpo', weight: -15, theme: 'má alimentação' },

  // MENTE
  { words: ['estudo', 'estudar', 'ler', 'leitura', 'livro', 'curso', 'aprender', 'faculdade', 'concurso', 'prova'], attr: 'mente', weight: 18, theme: 'estudo' },
  { words: ['não consigo focar', 'desfocado', 'esqueço', 'memória ruim', 'memoria ruim', 'cabeça cheia'], attr: 'mente', weight: -18, theme: 'dispersão' },

  // EMOCIONAL
  { words: ['terapia', 'autoconhecimento', 'equilíbrio', 'equilibrio', 'gratidão', 'gratidao', 'meditar', 'meditação', 'meditacao'], attr: 'emocional', weight: 16, theme: 'equilíbrio' },
  { words: ['ansiedade', 'ansioso', 'depressão', 'depressao', 'triste', 'estresse', 'estressado', 'burnout', 'crise', 'pânico', 'panico'], attr: 'emocional', weight: -25, theme: 'sofrimento emocional' },
  { words: ['solitário', 'solitario', 'vazio', 'sem sentido', 'desmotivado'], attr: 'emocional', weight: -18, theme: 'desânimo' },

  // SOCIAL
  { words: ['amigos', 'família', 'familia', 'relacionamento', 'namorar', 'social', 'sair', 'pessoas', 'networking'], attr: 'social', weight: 15, theme: 'conexões' },
  { words: ['isolado', 'sem amigos', 'tímido', 'timido', 'vergonha', 'não saio', 'nao saio', 'antissocial'], attr: 'social', weight: -20, theme: 'isolamento' },

  // PROPÓSITO
  { words: ['propósito', 'proposito', 'missão de vida', 'missao de vida', 'objetivo', 'sonho', 'carreira', 'vocação', 'vocacao', 'legado'], attr: 'proposito', weight: 16, theme: 'direção' },
  { words: ['perdido', 'sem rumo', 'não sei o que', 'nao sei o que', 'sem direção', 'sem direcao', 'sem propósito'], attr: 'proposito', weight: -22, theme: 'falta de rumo' },

  // FINANÇAS
  { words: ['investir', 'poupança', 'poupanca', 'economizar', 'dinheiro', 'renda extra', 'empreender', 'salário', 'salario', 'finanças', 'financas'], attr: 'financas', weight: 15, theme: 'finanças' },
  { words: ['dívida', 'divida', 'endividado', 'sem dinheiro', 'gasto demais', 'falido', 'devendo'], attr: 'financas', weight: -22, theme: 'dívidas' },

  // ENERGIA
  { words: ['durmo bem', 'energia', 'disposição', 'disposicao', 'acordo cedo', 'descansado'], attr: 'energia', weight: 16, theme: 'vitalidade' },
  { words: ['cansado', 'exausto', 'sem energia', 'insônia', 'insonia', 'durmo mal', 'fadiga', 'sono ruim'], attr: 'energia', weight: -22, theme: 'esgotamento' },

  // DISCIPLINA
  { words: ['disciplina', 'rotina', 'foco', 'constância', 'constancia', 'comprometido', 'organizado', 'metas'], attr: 'disciplina', weight: 18, theme: 'disciplina' },
  { words: ['procrastino', 'procrastinação', 'procrastinacao', 'preguiça', 'preguica', 'deixo pra depois', 'desorganizado', 'sem rotina'], attr: 'disciplina', weight: -22, theme: 'procrastinação' },

  // FOCO
  { words: ['concentração', 'concentracao', 'deep work', 'flow', 'produtivo', 'produtividade'], attr: 'foco', weight: 16, theme: 'concentração' },
  { words: ['celular', 'redes sociais', 'tiktok', 'instagram', 'distração', 'distracao', 'viciado em tela', 'dopamina'], attr: 'foco', weight: -20, theme: 'distração digital' },

  // CONSISTÊNCIA
  { words: ['todo dia', 'todos os dias', 'hábito', 'habito', 'consistente', 'regular'], attr: 'consistencia', weight: 16, theme: 'hábitos' },
  { words: ['desisto', 'começo e paro', 'comeco e paro', 'nunca termino', 'abandono'], attr: 'consistencia', weight: -20, theme: 'abandono' },
]

const TONE_LEXICON: { words: string[]; tag: string }[] = [
  { words: ['quero muito', 'determinado', 'vou conseguir', 'foco total', 'pronto', 'motivado', 'bora', 'vamos'], tag: 'motivado' },
  { words: ['cansado', 'exausto', 'esgotado', 'não aguento', 'nao aguento', 'sem forças'], tag: 'exausto' },
  { words: ['ansioso', 'ansiedade', 'medo', 'preocupado', 'nervoso'], tag: 'ansioso' },
  { words: ['perdido', 'sem rumo', 'confuso', 'não sei', 'nao sei'], tag: 'perdido' },
  { words: ['triste', 'deprimido', 'vazio', 'sozinho'], tag: 'fragilizado' },
]

function normalize(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Extrai sinais de um texto livre
function scanText(text: string, weights: Record<string, number>, themes: Set<string>, tones: Set<string>): number {
  const norm = normalize(text)
  if (!norm || norm.length < 2) return 0
  let signals = 0
  for (const entry of LEXICON) {
    for (const w of entry.words) {
      if (norm.includes(normalize(w))) {
        weights[entry.attr] = (weights[entry.attr] || 0) + entry.weight
        themes.add(entry.theme)
        signals++
        break
      }
    }
  }
  for (const t of TONE_LEXICON) {
    for (const w of t.words) {
      if (norm.includes(normalize(w))) { tones.add(t.tag); break }
    }
  }
  return signals
}

/**
 * Analisa o assessment completo. Aceita:
 *  - respostas estruturadas (múltipla escolha, multi-seleção)
 *  - respostas livres ("Outro" + texto) em answers._free[] ou campos *_other
 */
export function analyzeAssessment(answers: any): AssessmentAnalysis {
  const weights: Record<string, number> = {}
  for (const k of ATTRIBUTE_KEYS) weights[k] = 0
  const themes = new Set<string>()
  const tones = new Set<string>()
  const customGoals: string[] = []
  let rawTextSignals = 0

  // 1) Coletar TODOS os textos livres do jogador
  const freeTexts: string[] = []
  // formato novo: answers.responses = [{ qid, choices:[], other:'texto' }]
  if (Array.isArray(answers.responses)) {
    for (const r of answers.responses) {
      if (r.other && typeof r.other === 'string') freeTexts.push(r.other)
      if (Array.isArray(r.choices)) {
        for (const ch of r.choices) {
          // mapear escolhas pré-definidas para atributos quando vierem com peso
          if (ch && ch.attr && typeof ch.weight === 'number') {
            weights[ch.attr] = (weights[ch.attr] || 0) + ch.weight
            if (ch.theme) themes.add(ch.theme)
          } else if (typeof ch === 'string') {
            freeTexts.push(ch)
          }
        }
      }
    }
  }
  // campos de texto livre soltos
  for (const key of Object.keys(answers || {})) {
    const v = answers[key]
    if (typeof v === 'string' && (key.includes('other') || key.includes('texto') || key.includes('free') || key.includes('custom') || key.includes('goal'))) {
      freeTexts.push(v)
      if (key.includes('goal') && v.trim().length > 2) customGoals.push(v.trim())
    }
  }
  if (typeof answers.primary_goal === 'string' && answers.primary_goal.trim().length > 2) {
    customGoals.push(answers.primary_goal.trim())
    freeTexts.push(answers.primary_goal)
  }

  // 2) Escanear os textos livres (a "técnica forte")
  for (const t of freeTexts) rawTextSignals += scanText(t, weights, themes, tones)

  // 3) Incorporar sinais estruturados legados (compatibilidade)
  if (answers.trains_body) weights.corpo += 15
  if (answers.studies_consistently) { weights.mente += 12; weights.foco += 8 }
  if (answers.finances_organized) weights.financas += 15
  if (answers.social_life_healthy) weights.social += 12
  if (answers.sleep_quality) weights.energia += 12
  if (answers.discipline_level === 'high') { weights.disciplina += 20; weights.consistencia += 12 }
  else if (answers.discipline_level === 'medium') { weights.disciplina += 8 }
  if (Array.isArray(answers.dopamine_drains)) {
    weights.foco -= Math.min(20, answers.dopamine_drains.length * 6)
  }
  if (answers.strongest_attribute && weights[answers.strongest_attribute] !== undefined) weights[answers.strongest_attribute] += 12
  if (answers.critical_attribute && weights[answers.critical_attribute] !== undefined) weights[answers.critical_attribute] -= 18

  const sat = Number(answers.satisfaction_score)
  if (!isNaN(sat)) {
    weights.emocional += (sat - 5) * 3
    weights.proposito += (sat - 5) * 2
  }

  // 4) Determinar áreas de foco (atributos mais negativos = mais precisam de trabalho)
  const sortedByNeed = [...ATTRIBUTE_KEYS].sort((a, b) => (weights[a] || 0) - (weights[b] || 0))
  const focusAreas = sortedByNeed.slice(0, 3)

  // 5) Intensidade: quanto mais dor/urgência, maior
  const negativeSum = ATTRIBUTE_KEYS.reduce((acc, k) => acc + Math.min(0, weights[k] || 0), 0)
  const intensity = Math.min(1, Math.abs(negativeSum) / 120)

  return {
    attributeWeights: weights,
    focusAreas,
    detectedThemes: [...themes],
    customGoals: [...new Set(customGoals)],
    intensity,
    toneTags: [...tones],
    rawTextSignals,
  }
}

/**
 * Converte a análise em atributos base 0-100 (substitui a versão antiga
 * baseada apenas em flags pré-configuradas).
 */
export function attributesFromAnalysis(analysis: AssessmentAnalysis): Record<string, number> {
  const base: Record<string, number> = {
    corpo: 40, mente: 42, emocional: 42, social: 42, proposito: 38,
    financas: 38, energia: 42, disciplina: 38, foco: 38, consistencia: 35,
  }
  for (const k of ATTRIBUTE_KEYS) {
    const w = analysis.attributeWeights[k] || 0
    base[k] = Math.max(5, Math.min(100, Math.round(base[k] + w * 0.7)))
  }
  return base
}
