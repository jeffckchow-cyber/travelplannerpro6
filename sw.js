
/* 
  Service Worker for Travel Planner 2026 
  Version: v3 (Text ID Fix)
*/

const CACHE_NAME = 'travel-planner-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing v3...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Exclude Supabase API calls from caching to ensure sync logic works
  if (url.hostname.includes('supabase.co')) {
    // We only cache storage objects, not API responses
    if (!url.pathname.includes('/storage/v1/object/public/')) {
      return;
    }
  }

  // Network-first strategy for main assets, cache-first for images/storage
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for storage objects
        if (response.status === 200 && url.href.includes('/storage/v1/object/public/')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
