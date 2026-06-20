export function renderApp(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#050508" />
  <title>LIFE LEVEL — Sistema de Evolução Pessoal</title>
  <meta name="description" content="Você não está aqui para sobreviver. Está aqui para evoluir." />
  <link rel="manifest" href="/static/manifest.webmanifest" />
  <link rel="apple-touch-icon" href="/static/icon.svg" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Space+Mono&family=Exo+2:wght@400;500;600&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            display: ['Orbitron', 'sans-serif'],
            body: ['Rajdhani', 'sans-serif'],
            mono: ['Space Mono', 'monospace'],
            accent: ['Exo 2', 'sans-serif'],
          },
          colors: {
            bg: { primary: '#050508', secondary: '#0a0a14', card: '#0f0f1a' },
            neon: { purple: '#7c3aed', blue: '#2563eb', green: '#10b981', red: '#ef4444', gold: '#f59e0b' },
          }
        }
      }
    }
  </script>
  <link href="/static/style.css" rel="stylesheet" />
</head>
<body class="bg-bg-primary text-slate-100 font-body antialiased overflow-x-hidden">
  <div id="app"></div>
  <div id="toast-container" class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"></div>
  <div id="overlay-root"></div>
  <script>
    // Registra o Service Worker (necessário para instalar como app / APK)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {})
      })
    }
  </script>
  <script src="/static/app.js"></script>
  <script src="/static/pages-intro.js"></script>
  <script src="/static/pages-app.js"></script>
  <script src="/static/pages-more.js"></script>
</body>
</html>`
}
