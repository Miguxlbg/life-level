// ===================================================
// LIFE LEVEL — Free External APIs integration
// All wrapped with timeout + graceful fallback
// ===================================================

async function fetchJson(url: string, timeoutMs = 4000): Promise<any | null> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'LifeLevel/1.0 (https://lifelvl.pages.dev)' },
    })
    clearTimeout(t)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// OpenTDB — quizzes
export async function getQuizQuestions(category = 9, difficulty = 'medium', amount = 5) {
  const data = await fetchJson(`https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}&type=multiple`)
  if (!data?.results) return null
  return data.results.map((q: any) => ({
    question: decodeHtml(q.question),
    correct: decodeHtml(q.correct_answer),
    options: [...q.incorrect_answers.map(decodeHtml), decodeHtml(q.correct_answer)].sort(() => Math.random() - 0.5),
  }))
}

// Wikipedia random summary (PT)
export async function getWikiArticle() {
  const data = await fetchJson('https://pt.wikipedia.org/api/rest_v1/page/random/summary')
  if (!data?.title) return null
  return {
    title: data.title,
    extract: (data.extract || '').slice(0, 280),
  }
}

// Numbers API — math fact
export async function getMathFact(n?: number) {
  const num = n ?? Math.floor(Math.random() * 100)
  try {
    const res = await fetch(`http://numbersapi.com/${num}/math`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

// Wger — exercises
export async function getExercises(category = 10) {
  const data = await fetchJson(`https://wger.de/api/v2/exercise/?format=json&language=2&category=${category}&limit=5`)
  if (!data?.results) return null
  return data.results.map((e: any) => e.name).filter(Boolean).slice(0, 3)
}

// Open Meteo — weather
export async function getWeather(lat: number, lng: number) {
  const data = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode`)
  if (!data?.current) return null
  const code = data.current.weathercode
  const desc = weatherCodeToDesc(code)
  return {
    temp: Math.round(data.current.temperature_2m),
    code,
    desc,
    isOutdoorFriendly: code <= 3,
  }
}

// Free Dictionary
export async function getWord(word: string, lang = 'en') {
  const data = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/${lang}/${word}`)
  if (!Array.isArray(data) || !data[0]) return null
  const entry = data[0]
  return {
    word: entry.word,
    phonetic: entry.phonetic || '',
    definition: entry.meanings?.[0]?.definitions?.[0]?.definition || '',
  }
}

// Frankfurter — currency
export async function getExchangeRate() {
  const data = await fetchJson('https://api.frankfurter.app/latest?base=BRL&symbols=USD,EUR')
  if (!data?.rates) return null
  return { usd: data.rates.USD, eur: data.rates.EUR }
}

// JokeAPI
export async function getJoke() {
  const data = await fetchJson('https://v2.jokeapi.dev/joke/Misc?safe-mode&lang=pt&type=single')
  if (data?.joke) return data.joke
  if (data?.setup) return `${data.setup} ${data.delivery}`
  return null
}

// Zen Quotes
export async function getQuote() {
  const data = await fetchJson('https://zenquotes.io/api/random')
  if (Array.isArray(data) && data[0]) return { text: data[0].q, author: data[0].a }
  return null
}

// Advice Slip
export async function getAdvice() {
  const data = await fetchJson('https://api.adviceslip.com/advice')
  return data?.slip?.advice || null
}

// NASA APOD
export async function getApod() {
  const data = await fetchJson('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY')
  if (!data?.title) return null
  return { title: data.title, explanation: (data.explanation || '').slice(0, 200) }
}

// Open Notify — astronauts
export async function getAstronauts() {
  const data = await fetchJson('http://api.open-notify.org/astros.json')
  return data?.number || null
}

// TheMealDB
export async function getRandomMeal() {
  const data = await fetchJson('https://www.themealdb.com/api/json/v1/1/random.php')
  const m = data?.meals?.[0]
  if (!m) return null
  return { name: m.strMeal, area: m.strArea, category: m.strCategory }
}

// ---- helpers ----
function decodeHtml(s: string): string {
  return (s || '')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&eacute;/g, 'é')
    .replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"').replace(/&rsquo;/g, "'")
}

function weatherCodeToDesc(code: number): string {
  if (code === 0) return 'céu limpo'
  if (code <= 3) return 'parcialmente nublado'
  if (code <= 48) return 'neblina'
  if (code <= 67) return 'chuva'
  if (code <= 77) return 'neve'
  if (code <= 82) return 'pancadas de chuva'
  return 'tempestade'
}
