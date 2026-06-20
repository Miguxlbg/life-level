;(function(){ /* LL_IIFE */
// ===================================================
// LIFE LEVEL — Missions, Skills, Ranking, Attribute, Profile, System, Death
// ===================================================
const { api, State, el, avatarHtml, toast, setApp, navigate, route, loadPlayer, ATTR_COLORS, ATTR_LABELS, ATTR_ICONS, CAT_ICONS } = window.LL
const { appShell, appGuard, completeMission, missionCardHtml, bindMissionCards, modal } = window.LL_app

// ---------- MISSIONS ----------
route('/app/missions', () => appGuard(renderMissions))

async function renderMissions() {
  const content = `<div class="px-4 lg:px-8 pt-6 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-4">
      <h1 class="font-display font-black text-2xl text-white">Missões</h1>
      <button id="gen-missions" class="card glass px-3 py-2 rounded-xl text-xs font-accent text-neon-purple uppercase"><i class="fas fa-rotate"></i> Gerar</button>
    </div>
    <div id="missions-list" class="space-y-6">
      <div class="skeleton h-24 w-full"></div><div class="skeleton h-24 w-full"></div>
    </div></div>`
  setApp(appShell('/app/missions', content))
  document.getElementById('gen-missions').onclick = async () => {
    try { await api.post('/api/missions/generate'); toast('Missões geradas', 'success'); renderMissions() } catch (e) { toast(e.message, 'error') }
  }
  await loadMissionsList()
}

window.renderMissions = renderMissions

async function loadMissionsList() {
  const { missions } = await api.get('/api/missions')
  const list = document.getElementById('missions-list')
  if (!list) return
  const groups = {
    event: missions.filter(m => m.type === 'event'),
    daily: missions.filter(m => m.type === 'daily'),
    weekly: missions.filter(m => m.type === 'weekly'),
    manual: missions.filter(m => m.type === 'manual'),
  }
  const titles = { event: '⚔️ Desafio', daily: '☀️ Diárias', weekly: '📅 Semanais', manual: '✍️ Manuais' }
  let html = ''
  for (const [k, arr] of Object.entries(groups)) {
    if (!arr.length) continue
    html += `<div><h2 class="font-display font-bold text-white text-sm mb-2 uppercase tracking-wide">${titles[k]}</h2><div class="space-y-2">${arr.map(missionRowHtml).join('')}</div></div>`
  }
  if (!html) html = '<div class="card glass p-6 text-center text-slate-400 font-body">Nenhuma missão ativa.</div>'
  list.innerHTML = html
  list.querySelectorAll('.mission-complete').forEach(b => b.onclick = () => completeMission(b.dataset.mid, b))
}

function missionRowHtml(mi) {
  const isChallenge = mi.type === 'event'
  return `<div class="card ${isChallenge ? 'mission-challenge' : 'glass'} p-4 flex items-start gap-3">
    <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background:${ATTR_COLORS[mi.category]||'#7c3aed'}22"><i class="fas ${CAT_ICONS[mi.category]||'fa-star'}" style="color:${ATTR_COLORS[mi.category]||'#7c3aed'}"></i></div>
    <div class="flex-1 min-w-0">
      <div class="font-display font-bold text-white text-sm">${mi.title}</div>
      <div class="font-body text-slate-400 text-xs mt-0.5 leading-snug">${mi.description || ''}</div>
      <div class="text-xs font-mono mt-2"><span class="text-neon-blue">+${mi.xp_reward} XP</span> · <span class="text-neon-gold">+${mi.coins_reward} moedas</span> · <span class="text-slate-500 uppercase">${mi.difficulty}</span></div>
    </div>
    <button class="mission-complete btn-primary px-4 py-2 rounded-xl text-sm font-display font-bold shrink-0" data-mid="${mi.id}"><i class="fas fa-check"></i></button>
  </div>`
}

// ---------- SKILLS ----------
const SKILL_CATEGORIES = [
  ['idiomas', 'Idiomas & Polyglota', 'fa-language', '#06b6d4'],
  ['matematica', 'Matemática', 'fa-square-root-variable', '#2563eb'],
  ['ciencias_naturais', 'Ciências Naturais', 'fa-atom', '#10b981'],
  ['programacao', 'Programação & Tech', 'fa-code', '#8b5cf6'],
  ['filosofia', 'Filosofia & Pensamento', 'fa-brain', '#f59e0b'],
  ['historia', 'História & Geopolítica', 'fa-landmark', '#f97316'],
  ['literatura', 'Literatura & Escrita', 'fa-feather', '#7c3aed'],
  ['artes', 'Artes & Criatividade', 'fa-palette', '#ec4899'],
  ['treino_fisico', 'Treino Físico', 'fa-dumbbell', '#10b981'],
  ['nutricao', 'Nutrição', 'fa-apple-whole', '#059669'],
  ['sono', 'Sono & Recuperação', 'fa-moon', '#6366f1'],
  ['meditacao', 'Meditação & Mindfulness', 'fa-spa', '#a855f7'],
  ['financas', 'Finanças & Investimentos', 'fa-coins', '#f59e0b'],
  ['empreendedorismo', 'Empreendedorismo', 'fa-rocket', '#ef4444'],
  ['comunicacao', 'Comunicação & Relações', 'fa-comments', '#06b6d4'],
  ['espiritualidade', 'Espiritualidade & Propósito', 'fa-compass', '#f59e0b'],
  ['saude_mental', 'Saúde Mental', 'fa-heart-pulse', '#7c3aed'],
  ['organizacao', 'Organização & Produtividade', 'fa-list-check', '#2563eb'],
  ['natureza', 'Natureza & Sustentabilidade', 'fa-leaf', '#10b981'],
  ['culinaria', 'Culinária & Gastronomia', 'fa-utensils', '#f97316'],
  ['esportes', 'Esportes & Competição', 'fa-chess', '#8b5cf6'],
  ['ciencias_humanas', 'Ciências Humanas', 'fa-users-viewfinder', '#06b6d4'],
]
function skillMarker(level) {
  if (level >= 20) return 'Lenda'
  if (level >= 15) return 'Mestre'
  if (level >= 10) return 'Avançado'
  if (level >= 5) return 'Intermediário'
  if (level >= 1) return 'Básico'
  return 'Novato'
}

route('/app/skills', () => appGuard(renderSkills))
async function renderSkills() {
  let skills = []
  try { const r = await api.get('/api/skills'); skills = r.skills } catch {}
  const skillMap = {}; skills.forEach(s => skillMap[s.skill_category] = s)
  const content = `<div class="px-4 lg:px-8 pt-6 max-w-3xl mx-auto">
    <h1 class="font-display font-black text-2xl text-white mb-1">Habilidades</h1>
    <p class="text-slate-400 font-body text-sm mb-4">22 categorias de evolução. Pratique missões para subir de nível.</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${SKILL_CATEGORIES.map(([key, label, icon, color]) => {
        const s = skillMap[key]
        const lvl = s?.skill_level || 0
        const xp = s?.xp_in_skill || 0
        return `<div class="card glass p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:${color}22"><i class="fas ${icon}" style="color:${color}"></i></div>
            <div class="flex-1 min-w-0"><div class="font-display text-white text-sm truncate">${label}</div>
              <div class="font-accent text-[10px] uppercase tracking-wider" style="color:${color}">${skillMarker(lvl)} · Nv ${lvl}</div></div>
          </div>
          <div class="progress-track h-1.5"><div class="progress-fill h-full" style="width:${(xp%100)}%;background:${color}"></div></div>
        </div>`
      }).join('')}
    </div></div>`
  setApp(appShell('/app/skills', content))
}

// ---------- RANKING ----------
route('/app/ranking', () => appGuard(renderRanking))
let rankingPoll = null
async function renderRanking() {
  const content = `<div class="px-4 lg:px-8 pt-6 max-w-3xl mx-auto">
    <h1 class="font-display font-black text-2xl text-white mb-1">Ranking Global</h1>
    <p class="text-slate-400 font-body text-sm mb-3">Melhores jogadores ativos</p>
    <div id="my-rank" class="mb-4"></div>
    <div id="rank-tabs" class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
      ${[['global','Global'],['streak','Streak'],['corpo','Corpo'],['mente','Mente'],['disciplina','Disciplina'],['financas','Finanças']].map(([k,l],idx) => `<button data-cat="${k}" class="rank-tab px-3 py-1.5 rounded-xl text-xs font-accent uppercase whitespace-nowrap ${idx===0?'bg-neon-purple/20 text-neon-purple':'card glass text-slate-400'}">${l}</button>`).join('')}
    </div>
    <div id="rank-list" class="space-y-2"><div class="skeleton h-16 w-full"></div><div class="skeleton h-16 w-full"></div></div>
  </div>`
  setApp(appShell('/app/ranking', content))
  document.querySelectorAll('.rank-tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.rank-tab').forEach(x => { x.classList.remove('bg-neon-purple/20','text-neon-purple'); x.classList.add('card','glass','text-slate-400') })
    t.classList.add('bg-neon-purple/20','text-neon-purple'); t.classList.remove('card','glass','text-slate-400')
    loadRanking(t.dataset.cat)
  })
  loadRanking('global')
}

