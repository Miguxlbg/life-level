// ===================================================
// LIFE LEVEL — Frontend SPA
// ===================================================

// ---------- API client ----------
const api = {
  async req(path, opts = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...opts,
    })
    let data = null
    try { data = await res.json() } catch {}
    if (!res.ok) throw Object.assign(new Error(data?.error || 'Erro'), { status: res.status, data })
    return data
  },
  get(p) { return this.req(p) },
  post(p, body) { return this.req(p, { method: 'POST', body: JSON.stringify(body || {}) }) },
  patch(p, body) { return this.req(p, { method: 'PATCH', body: JSON.stringify(body || {}) }) },
  del(p) { return this.req(p, { method: 'DELETE' }) },
}

// ---------- Global state ----------
const State = {
  player: null,
  attributeMap: {},
  attributes: [],
  meta: {},
  milestone: null,
  insight: '',
  notifications: [],
  guild: null,
  achievementCount: 0,
}

// ---------- Versão & Changelog ----------
const APP_VERSION = 'beta v0.1.4'
// Link para baixar o código-fonte completo do projeto (.zip)
const DOWNLOAD_URL = 'https://www.genspark.ai/api/files/s/vgFy0QWE'
// Captura o evento de instalação do PWA para o botão "Instalar app"
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window._deferredPrompt = e
})
const CHANGELOG = [
  {
    version: 'beta v0.1.4',
    date: '18 jun 2026',
    tag: 'MULTIPLATAFORMA',
    changes: [
      { type: 'add', text: 'Login com Google (entre com 1 clique usando sua conta Google)' },
      { type: 'add', text: 'Data de nascimento no cadastro e no onboarding (cálculo automático de idade)' },
      { type: 'add', text: 'Aba de CALENDÁRIO: anote, marque e registre compromissos em datas futuras' },
      { type: 'add', text: 'Relógio com data e hora ao vivo no topo do app (discreto, sempre visível)' },
      { type: 'add', text: 'Avaliação inicial reformulada: 11 perguntas refinadas com múltipla escolha' },
      { type: 'add', text: 'Opção "Outro" com texto livre em várias perguntas' },
      { type: 'add', text: 'Análise procedural FORTE: o sistema lê o que você escreve e gera missões a partir das suas próprias palavras' },
      { type: 'add', text: 'Missão personalizada criada a partir da sua meta escrita' },
      { type: 'add', text: 'Agora roda na Vercel (banco Turso) — funciona como site e como app (PWA/APK) no celular' },
      { type: 'add', text: 'App instalável no celular (Adicionar à tela inicial) e empacotável como APK' },
      { type: 'change', text: 'Interface 100% responsiva para celular, tablet e PC' },
      { type: 'change', text: 'Sessão segura por cookie em qualquer dispositivo' },
    ],
  },
  {
    version: 'beta v0.1.3',
    date: '12 jun 2026',
    tag: 'FASE 3',
    changes: [
      { type: 'add', text: 'Sistema de login real: crie sua conta com nome, codinome, email e senha' },
      { type: 'add', text: 'Login persistente — entre novamente em qualquer dispositivo com email e senha' },
      { type: 'add', text: 'Senhas protegidas com criptografia PBKDF2 (256 bits)' },
      { type: 'add', text: 'Streak diário: ganhe sequência de dias entrando todo dia' },
      { type: 'change', text: 'Tela inicial reformulada com abas Entrar / Criar Conta' },
      { type: 'change', text: 'Sessão estendida para 30 dias' },
      { type: 'change', text: 'Onboarding reaproveita o codinome definido no cadastro' },
    ],
  },
  {
    version: 'beta v0.1.2',
    date: '11 jun 2026',
    tag: 'FASE 2',
    changes: [
      { type: 'add', text: 'Sistema de Guildas: crie, entre e dispute o ranking de guildas' },
      { type: 'add', text: '22 Habilidades completas com progressão, níveis e XP por skill' },
      { type: 'add', text: 'Sistema de Conquistas (badges) desbloqueáveis' },
      { type: 'add', text: 'Personalização de avatar (emoji ou URL de imagem)' },
      { type: 'add', text: 'Botão de logs de atualização no topo da tela' },
      { type: 'add', text: 'Selo de versão "beta v0.1.2" no rodapé' },
      { type: 'change', text: 'Página de Habilidades reformulada com barras de progresso' },
      { type: 'change', text: 'Perfil agora exibe guilda, conquistas e avatar personalizado' },
    ],
  },
  {
    version: 'beta v0.1.0',
    date: '11 jun 2026',
    tag: 'FASE 1',
    changes: [
      { type: 'add', text: 'Núcleo jogável: login, onboarding e avaliação inicial' },
      { type: 'add', text: 'Dashboard com radar de atributos, XP e gráfico de evolução' },
      { type: 'add', text: 'Engine procedural de missões com 13 APIs externas gratuitas' },
      { type: 'add', text: 'Sistema de XP, níveis, títulos e moedas' },
      { type: 'add', text: 'Sistema de Morte e Renascimento com consequências reais' },
      { type: 'add', text: 'Ranking global e por categoria + Loja' },
    ],
  },
]

