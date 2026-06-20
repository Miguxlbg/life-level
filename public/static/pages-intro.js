;(function(){ /* LL_IIFE */
// ===================================================
// LIFE LEVEL — Intro pages: Landing, Onboarding, Assessment
// ===================================================
const { api, State, el, toast, setApp, navigate, route, loadPlayer } = window.LL

function typewriter(node, text, speed = 28, done) {
  node.textContent = ''
  node.classList.add('cursor-blink')
  let i = 0
  const tick = () => {
    if (i <= text.length) { node.textContent = text.slice(0, i); i++; setTimeout(tick, speed) }
    else { node.classList.remove('cursor-blink'); done && done() }
  }
  tick()
}

// ---------- LANDING / AUTH ----------
let authMode = 'login' // 'login' | 'register'
let googleConfigured = false

route('/', async () => {
  // detecta erro vindo do callback do Google
  const params = new URLSearchParams(location.search)
  const authError = params.get('auth_error')
  try { const s = await api.get('/api/auth/google/status'); googleConfigured = !!s.configured } catch {}
  renderLanding(authError)
})

function renderLanding(authError) {
  setApp(`<main class="min-h-screen bg-aurora flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden">
    <div class="absolute inset-0 opacity-30" style="background-image:radial-gradient(circle at 20% 30%, rgba(124,58,237,.15), transparent 40%),radial-gradient(circle at 80% 70%, rgba(37,99,235,.12), transparent 40%)"></div>
    <div class="relative z-10 max-w-md w-full text-center animate-fade-up">
      <div class="mb-2 text-xs font-accent tracking-[0.3em] text-neon-purple uppercase">Sistema Online</div>
      <h1 class="font-display font-black text-4xl sm:text-6xl mb-3 leading-none">
        <span class="glow-purple text-white">LIFE</span> <span class="text-neon-green glow-green">LEVEL</span>
      </h1>
      <p class="font-accent text-slate-400 text-xs sm:text-sm tracking-widest uppercase mb-5 sm:mb-6">Sistema de Evolução Pessoal</p>

      <div class="card p-5 sm:p-6 glass text-left">
        <div class="flex gap-2 mb-5 p-1 bg-bg-secondary/60 rounded-xl">
          <button id="tab-login" class="flex-1 py-2.5 rounded-lg font-display font-bold text-sm transition ${authMode==='login'?'bg-neon-purple/20 text-neon-purple':'text-slate-400'}">ENTRAR</button>
          <button id="tab-register" class="flex-1 py-2.5 rounded-lg font-display font-bold text-sm transition ${authMode==='register'?'bg-neon-purple/20 text-neon-purple':'text-slate-400'}">CRIAR CONTA</button>
        </div>

        <!-- BOTÃO GOOGLE -->
        <button id="google-btn" class="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-100 transition mb-3">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuar com Google
        </button>
        ${!googleConfigured ? `<p class="text-[10px] text-slate-500 text-center mb-3 -mt-1">Login Google ativa após configurar as chaves no servidor</p>` : ''}

        <div class="flex items-center gap-3 my-3"><div class="flex-1 h-px bg-slate-700"></div><span class="text-[11px] text-slate-500 font-body">ou</span><div class="flex-1 h-px bg-slate-700"></div></div>

        <form id="auth-form" class="space-y-3">
          ${authMode === 'register' ? `
          <div>
            <label class="block text-[11px] text-slate-400 font-accent uppercase tracking-wider mb-1">Nome</label>
            <input id="f-name" type="text" maxlength="40" autocomplete="name" class="auth-input" placeholder="Seu nome" />
          </div>
          <div>
            <label class="block text-[11px] text-slate-400 font-accent uppercase tracking-wider mb-1">Codinome (nick)</label>
            <input id="f-nick" type="text" maxlength="20" autocomplete="username" class="auth-input" placeholder="Ex: neo_01" />
          </div>
          <div>
            <label class="block text-[11px] text-slate-400 font-accent uppercase tracking-wider mb-1">Data de nascimento</label>
            <input id="f-birth" type="date" class="auth-input" max="2014-01-01" min="1925-01-01" />
          </div>` : ''}
          <div>
            <label class="block text-[11px] text-slate-400 font-accent uppercase tracking-wider mb-1">Email</label>
            <input id="f-email" type="email" autocomplete="email" class="auth-input" placeholder="voce@email.com" />
          </div>
          <div>
            <label class="block text-[11px] text-slate-400 font-accent uppercase tracking-wider mb-1">Senha</label>
            <input id="f-password" type="password" autocomplete="${authMode==='register'?'new-password':'current-password'}" class="auth-input" placeholder="${authMode==='register'?'Mínimo 6 caracteres':'Sua senha'}" />
          </div>
          <div id="auth-error" class="text-neon-red text-xs font-body min-h-[16px]">${authError ? authError : ''}</div>
          <button id="auth-submit" type="submit" class="btn-primary w-full py-3.5 rounded-2xl font-display font-bold tracking-wide">
            ${authMode==='register'?'CRIAR MEU PERFIL':'ACESSAR SISTEMA'}
          </button>
        </form>
        <div class="mt-4 text-center">
          <button id="demo-btn" class="text-slate-500 text-xs font-body hover:text-neon-purple transition"><i class="fas fa-flask mr-1"></i>Explorar com conta de teste</button>
        </div>
      </div>
      <p class="mt-5 text-slate-500 text-xs font-body px-4">Você não está aqui para sobreviver. Está aqui para evoluir.</p>
    </div>
  </main>`)

  // tab switching
  document.getElementById('tab-login').onclick = () => { authMode = 'login'; renderLanding() }
  document.getElementById('tab-register').onclick = () => { authMode = 'register'; renderLanding() }

  // google
  document.getElementById('google-btn').onclick = () => {
    if (!googleConfigured) { toast('Login com Google ainda não foi configurado no servidor.', 'error'); return }
    window.location.href = '/api/auth/google'
  }

  const form = document.getElementById('auth-form')
  const errEl = document.getElementById('auth-error')
  form.onsubmit = async (e) => {
    e.preventDefault()
    errEl.textContent = ''
    const btn = document.getElementById('auth-submit')
    const orig = btn.innerHTML
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSANDO...'
    try {
      let r
      if (authMode === 'register') {
        const payload = {
          name: document.getElementById('f-name').value.trim(),
          nick: document.getElementById('f-nick').value.trim(),
          email: document.getElementById('f-email').value.trim(),
          password: document.getElementById('f-password').value,
          birth_date: document.getElementById('f-birth').value || null,
        }
        r = await api.post('/api/auth/register', payload)
      } else {
        r = await api.post('/api/auth/login', {
          email: document.getElementById('f-email').value.trim(),
          password: document.getElementById('f-password').value,
        })
      }
      navigate(r.redirect)
    } catch (err) {
      errEl.textContent = err.message || 'Erro ao processar. Tente novamente.'
      btn.disabled = false; btn.innerHTML = orig
    }
  }

  // demo fallback
  document.getElementById('demo-btn').onclick = async () => {
    try { const r = await api.post('/api/auth/demo', {}); navigate(r.redirect) }
    catch { toast('Falha ao iniciar conta de teste', 'error') }
  }
}

// ---------- ONBOARDING ----------
const onboarding = { nick: '', age: 25, birth_date: '', biological_sex: '', height_cm: 175, weight_kg: 70 }

route('/onboarding', async () => {
  const ok = await loadPlayer()
  if (ok && State.player) {
    if (State.player.nick) onboarding.nick = State.player.nick
    onboarding.existingNick = State.player.nick || null
    if (State.player.birth_date) onboarding.birth_date = State.player.birth_date
  }
  renderOnboardingStep(0)
})

function obShell(stepLabel, inner) {
  setApp(`<main class="min-h-screen bg-aurora flex flex-col px-4 sm:px-6 py-8 relative">
    <div class="max-w-md w-full mx-auto flex-1 flex flex-col">
      <div class="text-center mb-6">
        <div class="font-accent text-[11px] tracking-[0.3em] text-neon-purple uppercase">${stepLabel}</div>
      </div>
      <div id="ob-inner" class="flex-1 flex flex-col justify-center animate-fade-up">${inner}</div>
    </div>
  </main>`)
}

function renderOnboardingStep(step) {
  if (step === 0) {
    obShell('Inicialização', `
      <div class="text-center">
        <div class="font-display font-black text-4xl mb-4"><span class="text-white glow-purple">LIFE</span> <span class="text-neon-green glow-green">LEVEL</span></div>
        <div class="card glass p-5 mb-6 text-left"><p id="ob-tw" class="font-body text-lg text-slate-200 min-h-[80px] leading-relaxed"></p></div>
        <button id="ob-next" class="btn-primary w-full py-4 rounded-2xl font-display font-bold tracking-wide opacity-50" disabled>INICIAR PROTOCOLO</button>
      </div>`)
    typewriter(document.getElementById('ob-tw'),
      'Antes de começar, preciso conhecer você. Não há respostas certas ou erradas. Apenas a verdade do seu ponto de partida.',
      28, () => { const b = document.getElementById('ob-next'); b.disabled = false; b.classList.remove('opacity-50') })
    document.getElementById('ob-next').onclick = () => renderOnboardingStep(onboarding.existingNick ? 2 : 1)
    return
  }

  if (step === 1) {
    obShell('Identificação · 1/6', `
      <h2 class="font-display font-bold text-2xl text-white mb-2">Como devo te chamar?</h2>
      <p class="text-slate-400 font-body mb-6">Seu codinome no sistema. Único e definitivo.</p>
      <input id="ob-nick" maxlength="30" value="${onboarding.nick}" placeholder="Ex: Alex" class="w-full bg-bg-card border border-slate-700 rounded-xl px-4 py-4 text-white font-body text-lg focus:border-neon-purple focus:outline-none" />
      <div id="ob-nick-status" class="mt-2 text-sm font-body min-h-[20px]"></div>
      <button id="ob-next" class="btn-primary w-full py-4 rounded-2xl font-display font-bold mt-6 opacity-50" disabled>PRÓXIMO</button>`)
    const input = document.getElementById('ob-nick')
    const status = document.getElementById('ob-nick-status')
    const btn = document.getElementById('ob-next')
    let timer
    input.oninput = () => {
      const v = input.value.trim()
      clearTimeout(timer)
      btn.disabled = true; btn.classList.add('opacity-50')
      if (v.length < 3) { status.innerHTML = '<span class="text-slate-500">Mínimo 3 caracteres</span>'; return }
      status.innerHTML = '<span class="text-slate-500"><i class="fas fa-spinner fa-spin"></i> Verificando...</span>'
      timer = setTimeout(async () => {
        const r = await api.get('/api/player/check-nick?nick=' + encodeURIComponent(v))
        if (r.available) { status.innerHTML = '<span class="text-neon-green"><i class="fas fa-check"></i> Disponível</span>'; btn.disabled = false; btn.classList.remove('opacity-50') }
        else { status.innerHTML = '<span class="text-neon-red"><i class="fas fa-times"></i> ' + (r.reason || 'Já em uso') + '</span>' }
      }, 400)
    }
    input.focus()
    btn.onclick = () => { onboarding.nick = input.value.trim(); renderOnboardingStep(2) }
    return
  }

  if (step === 2) {
    // DATA DE NASCIMENTO (substitui o slider de idade)
    obShell('Fase de Vida · 2/6', `
      <h2 class="font-display font-bold text-2xl text-white mb-2">Sua data de nascimento</h2>
      <p class="text-slate-400 font-body mb-6">Usada para calibrar sua fase de vida.</p>
      <input id="ob-birth" type="date" value="${onboarding.birth_date}" max="2014-01-01" min="1925-01-01"
        class="w-full bg-bg-card border border-slate-700 rounded-xl px-4 py-4 text-white font-body text-lg focus:border-neon-purple focus:outline-none" />
      <div class="text-center mt-5">
        <div id="ob-age-val" class="font-display font-black text-5xl text-neon-purple glow-purple">--</div>
        <div id="ob-phase" class="font-accent text-sm text-slate-400 uppercase tracking-wider mt-2"></div>
      </div>
      <button id="ob-next" class="btn-primary w-full py-4 rounded-2xl font-display font-bold mt-8 opacity-50" disabled>PRÓXIMO</button>`)
    const inp = document.getElementById('ob-birth')
    const btn = document.getElementById('ob-next')
    const upd = () => {
      if (!inp.value) return
      const bd = new Date(inp.value)
      const age = Math.floor((Date.now() - bd.getTime()) / (365.25 * 86400000))
      if (age < 5 || age > 110) { document.getElementById('ob-age-val').textContent = '?'; return }
      onboarding.birth_date = inp.value; onboarding.age = age
      document.getElementById('ob-age-val').textContent = age + ' anos'
      document.getElementById('ob-phase').textContent = lifePhase(age)
      btn.disabled = false; btn.classList.remove('opacity-50')
    }
    inp.onchange = upd; if (inp.value) upd()
    btn.onclick = () => renderOnboardingStep(3)
    return
  }

  if (step === 3) {
    obShell('Biometria · 3/6', `
      <h2 class="font-display font-bold text-2xl text-white mb-2">Sexo biológico</h2>
      <p class="text-slate-400 font-body mb-6">Usado apenas para calibrar projeções físicas.</p>
      <div class="space-y-3">
        ${[['Masculino','male'],['Feminino','female'],['Prefiro não informar','na']].map(([l,v]) => `
        <button data-sex="${v}" class="ob-sex w-full card glass p-4 text-left font-body text-lg text-white card-hover ${onboarding.biological_sex===v?'border-neon-purple':''}">${l}</button>`).join('')}
      </div>
      <button id="ob-next" class="btn-primary w-full py-4 rounded-2xl font-display font-bold mt-6 opacity-50" disabled>PRÓXIMO</button>`)
    document.querySelectorAll('.ob-sex').forEach(b => b.onclick = () => {
      onboarding.biological_sex = b.getAttribute('data-sex')
      document.querySelectorAll('.ob-sex').forEach(x => x.classList.remove('border-neon-purple'))
      b.classList.add('border-neon-purple')
      const n = document.getElementById('ob-next'); n.disabled = false; n.classList.remove('opacity-50')
    })
    if (onboarding.biological_sex) { const n = document.getElementById('ob-next'); n.disabled = false; n.classList.remove('opacity-50') }
    document.getElementById('ob-next').onclick = () => renderOnboardingStep(4)
    return
  }

  if (step === 4) {
    obShell('Altura · 4/6', stepperHtml('Qual sua altura?', '', onboarding.height_cm, 'cm'))
    setupStepper(120, 230, 1, () => renderOnboardingStep(5), v => onboarding.height_cm = v, onboarding.height_cm)
    return
  }

  if (step === 5) {
    obShell('Peso · 5/6', stepperHtml('Qual seu peso?', 'Sem julgamento — é só o ponto de partida.', onboarding.weight_kg, 'kg'))
    setupStepper(30, 300, 1, () => renderOnboardingStep(6), v => onboarding.weight_kg = v, onboarding.weight_kg)
    return
  }

  if (step === 6) {
    obShell('Análise · 6/6', `<div class="text-center"><div class="font-display text-neon-purple text-sm mb-4"><i class="fas fa-spinner fa-spin"></i> GERANDO RELATÓRIO INICIAL...</div></div>`)
    finalizeOnboarding()
    return
  }
}

function stepperHtml(title, sub, val, unit) {
  return `<h2 class="font-display font-bold text-2xl text-white mb-2">${title}</h2>
    <p class="text-slate-400 font-body mb-8">${sub}</p>
    <div class="flex items-center justify-center gap-4 sm:gap-6 mb-4">
      <button id="st-minus" class="w-14 h-14 rounded-full card glass text-2xl text-white card-hover">−</button>
      <div class="text-center"><span id="st-val" class="font-display font-black text-5xl sm:text-6xl text-neon-purple glow-purple">${val}</span><span class="text-slate-400 font-accent text-xl ml-1">${unit}</span></div>
      <button id="st-plus" class="w-14 h-14 rounded-full card glass text-2xl text-white card-hover">+</button>
    </div>
    <input id="st-range" type="range" class="w-full accent-purple-600" />
    <button id="ob-next" class="btn-primary w-full py-4 rounded-2xl font-display font-bold mt-8">PRÓXIMO</button>`
}

function setupStepper(min, max, step, onNext, onChange, initial) {
  let v = initial
  const valEl = document.getElementById('st-val')
  const range = document.getElementById('st-range')
  range.min = min; range.max = max; range.step = step; range.value = v
  const upd = () => { valEl.textContent = v; range.value = v; onChange(v) }
  document.getElementById('st-minus').onclick = () => { v = Math.max(min, v - 1); upd() }
  document.getElementById('st-plus').onclick = () => { v = Math.min(max, v + 1); upd() }
  range.oninput = () => { v = +range.value; upd() }
  upd()
  document.getElementById('ob-next').onclick = onNext
}

async function finalizeOnboarding() {
  try {
    const r = await api.post('/api/onboarding/complete', onboarding)
    await new Promise(res => setTimeout(res, 800))
    obShell('Relatório do Sistema', `
      <div class="card glass p-6 text-center animate-fade-up">
        <div class="font-accent text-xs text-neon-purple uppercase tracking-widest mb-3">Índice de Massa Corporal</div>
        <div class="font-display font-black text-5xl text-white mb-1">${r.bmi}</div>
        <div class="font-body text-neon-green mb-4">${r.bmiClass}</div>
        <div class="border-t border-slate-800 pt-4 text-left">
          <p class="font-body text-slate-200 leading-relaxed">${onboarding.nick}, seu ponto de partida foi calculado. Fase de vida: <span class="text-neon-purple">${r.lifePhase}</span>. A partir de agora, cada escolha será registrada. O Arquiteto observará sua evolução.</p>
        </div>
      </div>
      <button id="ob-assess" class="btn-neon w-full py-4 rounded-2xl font-display font-bold mt-6">INICIAR AVALIAÇÃO INICIAL</button>`)
    document.getElementById('ob-assess').onclick = () => navigate('/assessment')
  } catch (e) {
    toast(e.message || 'Erro ao salvar perfil', 'error')
    renderOnboardingStep(1)
  }
}

function lifePhase(age) {
  if (age <= 17) return 'Adolescente'
  if (age <= 25) return 'Jovem Adulto'
  if (age <= 40) return 'Adulto'
  if (age <= 60) return 'Adulto Maduro'
  return 'Sênior'
}

// ===================================================
// ASSESSMENT REFORMULADO (11 perguntas, multi-escolha,
// opção "Outro" com texto livre -> análise procedural forte)
// ===================================================
const ATTR_OPTS = [
  { val: 'corpo', label: 'Corpo', icon: '🏋️' },
  { val: 'mente', label: 'Mente', icon: '🧠' },
  { val: 'emocional', label: 'Emocional', icon: '❤️' },
  { val: 'social', label: 'Social', icon: '👥' },
  { val: 'proposito', label: 'Propósito', icon: '🎯' },
  { val: 'financas', label: 'Finanças', icon: '💰' },
  { val: 'energia', label: 'Energia', icon: '⚡' },
  { val: 'disciplina', label: 'Disciplina', icon: '🔥' },
]

// Cada pergunta: tipo, se permite múltipla escolha e se tem campo "Outro"
const ASSESSMENT_Q = [
  { key: 'satisfaction_score', q: 'Quão satisfeito você está com sua vida hoje?', sub: 'Seja honesto. É o ponto de partida.', type: 'scale' },
  { key: 'critical_attribute', q: 'Quais áreas estão mais negligenciadas? ', sub: 'Pode escolher mais de uma.', type: 'attr', multi: true, other: true },
  { key: 'strongest_attribute', q: 'Onde você já é forte hoje?', sub: 'Seus pontos fortes atuais.', type: 'attr', multi: true, other: true },
  { key: 'dopamine_drains', q: 'O que mais drena sua energia e foco?', sub: 'Escolha tudo que se aplica.', type: 'multi', other: true,
    options: ['Redes sociais', 'Jogos', 'Procrastinação', 'Notícias', 'Comparação', 'Streaming excessivo', 'Pornografia', 'Açúcar / junk food'] },
  { key: 'sleep_quality', q: 'Você dorme bem e acorda descansado?', type: 'bool' },
  { key: 'discipline_level', q: 'Como você avalia sua disciplina?', type: 'choice', options: [['Alta','high'],['Média','medium'],['Baixa','low']] },
  { key: 'routine_desc', q: 'Descreva sua rotina atual em poucas palavras', sub: 'Escreva livremente — quanto mais detalhe, melhor o sistema te entende.', type: 'text', placeholder: 'Ex: acordo tarde, trabalho o dia todo, sem tempo pra mim...' },
  { key: 'biggest_struggle', q: 'Qual é a sua maior dificuldade hoje?', sub: 'Conte com suas palavras. (opcional, mas poderoso)', type: 'text', placeholder: 'Ex: não consigo manter constância, fico ansioso...' },
  { key: 'habits_good', q: 'Quais bons hábitos você já tem?', sub: 'Escolha e/ou escreva os seus.', type: 'multi', other: true,
    options: ['Treino', 'Leitura', 'Meditação', 'Alimentação saudável', 'Acordar cedo', 'Estudar todo dia', 'Poupar dinheiro', 'Beber água'] },
  { key: 'primary_goal', q: 'Qual é o seu maior objetivo agora?', sub: 'Escreva sua meta com suas próprias palavras.', type: 'text', placeholder: 'Ex: montar uma rotina de treino e estudo, abrir meu negócio...' },
  { key: 'primary_goal_area', q: 'Em qual área quer focar a evolução primeiro?', sub: 'Pode escolher mais de uma.', type: 'attr', multi: true, other: true },
]

const assessment = { responses: [], dopamine_drains: [] }

route('/assessment', () => { assessment.responses = []; renderAssessmentQ(0) })

function renderAssessmentQ(i) {
  if (i >= ASSESSMENT_Q.length) return finalizeAssessment()
  const q = ASSESSMENT_Q[i]
  const num = String(i + 1).padStart(2, '0')
  let body = ''
  const showOther = q.other
  const showNext = q.multi || q.type === 'multi' || q.type === 'text' || q.other

  if (q.type === 'scale') {
    body = `<div class="grid grid-cols-5 gap-2 mt-4">${[1,2,3,4,5,6,7,8,9,10].map(n => `<button data-val="${n}" class="as-opt card glass py-3 font-display text-white card-hover">${n}</button>`).join('')}</div>
      <div class="flex justify-between text-xs text-slate-500 mt-2 font-body"><span>Insatisfeito</span><span>Realizado</span></div>`
  } else if (q.type === 'attr') {
    body = `<div class="grid grid-cols-2 gap-3 mt-4">${ATTR_OPTS.map(o => `<button data-val="${o.val}" class="${q.multi?'as-multi':'as-opt'} card glass p-3 sm:p-4 text-left card-hover"><span class="text-2xl">${o.icon}</span><div class="font-body text-white mt-1">${o.label}</div></button>`).join('')}</div>`
  } else if (q.type === 'multi') {
    body = `<div class="space-y-2 mt-4">${q.options.map(o => `<button data-val="${o}" class="as-multi card glass w-full p-3 text-left font-body text-white card-hover">${o}</button>`).join('')}</div>`
  } else if (q.type === 'bool') {
    body = `<div class="grid grid-cols-2 gap-3 mt-4">
      <button data-val="1" class="as-opt card glass p-5 font-display text-neon-green card-hover text-lg"><i class="fas fa-check mb-1 block text-2xl"></i>SIM</button>
      <button data-val="0" class="as-opt card glass p-5 font-display text-neon-red card-hover text-lg"><i class="fas fa-times mb-1 block text-2xl"></i>NÃO</button></div>`
  } else if (q.type === 'choice') {
    body = `<div class="space-y-3 mt-4">${q.options.map(([l,v]) => `<button data-val="${v}" class="as-opt card glass w-full p-4 font-body text-white text-lg card-hover">${l}</button>`).join('')}</div>`
  } else if (q.type === 'text') {
    body = `<textarea id="as-text" rows="4" maxlength="500" placeholder="${q.placeholder||'Escreva aqui...'}" class="w-full mt-4 bg-bg-card border border-slate-700 rounded-xl px-4 py-3 text-white font-body focus:border-neon-purple focus:outline-none resize-none"></textarea>`
  }

  const otherHtml = showOther ? `
    <div class="mt-3">
      <button id="as-other-toggle" class="text-sm text-neon-purple font-body"><i class="fas fa-plus-circle mr-1"></i>Outro (escrever)</button>
      <textarea id="as-other" rows="2" maxlength="300" placeholder="Descreva com suas próprias palavras..." class="hidden w-full mt-2 bg-bg-card border border-slate-700 rounded-xl px-4 py-2.5 text-white font-body focus:border-neon-purple focus:outline-none resize-none"></textarea>
    </div>` : ''

  const nextBtn = showNext ? `<button id="as-next" class="btn-primary w-full py-4 rounded-2xl font-display font-bold mt-6">${q.type==='text'?'CONTINUAR':'CONFIRMAR'}</button>` : ''
  const skipBtn = (q.type === 'text' && q.key !== 'primary_goal') ? `<button id="as-skip" class="w-full py-2 text-slate-500 text-sm font-body mt-2 hover:text-slate-300">Pular esta</button>` : ''

  setApp(`<main class="min-h-screen bg-aurora flex flex-col px-4 sm:px-6 py-8">
    <div class="max-w-md w-full mx-auto flex-1 flex flex-col">
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2"><span class="font-accent text-xs text-neon-purple tracking-widest uppercase">Situação Atual</span><span class="font-mono text-sm text-slate-400">${num}/11</span></div>
        <div class="progress-track h-1.5"><div class="progress-fill h-full bg-neon-purple" style="width:${((i+1)/11*100)}%"></div></div>
      </div>
      <div class="flex-1 flex flex-col justify-center animate-fade-up">
        <h2 class="font-display font-bold text-xl sm:text-2xl text-white leading-tight">${q.q}</h2>
        ${q.sub ? `<p class="text-slate-400 font-body text-sm mt-1">${q.sub}</p>` : ''}
        ${body}
        ${otherHtml}
        ${nextBtn}
        ${skipBtn}
      </div>
    </div>
  </main>`)

  // "Outro" toggle
  if (showOther) {
    document.getElementById('as-other-toggle').onclick = () => {
      document.getElementById('as-other').classList.toggle('hidden')
      document.getElementById('as-other').focus()
    }
  }

  // helper para registrar resposta procedural
  const record = (choices, other) => {
    assessment.responses.push({ qid: q.key, choices: choices || [], other: other || '' })
  }

  if (q.type === 'scale') {
    document.querySelectorAll('.as-opt').forEach(b => b.onclick = () => {
      assessment.satisfaction_score = +b.dataset.val
      record([], '')
      setTimeout(() => renderAssessmentQ(i + 1), 150)
    })
  } else if (q.type === 'bool') {
    document.querySelectorAll('.as-opt').forEach(b => b.onclick = () => {
      assessment[q.key] = b.dataset.val === '1'
      setTimeout(() => renderAssessmentQ(i + 1), 150)
    })
  } else if (q.type === 'choice') {
    document.querySelectorAll('.as-opt').forEach(b => b.onclick = () => {
      assessment[q.key] = b.dataset.val
      setTimeout(() => renderAssessmentQ(i + 1), 150)
    })
  } else if (q.type === 'multi' || q.multi) {
    const sel = new Set()
    document.querySelectorAll('.as-multi').forEach(b => {
      b.onclick = () => { const v = b.dataset.val; if (sel.has(v)) { sel.delete(v); b.classList.remove('border-neon-purple') } else { sel.add(v); b.classList.add('border-neon-purple') } }
    })
    document.getElementById('as-next').onclick = () => {
      const choices = [...sel]
      const other = showOther ? (document.getElementById('as-other').value || '').trim() : ''
      // legados
      if (q.key === 'dopamine_drains') assessment.dopamine_drains = choices.concat(other ? [other] : [])
      if (q.key === 'critical_attribute' && choices[0]) assessment.critical_attribute = choices[0]
      if (q.key === 'strongest_attribute' && choices[0]) assessment.strongest_attribute = choices[0]
      if (q.key === 'primary_goal_area' && choices[0]) assessment.primary_goal_area = choices[0]
      record(choices, other)
      renderAssessmentQ(i + 1)
    }
  } else if (q.type === 'text') {
    document.getElementById('as-next').onclick = () => {
      const txt = (document.getElementById('as-text').value || '').trim()
      const other = showOther ? (document.getElementById('as-other').value || '').trim() : ''
      if (q.key === 'primary_goal') assessment.primary_goal = txt
      assessment[q.key] = txt
      record([], (txt + ' ' + other).trim())
      renderAssessmentQ(i + 1)
    }
    if (skipBtn) document.getElementById('as-skip').onclick = () => { record([], ''); renderAssessmentQ(i + 1) }
  }
}

async function finalizeAssessment() {
  setApp(`<main class="min-h-screen bg-aurora flex items-center justify-center px-6">
    <div class="text-center animate-fade-up">
      <div class="font-display text-neon-purple text-lg mb-3"><i class="fas fa-spinner fa-spin"></i></div>
      <p class="font-body text-slate-300 text-lg">Analisando suas respostas...<br/>O Arquiteto está interpretando o que você escreveu.</p>
    </div></main>`)
  try {
    const r = await api.post('/api/assessment/complete', assessment)
    await new Promise(res => setTimeout(res, 1000))
    // mostra um resumo da análise antes de entrar
    const a = r.analysis || {}
    const themes = (a.detectedThemes || []).slice(0, 5)
    setApp(`<main class="min-h-screen bg-aurora flex items-center justify-center px-4 sm:px-6 py-8">
      <div class="max-w-md w-full card glass p-6 animate-fade-up">
        <div class="font-accent text-xs text-neon-purple uppercase tracking-widest mb-2 text-center">Análise Concluída</div>
        <h2 class="font-display font-bold text-2xl text-white text-center mb-4">Perfil Mapeado</h2>
        ${themes.length ? `<div class="mb-4"><div class="text-xs text-slate-400 font-body mb-2">O sistema detectou estes temas nas suas respostas:</div>
          <div class="flex flex-wrap gap-2">${themes.map(t => `<span class="text-xs bg-neon-purple/20 text-neon-purple px-2.5 py-1 rounded-full font-body">${t}</span>`).join('')}</div></div>` : ''}
        ${(a.focusAreas||[]).length ? `<p class="font-body text-slate-300 text-sm mb-4">Suas missões serão focadas em <span class="text-neon-green">${(a.focusAreas||[]).slice(0,3).join(', ')}</span> — onde você mais precisa evoluir agora.</p>` : ''}
        <button id="go-app" class="btn-neon w-full py-4 rounded-2xl font-display font-bold">ENTRAR NO SISTEMA</button>
      </div>
    </main>`)
    document.getElementById('go-app').onclick = () => navigate('/app/status')
  } catch (e) {
    toast(e.message || 'Erro ao processar avaliação', 'error')
  }
}
})();
