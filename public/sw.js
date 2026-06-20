// LIFE LEVEL — Service Worker (PWA / APK)
const CACHE = 'lifelvl-v0.1.4'
const ASSETS = [
  '/static/app.js',
  '/static/pages-intro.js',
  '/static/pages-app.js',
  '/static/pages-more.js',
  '/static/style.css',
  '/static/manifest.webmanifest',
  '/static/icon-192.png',
  '/static/icon-512.png',
]

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  // Nunca cachear chamadas de API (dados sempre frescos)
  if (url.pathname.startsWith('/api/')) {
    return // deixa passar direto para a rede
  }
  // Cache-first para estáticos, network-first para o resto
  if (url.pathname.startsWith('/static/')) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {})
        return res
      }))
    )
  }
})
