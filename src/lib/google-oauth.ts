// ===================================================
// LIFE LEVEL — Login com Google (OAuth 2.0)
// Funciona em qualquer runtime (usa fetch + Web Crypto).
// Requer GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e
// GOOGLE_REDIRECT_URI nas variáveis de ambiente.
// ===================================================
import type { Database } from './types'
import { Context } from 'hono'
import { createSession, setSessionCookie } from './auth'
import { getPlayer } from './db'

function getGoogleConfig(c?: Context) {
  let redirectUri = process.env.GOOGLE_REDIRECT_URI || ''
  // Fallback: deriva a redirect URI a partir da URL da requisição
  // (funciona automaticamente na Vercel sem precisar configurar a variável).
  if (!redirectUri && c) {
    try {
      const u = new URL(c.req.url)
      redirectUri = `${u.protocol}//${u.host}/api/auth/google/callback`
    } catch { /* ignore */ }
  }
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri,
  }
}

export function isGoogleConfigured(): boolean {
  const { clientId, clientSecret } = getGoogleConfig()
  return !!(clientId && clientSecret)
}

// Passo 1: redireciona o usuário para o Google
export async function startGoogleOAuth(c: Context) {
  const { clientId, redirectUri } = getGoogleConfig(c)
  if (!clientId) {
    return c.redirect('/?auth_error=' + encodeURIComponent('Login com Google não está configurado no servidor.'))
  }
  const state = crypto.randomUUID()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  })
  return c.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params.toString())
}

// Passo 2: callback do Google -> troca code por token -> cria/loga jogador
export async function handleGoogleCallback(c: Context) {
  const db = c.env.DB as Database
  const code = c.req.query('code')
  const { clientId, clientSecret, redirectUri } = getGoogleConfig(c)
  if (!code || !clientId || !clientSecret) {
    return c.redirect('/?auth_error=' + encodeURIComponent('Falha no login com Google.'))
  }

  // Trocar code por tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) {
    return c.redirect('/?auth_error=' + encodeURIComponent('Token do Google inválido.'))
  }
  const tokens = await tokenRes.json() as any

  // Buscar perfil
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const profile = await userRes.json() as any
  const email = (profile.email || '').toLowerCase()
  const googleId = profile.id
  if (!email) {
    return c.redirect('/?auth_error=' + encodeURIComponent('Não foi possível obter seu email do Google.'))
  }

  // Localizar ou criar jogador
  let player = await db.prepare('SELECT * FROM players WHERE google_id = ? OR email = ?').bind(googleId, email).first<any>()
  if (!player) {
    const id = crypto.randomUUID()
    await db.prepare(`INSERT INTO players (id, google_id, email, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)`)
      .bind(id, googleId, email, profile.name || 'Jogador Google', profile.picture || null).run()
    player = await getPlayer(db, id)
  } else if (!player.google_id) {
    // vincula google a conta existente por email
    await db.prepare('UPDATE players SET google_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?')
      .bind(googleId, profile.picture || null, player.id).run()
  }

  await db.prepare(`UPDATE players SET last_login_at = datetime('now'), is_online = 1 WHERE id = ?`).bind(player.id).run()
  const token = await createSession(db, player.id)
  setSessionCookie(c, token)

  const redirect = player.onboarding_completed
    ? (player.assessment_completed ? (player.is_dead ? '/app/death' : '/app/status') : '/assessment')
    : '/onboarding'
  return c.redirect(redirect)
}
