;(function(){ /* LL_IIFE */
// ===================================================
// LIFE LEVEL — App shell + Dashboard (Status)
// ===================================================
const { api, State, el, avatarHtml, toast, setApp, navigate, route, loadPlayer, ATTR_COLORS, ATTR_LABELS, ATTR_ICONS, CAT_ICONS } = window.LL

const NAV_ITEMS = [
  { path: '/app/status', icon: 'fa-chart-pie', label: 'Status' },
  { path: '/app/missions', icon: 'fa-khanda', label: 'Missões' },
  { path: '/app/ranking', icon: 'fa-trophy', label: 'Ranking' },
  { path: '/app/system', icon: 'fa-gear', label: 'Sistema' },
]

function appShell(activePath, content) {
  const p = State.player
  return `<div class="min-h-screen bg-bg-primary flex flex-col lg:flex-row">
    <!-- Sidebar desktop -->
    <aside class="hidden lg:flex lg:flex-col lg:w-64 bg-bg-secondary border-r border-slate-900 p-4 sticky top-0 h-screen">
      <div class="font-display font-black text-xl mb-8 px-2"><span class="text-white">LIFE</span> <span class="text-neon-green">LEVEL</span></div>
      <div class="card glass p-3 mb-6 flex items-center gap-3">
        ${avatarHtml(p, 'w-10 h-10', 'text-sm')}
        <div class="min-w-0"><div class="font-body text-white truncate">${p.nick}</div><div class="text-xs text-neon-purple font-accent uppercase">${p.title}</div></div>
      </div>
      <nav class="flex flex-col gap-1 flex-1">
        ${[...NAV_ITEMS, { path: '/app/calendar', icon: 'fa-calendar-days', label: 'Calendário' }, { path: '/app/skills', icon: 'fa-layer-group', label: 'Habilidades' }, { path: '/app/guilds', icon: 'fa-shield-halved', label: 'Guildas' }, { path: '/app/achievements', icon: 'fa-medal', label: 'Conquistas' }, { path: '/app/shop', icon: 'fa-store', label: 'Loja' }, { path: '/app/profile', icon: 'fa-user', label: 'Perfil' }].map(n => `
          <a data-link="${n.path}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-body transition ${activePath===n.path?'bg-neon-purple/15 text-neon-purple':'text-slate-400 hover:text-white hover:bg-white/5'}">
            <i class="fas ${n.icon} w-5"></i>${n.label}</a>`).join('')}
      </nav>
      <div class="card glass p-3 flex items-center justify-between text-sm">
        <span class="text-neon-gold font-mono"><i class="fas fa-coins"></i> ${p.coins}</span>
        <span class="text-slate-400 font-mono">Lv ${p.level}</span>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <div class="flex-1 pb-24 lg:pb-8">${content}</div>
      <!-- Bottom nav mobile -->
      <nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-bg-secondary/95 backdrop-blur border-t border-slate-900 grid grid-cols-4 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        ${NAV_ITEMS.map(n => `
          <a data-link="${n.path}" class="flex flex-col items-center gap-1 py-1 ${activePath===n.path?'nav-active':'text-slate-500'}">
            <i class="fas ${n.icon} text-lg"></i>
            <span class="text-[10px] font-accent uppercase tracking-wider">${n.label}</span>
            <div class="nav-glow h-0.5 w-8 rounded-full bg-neon-purple ${activePath===n.path?'opacity-100':'opacity-0'}"></div>
          </a>`).join('')}
      </nav>
    </div>
  </div>`
}

function loadingScreen() {
  setApp(`<div class="min-h-screen bg-bg-primary flex items-center justify-center">
    <div class="text-center"><div class="font-display text-neon-purple text-2xl mb-2 animate-pulse">LIFE LEVEL</div>
    <i class="fas fa-spinner fa-spin text-neon-purple"></i></div></div>`)
}

// guard: load player then render page
async function appGuard(renderFn) {
  loadingScreen()
  const ok = await loadPlayer()
  if (!ok) return navigate('/')
  if (!State.player.onboarding_completed) return navigate('/onboarding')
  if (!State.player.assessment_completed) return navigate('/assessment')
  if (State.player.is_dead) return navigate('/app/death')
  renderFn()
}

// ---------- DASHBOARD ----------
route('/app/status', () => appGuard(renderDashboard))

async function renderDashboard() {
  const p = State.player
  const m = State.attributeMap
  const unread = State.notifications.length

  const radarKeys = ['corpo', 'mente', 'emocional', 'social', 'proposito', 'financas']
  const content = `
    <div class="bg-aurora">
    <!-- Header -->
    <header class="px-4 lg:px-8 pt-6 pb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="relative">${avatarHtml(p, 'w-12 h-12', 'text-base')}
          <div class="pulse-dot absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-green border-2 border-bg-primary"></div></div>
        <div>
          <div class="font-accent text-[10px] text-neon-green uppercase tracking-widest">Sistema Online</div>
          <div class="font-display font-bold text-white text-lg leading-none">${p.nick}</div>
          <div class="font-accent text-[11px] text-neon-purple uppercase">${p.title} · ${p.life_phase || ''}</div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right hidden sm:block"><div class="font-mono text-neon-gold text-sm"><i class="fas fa-coins"></i> ${p.coins}</div></div>
        <button id="btn-calendar" title="Calendário" class="relative w-10 h-10 rounded-full card glass flex items-center justify-center text-slate-300 hover:text-neon-purple transition">
          <i class="fas fa-calendar-days"></i>
        </button>
        <button id="btn-changelog" title="Logs de atualização" class="relative w-10 h-10 rounded-full card glass flex items-center justify-center text-slate-300 hover:text-neon-purple transition">
          <i class="fas fa-rocket"></i>
        </button>
        <button id="btn-notif" class="relative w-10 h-10 rounded-full card glass flex items-center justify-center text-slate-300">
          <i class="fas fa-bell"></i>
          ${unread > 0 ? `<span class="absolute -top-1 -right-1 bg-neon-red text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">${unread}</span>` : ''}
        </button>
      </div>
    </header>

    <div class="px-4 lg:px-8 space-y-4 max-w-3xl mx-auto">
      <!-- Insight -->
      <div class="card p-4 glass" style="background:linear-gradient(135deg,rgba(124,58,237,.12),rgba(37,99,235,.08))">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-lg bg-neon-purple/20 flex items-center justify-center shrink-0"><i class="fas fa-bolt text-neon-purple"></i></div>
          <div><div class="font-accent text-[10px] text-neon-purple uppercase tracking-widest mb-1">Insight do Arquiteto</div>
            <p class="font-body text-slate-200 text-sm leading-relaxed">${State.insight}</p></div>
        </div>
      </div>

      <!-- Radar + Level -->
      <div class="grid lg:grid-cols-2 gap-4">
        <div class="card p-4">
          <div class="font-accent text-[10px] text-slate-400 uppercase tracking-widest mb-2">Mapa de Atributos</div>
          <canvas id="radar-chart" height="220"></canvas>
        </div>
        <div class="card p-4 flex flex-col justify-center">
          <div class="flex items-center justify-between mb-1">
            <span class="font-accent text-[10px] text-slate-400 uppercase tracking-widest">Nível Atual</span>
            <span class="font-mono text-xs text-slate-400">XP ${p.xp} / ${p.xp_to_next}</span>
          </div>
          <div class="flex items-baseline gap-2 mb-3"><span class="font-display font-black text-5xl text-white">${p.level}</span><span class="font-accent text-neon-purple uppercase text-sm">${p.title}</span></div>
          <div class="progress-track h-3"><div class="xp-fill h-full" style="width:0%;background:linear-gradient(90deg,#7c3aed,#2563eb)" id="xp-bar"></div></div>
          ${State.milestone ? `<div class="mt-4 pt-3 border-t border-slate-800">
            <div class="flex items-center gap-2 text-xs text-slate-400 mb-1"><i class="fas fa-flag text-neon-gold"></i> Próximo Marco</div>
            <div class="font-body text-white">${State.milestone.label} · Nível ${State.milestone.level}</div></div>` : ''}
        </div>
      </div>

      <!-- Missions today -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-display font-bold text-white">Missões de Hoje</h2>
          <a data-link="/app/missions" class="text-xs text-neon-purple font-accent uppercase">Ver todas →</a>
        </div>
        <div id="dash-missions" class="flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2">
          <div class="skeleton h-28 w-64 shrink-0"></div><div class="skeleton h-28 w-64 shrink-0"></div>
        </div>
      </div>

      <!-- Attributes grid -->
      <div>
        <h2 class="font-display font-bold text-white mb-2">Atributos Principais</h2>
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
          ${['corpo','mente','emocional','social','proposito','financas'].map(k => attrCard(k, m[k] || 0)).join('')}
        </div>
      </div>

      <!-- Evolution chart -->
      <div class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-display font-bold text-white text-sm">Linha do Tempo — Evolução Geral</h2>
          <div id="period-tabs" class="flex gap-1 text-xs">
            ${['7','30','90','total'].map(pr => `<button data-period="${pr}" class="period-tab px-2 py-1 rounded-lg font-accent uppercase ${pr==='30'?'bg-neon-purple/20 text-neon-purple':'text-slate-500'}">${pr==='total'?'Total':pr+'D'}</button>`).join('')}
          </div>
        </div>
        <canvas id="evolution-chart" height="180"></canvas>
        <div id="evolution-summary" class="grid grid-cols-3 gap-2 mt-3"></div>
      </div>

      <div class="grid grid-cols-2 gap-3 pt-2">
        <button id="btn-log-activity" class="card glass card-hover p-4 text-center"><i class="fas fa-plus-circle text-neon-green text-xl mb-1"></i><div class="font-body text-white text-sm">Registrar Atividade</div></button>
        <button id="btn-add-mission" class="card glass card-hover p-4 text-center"><i class="fas fa-pen text-neon-purple text-xl mb-1"></i><div class="font-body text-white text-sm">Missão Manual</div></button>
      </div>
    </div>
    </div>`

  setApp(appShell('/app/status', content))

  // animate XP bar
  setTimeout(() => { const b = document.getElementById('xp-bar'); if (b) b.style.width = Math.min(100, Math.round(p.xp / p.xp_to_next * 100)) + '%' }, 100)

  drawRadar(radarKeys)
  loadDashMissions()
  loadEvolution('30')
  bindAttrCards()

  document.getElementById('btn-notif').onclick = showNotifications
  const bcl = document.getElementById('btn-changelog'); if (bcl) bcl.onclick = window.LL.changelogModal
  const bcal = document.getElementById('btn-calendar'); if (bcal) bcal.onclick = () => navigate('/app/calendar')
  document.getElementById('btn-log-activity').onclick = showActivityModal
  document.getElementById('btn-add-mission').onclick = showManualMissionModal
  document.querySelectorAll('.period-tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.period-tab').forEach(x => { x.classList.remove('bg-neon-purple/20','text-neon-purple'); x.classList.add('text-slate-500') })
    t.classList.remove('text-slate-500'); t.classList.add('bg-neon-purple/20','text-neon-purple')
    loadEvolution(t.dataset.period)
  })
}

