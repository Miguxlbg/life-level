// ===================================================
// LIFE LEVEL — Inicializador do banco (Turso / libSQL)
// Aplica schema-turso.sql + seed.sql no banco configurado.
//
// Uso (Turso real):
//   export TURSO_DATABASE_URL="libsql://...turso.io"
//   export TURSO_AUTH_TOKEN="..."
//   node scripts/init-db.mjs
//
// Sem variáveis, usa o banco local file:./local-dev.db (para testes).
// ===================================================
import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@libsql/client'

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

const url = process.env.TURSO_DATABASE_URL || 'file:./local-dev.db'
const authToken = process.env.TURSO_AUTH_TOKEN
console.log('[init-db] Banco:', url)

const client = createClient({ url, authToken })

function splitStatements(sql) {
  // Remove comentários de linha e separa por ';'
  return sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function runFile(file) {
  if (!existsSync(file)) {
    console.log('[init-db] Arquivo não encontrado, pulando:', file)
    return
  }
  const sql = readFileSync(file, 'utf8')
  const statements = splitStatements(sql)
  let ok = 0, fail = 0
  for (const stmt of statements) {
    try {
      await client.execute(stmt)
      ok++
    } catch (e) {
      fail++
      console.warn('[init-db] Falha em statement:', e.message?.slice(0, 120))
    }
  }
  console.log(`[init-db] ${file}: ${ok} OK, ${fail} falhas`)
}

await runFile('./schema-turso.sql')
await runFile('./seed.sql')

const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
console.log('[init-db] Tabelas criadas:', tables.rows.map((r) => r.name).join(', '))
console.log('[init-db] ✅ Pronto!')
