// ===================================================
// LIFE LEVEL — Tipos do banco de dados
// Interface única usada por todo o código. O adaptador
// src/lib/d1-adapter.ts (Turso/libSQL) implementa esta interface.
// (Antes isto era o tipo "D1Database" do Cloudflare; agora é nosso,
//  para o projeto ficar 100% independente do Cloudflare.)
// ===================================================

export interface PreparedStatement {
  bind(...values: any[]): PreparedStatement
  first<T = any>(): Promise<T | null>
  all<T = any>(): Promise<{ results: T[]; success: boolean; meta: any }>
  run(): Promise<{ success: boolean; meta: any }>
}

export interface Database {
  prepare(sql: string): PreparedStatement
  batch(statements: PreparedStatement[]): Promise<any[]>
  exec(sql: string): Promise<{ count: number; duration: number }>
}