function attrCard(k, val) {
  const delta = (State.attributes.find(a => a.attribute_key === k) || {}).delta_week || 0
  const color = ATTR_COLORS[k]
  return `<button data-attr="${k}" class="attr-card card glass card-hover p-3 text-left">
    <div class="flex items-center justify-between mb-1">
      <span class="text-lg">${ATTR_ICONS[k]}</span>
      ${delta !== 0 ? `<span class="text-xs font-mono ${delta>0?'text-neon-green':'text-neon-red'}">${delta>0?'+':''}${delta}</span>` : '<span></span>'}
    </div>
    <div class="font-accent text-[11px] text-slate-400 uppercase">${ATTR_LABELS[k]}</div>
    <div class="font-display font-bold text-2xl text-white">${val}</div>
    <div class="progress-track h-1 mt-1"><div class="progress-fill h-full" style="width:${val}%;background:${color}"></div></div>
  </button>`
}

function bindAttrCards() {
  document.querySelectorAll('.attr-card').forEach(b => b.onclick = () => navigate('/app/attributes/' + b.dataset.attr))
}

let radarChartInstance = null
function drawRadar(keys) {
  const ctx = document.getElementById('radar-chart')
  if (!ctx) return
  if (radarChartInstance) radarChartInstance.destroy()
  const m = State.attributeMap
  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: keys.map(k => ATTR_LABELS[k]),
      datasets: [{
        label: 'Você', data: keys.map(k => m[k] || 0),
        backgroundColor: 'rgba(124,58,237,.18)', borderColor: '#7c3aed', borderWidth: 2,
        pointBackgroundColor: '#10b981', pointRadius: 3,
      }, {
        label: 'Média Global', data: keys.map(() => 50),
        backgroundColor: 'transparent', borderColor: 'rgba(148,163,184,.3)', borderDash: [4, 4], borderWidth: 1, pointRadius: 0,
      }]
    },
    options: {
      animation: { duration: 1000 },
      plugins: { legend: { display: false } },
      scales: { r: {
        min: 0, max: 100, ticks: { display: false, stepSize: 25 },
        grid: { color: 'rgba(255,255,255,.06)' }, angleLines: { color: 'rgba(255,255,255,.06)' },
        pointLabels: { color: '#94a3b8', font: { size: 11, family: 'Rajdhani' } }
      } }
    }
  })
}

