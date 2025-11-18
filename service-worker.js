/**
 * ALT42 Service Worker
 * Provides offline support and caching for standalone PWA
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `alt42-graph-${CACHE_VERSION}`;

// Files to cache for offline use
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/graph-visualizer.js',
  '/burst-effect.js',
  '/lms-connector.js',
  '/storage-manager.js',
  '/manifest.json'
];

// Dynamic cache for runtime resources
const RUNTIME_CACHE = `alt42-runtime-${CACHE_VERSION}`;

/**
 * Install Event
 * Triggered when service worker is first installed
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

/**
 * Activate Event
 * Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Remove old cache versions
              return cacheName.startsWith('alt42-') && cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch Event
 * Intercept network requests and serve from cache when offline
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', request.url);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache if not a success response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response (can only be consumed once)
            const responseToCache = response.clone();

            // Add to runtime cache
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);

            // Return offline page if available
            return caches.match('/offline.html');
          });
      })
  );
});

/**
 * Background Sync Event
 * Sync data when connection is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-graph-data') {
    event.waitUntil(
      syncGraphData()
    );
  }
});

/**
 * Message Event
 * Communication with main thread
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls;
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then((cache) => cache.addAll(urls))
    );
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
    );
  }
});

/**
 * Push Event
 * Handle push notifications (future feature)
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '열기',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ALT42 Graph', options)
  );
});

/**
 * Notification Click Event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * Sync graph data with server (when online)
 */
async function syncGraphData() {
  try {
    // Get pending sync data from IndexedDB
    const db = await openIndexedDB();
    const pendingData = await getPendingSync(db);

    if (pendingData.length === 0) {
      console.log('[Service Worker] No pending data to sync');
      return;
    }

    // Sync each item
    for (const item of pendingData) {
      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });

      // Mark as synced
      await markAsSynced(db, item.id);
    }

    console.log('[Service Worker] Sync complete');
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    throw error;
  }
}

/**
 * Open IndexedDB
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('alt42-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('sync')) {
        db.createObjectStore('sync', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Get pending sync data
 */
function getPendingSync(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync'], 'readonly');
    const store = transaction.objectStore('sync');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Mark item as synced
 */
function markAsSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync'], 'readwrite');
    const store = transaction.objectStore('sync');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[Service Worker] Loaded successfully');
