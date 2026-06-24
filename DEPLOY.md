# 🚀 LIFE LEVEL — Tutorial Completo de Hospedagem (Vercel + Turso + APK)

Este guia te leva **do zero** até o app no ar na Vercel, com banco Turso, funcionando na **web, no PC e como APK no celular**. Tem também uma seção de **solução de erros** (inclusive o erro `404 / page can't be found`).

---

## 📋 Índice
1. [Pré-requisitos](#1-pré-requisitos)
2. [Passo A — Configurar o banco no Turso](#2-passo-a--configurar-o-banco-no-turso)
3. [Passo B — Subir o código no GitHub](#3-passo-b--subir-o-código-no-github)
4. [Passo C — Publicar na Vercel](#4-passo-c--publicar-na-vercel)
5. [Passo D — Configurar as variáveis de ambiente](#5-passo-d--configurar-as-variáveis-de-ambiente)
6. [Passo E — (Opcional) Login com Google](#6-passo-e--opcional-login-com-google)
7. [Passo F — Instalar como APP/APK no celular](#7-passo-f--instalar-como-appapk-no-celular)
8. [Passo G — Rodar na sua máquina (local)](#8-passo-g--rodar-na-sua-máquina-local)
9. [🛠️ Solução de erros (incl. o 404)](#9-️-solução-de-erros)

---

## 1. Pré-requisitos
- Uma conta no **GitHub** (grátis) — https://github.com
- Uma conta na **Vercel** (grátis) — https://vercel.com
- Uma conta no **Turso** (grátis) — https://turso.tech
- **Node.js 18+** instalado (só se for rodar/local ou usar a CLI) — https://nodejs.org

> ⚠️ **IMPORTANTE — Segurança:** o token do Turso que você me passou ficou exposto no chat. **Crie um token novo** (ver Passo A.4) e **não compartilhe** com ninguém. O antigo deve ser revogado.

---

## 2. Passo A — Configurar o banco no Turso

O banco **já foi criado e inicializado** com o nome `life-level-miguxl`. Mesmo assim, segue como tudo funciona (e como recriar do zero se precisar).

### A.1 — Instalar a CLI do Turso (opcional, recomendado)
```bash
# Linux / macOS / WSL
curl -sSfL https://get.tur.so/install.sh | bash

# Windows: instale via WSL ou use o painel web em https://app.turso.tech
```

### A.2 — Login
```bash
turso auth login
```

### A.3 — (Se precisar criar do zero)
```bash
# criar o banco
turso db create life-level

# aplicar o schema (cria as 17 tabelas)
turso db shell life-level < schema-turso.sql

# (opcional) popular a loja
turso db shell life-level < seed.sql
```

### A.4 — Pegar a URL e gerar um TOKEN NOVO
```bash
# URL do banco (copie):
turso db show life-level --url
# Ex: libsql://life-level-miguxl.aws-us-east-1.turso.io

# Gerar um token de autenticação NOVO (copie e guarde):
turso db tokens create life-level
```
Guarde esses dois valores — você vai usá-los na Vercel:
- `TURSO_DATABASE_URL` = a URL acima
- `TURSO_AUTH_TOKEN` = o token gerado

### A.5 — Pelo site (sem CLI)
1. Entre em **https://app.turso.tech**
2. Abra o banco `life-level-miguxl` (ou crie um novo)
3. Em **"Connect" / "Tokens"**, copie a **Database URL** e crie um **novo token**
4. Se o banco estiver vazio, use a aba **"SQL Shell"** do site e cole o conteúdo de `schema-turso.sql` (e depois `seed.sql`)

> ✅ **No seu caso, o banco já está pronto** (17 tabelas + 13 itens da loja). Você só precisa **gerar um token novo** e usar a URL.

---

## 3. Passo B — Subir o código no GitHub

> Você pode pular o GitHub e usar a **Vercel CLI** (Passo C.2). Mas o GitHub é o jeito mais fácil.

1. Crie um repositório novo (privado de preferência) em https://github.com/new
2. Na pasta do projeto, rode:
```bash
git init
git add .
git commit -m "LIFE LEVEL beta v0.1.4 - Vercel + Turso"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/life-level.git
git push -u origin main
```

> ⚠️ O arquivo `.env` **NÃO** vai pro GitHub (está no `.gitignore`). Isso é proposital — segredos nunca vão pro repositório.

---

## 4. Passo C — Publicar na Vercel

### Opção 1 — Pelo site (mais fácil)
1. Entre em **https://vercel.com** e faça login (pode usar o GitHub).
2. Clique em **"Add New..." → "Project"**.
3. Selecione o repositório `life-level` que você subiu.
4. Em **"Framework Preset"**, deixe **"Other"**.
5. **Deixe Build Command, Output Directory e Install Command VAZIOS / no padrão.** A Vercel detecta `api/index.ts` automaticamente como função serverless e serve a pasta `public/` como estática. ⚠️ Se você já tinha publicado antes com "Output Directory: public" ou "Build Command: echo no build", **apague esses valores** (veja a seção 9, erro `FUNCTION_INVOCATION_FAILED`).
6. Antes de clicar em Deploy, vá em **"Environment Variables"** e adicione as do **Passo D**.
7. Clique em **"Deploy"** e aguarde (~1 min).
8. Pronto! Você recebe uma URL tipo `https://life-level-xxxx.vercel.app`.

### Opção 2 — Pela CLI (sem GitHub)
```bash
npm i -g vercel
vercel login
# na pasta do projeto:
vercel            # primeiro deploy (responda às perguntas, aceite os padrões)
vercel --prod     # publica em produção
```
Defina as variáveis com:
```bash
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
# depois rode de novo:
vercel --prod
```

---

## 5. Passo D — Configurar as variáveis de ambiente

Na Vercel: **Project → Settings → Environment Variables**. Adicione (marque os 3 ambientes: Production, Preview, Development):

| Nome | Valor | Obrigatório? |
|------|-------|--------------|
| `TURSO_DATABASE_URL` | `libsql://life-level-miguxl.aws-us-east-1.turso.io` | ✅ Sim |
| `TURSO_AUTH_TOKEN` | *(o token NOVO que você gerou no Passo A.4)* | ✅ Sim |
| `GOOGLE_CLIENT_ID` | *(só se quiser login Google)* | ❌ Opcional |
| `GOOGLE_CLIENT_SECRET` | *(só se quiser login Google)* | ❌ Opcional |
| `GOOGLE_REDIRECT_URI` | `https://SEU-PROJETO.vercel.app/api/auth/google/callback` | ❌ Opcional |

> 🔁 **Depois de adicionar/alterar variáveis, faça um Redeploy** (Deployments → ... → Redeploy). A Vercel só lê as variáveis no momento do build.

---

## 6. Passo E — (Opcional) Login com Google

Sem isto, o botão "Entrar com Google" aparece desativado, mas **email/senha funciona normal**.

1. Acesse https://console.cloud.google.com
2. Crie um projeto → **APIs e Serviços → Tela de consentimento OAuth** (tipo "Externo").
3. **Credenciais → Criar credenciais → ID do cliente OAuth → Tipo: Aplicativo da Web**.
4. Em **URIs de redirecionamento autorizados**, adicione:
   ```
   https://SEU-PROJETO.vercel.app/api/auth/google/callback
   ```
5. Copie o **Client ID** e **Client Secret** e coloque nas variáveis da Vercel (Passo D).
6. Defina `GOOGLE_REDIRECT_URI` com a mesma URL acima.
7. Redeploy.

---

## 7. Passo F — Instalar como APP/APK no celular

O LIFE LEVEL é um **PWA** (Progressive Web App), então funciona como app de verdade.

### 📱 Método 1 — "Adicionar à tela inicial" (mais simples, funciona já)
**Android (Chrome):**
1. Abra `https://SEU-PROJETO.vercel.app` no Chrome.
2. Toque no menu **⋮** → **"Adicionar à tela inicial"** / **"Instalar app"**.
3. Pronto: vira um ícone na tela, abre em tela cheia, sem barra do navegador.

**iPhone (Safari):**
1. Abra a URL no Safari.
2. Toque em **Compartilhar** (□↑) → **"Adicionar à Tela de Início"**.

### 📦 Método 2 — Gerar um APK real (arquivo .apk para instalar/distribuir)
Use o **PWABuilder** (gratuito, da Microsoft):
1. Acesse **https://www.pwabuilder.com**
2. Cole a URL `https://SEU-PROJETO.vercel.app` e clique em **Start**.
3. Ele analisa o manifest/Service Worker (já incluídos no projeto). Clique em **"Package for stores"**.
4. Escolha **Android** → **Download** → você recebe um `.apk` (e um `.aab` para a Play Store).
5. Transfira o `.apk` para o celular e instale (ative "Fontes desconhecidas" se pedir).

> 💡 O APK gerado é um "wrapper" que abre seu site PWA em tela cheia, com ícone próprio. Atualizações no site refletem no app automaticamente.

---

## 8. Passo G — Rodar na sua máquina (local)

```bash
# 1. Instale as dependências
npm install

# 2. Crie o banco local de teste (ou configure .env com o Turso real)
node scripts/init-db.mjs

# 3. Rode
npm run dev
# abre em http://localhost:3000
```

Para usar o **Turso real** localmente, crie `.env` (copie de `.env.example`):
```
TURSO_DATABASE_URL=libsql://life-level-miguxl.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=seu_token_novo
```

---

## 9. 🛠️ Solução de erros

### ❌ `This lifelevelbeta.pages.dev page can't be found` (HTTP 404)
**Causa:** essa era a URL antiga do **Cloudflare Pages**, que **foi desativada** nesta migração. O projeto agora roda na **Vercel**.
**Solução:** use a sua nova URL da Vercel (`https://SEU-PROJETO.vercel.app`). O endereço `.pages.dev` não existe mais — pode esquecê-lo.

### ❌ `404 NOT_FOUND` na Vercel ao abrir o site
**Causas comuns e soluções:**
1. **Faltou o `vercel.json`** — confirme que ele está na raiz do projeto (ele redireciona tudo para `/api/index`).
2. **A pasta `api/` não foi enviada** — confirme que `api/index.ts` está no repositório.

### ❌ `500 Internal Server Error` / `FUNCTION_INVOCATION_FAILED` (O ERRO DA IMAGEM)
Esse foi exatamente o erro que você viu. Ele tem **3 causas possíveis**, e a versão nova do projeto **já corrige todas**:

**1. Configuração de build "presa" no painel da Vercel (causa nº 1 no seu caso).**
Quando você publicou da primeira vez, a Vercel salvou `Build Command: echo 'no build needed'` e `Output Directory: public`. Isso faz a Vercel tratar o projeto como **site estático** e a função `api/index.ts` quebra. **Como resolver:**
   - Vercel → seu projeto → **Settings → Build & Development Settings**
   - **Framework Preset:** `Other`
   - **Build Command:** clique em **Override** e deixe **VAZIO** (ou desligue o Override)
   - **Output Directory:** clique em **Override** e deixe **VAZIO** (apague `public`)
   - **Install Command:** padrão (`npm install`)
   - Salve → vá em **Deployments → ... → Redeploy** (desmarque "use existing build cache").

**2. Variáveis de ambiente faltando ou sem redeploy.**
   - Confirme `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` em Settings → Environment Variables (nos 3 ambientes).
   - **Faça Redeploy** depois de adicionar (a Vercel não relê variáveis sem novo build).

**3. Código antigo (`src/index.tsx`, `tsconfig` com `vite/client`, `runtime:'nodejs'`).**
   - A versão nova renomeou `index.tsx → index.ts`, limpou o `tsconfig.json`, removeu o `runtime` inválido do `api/index.ts` e adicionou um tratador de erros que mostra a causa real no log.
   - **Garanta que o seu GitHub está com a versão nova** (veja a seção "Como atualizar o repositório" no final).

**Para ver o erro real:** Vercel → Deployments → clique no deploy → **Logs / Functions**. Agora, com o tratador de erros novo, vai aparecer a mensagem exata (ex.: `TURSO_DATABASE_URL não configurada`) em vez de um 500 cego.

### ❌ `TURSO_DATABASE_URL não configurada`
A variável não chegou na função. Adicione-a (Passo D) e **redeploy**.

### ❌ Erro de autenticação no Turso / `UNAUTHORIZED`
O token está errado, expirou ou foi revogado. Gere um novo: `turso db tokens create life-level` e atualize na Vercel.

### ❌ Botão "Entrar com Google" desativado
Normal se você não configurou as chaves do Google (Passo E). O login por **email/senha funciona** mesmo assim.

### ❌ "redirect_uri_mismatch" ao logar com Google
A URL de callback no Google Console precisa ser **idêntica** à `GOOGLE_REDIRECT_URI` (incluindo `https://` e `/api/auth/google/callback`). Corrija no Console e nas variáveis.

### ❌ O PWA não mostra "Instalar" no celular
1. Tem que estar em **HTTPS** (a Vercel já dá HTTPS).
2. Abra pelo **Chrome (Android)** ou **Safari (iPhone)**.
3. Aguarde alguns segundos (o Service Worker precisa registrar). Recarregue uma vez.

### ❌ Mudei o código mas o app no celular não atualizou
O Service Worker faz cache. Solução: feche e reabra o app, ou no Chrome → Configurações do site → Limpar dados. (Cada deploy novo usa um cache novo.)

### ❌ `Module not found` / erro de build na Vercel
Confirme que `package.json` lista `hono`, `@libsql/client` e `@hono/node-server`. Rode `npm install` localmente e faça commit do `package-lock.json`.

### ❌ `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".tsx"` ao rodar `npm run dev` (LOCAL)
Esse erro acontece porque o Node novo (v20+) não sabe ler arquivos TypeScript sozinho. **A versão nova já corrige**, de duas formas:
1. O `package.json` agora usa `node --import tsx dev-server.mjs` (o `tsx` ensina o Node a ler `.ts`).
2. O arquivo problemático foi renomeado de `index.tsx` para `index.ts`.

**Se mesmo assim der erro**, instale as dependências de novo e rode:
```bash
npm install
npm run dev
```
Se você está com a pasta antiga baixada, **baixe o pacote novo** ou atualize pelo Git (seção abaixo).

---

## 🔄 Como atualizar o repositório que já está no GitHub/Vercel

Se você **já tinha subido a versão antiga** (com `src/index.tsx`), faça assim para aplicar as correções:

### Opção A — Baixar o pacote novo e substituir (mais simples)
1. Baixe o `.zip` novo (link que te enviei no chat).
2. Apague a pasta antiga do projeto no seu PC (ou renomeie).
3. Extraia o `.zip` novo no lugar.
4. No terminal, dentro da pasta nova:
```bash
npm install
git add -A
git commit -m "Corrige Vercel 500 + erro .tsx local (migracao Turso)"
git push
```
5. A Vercel detecta o push e redeploya sozinha. **Depois confira as configs de build** (seção 9, erro `FUNCTION_INVOCATION_FAILED`, passo 1).

### Opção B — Atualizar pelo Git (se você sabe usar Git)
Dentro da pasta do projeto novo (a que extraiu):
```bash
git remote set-url origin https://github.com/SEU_USUARIO/life-level.git
git add -A
git commit -m "Corrige Vercel 500 + erro .tsx local"
git push -f origin main   # -f sobrescreve o conteudo antigo
```

> ⚠️ Depois do push, **vá na Vercel e limpe as configs de build presas** (Settings → Build & Development → deixe Build Command e Output Directory vazios) e faça **Redeploy sem cache**. Sem isso, o erro 500 pode continuar mesmo com o código novo.

---

## ✅ Checklist final
- [ ] Banco Turso criado e com schema aplicado
- [ ] Token NOVO do Turso gerado (e o antigo revogado)
- [ ] Código no GitHub (ou via Vercel CLI)
- [ ] Variáveis `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` na Vercel
- [ ] Deploy feito → URL `.vercel.app` abrindo
- [ ] Testou cadastro/login no celular
- [ ] Instalou como app ("Adicionar à tela inicial") ou gerou APK no PWABuilder

Bom jogo. **Evolua.** 🎮