async function loadDashMissions() {
  try {
    const { missions } = await api.get('/api/missions')
    const cont = document.getElementById('dash-missions')
    if (!cont) return
    const active = missions.filter(x => x.status === 'active')
    if (!active.length) { cont.innerHTML = `<div class="card glass p-4 text-slate-400 font-body text-sm">Nenhuma missão ativa. <button class="text-neon-purple" onclick="window.LL_genMissions()">Gerar agora</button></div>`; return }
    cont.innerHTML = active.slice(0, 5).map(missionCardHtml).join('')
    bindMissionCards(cont)
  } catch {}
}

function missionCardHtml(mi) {
  const isChallenge = mi.type === 'event'
  return `<div class="mission-card card glass p-3 w-64 shrink-0 snap-start ${isChallenge ? 'mission-challenge' : ''}" data-mid="${mi.id}">
    <div class="flex items-center justify-between mb-1">
      <i class="fas ${CAT_ICONS[mi.category] || 'fa-star'} text-neon-purple"></i>
      <span class="font-accent text-[9px] uppercase tracking-wider ${isChallenge ? 'text-neon-gold' : 'text-slate-500'}">${isChallenge ? 'Desafio' : mi.type === 'weekly' ? 'Semanal' : 'Diária'}</span>
    </div>
    <div class="font-display font-bold text-white text-sm leading-tight mb-1">${mi.title}</div>
    <div class="font-body text-slate-400 text-xs leading-snug mb-2 line-clamp-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${mi.description || ''}</div>
    <div class="flex items-center justify-between">
      <div class="text-xs font-mono"><span class="text-neon-blue">+${mi.xp_reward} XP</span> <span class="text-neon-gold">+${mi.coins_reward}</span></div>
      <button class="mission-complete btn-primary px-3 py-1.5 rounded-lg text-xs font-display font-bold" data-mid="${mi.id}"><i class="fas fa-check"></i></button>
    </div>
  </div>`
}

