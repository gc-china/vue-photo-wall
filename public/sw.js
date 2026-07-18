const SHELL_CACHE = 'photo-gallery-shell-v3'
const THUMB_CACHE = 'photo-gallery-thumbs-v3'
const MEDIUM_CACHE = 'photo-gallery-medium-v3'
const ACTIVE_CACHES = new Set([SHELL_CACHE, THUMB_CACHE, MEDIUM_CACHE])
const INDEX_URL = new URL('index.html', self.registration.scope).toString()

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map(key => cache.delete(key)))
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}

async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone())
        await trimCache(cacheName, maxEntries)
      }
      return response
    })
    .catch(() => cached || new Response('', { status: 503, statusText: 'Service Unavailable' }))
  return cached || network
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.add(INDEX_URL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => !ACTIVE_CACHES.has(name)).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(SHELL_CACHE)
            await cache.put(INDEX_URL, response.clone())
          }
          return response
        })
        .catch(() => caches.match(INDEX_URL))
    )
    return
  }

  // 原图可达数百 MB，只使用浏览器 HTTP 缓存；离线缓存限定为预览资源。
  if (url.pathname.includes('/photos/')) return

  if (url.pathname.includes('/thumbs/')) {
    event.respondWith(staleWhileRevalidate(request, THUMB_CACHE, 180))
    return
  }

  if (url.pathname.includes('/medium/')) {
    event.respondWith(staleWhileRevalidate(request, MEDIUM_CACHE, 60))
    return
  }

  if (['script', 'style', 'font', 'image'].includes(request.destination)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE))
  }
})