function changelogModal() {
  const typeMeta = {
    add: { icon: 'fa-plus', color: 'text-neon-green', bg: 'bg-neon-green/15', label: 'NOVO' },
    change: { icon: 'fa-pen', color: 'text-neon-blue', bg: 'bg-neon-blue/15', label: 'MUDOU' },
    remove: { icon: 'fa-minus', color: 'text-neon-red', bg: 'bg-neon-red/15', label: 'REMOVIDO' },
    fix: { icon: 'fa-wrench', color: 'text-neon-gold', bg: 'bg-neon-gold/15', label: 'CORREÇÃO' },
  }
  const body = CHANGELOG.map((v, i) => `
    <div class="${i > 0 ? 'mt-6 pt-6 border-t border-slate-800' : ''}">
      <div class="flex items-center gap-2 mb-3">
        <span class="font-display font-bold text-white text-lg">${v.version}</span>
        ${v.tag ? `<span class="text-[10px] font-accent uppercase tracking-wider px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple">${v.tag}</span>` : ''}
        <span class="text-xs text-slate-500 font-mono ml-auto">${v.date}</span>
      </div>
      <ul class="space-y-2">
        ${v.changes.map(c => {
          const t = typeMeta[c.type] || typeMeta.add
          return `<li class="flex items-start gap-2.5">
            <span class="shrink-0 mt-0.5 w-5 h-5 rounded-md ${t.bg} ${t.color} flex items-center justify-center text-[9px]"><i class="fas ${t.icon}"></i></span>
            <span class="text-sm text-slate-300 font-body leading-snug"><span class="${t.color} font-accent text-[9px] uppercase tracking-wider mr-1">${t.label}</span>${c.text}</span>
          </li>`
        }).join('')}
      </ul>
    </div>`).join('')

  const overlay = el(`<div class="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm" id="changelog-overlay">
    <div class="card glass w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-700 animate-fade-up">
      <div class="sticky top-0 bg-bg-card/95 backdrop-blur px-5 py-4 border-b border-slate-800 flex items-center justify-between z-10">
        <div class="flex items-center gap-2">
          <i class="fas fa-rocket text-neon-purple"></i>
          <h3 class="font-display font-bold text-white">Logs de Atualização</h3>
        </div>
        <button id="changelog-close" class="w-8 h-8 rounded-full hover:bg-white/10 text-slate-400 flex items-center justify-center"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="p-5">${body}</div>
      <div class="px-5 pb-3">
        <div class="card glass rounded-xl border border-slate-700 p-4">
          <div class="flex items-center gap-2 mb-2">
            <i class="fas fa-download text-neon-green"></i>
            <span class="font-display font-bold text-white text-sm">Baixar / Instalar</span>
          </div>
          <p class="text-xs text-slate-400 font-body mb-3">Baixe o código-fonte completo, ou instale o LIFE LEVEL como app no seu celular.</p>
          <a href="${DOWNLOAD_URL}" target="_blank" rel="noopener" class="btn-primary w-full py-2.5 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 mb-2">
            <i class="fas fa-file-zipper"></i> Baixar código (.zip)
          </a>
          <button id="pwa-install-btn" class="card glass w-full py-2.5 rounded-xl font-display font-bold text-sm text-white border border-slate-700 hover:border-neon-purple/50 flex items-center justify-center gap-2">
            <i class="fas fa-mobile-screen"></i> Instalar app no celular
          </button>
          <p class="text-[10px] text-slate-500 font-body mt-2 text-center">No celular: menu do navegador → "Adicionar à tela inicial". Veja o DEPLOY.md para gerar um APK.</p>
        </div>
      </div>
      <div class="px-5 pb-5 text-center text-[11px] text-slate-600 font-mono">LIFE LEVEL · ${APP_VERSION}</div>
    </div>
  </div>`)
  const close = () => overlay.remove()
  overlay.addEventListener('click', (e) => { if (e.target.id === 'changelog-overlay') close() })
  overlay.querySelector('#changelog-close').addEventListener('click', close)
  const pwaBtn = overlay.querySelector('#pwa-install-btn')
  if (pwaBtn) pwaBtn.addEventListener('click', () => {
    if (window._deferredPrompt) {
      window._deferredPrompt.prompt()
      window._deferredPrompt = null
    } else {
      alert('Para instalar:\n\n• Android (Chrome): menu ⋮ → "Adicionar à tela inicial" / "Instalar app".\n• iPhone (Safari): Compartilhar → "Adicionar à Tela de Início".')
    }
  })
  document.getElementById('overlay-root').appendChild(overlay)
}