async function loadRanking(cat) {
  try {
    const list = document.getElementById('rank-list')
    const myRankEl = document.getElementById('my-rank')
    if (cat === 'global') {
      const r = await api.get('/api/ranking/global')
      if (myRankEl && r.myRank) myRankEl.innerHTML = rankRowHtml(r.myRank, true)
      list.innerHTML = r.players.length ? r.players.map(p => rankRowHtml(p)).join('') : emptyRank()
    } else {
      if (myRankEl) myRankEl.innerHTML = ''
      const r = await api.get('/api/ranking/category/' + cat)
      list.innerHTML = r.players.length ? r.players.map(p => rankRowHtml(p, false, true)).join('') : emptyRank()
    }
  } catch (e) {}
}
function emptyRank() { return '<div class="card glass p-6 text-center text-slate-400 font-body text-sm">Ainda sem jogadores rankeados.</div>' }

function rankRowHtml(p, isMe = false, showScore = false) {
  const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : ''
  const borderColor = p.rank === 1 ? '#f59e0b' : p.rank === 2 ? '#94a3b8' : p.rank === 3 ? '#cd7f32' : 'transparent'
  return `<div class="card ${isMe ? '' : 'glass'} p-3 flex items-center gap-3 ${isMe ? 'border-neon-purple' : ''}" ${borderColor !== 'transparent' ? `style="border-color:${borderColor}55"` : ''}>
    <div class="w-8 text-center font-display font-bold ${p.rank<=3?'text-lg':'text-slate-400'}">${medal || '#' + p.rank}</div>
    ${avatarHtml(p, 'w-9 h-9', 'text-xs')}
    <div class="flex-1 min-w-0">
      <div class="font-body text-white truncate">${p.nick} ${isMe ? '<span class="text-[10px] text-neon-purple">(você)</span>' : ''}</div>
      <div class="font-accent text-[10px] text-slate-500 uppercase">${p.title || ''} · Nv ${p.level}</div>
    </div>
    <div class="text-right font-mono text-sm ${showScore ? 'text-neon-purple' : 'text-neon-blue'}">${showScore ? p.score : (p.xp || 0).toLocaleString('pt-BR') + ' XP'}</div>
  </div>`
}

