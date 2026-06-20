// ===================================================
// LIFE LEVEL — Servidor de desenvolvimento local
// Simula o ambiente da Vercel: roda o app Hono no Node,
// injeta o Turso (libSQL) como banco e serve /public.
//
// Uso:
//   1) Configure as variáveis em .env (ou use o banco local de teste)
//   2) node dev-server.mjs
//
// Para usar o Turso REAL localmente, exporte antes de rodar:
//   export TURSO_DATABASE_URL="libsql://...turso.io"
//   export TURSO_AUTH_TOKEN="..."
// Caso contrário, usa um arquivo SQLite local (file:./local-dev.db).
// ===================================================
// Carrega .env se existir (sem dependências externas)
import { readFileSync, existsSync } from 'node:fs'
function loadEnv(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) {
      let v = m[2].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      if (!process.env[m[1]]) process.env[m[1]] = v
    }
  }
}
loadEnv('.env')
loadEnv('.dev.vars')

// Fallback: banco local de teste se o Turso não foi configurado
if (!process.env.TURSO_DATABASE_URL) {
  process.env.TURSO_DATABASE_URL = 'file:./local-dev.db'
  console.log('[dev] TURSO_DATABASE_URL não definido — usando banco local file:./local-dev.db')
}

const { serve } = await import('@hono/node-server')
const { serveStatic } = await import('@hono/node-server/serve-static')
const { app, renderApp } = await import('./src/index.tsx')

// Servir arquivos estáticos (como a Vercel faz com /public)
app.get('/static/*', serveStatic({ root: './public' }))
app.get('/sw.js', serveStatic({ path: './public/sw.js' }))
app.get('/manifest.webmanifest', serveStatic({ path: './public/static/manifest.webmanifest' }))
app.get('/favicon.ico', serveStatic({ path: './public/static/icon.svg' }))

// Catch-all do SPA
app.get('*', (c) => c.html(renderApp()))

const port = Number(process.env.PORT || 3000)
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`[dev] LIFE LEVEL rodando em http://localhost:${info.port}`)
})
