const CACHE_NAME = 'photo-gallery-v1';

// 检测是否为开发模式
const isDev = self.location.hostname === 'localhost' || 
              self.location.hostname === '127.0.0.1' ||
              self.location.port !== '';

// 安装 Service Worker
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // 开发模式下直接跳过所有处理
  if (isDev) {
    return;
  }
  
  // 1. 只处理 http/https 请求
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
    return;
  }
  
  // 2. 跳过 chrome-extension:// 请求（这会导致缓存失败）
  if (requestUrl.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then(response => {
        // 检查响应是否有效
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        
        // 只缓存同源请求
        if (requestUrl.origin !== location.origin) {
          return response;
        }
        
        // 克隆并缓存
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // 网络错误时，如果是导航请求，返回 index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
