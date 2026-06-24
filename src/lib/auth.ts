// ===================================================
// LIFE LEVEL — Autenticação por sessão (Turso/libSQL)
// ===================================================
import type { Database } from './types'
import { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

export interface Env {
  DB: Database
  ANTHROPIC_API_KEY?: string
}

const SESSION_COOKIE = 'lifelvl_session'
const SESSION_DAYS = 30

// ---------- Password hashing (PBKDF2 via Web Crypto) ----------
const PBKDF2_ITERATIONS = 100000

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}
function hexToBuf(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16)
  return arr
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, 256
  )
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bufToHex(salt.buffer)}$${bufToHex(bits)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [algo, iterStr, saltHex, hashHex] = stored.split('$')
    if (algo !== 'pbkdf2') return false
    const iterations = parseInt(iterStr, 10)
    const salt = hexToBuf(saltHex)
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial, 256
    )
    return bufToHex(bits) === hashHex
  } catch { return false }
}

export async function createSession(db: Database, playerId: string): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '')
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString()
  await db.prepare('INSERT INTO sessions (token, player_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, playerId, expires).run()
  return token
}

export function setSessionCookie(c: Context, token: string) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  })
}

export async function getPlayerId(c: Context): Promise<string | null> {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  const db = c.env.DB as Database
  const row = await db.prepare('SELECT player_id, expires_at FROM sessions WHERE token = ?').bind(token).first<any>()
  if (!row) return null
  if (new Date(row.expires_at) < new Date()) {
    await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
    return null
  }
  return row.player_id
}

export async function clearSession(c: Context) {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) {
    await (c.env.DB as Database).prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}

// Auth middleware for /api/protected routes
export async function requireAuth(c: Context, next: () => Promise<void>) {
  const playerId = await getPlayerId(c)
  if (!playerId) return c.json({ error: 'Não autenticado' }, 401)
  c.set('playerId', playerId)
  await next()
}
