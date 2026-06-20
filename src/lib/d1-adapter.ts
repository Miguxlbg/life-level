// ===================================================
// LIFE LEVEL — Adaptador D1 -> libSQL (Turso)
// Expõe a MESMA interface do D1Database para que TODO o
// código existente (db.prepare().bind().first()/all()/run())
// funcione sem mudar nenhuma query.
// ===================================================
import { createClient, Client, InValue } from '@libsql/client'

let _client: Client | null = null

export function getLibsqlClient(): Client {
  if (_client) return _client
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!url) {
    throw new Error('TURSO_DATABASE_URL não configurada. Defina nas variáveis de ambiente.')
  }
  _client = createClient({ url, authToken })
  return _client
}

// ---- Statement compatível com D1PreparedStatement ----
class D1StatementAdapter {
  private sql: string
  private args: InValue[] = []
  private client: Client
  constructor(client: Client, sql: string) {
    this.client = client
    this.sql = sql
  }
  bind(...values: any[]) {
    this.args = values.map((v) => (v === undefined ? null : v)) as InValue[]
    return this
  }
  async first<T = any>(): Promise<T | null> {
    const rs = await this.client.execute({ sql: this.sql, args: this.args })
    if (!rs.rows || rs.rows.length === 0) return null
    return rowToObject<T>(rs.rows[0])
  }
  async all<T = any>(): Promise<{ results: T[]; success: boolean; meta: any }> {
    const rs = await this.client.execute({ sql: this.sql, args: this.args })
    const results = (rs.rows || []).map((r) => rowToObject<T>(r))
    return { results, success: true, meta: { rows_read: results.length } }
  }
  async run(): Promise<{ success: boolean; meta: any }> {
    const rs = await this.client.execute({ sql: this.sql, args: this.args })
    return {
      success: true,
      meta: {
        last_row_id: rs.lastInsertRowid ? Number(rs.lastInsertRowid) : undefined,
        changes: rs.rowsAffected,
        rows_written: rs.rowsAffected,
      },
    }
  }
}

function rowToObject<T>(row: any): T {
  // libSQL retorna cada linha como objeto keyed por coluna, mas inclui
  // propriedades não-enumeráveis. Normalizamos para um objeto simples.
  const obj: any = {}
  for (const key of Object.keys(row)) {
    obj[key] = row[key]
  }
  return obj as T
}

// ---- Database compatível com D1Database ----
export class D1Adapter {
  private client: Client
  constructor(client: Client) {
    this.client = client
  }
  prepare(sql: string) {
    return new D1StatementAdapter(this.client, sql)
  }
  async batch(statements: D1StatementAdapter[]) {
    const results = []
    for (const s of statements) results.push(await s.run())
    return results
  }
  async exec(sql: string) {
    // Executa múltiplos statements separados por ;
    const parts = sql.split(';').map((s) => s.trim()).filter(Boolean)
    for (const p of parts) {
      await this.client.execute(p)
    }
    return { count: parts.length, duration: 0 }
  }
}

export function getDb(): any {
  return new D1Adapter(getLibsqlClient())
}
