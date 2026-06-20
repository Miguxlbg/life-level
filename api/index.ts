// ===================================================
// LIFE LEVEL — Entrypoint Vercel (Serverless Function)
// Roda o app Hono no runtime Node da Vercel. O banco Turso
// (libSQL) é injetado como c.env.DB pelo middleware em src/index.
// Arquivos estáticos em /public são servidos pela Vercel.
// ===================================================
import { handle } from 'hono/vercel'
import { app, renderApp } from '../src/index'

export const config = {
  runtime: 'nodejs',
}

// Catch-all do SPA (a Vercel já serviu /static via /public)
app.get('*', (c) => c.html(renderApp()))

export default handle(app)
