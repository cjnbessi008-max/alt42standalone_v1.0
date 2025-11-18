/**
 * Curvy Log - Service Worker
 * Provides offline support, caching, and background sync
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `curvy-log-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `curvy-log-data-${CACHE_VERSION}`;

// Files to cache immediately on install
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/demo.html',
  '/dashboard.html',
  '/recommendations.html',
  '/css/style.css',
  '/js/curvy-log.js',
  '/js/app.js',
  '/js/recommendation-engine.js',
  '/js/dashboard.js',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// API endpoints to cache with network-first strategy
const API_URLS = [
  '/api/get_log_data.php',
  '/api/get_quiz_data.php',
  '/api/get_recommendations.php'
];

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, {
          cache: 'reload'
        })));
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[ServiceWorker] Install failed:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith('curvy-log-') &&
                     cacheName !== CACHE_NAME &&
                     cacheName !== DATA_CACHE_NAME;
            })
            .map(cacheName => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Serve from cache, fallback to network
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (request.method === 'GET') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Let other requests pass through
  event.respondWith(fetch(request));
});

/**
 * Check if request is an API call
 */
function isApiRequest(url) {
  return url.pathname.includes('/api/');
}

/**
 * Cache-first strategy for static assets
 */
async function cacheFirstStrategy(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[ServiceWorker] Cache hit:', request.url);

      // Update cache in background
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
        })
        .catch(() => {}); // Ignore network errors

      return cachedResponse;
    }

    // Not in cache, fetch from network
    const response = await fetch(request);

    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;

  } catch (error) {
    console.error('[ServiceWorker] Cache-first failed:', error);
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Network-first strategy for API requests
 */
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;

  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);

    // Fallback to cache
    const cache = await caches.open(DATA_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response
    return new Response(JSON.stringify({
      success: false,
      error: 'Offline - No cached data available',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Background Sync - Retry failed requests when online
 */
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-learning-data') {
    event.waitUntil(syncLearningData());
  }
});

async function syncLearningData() {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const requests = await cache.keys();

    const syncPromises = requests.map(async request => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        console.error('[ServiceWorker] Sync failed for:', request.url);
        return null;
      }
    });

    await Promise.all(syncPromises);
    console.log('[ServiceWorker] Background sync completed');

  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
  }
}

/**
 * Push Notifications - Learning reminders
 */
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received');

  let data = {
    title: 'Curvy Log',
    body: '새로운 학습 추천이 있습니다!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    data: {
      url: '/recommendations.html'
    }
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      {
        action: 'open',
        title: '확인',
        icon: '/assets/icons/check-icon.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/assets/icons/close-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'open') {
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
          // Check if there's already a window open
          for (let client of windowClients) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }

          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

/**
 * Message Handler - Communication with main app
 */
self.addEventListener('message', event => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_VERSION
    });
  }
});

/**
 * Periodic Background Sync - Update recommendations
 */
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-recommendations') {
    event.waitUntil(updateRecommendations());
  }
});

async function updateRecommendations() {
  try {
    const response = await fetch('/api/get_recommendations.php');

    if (response.ok) {
      const data = await response.json();

      // Cache the recommendations
      const cache = await caches.open(DATA_CACHE_NAME);
      await cache.put('/api/get_recommendations.php', new Response(JSON.stringify(data)));

      // Show notification if there are new recommendations
      if (data.recommendations && data.recommendations.length > 0) {
        await self.registration.showNotification('새로운 학습 추천', {
          body: `${data.recommendations.length}개의 추천 콘텐츠가 준비되었습니다.`,
          icon: '/assets/icons/icon-192x192.png',
          data: { url: '/recommendations.html' }
        });
      }
    }

    console.log('[ServiceWorker] Recommendations updated');

  } catch (error) {
    console.error('[ServiceWorker] Failed to update recommendations:', error);
  }
}

console.log('[ServiceWorker] Loaded - Version:', CACHE_VERSION);
