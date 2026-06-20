# 🎮 LIFE LEVEL — Sistema de Evolução Pessoal

> **"Você não está aqui para sobreviver. Está aqui para evoluir."**

Um RPG da vida real (gamificação pessoal) em **Português-BR**. Transforme hábitos, metas e disciplina em atributos, missões, níveis e XP. Funciona como **site (web)**, **PC** e como **app instalável no celular (APK / PWA)**.

- **Versão atual:** `beta v0.1.4` — *18 jun 2026* (MULTIPLATAFORMA)
- **Stack:** Hono + Turso (libSQL) + Vanilla JS SPA + PWA
- **Hospedagem:** Vercel (serverless) + Turso (banco de dados na nuvem)

---

## 🚀 O que mudou na beta v0.1.4 (desde a v0.1.3)

| # | Novidade | Detalhe |
|---|----------|---------|
| 1 | **Roda na Vercel** | Migração completa de Cloudflare → Vercel. Adaptador D1→libSQL faz todas as queries antigas funcionarem sem mudança. |
| 2 | **Banco Turso (libSQL)** | Banco SQLite na nuvem, global e gratuito no plano free. Substitui o Cloudflare D1. |
| 3 | **Login/Registro com Google** | Fluxo OAuth 2.0 completo (opcional — basta configurar as chaves). |
| 4 | **Data de nascimento** | Campo no registro e no onboarding; a idade é calculada automaticamente. |
| 5 | **Aba de Calendário** | Anote, marque e registre compromissos em datas futuras. Grade mensal, lembretes, categorias, concluir/excluir. |
| 6 | **Calendário na home** | Acesso rápido pelo botão no topo e pela navegação. |
| 7 | **Avaliação reformulada (11 perguntas)** | Mais refinada, com **múltipla escolha** e opção **"Outro"** para escrever com suas próprias palavras. |
| 8 | **Análise procedural FORTE** | O sistema lê suas respostas em texto livre (não só as pré-configuradas) e procedimentalmente define atributos, temas, foco e até cria uma **missão de meta personalizada**. |
| 9 | **Relógio ao vivo** | Data e hora pequenas e visíveis no topo, sem atrapalhar a tela. |
| 10 | **100% responsivo** | Celular, tablet, PC. Layout adaptado com breakpoints. |
| 11 | **Instalável (PWA → APK)** | Service Worker + manifest + ícones. "Adicionar à tela inicial" no celular, ou gere um APK real. |
| 12 | **Sessões seguras** | Cookies httpOnly, senhas com PBKDF2 (SHA-256, 100k iterações). |

---

## 🌐 URLs (após você hospedar)

- **Produção (Vercel):** `https://SEU-PROJETO.vercel.app` *(você define ao publicar)*
- **Banco (Turso):** `libsql://life-level-miguxl.aws-us-east-1.turso.io`

### Principais rotas da API
| Método | Rota | Função |
|--------|------|--------|
| POST | `/api/auth/register` | Cadastro (name, nick, email, password, birth_date) |
| POST | `/api/auth/login` | Login (email, password) |
| GET | `/api/auth/google` | Inicia login com Google |
| GET | `/api/auth/google/callback` | Callback do Google |
| GET | `/api/auth/google/status` | Diz se o Google está configurado |
| POST | `/api/onboarding/complete` | Conclui onboarding (calcula idade pela data de nascimento) |
| POST | `/api/assessment/complete` | Avaliação + análise procedural |
| GET | `/api/player/me` | Dados do jogador logado |
| GET | `/api/missions` | Missões diárias/semanais |
| GET/POST/PATCH/DELETE | `/api/calendar` | CRUD do calendário |
| GET | `/api/attributes` | Atributos do jogador |

---

## 🗄️ Arquitetura de dados