// Selo de versão fixo no rodapé (persistente em todas as páginas)
function mountVersionBadge() {
  if (document.getElementById('version-badge')) return
  const badge = el(`<button id="version-badge" title="Ver logs de atualização"
    class="fixed bottom-2 right-2 z-[80] px-2.5 py-1 rounded-full bg-bg-secondary/80 backdrop-blur border border-slate-800 text-[10px] font-mono text-slate-500 hover:text-neon-purple hover:border-neon-purple/50 transition flex items-center gap-1.5 pointer-events-auto">
    <span class="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>${APP_VERSION}
  </button>`)
  badge.addEventListener('click', changelogModal)
  document.body.appendChild(badge)
}

// Relógio com data/hora ao vivo — pequeno, fixo no topo, sem atrapalhar
let _clockTimer = null
function mountClock() {
  if (document.getElementById('live-clock')) return
  const clock = el(`<div id="live-clock" class="fixed top-2 left-1/2 -translate-x-1/2 z-[80] px-3 py-1 rounded-full bg-bg-secondary/70 backdrop-blur border border-slate-800/80 text-[11px] font-mono text-slate-400 pointer-events-none flex items-center gap-2 shadow">
    <i class="fas fa-clock text-neon-purple text-[10px]"></i>
    <span id="clock-text">--</span>
  </div>`)
  document.body.appendChild(clock)
  const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
  const upd = () => {
    const elc = document.getElementById('clock-text')
    if (!elc) { if (_clockTimer) clearInterval(_clockTimer); return }
    const d = new Date()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    elc.textContent = `${dias[d.getDay()]} ${dd}/${mo} · ${hh}:${mm}:${ss}`
  }
  upd()
  _clockTimer = setInterval(upd, 1000)
}

// ---------- Utilities ----------
const ATTR_COLORS = {
  corpo: '#10b981', mente: '#2563eb', emocional: '#7c3aed', social: '#06b6d4',
  proposito: '#f59e0b', financas: '#059669', energia: '#f97316',
  disciplina: '#ef4444', foco: '#8b5cf6', consistencia: '#6366f1',
}
const ATTR_LABELS = {
  corpo: 'Corpo', mente: 'Mente', emocional: 'Emocional', social: 'Social',
  proposito: 'Propósito', financas: 'Finanças', energia: 'Energia',
  disciplina: 'Disciplina', foco: 'Foco', consistencia: 'Consistência',
}
const ATTR_ICONS = {
  corpo: '🏋️', mente: '🧠', emocional: '❤️', social: '👥', proposito: '🎯',
  financas: '💰', energia: '⚡', disciplina: '🔥', foco: '🎯', consistencia: '♻️',
}
const CAT_ICONS = {
  corpo: 'fa-dumbbell', mente: 'fa-brain', emocional: 'fa-heart', social: 'fa-users',
  proposito: 'fa-compass', financas: 'fa-coins', energia: 'fa-bolt',
  disciplina: 'fa-fire', foco: 'fa-bullseye', consistencia: 'fa-rotate',
}