// ---------- ATTRIBUTE DETAIL ----------
route('__attribute__', (key) => appGuard(() => renderAttributeDetail(key)))
async function renderAttributeDetail(key) {
  const attr = State.attributes.find(a => a.attribute_key === key)
  const val = State.attributeMap[key] || 0
  const color = ATTR_COLORS[key]
  const meta = State.meta[key] || { label: ATTR_LABELS[key], subs: [] }
  const subs = JSON.parse(attr?.sub_attributes || '{}')
  const content = `<div class="px-4 lg:px-8 pt-6 max-w-2xl mx-auto">
    <button data-link="/app/status" class="text-slate-400 mb-4 font-body text-sm"><i class="fas fa-arrow-left"></i> Voltar</button>
    <div class="card p-6 mb-4 text-center" style="background:linear-gradient(135deg,${color}22,transparent)">
      <div class="text-4xl mb-2">${ATTR_ICONS[key]}</div>
      <div class="font-accent text-xs uppercase tracking-widest mb-1" style="color:${color}">${meta.label}</div>
      <div class="font-display font-black text-6xl text-white">${val}</div>
      <div class="text-slate-400 font-mono text-sm">/ 100</div>
      <div class="progress-track h-3 mt-4"><div class="progress-fill h-full" style="width:${val}%;background:${color}"></div></div>
    </div>
    <div class="card glass p-4 mb-4">
      <div class="font-accent text-xs text-slate-400 uppercase tracking-widest mb-3">Sub-Atributos</div>
      <div class="space-y-3">${(meta.subs || []).map(s => `
        <div><div class="flex justify-between text-sm font-body mb-1"><span class="text-slate-300">${s}</span><span class="text-slate-500 font-mono">${Math.round(val * (0.7 + Math.random()*0.5))}</span></div>
        <div class="progress-track h-1"><div class="progress-fill h-full" style="width:${Math.min(100,Math.round(val*(0.7+Math.random()*0.5)))}%;background:${color}"></div></div></div>`).join('')}</div>
    </div>
    <div class="card glass p-4"><div class="flex items-start gap-3">
      <i class="fas fa-bolt text-neon-purple mt-1"></i>
      <p class="font-body text-slate-300 text-sm">${val < 30 ? `${meta.label} está crítico. Priorize missões desta área para evitar colapso.` : val < 60 ? `${meta.label} está em desenvolvimento. Continue praticando para fortalecer.` : `${meta.label} está sólido. Mantenha a consistência para chegar ao topo.`}</p>
    </div></div>
  </div>`
  setApp(appShell('/app/status', content))
}

// ---------- PROFILE ----------
route('/app/profile', () => appGuard(() => renderProfile(null)))
route('__profile__', (nick) => appGuard(() => renderProfile(nick)))