function bindMissionCards(root) {
  root.querySelectorAll('.mission-complete').forEach(b => b.onclick = async (e) => {
    e.stopPropagation()
    await completeMission(b.dataset.mid, b)
  })
}

async function completeMission(mid, btn) {
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>' }
  try {
    const r = await api.post(`/api/missions/${mid}/complete`)
    spawnXp(r.xp)
    toast(`Missão concluída! +${r.xp} XP, +${r.coins} moedas`, 'success')
    if (r.levelUp?.leveledUp) showLevelUp(r.levelUp)
    if (r.newAchievements && r.newAchievements.length) {
      r.newAchievements.forEach((a, i) => setTimeout(() => toast(`${a.icon} Conquista: ${a.name}`, 'warn'), 600 + i * 800))
    }
    await loadPlayer()
    if (location.pathname === '/app/status') renderDashboard()
    else if (location.pathname === '/app/missions') renderMissions()
  } catch (e) {
    toast(e.message || 'Erro', 'error')
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check"></i>' }
  }
}

function spawnXp(xp) {
  const p = el(`<div class="particle-xp fixed left-1/2 top-1/3 -translate-x-1/2 z-[90] font-display font-black text-3xl text-neon-green glow-green pointer-events-none">+${xp} XP</div>`)
  document.body.appendChild(p)
  setTimeout(() => p.remove(), 1000)
}