- **Modelos:** `players`, `player_attributes`, `missions`, `activities`, `calendar_events`, `assessment_responses`, `sessions`, `guilds`, `shop_items`, etc. (17 tabelas).
- **Armazenamento:** **Turso (libSQL)** — SQLite na nuvem.
- **Compatibilidade:** `src/lib/d1-adapter.ts` expõe a mesma interface do antigo Cloudflare D1, então todo o código de queries continua igual.
- **Fluxo:** Navegador (SPA) → `/api/*` (Hono na Vercel) → Turso.

---

## 📁 Estrutura do projeto

```
webapp/
├── api/
│   └── index.ts          # Entrypoint da Vercel (serverless, hono/vercel)
├── src/
│   ├── index.tsx         # App Hono + todas as rotas + injeção do Turso
│   ├── app-html.ts       # HTML base do SPA (+ registro do Service Worker)
│   ├── lib/
│   │   ├── d1-adapter.ts # Adaptador D1 → Turso/libSQL
│   │   ├── auth.ts       # Sessões, hash de senha (PBKDF2)
│   │   ├── google-oauth.ts # Login com Google
│   │   ├── db.ts, game.ts, death.ts, guilds.ts, achievements.ts
│   └── procedural/
│       ├── analyzer.ts   # Análise FORTE de texto livre (técnica procedural)
│       ├── engine.ts     # Geração de missões
│       └── templates.ts
├── public/
│   ├── sw.js             # Service Worker (PWA/offline)
│   └── static/
│       ├── app.js, pages-intro.js, pages-app.js, pages-more.js
│       ├── style.css, manifest.webmanifest
│       └── icon-192.png, icon-512.png, icon-512-maskable.png, icon.svg
├── scripts/
│   └── init-db.mjs       # Inicializa o banco (schema + seed)
├── schema-turso.sql      # Schema completo (17 tabelas)
├── seed.sql              # Itens iniciais da loja
├── dev-server.mjs        # Servidor local (simula a Vercel)
├── vercel.json           # Configuração da Vercel (rewrites)
├── .env.example          # Modelo de variáveis de ambiente
└── package.json
```

---

## 💻 Rodar localmente

```bash
npm install
node scripts/init-db.mjs   # cria banco local de teste (local-dev.db)
npm run dev                # http://localhost:3000
```

Para rodar local **usando o Turso real**, crie um arquivo `.env` (copie de `.env.example`) com `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`.

---

## ☁️ Hospedar na Vercel + Turso + Instalar APK

👉 **Tutorial completo passo a passo:** veja **[DEPLOY.md](./DEPLOY.md)**.

Resumo:
1. Crie/abra o banco no [Turso](https://turso.tech) e rode o schema.
2. Suba o código no GitHub (ou use `vercel` CLI).
3. Importe na [Vercel](https://vercel.com) e configure as variáveis `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`.
4. Deploy. Acesse pelo celular → "Adicionar à tela inicial" ou gere um APK com o [PWABuilder](https://www.pwabuilder.com).

---

## ✅ Funcionalidades implementadas
- Cadastro/login (email+senha e Google), sessões seguras, data de nascimento
- Onboarding com cálculo de idade, IMC e fase da vida
- Avaliação de 11 perguntas com múltipla escolha + texto livre ("Outro")
- Análise procedural que interpreta as respostas próprias do jogador
- Atributos, níveis, XP, missões diárias/semanais, missão de meta personalizada
- Calendário com CRUD completo (criar, listar, concluir, excluir, lembretes)
- Relógio ao vivo, loja, conquistas, guildas, ranking, sistema de "morte"
- PWA instalável (offline básico via Service Worker)

## 🔜 Próximos passos sugeridos
- Notificações push reais (web-push) para lembretes do calendário
- Sincronização offline mais robusta (fila de ações)
- Tela de estatísticas/gráficos de evolução por atributo
- Tema claro opcional

## 🚀 Status de deploy
- **Plataforma:** Vercel (serverless) + Turso (libSQL)
- **Status:** ✅ Pronto para deploy
- **Última atualização:** 18 jun 2026 — `beta v0.1.4`
