// PM2 — apenas para desenvolvimento/teste local no sandbox.
// Em produção, a Vercel roda api/index.ts automaticamente.
module.exports = {
  apps: [
    {
      name: 'lifelvl-dev',
      script: 'node',
      args: '--import tsx dev-server.mjs',
      cwd: '/home/user/webapp',
      env: { NODE_ENV: 'development', PORT: 3000 },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
