// ===================================================
// LIFE LEVEL — Procedural Engine
// ===================================================
import { MISSION_TEMPLATES, CHALLENGE_TEMPLATES, WEEKLY_TEMPLATES, MissionTemplate } from './templates'
import * as ext from '../lib/external-apis'

export interface PlayerCtx {
  nick: string
  level: number
  focus_area: string | null
  streak_days: number
  attributes: Record<string, number>
  location_lat?: number | null
  location_lng?: number | null
  recentTemplateIds: string[]
  // Sinais procedurais derivados das respostas próprias do jogador
  themes?: string[]
  customGoals?: string[]
  toneTags?: string[]
}

// Mapeia temas detectados (texto livre) -> categorias de atributo priorizadas
const THEME_TO_CATEGORY: Record<string, string> = {
  'fitness': 'corpo', 'sedentarismo': 'corpo', 'nutrição': 'corpo', 'má alimentação': 'corpo',
  'estudo': 'mente', 'dispersão': 'mente',
  'equilíbrio': 'emocional', 'sofrimento emocional': 'emocional', 'desânimo': 'emocional',
  'conexões': 'social', 'isolamento': 'social',
  'direção': 'proposito', 'falta de rumo': 'proposito',
  'finanças': 'financas', 'dívidas': 'financas',
  'vitalidade': 'energia', 'esgotamento': 'energia',
  'disciplina': 'disciplina', 'procrastinação': 'disciplina',
  'concentração': 'foco', 'distração digital': 'foco',
  'hábitos': 'consistencia', 'abandono': 'consistencia',
}

export interface GeneratedMission {
  template_id: string
  title: string
  description: string
  category: string
  type: string
  difficulty: string
  xp_reward: number
  coins_reward: number
  attribute_gains: Record<string, number>
  skill_gains: Record<string, number>
  metadata: Record<string, any>
}

function now() { return new Date() }
function weekday() { return now().getUTCDay() } // 0=Sun
function hour() { return now().getUTCHours() }

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

// Detect critical attribute (lowest value)
export function detectCritical(attrs: Record<string, number>): string {
  let minKey = 'corpo', minVal = 999
  for (const [k, v] of Object.entries(attrs)) {
    if (v < minVal) { minVal = v; minKey = k }
  }
  return minKey
}

function templateToMission(t: MissionTemplate, type: string): GeneratedMission {
  return {
    template_id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    type,
    difficulty: t.difficulty,
    xp_reward: t.xp,
    coins_reward: t.coins,
    attribute_gains: t.attribute_gains,
    skill_gains: t.skill_category ? { [t.skill_category]: 10 } : {},
    metadata: {},
  }
}

// Fill template variables with API data
async function enrichTemplate(m: GeneratedMission, t: MissionTemplate, ctx: PlayerCtx): Promise<GeneratedMission> {
  let desc = m.description
  let title = m.title.replace('{nick}', ctx.nick)
  desc = desc.replace(/{nick}/g, ctx.nick).replace(/{player_level}/g, String(ctx.level))

  try {
    switch (t.api) {
      case 'wger': {
        const ex = await ext.getExercises(pick([8, 9, 10, 12, 13]))
        if (ex && ex.length >= 3) {
          desc = desc.replace('{exercise_1}', ex[0]).replace('{exercise_2}', ex[1]).replace('{exercise_3}', ex[2])
        } else {
          desc = desc.replace('{exercise_1}', 'agachamentos').replace('{exercise_2}', 'flexões').replace('{exercise_3}', 'abdominais')
        }
        break
      }
      case 'open_meteo': {
        if (ctx.location_lat && ctx.location_lng) {
          const w = await ext.getWeather(ctx.location_lat, ctx.location_lng)
          if (w) {
            desc = desc.replace('{weather_desc}', w.desc).replace('{temp}', String(w.temp))
            m.metadata.weather = w
          }
        }
        desc = desc.replace('{weather_desc}', 'agradável').replace('{temp}', '22')
        break
      }
      case 'opentdb': {
        m.metadata.quiz = true
        break
      }
      case 'wikipedia': {
        const a = await ext.getWikiArticle()
        if (a) {
          title = title.replace('{article_title}', a.title)
          desc = desc.replace('{article_title}', a.title).replace('{article_extract}', a.extract)
          m.metadata.article = a
        } else {
          desc = desc.replace('{article_title}', 'um tema fascinante').replace('{article_extract}', 'Explore um tópico que desperte sua curiosidade.')
        }
        break
      }
      case 'numbers_api': {
        const f = await ext.getMathFact()
        desc = desc.replace('{math_fact}', f || 'Os números regem o universo.')
        break
      }
      case 'dictionary': {
        const words = ['resilience', 'discipline', 'momentum', 'clarity', 'purpose', 'focus', 'growth', 'wisdom']
        const w = await ext.getWord(pick(words))
        if (w) {
          desc = desc.replace('{word}', w.word).replace('{definition}', w.definition)
          m.metadata.word = w
        } else {
          desc = desc.replace('{word}', 'resilience').replace('{definition}', 'the capacity to recover quickly from difficulties.')
        }
        break
      }
      case 'frankfurter': {
        const r = await ext.getExchangeRate()
        desc = desc.replace('{usd}', r ? r.usd.toFixed(4) : '0.1900')
        break
      }
      case 'jokeapi': {
        const j = await ext.getJoke()
        desc = desc.replace('{joke}', j || 'Rir é o melhor remédio — e é grátis.')
        break
      }
      case 'zenquotes': {
        const q = await ext.getQuote()
        if (q) {
          desc = desc.replace('{quote_text}', q.text).replace('{quote_author}', q.author)
        } else {
          desc = desc.replace('{quote_text}', 'A disciplina é a ponte entre metas e realizações.').replace('{quote_author}', 'Jim Rohn')
        }
        break
      }
      case 'nasa': {
        const apod = await ext.getApod()
        const astros = await ext.getAstronauts()
        title = title.replace('{apod_title}', apod?.title || 'o Cosmos')
        desc = desc.replace('{apod_title}', apod?.title || 'o universo profundo').replace('{astronaut_count}', String(astros || 7))
        break
      }
      case 'themealdb': {
        const meal = await ext.getRandomMeal()
        desc = desc.replace('{meal_name}', meal?.name || 'um prato saudável').replace('{meal_area}', meal?.area || 'Internacional')
        break
      }
    }
  } catch { /* fallback to raw */ }

  // Clean any leftover placeholders
  desc = desc.replace(/{[^}]+}/g, '').replace(/\s+/g, ' ').trim()
  return { ...m, title, description: desc }
}