function showLevelUp(lvl) {
  const overlay = el(`<div class="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 backdrop-blur animate-fade-in" id="lvlup-overlay">
    <div class="text-center animate-fade-up">
      <div class="text-6xl mb-4">⭐</div>
      <div class="font-accent text-neon-gold uppercase tracking-[0.3em] text-sm mb-2">Nível Desbloqueado</div>
      <div class="font-display font-black text-7xl text-white glow-gold mb-2">${lvl.newLevel}</div>
      <div class="font-display text-neon-purple text-xl uppercase mb-1">${lvl.newTitle}</div>
      <div class="font-mono text-neon-gold mb-6">+${lvl.bonusCoins} moedas</div>
      <p class="font-body text-slate-300 max-w-xs mx-auto mb-6">O mundo vê uma versão diferente de você agora.</p>
      <button class="btn-neon px-8 py-3 rounded-2xl font-display font-bold" onclick="document.getElementById('lvlup-overlay').remove()">CONTINUAR</button>
    </div></div>`)
  document.getElementById('overlay-root').appendChild(overlay)
  // particles
  for (let i = 0; i < 24; i++) {
    const part = el(`<div class="absolute w-2 h-2 rounded-full" style="background:${['#7c3aed','#10b981','#f59e0b','#2563eb'][i%4]};left:50%;top:50%"></div>`)
    overlay.appendChild(part)
    const ang = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 180
    part.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist}px)`, opacity: 0 }], { duration: 900 + Math.random()*400, easing: 'ease-out' })
  }
}

let evoChart = null
async function loadEvolution(period) {
  try {
    const apiPeriod = period === 'total' ? '9999' : period
    const [{ snapshots }, summary] = await Promise.all([
      api.get('/api/snapshots?period=' + apiPeriod),
      api.get('/api/snapshots/summary?period=' + (period === 'total' ? '365' : period)).catch(() => null)
    ])
    const ctx = document.getElementById('evolution-chart')
    if (!ctx) return
    const sumEl = document.getElementById('evolution-summary')

    if (!snapshots || snapshots.length === 0) {
      if (evoChart) { evoChart.destroy(); evoChart = null }
      ctx.style.display = 'none'
      ctx.insertAdjacentHTML('afterend', `<div id="evo-empty" class="text-center py-8"><div class="w-3 h-3 rounded-full bg-neon-purple mx-auto mb-3 animate-pulse"></div><p class="font-body text-slate-400 text-sm">Seu gráfico de evolução está em branco.<br/>Comece hoje. Cada ação deixa uma marca.</p></div>`)
      if (sumEl) sumEl.innerHTML = ''
      return
    }
    document.getElementById('evo-empty')?.remove()
    ctx.style.display = 'block'

    const labels = snapshots.map(s => {
      const d = new Date(s.snapshot_date + 'T00:00:00')
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    })
    const data = snapshots.map(s => s.overall_score)
    const events = snapshots.map(s => s.notable_event)

    if (evoChart) evoChart.destroy()
    const grad = ctx.getContext('2d').createLinearGradient(0, 0, 0, 180)
    grad.addColorStop(0, 'rgba(124,58,237,.3)'); grad.addColorStop(1, 'rgba(124,58,237,0)')

    evoChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{
        data, borderColor: '#10b981', borderWidth: 2, fill: true, backgroundColor: grad,
        tension: 0.4, pointRadius: snapshots.length <= 14 ? 3 : 0,
        pointBackgroundColor: events.map(e => e === 'level_up' ? '#f59e0b' : e === 'death' ? '#ef4444' : '#10b981'),
      }] },
      options: {
        animation: { duration: 1200 },
        plugins: { legend: { display: false }, tooltip: {
          callbacks: { afterLabel: (item) => { const ev = events[item.dataIndex]; return ev ? '⚑ ' + (snapshots[item.dataIndex].notable_event_label || ev) : '' } }
        } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9 }, maxTicksLimit: 7 } },
          y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 9 } } }
        }
      }
    })

    if (sumEl && summary) {
      if (summary.topGain) {
        sumEl.innerHTML = `
          <div class="card glass p-2 text-center"><div class="text-[9px] text-slate-500 font-accent uppercase">Maior Alta</div><div class="font-display text-neon-green text-sm">${ATTR_LABELS[summary.topGain.key]||''} ${summary.topGain.delta>=0?'+':''}${summary.topGain.delta}</div></div>
          <div class="card glass p-2 text-center"><div class="text-[9px] text-slate-500 font-accent uppercase">Maior Baixa</div><div class="font-display text-neon-red text-sm">${ATTR_LABELS[summary.topLoss.key]||''} ${summary.topLoss.delta}</div></div>
          <div class="card glass p-2 text-center"><div class="text-[9px] text-slate-500 font-accent uppercase">Dias Ativos</div><div class="font-display text-neon-blue text-sm">${summary.activeDays}/${summary.totalDays}</div></div>`
      } else { sumEl.innerHTML = `<div class="col-span-3 text-center text-slate-500 text-xs font-body py-1">Continue. Sua trajetória está tomando forma.</div>` }
    }
  } catch (e) {}
}

window.LL_genMissions = async () => {
  try { await api.post('/api/missions/generate'); toast('Novas missões geradas', 'success'); loadDashMissions() }
  catch (e) { toast(e.message, 'error') }
}

// ---------- Modals ----------
function modal(inner) {
  const m = el(`<div class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-0 sm:p-6" id="modal-bg">
    <div class="card w-full sm:max-w-md p-5 rounded-t-3xl sm:rounded-2xl animate-fade-up max-h-[90vh] overflow-y-auto no-scrollbar">${inner}</div></div>`)
  document.getElementById('overlay-root').appendChild(m)
  m.querySelector('#modal-bg') === m && (m.onclick = (e) => { if (e.target === m) m.remove() })
  m.addEventListener('click', e => { if (e.target.id === 'modal-bg') m.remove() })
  return m
}

async function showNotifications() {
  let notifs = State.notifications
  try { const r = await api.get('/api/notifications'); notifs = r.notifications } catch {}
  const m = modal(`
    <div class="flex items-center justify-between mb-4"><h3 class="font-display font-bold text-white">Notificações</h3>
      <button id="mark-all" class="text-xs text-neon-purple font-accent">Marcar lidas</button></div>
    <div class="space-y-2">${notifs.length ? notifs.map(n => `
      <div class="card glass p-3 ${n.read ? 'opacity-60' : ''}"><div class="font-display text-sm text-white">${n.title}</div>
        <div class="font-body text-slate-400 text-xs mt-0.5">${n.message}</div></div>`).join('') : '<p class="text-slate-500 text-sm font-body">Nenhuma notificação.</p>'}</div>
    <button class="btn-primary w-full py-3 rounded-xl font-display font-bold mt-4" onclick="document.getElementById('modal-bg').parentElement.remove()">Fechar</button>`)
  m.querySelector('#mark-all').onclick = async () => { await api.post('/api/notifications/read-all'); m.remove(); await loadPlayer(); if (location.pathname === '/app/status') renderDashboard() }
}

function showActivityModal() {
  const m = modal(`
    <h3 class="font-display font-bold text-white mb-1">Registrar Atividade</h3>
    <p class="text-slate-400 text-xs font-body mb-4">Atividades reais geram XP proporcional.</p>
    <label class="text-xs text-slate-400 font-accent uppercase">Tipo</label>
    <select id="act-type" class="w-full bg-bg-card border border-slate-700 rounded-xl px-3 py-3 text-white font-body mt-1 mb-3">
      <option value="treino">🏋️ Treino físico</option><option value="estudo">🧠 Estudo</option>
      <option value="meditacao">❤️ Meditação</option><option value="social">👥 Social</option><option value="outro">⚡ Outro</option>
    </select>
    <label class="text-xs text-slate-400 font-accent uppercase">Duração (minutos)</label>
    <input id="act-dur" type="number" value="30" min="5" max="300" class="w-full bg-bg-card border border-slate-700 rounded-xl px-3 py-3 text-white font-body mt-1 mb-3" />
    <label class="text-xs text-slate-400 font-accent uppercase">Descrição (opcional)</label>
    <input id="act-desc" class="w-full bg-bg-card border border-slate-700 rounded-xl px-3 py-3 text-white font-body mt-1 mb-4" placeholder="O que você fez?" />
    <button id="act-save" class="btn-neon w-full py-3 rounded-xl font-display font-bold">REGISTRAR</button>`)
  m.querySelector('#act-save').onclick = async () => {
    try {
      const r = await api.post('/api/activities', {
        activity_type: m.querySelector('#act-type').value,
        duration_minutes: +m.querySelector('#act-dur').value,
        description: m.querySelector('#act-desc').value,
      })
      m.remove(); spawnXp(r.xp); toast(`Atividade registrada! +${r.xp} XP`, 'success')
      if (r.levelUp?.leveledUp) showLevelUp(r.levelUp)
      await loadPlayer(); renderDashboard()
    } catch (e) { toast(e.message, 'error') }
  }
}

function showManualMissionModal() {
  const m = modal(`
    <h3 class="font-display font-bold text-white mb-4">Missão Manual</h3>
    <input id="mm-title" class="w-full bg-bg-card border border-slate-700 rounded-xl px-3 py-3 text-white font-body mb-3" placeholder="Título da missão" />
    <input id="mm-desc" class="w-full bg-bg-card border border-slate-700 rounded-xl px-3 py-3 text-white font-body mb-3" placeholder="Descrição (opcional)" />
    <select id="mm-cat" class="w-full bg-bg-card border border-slate-700 rounded-xl px-3 py-3 text-white font-body mb-4">
      ${['corpo','mente','emocional','social','proposito','financas','disciplina','foco'].map(k => `<option value="${k}">${ATTR_ICONS[k]} ${ATTR_LABELS[k]}</option>`).join('')}
    </select>
    <button id="mm-save" class="btn-neon w-full py-3 rounded-xl font-display font-bold">CRIAR MISSÃO</button>`)
  m.querySelector('#mm-save').onclick = async () => {
    const title = m.querySelector('#mm-title').value.trim()
    if (!title) return toast('Informe um título', 'error')
    try {
      await api.post('/api/missions/manual', { title, description: m.querySelector('#mm-desc').value, category: m.querySelector('#mm-cat').value })
      m.remove(); toast('Missão criada', 'success'); loadDashMissions()
    } catch (e) { toast(e.message, 'error') }
  }
}

// expose for other modules
window.LL_app = { appShell, appGuard, loadingScreen, completeMission, missionCardHtml, bindMissionCards, showLevelUp, spawnXp, modal, renderDashboard }
})();
