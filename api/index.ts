// ===================================================
// LIFE LEVEL — Entrypoint Vercel (Serverless Function)
// Roda o app Hono no runtime Node da Vercel. O banco Turso
// (libSQL) é injetado como c.env.DB pelo middleware em src/index.
// Arquivos estáticos em /public são servidos pela Vercel.
// ===================================================
import { handle } from 'hono/vercel'
import { app, renderApp } from '../src/index'

// Catch-all do SPA: qualquer rota não-API devolve o HTML do app.
// (A Vercel já serve /static, /sw.js e /favicon.ico via /public
//  por causa dos rewrites em vercel.json, então aqui só cai o resto.)
app.get('*', (c) => c.html(renderApp()))

export default handle(app)