export class ProceduralEngine {
  async generateDailyPackage(ctx: PlayerCtx): Promise<{
    daily: GeneratedMission[]
    challenge: GeneratedMission
    weekly: GeneratedMission | null
  }> {
    const wd = weekday()
    const hr = hour()
    const isWeekend = wd === 0 || wd === 6
    const isMonday = wd === 1
    const isNight = hr >= 22 || hr < 5
    const critical = detectCritical(ctx.attributes)
    const lowDiscipline = (ctx.attributes['disciplina'] || 50) < 30

    let pool = MISSION_TEMPLATES.filter(t => !ctx.recentTemplateIds.includes(t.id))
    if (pool.length < 6) pool = MISSION_TEMPLATES

    // Weather filter
    if (!ctx.location_lat) pool = pool.filter(t => !t.weatherNeeded)
    // Weekend filter
    pool = pool.filter(t => !t.weekendOnly || isWeekend)
    // Night filter
    if (!isNight) pool = pool.filter(t => !t.nightOnly)
    // Low discipline -> only easy
    if (lowDiscipline) {
      const easy = pool.filter(t => t.difficulty === 'easy')
      if (easy.length >= 3) pool = easy
    }

    const selected: MissionTemplate[] = []
    const usedCategories = new Set<string>()

    // Regra NOVA: priorizar categorias derivadas dos temas próprios do jogador
    // (extraídos do texto livre do assessment via analyzer).
    const themeCategories = (ctx.themes || [])
      .map(t => THEME_TO_CATEGORY[t])
      .filter(Boolean) as string[]
    for (const cat of themeCategories) {
      if (selected.length >= 2) break
      if (usedCategories.has(cat)) continue
      const match = pool.filter(t => t.category === cat && !selected.includes(t))
      if (match.length) { const m = pick(match); selected.push(m); usedCategories.add(m.category) }
    }

    // Rule: at least one mission matching focus area
    if (ctx.focus_area) {
      const focusMatch = pool.filter(t => t.category === ctx.focus_area)
      if (focusMatch.length) {
        const m = pick(focusMatch)
        selected.push(m); usedCategories.add(m.category)
      }
    }
    // Rule: critical attribute recovery
    const critMatch = pool.filter(t => t.category === critical && !selected.includes(t))
    if (critMatch.length && !usedCategories.has(critical)) {
      const m = pick(critMatch)
      selected.push(m); usedCategories.add(m.category)
    }
    // Monday planning
    if (isMonday) {
      const plan = MISSION_TEMPLATES.find(t => t.id === 'meta_semana_001')
      if (plan && !selected.includes(plan)) { selected.push(plan); usedCategories.add(plan.category) }
    }
    // Fill to 3, variety of category
    let guard = 0
    while (selected.length < 3 && guard < 50) {
      guard++
      const candidates = pool.filter(t => !usedCategories.has(t.category) && !selected.includes(t))
      const m = candidates.length ? pick(candidates) : pick(pool.filter(t => !selected.includes(t)))
      if (!m) break
      selected.push(m); usedCategories.add(m.category)
    }

    const daily = await Promise.all(selected.slice(0, 3).map(t => enrichTemplate(templateToMission(t, 'daily'), t, ctx)))

    // Missão personalizada a partir da meta livre do jogador (texto próprio).
    if (ctx.customGoals && ctx.customGoals.length) {
      const goal = pick(ctx.customGoals)
      if (goal && goal.length > 3) {
        const goalCat = themeCategories[0] || critical
        daily.unshift({
          template_id: 'custom_goal',
          title: '🎯 Sua Meta: ' + goal.slice(0, 48),
          description: `Você declarou que quer: "${goal}". Hoje, dê UM passo concreto e mensurável nessa direção. Pequeno conta. Não pular.`,
          category: goalCat,
          type: 'daily',
          difficulty: 'medium',
          xp_reward: 30,
          coins_reward: 5,
          attribute_gains: { [goalCat]: 6, disciplina: 3, consistencia: 2 },
          skill_gains: {},
          metadata: { custom: true, goal },
        })
        if (daily.length > 4) daily.length = 4
      }
    }

    // Challenge — prefer critical attribute
    let challengePool = CHALLENGE_TEMPLATES.filter(t => t.category === critical)
    if (!challengePool.length) challengePool = CHALLENGE_TEMPLATES
    const chTpl = pick(challengePool)
    const challenge = await enrichTemplate(templateToMission(chTpl, 'event'), chTpl, ctx)

    // Weekly — only generate fresh on Monday in cron; on-demand we include one
    const weeklyTpl = isMonday ? pick(WEEKLY_TEMPLATES) : null
    const weekly = weeklyTpl ? await enrichTemplate(templateToMission(weeklyTpl, 'weekly'), weeklyTpl, ctx) : null

    return { daily, challenge, weekly }
  }
}