async function renderProfile(nick) {
  let p, attrMap, meta, isPublic = false
  if (nick && nick !== State.player.nick) {
    isPublic = true
    try { const r = await api.get('/api/player/profile/' + encodeURIComponent(nick)); p = r; attrMap = r.attributeMap; meta = r.meta }
    catch { toast('Perfil não encontrado', 'error'); return navigate('/app/ranking') }
  } else {
    p = State.player; attrMap = State.attributeMap; meta = State.meta
  }
  const radarKeys = ['corpo', 'mente', 'emocional', 'social', 'proposito', 'financas']
  const guild = isPublic ? p.guild : State.guild
  const achCount = isPublic ? (p.achievements ? p.achievements.length : 0) : (State.achievementCount || 0)
  const content = `<div class="px-4 lg:px-8 pt-6 max-w-2xl mx-auto">
    ${isPublic ? '<button data-link="/app/ranking" class="text-slate-400 mb-4 font-body text-sm"><i class="fas fa-arrow-left"></i> Voltar</button>' : ''}
    <div class="card p-6 mb-4 text-center bg-aurora">
      <div class="flex justify-center mb-3 relative">
        <div class="relative">${avatarHtml(p, 'w-24 h-24', 'text-3xl')}
        ${!isPublic ? `<button id="edit-avatar" class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-neon-purple text-white flex items-center justify-center shadow-lg"><i class="fas fa-pen text-xs"></i></button>` : ''}</div>
      </div>
      <div class="font-display font-black text-2xl text-white">${p.nick}</div>
      <div class="font-accent text-neon-purple uppercase text-sm">${p.title} · Nível ${p.level}</div>
      ${guild ? `<div class="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full" style="background:${guild.emblem_color}22"><span>${guild.emblem||'🛡️'}</span><span class="font-body text-xs" style="color:${guild.emblem_color}">${guild.name}</span></div>` : ''}
      <div class="flex items-center justify-center gap-4 mt-3 text-sm font-mono flex-wrap">
        <span class="text-neon-blue">${(p.xp || 0).toLocaleString('pt-BR')} XP</span>
        <span class="text-neon-gold"><i class="fas fa-fire"></i> ${p.streak_days || 0}d</span>
        <span class="text-neon-purple"><i class="fas fa-medal"></i> ${achCount}</span>
        ${p.death_count ? `<span class="text-neon-red"><i class="fas fa-skull"></i> ${p.death_count}</span>` : ''}
      </div>
    </div>
    <div class="card p-4 mb-4"><div class="font-accent text-xs text-slate-400 uppercase tracking-widest mb-2">Mapa de Atributos</div>
      <canvas id="profile-radar" height="220"></canvas></div>
    ${!isPublic ? `<div class="grid grid-cols-2 gap-3 mb-4">
      <button data-link="/app/achievements" class="card glass p-4 text-center card-hover"><i class="fas fa-medal text-neon-gold text-xl mb-1"></i><div class="font-body text-white text-sm">Conquistas</div></button>
      <button data-link="/app/guilds" class="card glass p-4 text-center card-hover"><i class="fas fa-shield-halved text-neon-purple text-xl mb-1"></i><div class="font-body text-white text-sm">Guilda</div></button>
    </div>
    <button id="btn-logout" class="card glass w-full p-4 text-center text-neon-red font-body card-hover"><i class="fas fa-right-from-bracket"></i> Sair do Sistema</button>` : ''}
  </div>`
  setApp(appShell('/app/profile', content))
  if (!isPublic) { const ea = document.getElementById('edit-avatar'); if (ea) ea.onclick = window.LL_showAvatarEditor }
  // radar
  const ctx = document.getElementById('profile-radar')
  new Chart(ctx, {
    type: 'radar',
    data: { labels: radarKeys.map(k => ATTR_LABELS[k]), datasets: [{ data: radarKeys.map(k => attrMap[k] || 0), backgroundColor: 'rgba(124,58,237,.18)', borderColor: '#7c3aed', borderWidth: 2, pointBackgroundColor: '#10b981', pointRadius: 3 }] },
    options: { plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,.06)' }, angleLines: { color: 'rgba(255,255,255,.06)' }, pointLabels: { color: '#94a3b8', font: { size: 11, family: 'Rajdhani' } } } } }
  })
  if (!isPublic) document.getElementById('btn-logout').onclick = async () => { await api.post('/api/auth/logout'); navigate('/') }
}

// ---------- SHOP ----------
route('/app/shop', () => appGuard(renderShop))
async function renderShop() {
  const content = `<div class="px-4 lg:px-8 pt-6 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-4">
      <h1 class="font-display font-black text-2xl text-white">Loja</h1>
      <span class="font-mono text-neon-gold"><i class="fas fa-coins"></i> ${State.player.coins}</span>
    </div>
    <div id="shop-list" class="grid grid-cols-2 sm:grid-cols-3 gap-3"><div class="skeleton h-32"></div><div class="skeleton h-32"></div></div>
  </div>`
  setApp(appShell('/app/shop', content))
  const { items } = await api.get('/api/shop/items')
  const rarityColor = { common: '#94a3b8', rare: '#2563eb', epic: '#7c3aed', legendary: '#f59e0b' }
  document.getElementById('shop-list').innerHTML = items.map(it => `
    <div class="card glass p-4 text-center" style="border-color:${rarityColor[it.rarity]}44">
      <div class="text-3xl mb-2">${it.icon}</div>
      <div class="font-display text-white text-sm">${it.name}</div>
      <div class="font-accent text-[9px] uppercase tracking-wider mb-2" style="color:${rarityColor[it.rarity]}">${it.rarity}</div>
      ${it.owned ? '<div class="text-neon-green text-xs font-body"><i class="fas fa-check"></i> Adquirido</div>' :
        `<button class="buy-btn btn-primary w-full py-2 rounded-lg text-xs font-display font-bold" data-id="${it.id}" data-price="${it.price_coins}" data-lvl="${it.price_level_required}">
          ${it.price_coins === 0 ? 'GRÁTIS' : `<i class="fas fa-coins"></i> ${it.price_coins}`}</button>`}
    </div>`).join('')
  document.querySelectorAll('.buy-btn').forEach(b => b.onclick = async () => {
    try { await api.post('/api/shop/purchase/' + b.dataset.id); toast('Item adquirido!', 'success'); await loadPlayer(); renderShop() }
    catch (e) { toast(e.message, 'error') }
  })
}

// ---------- SYSTEM ----------
route('/app/system', () => appGuard(renderSystem))
async function renderSystem() {
  const p = State.player
  const content = `<div class="px-4 lg:px-8 pt-6 max-w-2xl mx-auto">
    <h1 class="font-display font-black text-2xl text-white mb-4">Sistema</h1>
    <div class="card glass p-4 mb-3">
      <div class="font-accent text-xs text-slate-400 uppercase tracking-widest mb-3">Dados do Jogador</div>
      ${[['Codinome', p.nick],['Título', p.title],['Classe', p.class],['Fase de Vida', p.life_phase],['IMC', `${p.bmi} (${p.bmi_class})`],['Mortes', p.death_count],['Streak', p.streak_days + ' dias'],['Membro desde', new Date(p.created_at).toLocaleDateString('pt-BR')]].map(([l,v]) => `
        <div class="flex justify-between py-1.5 border-b border-slate-800/50 text-sm"><span class="text-slate-400 font-body">${l}</span><span class="text-white font-body">${v||'—'}</span></div>`).join('')}
    </div>
    <div class="card glass p-4 mb-3">
      <div class="font-accent text-xs text-slate-400 uppercase tracking-widest mb-3">Foco & Meta</div>
      <div class="flex items-center gap-2 mb-2"><span class="text-slate-400 font-body text-sm">Área de Foco:</span><span class="px-2 py-1 rounded-lg text-xs font-accent uppercase" style="background:${ATTR_COLORS[p.focus_area]||'#7c3aed'}22;color:${ATTR_COLORS[p.focus_area]||'#7c3aed'}">${ATTR_LABELS[p.focus_area]||'—'}</span></div>
    </div>
    <div class="card glass p-4 mb-3">
      <div class="font-accent text-xs text-neon-red uppercase tracking-widest mb-2"><i class="fas fa-skull"></i> Zona de Perigo</div>
      <p class="text-slate-400 font-body text-xs mb-3">O sistema monitora sua atividade. 72h de ausência = morte. Teste a mecânica abaixo.</p>
      <button id="sim-death" class="card border border-neon-red/40 w-full py-3 rounded-xl text-neon-red font-display text-sm">SIMULAR MORTE (TESTE)</button>
    </div>
    <button id="sys-logout" class="card glass w-full p-4 text-center text-slate-400 font-body card-hover"><i class="fas fa-right-from-bracket"></i> Sair</button>
  </div>`
  setApp(appShell('/app/system', content))
  document.getElementById('sim-death').onclick = async () => {
    if (!confirm('Simular morte? Seus atributos serão resetados.')) return
    await api.post('/api/death/simulate'); navigate('/app/death')
  }
  document.getElementById('sys-logout').onclick = async () => { await api.post('/api/auth/logout'); navigate('/') }
}

// ---------- DEATH ----------
route('/app/death', async () => {
  const ok = await loadPlayer()
  if (!ok) return navigate('/')
  if (!State.player.is_dead) return navigate('/app/status')
  let death = null
  try { const r = await api.get('/api/death/status'); death = r.death } catch {}
  const p = State.player
  const causeLabels = { absence: 'Ausência Prolongada', sedentarism: 'Sedentarismo Total', starvation: 'Inanição Digital', mental_collapse: 'Colapso Mental' }
  const daysSurvived = death ? Math.max(1, Math.floor((new Date(death.died_at) - new Date(p.created_at)) / 86400000)) : 1
  setApp(`<main class="min-h-screen flex items-center justify-center px-6 animate-shake relative overflow-hidden" style="background:radial-gradient(ellipse at center, #1a0505, #050508)">
    <div class="absolute inset-0 bg-neon-red/10"></div>
    <div id="death-particles" class="absolute inset-0 pointer-events-none"></div>
    <div class="relative z-10 text-center max-w-md animate-fade-up">
      <div class="font-accent text-neon-red tracking-[0.3em] uppercase text-sm mb-4">⚠ Sistema Interrompido ⚠</div>
      <div class="text-7xl mb-6">💀</div>
      <div class="card p-6 mb-6" style="background:rgba(239,68,68,.06);border-color:rgba(239,68,68,.3)">
        <div class="space-y-2 text-left font-body">
          <div class="flex justify-between"><span class="text-slate-500">Jogador</span><span class="text-white">${p.nick}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Causa do Fim</span><span class="text-neon-red">${causeLabels[death?.cause] || 'Desconhecida'}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Dias Sobrevividos</span><span class="text-white">${daysSurvived}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Nível Alcançado</span><span class="text-white">${death?.level_at_death || p.max_level_reached}</span></div>
        </div>
      </div>
      <p class="font-body text-slate-300 leading-relaxed mb-8 italic">"Você parou de evoluir. O sistema não perdoa inércia. Mas o Arquiteto... concede uma nova chance."</p>
      <button id="btn-rebirth" class="btn-neon w-full py-4 rounded-2xl font-display font-bold mb-3">🔥 RENASCER DO ZERO</button>
      <div class="text-slate-500 text-xs font-body">50% das suas moedas sobreviveram: <span class="text-neon-gold">${p.coins}</span></div>
    </div>
  </main>`)
  // falling particles
  const pc = document.getElementById('death-particles')
  for (let i = 0; i < 30; i++) {
    const part = el(`<div class="absolute w-1 h-3 bg-neon-red/40" style="left:${Math.random()*100}%;top:-10px"></div>`)
    pc.appendChild(part)
    part.animate([{ transform: 'translateY(0)', opacity: .6 }, { transform: `translateY(100vh)`, opacity: 0 }], { duration: 3000 + Math.random()*3000, delay: Math.random()*2000, iterations: Infinity })
  }
  document.getElementById('btn-rebirth').onclick = async () => {
    const b = document.getElementById('btn-rebirth')
    b.disabled = true; b.innerHTML = '<i class="fas fa-spinner fa-spin"></i> RENASCENDO...'
    try { await api.post('/api/death/rebirth'); toast('Você renasceu. Não falhe de novo.', 'success'); await loadPlayer(); navigate('/app/status') }
    catch (e) { toast(e.message, 'error'); b.disabled = false; b.innerHTML = '🔥 RENASCER DO ZERO' }
  }
})

// ---------- GUILDS ----------
route('/app/guilds', () => appGuard(renderGuilds))
async function renderGuilds() {
  setApp(appShell('/app/guilds', `<div class="px-4 lg:px-8 pt-6 max-w-3xl mx-auto"><div class="skeleton h-40 w-full"></div></div>`))
  let data
  try { data = await api.get('/api/guilds') } catch { return }
  const { guilds, myGuild, members } = data

  let myGuildHtml = ''
  if (myGuild) {
    myGuildHtml = `<div class="card p-5 mb-5 bg-aurora" style="border-color:${myGuild.emblem_color}55">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style="background:${myGuild.emblem_color}22;border:2px solid ${myGuild.emblem_color}">${myGuild.emblem || '🛡️'}</div>
        <div class="flex-1 min-w-0">
          <div class="font-display font-black text-xl text-white truncate">${myGuild.name}</div>
          <div class="font-accent text-[10px] uppercase tracking-wider" style="color:${myGuild.emblem_color}">${myGuild.role === 'owner' ? '👑 Líder' : 'Membro'} · ${myGuild.member_count} membro(s)</div>
        </div>
        <div class="text-right"><div class="font-mono text-neon-blue text-sm">${(myGuild.total_xp||0).toLocaleString('pt-BR')}</div><div class="text-[10px] text-slate-500 uppercase">XP total</div></div>
      </div>
      ${myGuild.description ? `<p class="text-slate-400 font-body text-sm mb-3">${myGuild.description}</p>` : ''}
      <div class="font-accent text-[10px] text-slate-400 uppercase tracking-widest mb-2">Membros</div>
      <div class="space-y-2 mb-3">${members.map((mb,i) => `
        <div class="flex items-center gap-3">
          <span class="w-5 text-center font-display text-sm ${i===0?'text-neon-gold':'text-slate-500'}">${i+1}</span>
          ${avatarHtml(mb,'w-8 h-8','text-xs')}
          <div class="flex-1 min-w-0"><div class="font-body text-white text-sm truncate">${mb.nick} ${mb.role==='owner'?'👑':''}</div></div>
          <div class="font-mono text-xs text-neon-blue">${(mb.contributed_xp||0).toLocaleString('pt-BR')} XP</div>
        </div>`).join('')}</div>
      <button id="leave-guild" class="card border border-neon-red/40 w-full py-2.5 rounded-xl text-neon-red font-display text-sm">SAIR DA GUILDA</button>
    </div>`
  } else {
    myGuildHtml = `<button id="create-guild" class="btn-neon w-full py-3.5 rounded-2xl font-display font-bold mb-5"><i class="fas fa-plus mr-2"></i>FUNDAR GUILDA</button>`
  }

  const content = `<div class="px-4 lg:px-8 pt-6 max-w-3xl mx-auto">
    <h1 class="font-display font-black text-2xl text-white mb-1">Guildas</h1>
    <p class="text-slate-400 font-body text-sm mb-4">Una-se a outros operadores e dispute o domínio coletivo.</p>
    ${myGuildHtml}
    <div class="font-accent text-[10px] text-slate-400 uppercase tracking-widest mb-2">Ranking de Guildas</div>
    <div class="space-y-2">${guilds.length ? guilds.map(g => `
      <div class="card glass p-3 flex items-center gap-3" style="border-color:${g.rank<=3?(g.emblem_color+'55'):'transparent'}">
        <span class="w-7 text-center font-display font-bold ${g.rank<=3?'text-lg text-neon-gold':'text-slate-400'}">${g.rank<=3?['🥇','🥈','🥉'][g.rank-1]:'#'+g.rank}</span>
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style="background:${g.emblem_color}22;border:1px solid ${g.emblem_color}55">${g.emblem||'🛡️'}</div>
        <div class="flex-1 min-w-0"><div class="font-display text-white text-sm truncate">${g.name}</div><div class="text-[10px] text-slate-500 uppercase font-accent">${g.member_count} membro(s)</div></div>
        <div class="text-right"><div class="font-mono text-neon-blue text-sm">${(g.total_xp||0).toLocaleString('pt-BR')}</div>
        ${!myGuild ? `<button class="join-guild text-[10px] text-neon-purple font-accent uppercase" data-id="${g.id}">Entrar →</button>` : ''}</div>
      </div>`).join('') : '<div class="card glass p-6 text-center text-slate-400 font-body text-sm">Nenhuma guilda ainda. Seja o primeiro a fundar!</div>'}</div>
  </div>`
  setApp(appShell('/app/guilds', content))

  const cg = document.getElementById('create-guild')
  if (cg) cg.onclick = showCreateGuild
  const lg = document.getElementById('leave-guild')
  if (lg) lg.onclick = async () => {
    if (!confirm('Sair da guilda? Sua contribuição de XP será perdida.')) return
    try { await api.post('/api/guilds/leave'); toast('Você saiu da guilda', 'info'); renderGuilds() } catch(e){ toast(e.message,'error') }
  }
  document.querySelectorAll('.join-guild').forEach(b => b.onclick = async () => {
    try { await api.post('/api/guilds/'+b.dataset.id+'/join'); toast('Bem-vindo à guilda!', 'success'); renderGuilds() } catch(e){ toast(e.message,'error') }
  })
}

function showCreateGuild() {
  const emojis = ['🛡️','⚔️','🔥','⚡','🐺','🦅','🐉','👑','💎','🌟','🎯','🦁']
  const colors = ['#7c3aed','#2563eb','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#a855f7']
  const m = modal(`
    <h3 class="font-display font-bold text-white mb-4">Fundar Guilda</h3>
    <label class="block text-xs text-slate-400 font-body mb-1">Nome da Guilda</label>
    <input id="g-name" maxlength="24" class="w-full bg-bg-secondary border border-slate-700 rounded-xl px-3 py-2.5 text-white font-body mb-3 focus:border-neon-purple outline-none" placeholder="Ex: Os Despertos" />
    <label class="block text-xs text-slate-400 font-body mb-1">Descrição</label>
    <textarea id="g-desc" maxlength="120" rows="2" class="w-full bg-bg-secondary border border-slate-700 rounded-xl px-3 py-2.5 text-white font-body mb-3 focus:border-neon-purple outline-none resize-none" placeholder="O propósito da sua guilda..."></textarea>
    <label class="block text-xs text-slate-400 font-body mb-1">Emblema</label>
    <div id="g-emojis" class="flex flex-wrap gap-2 mb-3">${emojis.map((e,i)=>`<button class="g-emoji w-10 h-10 rounded-xl text-xl flex items-center justify-center ${i===0?'ring-2 ring-neon-purple':'card glass'}" data-e="${e}">${e}</button>`).join('')}</div>
    <label class="block text-xs text-slate-400 font-body mb-1">Cor</label>
    <div id="g-colors" class="flex flex-wrap gap-2 mb-4">${colors.map((c,i)=>`<button class="g-color w-8 h-8 rounded-full ${i===0?'ring-2 ring-white':''}" style="background:${c}" data-c="${c}"></button>`).join('')}</div>
    <button id="g-create" class="btn-primary w-full py-3 rounded-xl font-display font-bold">FUNDAR</button>`)
  let emblem = emojis[0], color = colors[0]
  m.querySelectorAll('.g-emoji').forEach(b => b.onclick = () => { m.querySelectorAll('.g-emoji').forEach(x=>x.classList.remove('ring-2','ring-neon-purple')); b.classList.add('ring-2','ring-neon-purple'); emblem = b.dataset.e })
  m.querySelectorAll('.g-color').forEach(b => b.onclick = () => { m.querySelectorAll('.g-color').forEach(x=>x.classList.remove('ring-2','ring-white')); b.classList.add('ring-2','ring-white'); color = b.dataset.c })
  m.querySelector('#g-create').onclick = async () => {
    const name = m.querySelector('#g-name').value.trim()
    if (name.length < 3) return toast('Nome muito curto', 'warn')
    try { await api.post('/api/guilds/create', { name, description: m.querySelector('#g-desc').value.trim(), emblem, emblem_color: color }); m.remove(); toast('Guilda fundada!', 'success'); renderGuilds() }
    catch(e){ toast(e.message, 'error') }
  }
}

// ---------- ACHIEVEMENTS ----------
route('/app/achievements', () => appGuard(renderAchievements))
async function renderAchievements() {
  setApp(appShell('/app/achievements', `<div class="px-4 lg:px-8 pt-6 max-w-3xl mx-auto"><div class="skeleton h-40 w-full"></div></div>`))
  let data
  try { data = await api.get('/api/achievements') } catch { return }
  const { achievements, unlockedCount, total } = data
  const pct = Math.round(unlockedCount / total * 100)
  const content = `<div class="px-4 lg:px-8 pt-6 max-w-3xl mx-auto">
    <h1 class="font-display font-black text-2xl text-white mb-1">Conquistas</h1>
    <p class="text-slate-400 font-body text-sm mb-3">${unlockedCount} de ${total} desbloqueadas (${pct}%)</p>
    <div class="progress-track h-2 mb-5"><div class="progress-fill h-full" style="width:${pct}%;background:linear-gradient(90deg,#f59e0b,#7c3aed)"></div></div>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${achievements.map(a => `
      <div class="card glass p-4 text-center ${a.unlocked?'':'opacity-50 grayscale'}" style="${a.unlocked?`border-color:${a.rarityMeta.color}55`:''}">
        <div class="text-3xl mb-2">${a.unlocked ? a.icon : '🔒'}</div>
        <div class="font-display text-white text-xs leading-tight">${a.name}</div>
        <div class="font-accent text-[9px] uppercase tracking-wider mt-1" style="color:${a.rarityMeta.color}">${a.rarityMeta.label}</div>
        <div class="font-body text-[10px] text-slate-500 mt-1.5 leading-tight">${a.description}</div>
      </div>`).join('')}</div>
  </div>`
  setApp(appShell('/app/achievements', content))
}

// ---------- AVATAR EDITOR ----------
window.LL_showAvatarEditor = function showAvatarEditor() {
  const p = State.player
  const emojis = ['😎','🔥','⚡','🦾','🧠','💪','🦅','🐺','🐉','👑','🎯','🥷','🦁','🚀','💎','🌟','⚔️','🛡️','👁️','🦊']
  const m = modal(`
    <h3 class="font-display font-bold text-white mb-4">Personalizar Avatar</h3>
    <div class="flex justify-center mb-4" id="av-preview">${avatarHtml(p,'w-20 h-20','text-3xl')}</div>
    <label class="block text-xs text-slate-400 font-body mb-2">Escolha um emoji</label>
    <div id="av-emojis" class="grid grid-cols-7 gap-2 mb-4">${emojis.map(e=>`<button class="av-emoji w-10 h-10 rounded-xl text-xl flex items-center justify-center card glass" data-e="${e}">${e}</button>`).join('')}</div>
    <label class="block text-xs text-slate-400 font-body mb-1">Ou cole uma URL de imagem</label>
    <input id="av-url" class="w-full bg-bg-secondary border border-slate-700 rounded-xl px-3 py-2.5 text-white font-body mb-4 focus:border-neon-purple outline-none text-sm" placeholder="https://..." />
    <div class="flex gap-2">
      <button id="av-reset" class="card glass flex-1 py-3 rounded-xl text-slate-400 font-body text-sm">Remover</button>
      <button id="av-save" class="btn-primary flex-1 py-3 rounded-xl font-display font-bold">SALVAR</button>
    </div>`)
  let chosen = { avatar_emoji: p.avatar_emoji, avatar_url: p.avatar_url }
  const preview = () => { m.querySelector('#av-preview').innerHTML = avatarHtml({ ...p, ...chosen }, 'w-20 h-20', 'text-3xl') }
  m.querySelectorAll('.av-emoji').forEach(b => b.onclick = () => { chosen = { avatar_emoji: b.dataset.e, avatar_url: null }; m.querySelector('#av-url').value=''; preview() })
  m.querySelector('#av-url').oninput = (e) => { chosen = { avatar_url: e.target.value.trim(), avatar_emoji: null }; if (chosen.avatar_url) preview() }
  m.querySelector('#av-reset').onclick = async () => { try { await api.post('/api/player/avatar', {}); m.remove(); await loadPlayer(); toast('Avatar removido','info'); renderProfile(null) } catch(e){ toast(e.message,'error') } }
  m.querySelector('#av-save').onclick = async () => {
    try { await api.post('/api/player/avatar', chosen); m.remove(); await loadPlayer(); toast('Avatar atualizado!','success'); renderProfile(null) }
    catch(e){ toast(e.message,'error') }
  }
}

// ===================================================
// CALENDÁRIO — anote, marque e registre coisas em datas
// ===================================================
let calState = { ym: null, events: [], selected: null }

route('/app/calendar', () => appGuard(renderCalendar))

function ymStr(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') }
function dateStr(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const WD_PT = ['D','S','T','Q','Q','S','S']

async function renderCalendar() {
  if (!calState.ym) calState.ym = ymStr(new Date())
  try { const r = await api.get('/api/calendar?month=' + calState.ym); calState.events = r.events || [] } catch { calState.events = [] }

  const [yy, mm] = calState.ym.split('-').map(Number)
  const first = new Date(yy, mm - 1, 1)
  const startWd = first.getDay()
  const daysInMonth = new Date(yy, mm, 0).getDate()
  const today = dateStr(new Date())

  // mapa dia -> eventos
  const byDay = {}
  for (const e of calState.events) { (byDay[e.event_date] = byDay[e.event_date] || []).push(e) }

  let cells = ''
  for (let i = 0; i < startWd; i++) cells += `<div></div>`
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${calState.ym}-${String(d).padStart(2,'0')}`
    const evs = byDay[ds] || []
    const isToday = ds === today
    const isSel = ds === calState.selected
    cells += `<button data-day="${ds}" class="cal-cell aspect-square rounded-lg flex flex-col items-center justify-center relative font-body text-sm transition
      ${isSel ? 'bg-neon-purple/30 border border-neon-purple' : isToday ? 'bg-neon-purple/10 border border-neon-purple/40' : 'hover:bg-white/5 border border-transparent'}">
      <span class="${isToday ? 'text-neon-purple font-bold' : 'text-slate-200'}">${d}</span>
      ${evs.length ? `<span class="absolute bottom-1 flex gap-0.5">${evs.slice(0,3).map(e=>`<span class="w-1.5 h-1.5 rounded-full" style="background:${e.color||'#7c3aed'}"></span>`).join('')}</span>` : ''}
    </button>`
  }

  const content = `<div class="bg-aurora min-h-screen">
    <header class="px-4 lg:px-8 pt-6 pb-4 flex items-center justify-between max-w-3xl mx-auto">
      <div>
        <div class="font-accent text-[10px] text-neon-purple uppercase tracking-widest">Agenda</div>
        <h1 class="font-display font-bold text-white text-2xl">Calendário</h1>
      </div>
      <button id="cal-add" class="btn-primary px-4 py-2.5 rounded-xl font-display font-bold text-sm"><i class="fas fa-plus mr-1"></i>Anotar</button>
    </header>

    <div class="px-4 lg:px-8 max-w-3xl mx-auto space-y-4">
      <div class="card p-4">
        <div class="flex items-center justify-between mb-4">
          <button id="cal-prev" class="w-9 h-9 rounded-full card glass text-slate-300 hover:text-white"><i class="fas fa-chevron-left"></i></button>
          <div class="font-display font-bold text-white text-lg">${MONTHS_PT[mm-1]} ${yy}</div>
          <button id="cal-next" class="w-9 h-9 rounded-full card glass text-slate-300 hover:text-white"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="grid grid-cols-7 gap-1 mb-1">${WD_PT.map(w=>`<div class="text-center text-[11px] text-slate-500 font-accent uppercase">${w}</div>`).join('')}</div>
        <div class="grid grid-cols-7 gap-1">${cells}</div>
      </div>

      <div id="cal-day-events" class="card p-4">
        <div class="text-center text-slate-500 font-body text-sm py-6"><i class="fas fa-hand-pointer mb-2 block text-xl"></i>Toque em um dia para ver e adicionar anotações</div>
      </div>
    </div>
  </div>`
  setApp(appShell('/app/calendar', content))

  document.getElementById('cal-prev').onclick = () => { const d = new Date(yy, mm - 2, 1); calState.ym = ymStr(d); calState.selected = null; renderCalendar() }
  document.getElementById('cal-next').onclick = () => { const d = new Date(yy, mm, 1); calState.ym = ymStr(d); calState.selected = null; renderCalendar() }
  document.getElementById('cal-add').onclick = () => showEventModal(calState.selected || today)
  document.querySelectorAll('.cal-cell').forEach(b => b.onclick = () => { calState.selected = b.dataset.day; renderDayEvents(b.dataset.day); document.querySelectorAll('.cal-cell').forEach(x=>x.classList.remove('bg-neon-purple/30','border-neon-purple')); b.classList.add('bg-neon-purple/30','border-neon-purple') })
  if (calState.selected) renderDayEvents(calState.selected)
}