function el(html) {
  const t = document.createElement('template')
  t.innerHTML = html.trim()
  return t.content.firstElementChild
}

function avatarHtml(player, size = 'w-12 h-12', textSize = 'text-lg') {
  const initials = (player.nick || player.display_name || 'XX').slice(0, 2).toUpperCase()
  const color = ATTR_COLORS[player.focus_area] || '#7c3aed'
  if (player.avatar_url) {
    return `<img src="${player.avatar_url}" class="${size} rounded-full object-cover" style="border:2px solid ${color}" onerror="this.style.display='none'" />`
  }
  if (player.avatar_emoji) {
    return `<div class="${size} rounded-full flex items-center justify-center ${textSize}" style="background:linear-gradient(135deg,${color}33,#1a1a2e);border:2px solid ${color};box-shadow:0 0 14px ${color}55">${player.avatar_emoji}</div>`
  }
  return `<div class="${size} rounded-full flex items-center justify-center font-display font-bold ${textSize}" style="background:linear-gradient(135deg,${color},#1a1a2e);border:2px solid ${color};box-shadow:0 0 14px ${color}55">${initials}</div>`
}

function toast(message, type = 'success') {
  const colors = { success: 'border-neon-green text-neon-green', error: 'border-neon-red text-neon-red', warn: 'border-neon-gold text-neon-gold', info: 'border-neon-purple text-neon-purple' }
  const icons = { success: 'fa-check-circle', error: 'fa-triangle-exclamation', warn: 'fa-bell', info: 'fa-circle-info' }
  const t = el(`<div class="toast pointer-events-auto glass border ${colors[type]} rounded-xl px-4 py-3 max-w-xs flex items-start gap-3 shadow-lg">
    <i class="fas ${icons[type]} mt-0.5"></i><span class="text-sm text-slate-100 font-body">${message}</span></div>`)
  document.getElementById('toast-container').appendChild(t)
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; t.style.transition = 'all .3s'; setTimeout(() => t.remove(), 300) }, 3500)
}

function setApp(node) {
  const app = document.getElementById('app')
  app.innerHTML = ''
  app.appendChild(typeof node === 'string' ? el(node) : node)
}

// ---------- Router ----------
const routes = {}
function route(path, handler) { routes[path] = handler }
function navigate(path) {
  if (location.pathname !== path) history.pushState({}, '', path)
  render()
}
window.addEventListener('popstate', render)
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-link]')
  if (a) { e.preventDefault(); navigate(a.getAttribute('data-link')) }
})

async function render() {
  mountVersionBadge()
  mountClock()
  const path = location.pathname
  // exact match
  if (routes[path]) return routes[path]()
  // dynamic profile
  if (path.startsWith('/app/profile/')) return routes['__profile__'](path.split('/').pop())
  if (path.startsWith('/app/attributes/')) return routes['__attribute__'](path.split('/').pop())
  if (path.startsWith('/app/')) return routes['/app/status']()
  return routes['/']()
}

// Load player into state (returns false if not authed)
async function loadPlayer() {
  try {
    const data = await api.get('/api/player/me')
    State.player = data.player
    State.attributeMap = data.attributeMap
    State.attributes = data.attributes
    State.meta = data.meta
    State.milestone = data.milestone
    State.insight = data.insight
    State.notifications = data.notifications || []
    State.guild = data.guild || null
    State.achievementCount = data.achievementCount || 0
    return true
  } catch (e) {
    return false
  }
}

// expose for module files
window.LL = { api, State, el, avatarHtml, toast, setApp, navigate, route, render, loadPlayer, changelogModal, APP_VERSION, ATTR_COLORS, ATTR_LABELS, ATTR_ICONS, CAT_ICONS }