// ---- Insight generator (local) ----
export function generateInsight(ctx: PlayerCtx): string {
  const critical = detectCritical(ctx.attributes)
  const critVal = ctx.attributes[critical] || 0
  const labels: Record<string, string> = {
    corpo: 'Corpo', mente: 'Mente', emocional: 'Emocional', social: 'Social',
    proposito: 'Propósito', financas: 'Finanças', energia: 'Energia',
    disciplina: 'Disciplina', foco: 'Foco', consistencia: 'Consistência'
  }
  const avg = Math.round(Object.values(ctx.attributes).reduce((a, b) => a + b, 0) / Object.values(ctx.attributes).length)

  const lines = []
  if (critVal < 20) {
    lines.push(`Atributo crítico detectado: ${labels[critical]} em ${critVal}. Sem correção, o sistema entrará em colapso, ${ctx.nick}.`)
  } else if (ctx.streak_days >= 7) {
    lines.push(`${ctx.streak_days} dias de consistência, ${ctx.nick}. O Arquiteto reconhece quem não desiste. Mantenha o ritmo.`)
  } else if (avg >= 70) {
    lines.push(`Média geral: ${avg}. Perfil sólido, ${ctx.nick}. Mas o topo ainda está distante. Continue subindo.`)
  } else {
    lines.push(`Análise concluída. ${labels[critical]} é seu ponto mais frágil hoje. Foque a energia onde dói mais, ${ctx.nick}.`)
  }
  return lines.join(' ')
}

export function getInitialAttributesFromAssessment(answers: any): Record<string, number> {
  // Compute base attribute values from assessment (0-100 scale)
  const base: Record<string, number> = {
    corpo: 35, mente: 40, emocional: 40, social: 40, proposito: 35,
    financas: 35, energia: 40, disciplina: 35, foco: 35, consistencia: 30
  }
  if (answers.trains_body) base.corpo += 25
  if (answers.studies_consistently) { base.mente += 20; base.foco += 15 }
  if (answers.finances_organized) base.financas += 30
  if (answers.social_life_healthy) base.social += 25
  if (answers.sleep_quality) base.energia += 20
  const disc = answers.discipline_level
  if (disc === 'high') { base.disciplina += 35; base.consistencia += 25 }
  else if (disc === 'medium') { base.disciplina += 15; base.consistencia += 10 }
  // satisfaction influences emotional/proposito
  const sat = Number(answers.satisfaction_score || 5)
  base.emocional += (sat - 5) * 4
  base.proposito += (sat - 5) * 3
  // strongest attribute boost
  if (answers.strongest_attribute && base[answers.strongest_attribute] !== undefined) {
    base[answers.strongest_attribute] = Math.min(100, base[answers.strongest_attribute] + 15)
  }
  // critical attribute penalty
  if (answers.critical_attribute && base[answers.critical_attribute] !== undefined) {
    base[answers.critical_attribute] = Math.max(5, base[answers.critical_attribute] - 15)
  }
  // clamp
  for (const k of Object.keys(base)) base[k] = Math.max(5, Math.min(100, Math.round(base[k])))
  return base
}