function renderDayEvents(ds) {
  const box = document.getElementById('cal-day-events')
  if (!box) return
  const evs = calState.events.filter(e => e.event_date === ds).sort((a,b)=>(a.event_time||'').localeCompare(b.event_time||''))
  const [yy,mm,dd] = ds.split('-')
  const head = `<div class="flex items-center justify-between mb-3">
    <div class="font-display font-bold text-white">${dd} de ${MONTHS_PT[+mm-1]}</div>
    <button id="cal-add-day" class="text-neon-purple text-sm font-body"><i class="fas fa-plus mr-1"></i>Adicionar</button>
  </div>`
  const list = evs.length ? evs.map(e => `
    <div class="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
      <span class="w-2 h-2 rounded-full mt-2 shrink-0" style="background:${e.color||'#7c3aed'}"></span>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-body ${e.done?'line-through text-slate-500':'text-white'}">${e.title}</span>
          ${e.event_time?`<span class="text-[11px] text-slate-400 font-mono">${e.event_time}</span>`:''}
          ${e.reminder?`<i class="fas fa-bell text-[10px] text-neon-gold"></i>`:''}
        </div>
        ${e.notes?`<div class="text-xs text-slate-400 font-body mt-0.5">${e.notes}</div>`:''}
      </div>
      <button data-done="${e.id}" class="text-${e.done?'neon-green':'slate-500'} hover:text-neon-green text-sm"><i class="fas fa-check-circle"></i></button>
      <button data-del="${e.id}" class="text-slate-500 hover:text-neon-red text-sm"><i class="fas fa-trash"></i></button>
    </div>`).join('') : `<div class="text-center text-slate-500 font-body text-sm py-4">Nenhuma anotação neste dia.</div>`
  box.innerHTML = head + list
  document.getElementById('cal-add-day').onclick = () => showEventModal(ds)
  box.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { try { await api.del('/api/calendar/'+b.dataset.del); toast('Removido','info'); await renderCalendar() } catch(e){ toast(e.message,'error') } })
  box.querySelectorAll('[data-done]').forEach(b => b.onclick = async () => { const ev = calState.events.find(x=>x.id===b.dataset.done); try { await api.patch('/api/calendar/'+b.dataset.done, { done: ev.done?0:1 }); await renderCalendar() } catch(e){ toast(e.message,'error') } })
}

function showEventModal(ds) {
  const cats = [['nota','Nota','#7c3aed'],['meta','Meta','#10b981'],['lembrete','Lembrete','#f59e0b'],['evento','Evento','#2563eb']]
  const m = modal(`
    <h3 class="font-display font-bold text-white text-lg mb-4"><i class="fas fa-calendar-plus text-neon-purple mr-2"></i>Nova anotação</h3>
    <label class="block text-xs text-slate-400 font-body mb-1">Título *</label>
    <input id="ev-title" maxlength="80" class="w-full bg-bg-secondary border border-slate-700 rounded-xl px-3 py-2.5 text-white font-body mb-3 focus:border-neon-purple outline-none" placeholder="Ex: Consulta médica" />
    <label class="block text-xs text-slate-400 font-body mb-1">Detalhes (opcional)</label>
    <textarea id="ev-notes" rows="2" maxlength="300" class="w-full bg-bg-secondary border border-slate-700 rounded-xl px-3 py-2.5 text-white font-body mb-3 focus:border-neon-purple outline-none resize-none" placeholder="Anote o que quiser lembrar..."></textarea>
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div><label class="block text-xs text-slate-400 font-body mb-1">Data</label>
        <input id="ev-date" type="date" value="${ds}" class="w-full bg-bg-secondary border border-slate-700 rounded-xl px-3 py-2.5 text-white font-body focus:border-neon-purple outline-none" /></div>
      <div><label class="block text-xs text-slate-400 font-body mb-1">Hora (opcional)</label>
        <input id="ev-time" type="time" class="w-full bg-bg-secondary border border-slate-700 rounded-xl px-3 py-2.5 text-white font-body focus:border-neon-purple outline-none" /></div>
    </div>
    <label class="block text-xs text-slate-400 font-body mb-1">Tipo</label>
    <div class="grid grid-cols-4 gap-2 mb-3">${cats.map(([v,l,c])=>`<button data-cat="${v}" data-color="${c}" class="ev-cat card glass py-2 rounded-lg text-xs font-body text-white border-transparent"><span class="block w-3 h-3 rounded-full mx-auto mb-1" style="background:${c}"></span>${l}</button>`).join('')}</div>
    <label class="flex items-center gap-2 mb-4 text-sm text-slate-300 font-body"><input id="ev-reminder" type="checkbox" class="accent-purple-600 w-4 h-4" /> Marcar como lembrete <i class="fas fa-bell text-neon-gold text-xs"></i></label>
    <div class="flex gap-2">
      <button id="ev-cancel" class="card glass flex-1 py-3 rounded-xl text-slate-400 font-body">Cancelar</button>
      <button id="ev-save" class="btn-primary flex-1 py-3 rounded-xl font-display font-bold">SALVAR</button>
    </div>`)
  let chosen = { category: 'nota', color: '#7c3aed' }
  const catBtns = m.querySelectorAll('.ev-cat')
  catBtns[0].classList.add('border-neon-purple')
  catBtns.forEach(b => b.onclick = () => { chosen = { category: b.dataset.cat, color: b.dataset.color }; catBtns.forEach(x=>x.classList.remove('border-neon-purple')); b.classList.add('border-neon-purple') })
  m.querySelector('#ev-cancel').onclick = () => m.remove()
  m.querySelector('#ev-save').onclick = async () => {
    const title = m.querySelector('#ev-title').value.trim()
    if (!title) { toast('Informe um título','error'); return }
    try {
      await api.post('/api/calendar', {
        title, notes: m.querySelector('#ev-notes').value.trim(),
        event_date: m.querySelector('#ev-date').value, event_time: m.querySelector('#ev-time').value || null,
        category: chosen.category, color: chosen.color, reminder: m.querySelector('#ev-reminder').checked,
      })
      m.remove(); calState.selected = m.querySelector ? calState.selected : null
      toast('Anotação salva!','success'); await renderCalendar()
    } catch(e){ toast(e.message,'error') }
  }
}

// ---------- Boot ----------
window.LL.render()
})();
