/**
 * Service Worker for Color Union PWA
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'color-union-v1.0.0';
const RUNTIME_CACHE = 'color-union-runtime';

// Files to cache immediately
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/app.html',
    '/dashboard.html',
    '/css/main.css',
    '/css/auth.css',
    '/css/app.css',
    '/css/dashboard.css',
    '/js/app.js',
    '/js/modules/storage.js',
    '/js/modules/auth.js',
    '/js/modules/recommendation.js',
    '/js/modules/notification.js',
    '/js/modules/analytics.js',
    '/js/modules/color-union-core.js',
    '/manifest.json',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Install event');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching assets');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activate event');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => {
                        return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
                    })
                    .map((cacheName) => {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip cross-origin requests
    if (!request.url.startsWith(self.location.origin)) {
        return;
    }

    // Cache-first strategy for static assets
    if (request.url.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(request).then((response) => {
                        // Cache successful responses
                        if (response && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(RUNTIME_CACHE).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    });
                })
                .catch(() => {
                    // Return offline fallback if available
                    return caches.match('/offline.html');
                })
        );
    }
    // Network-first strategy for HTML pages
    else {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful page responses
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fall back to cache
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Return offline page
                        return caches.match('/offline.html');
                    });
                })
        );
    }
});

// Background sync for saving data
self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event:', event.tag);

    if (event.tag === 'sync-progress') {
        event.waitUntil(syncProgress());
    }
});

// Sync progress data
async function syncProgress() {
    // This would sync with a server if we had one
    // For now, it's just a placeholder for future server integration
    console.log('[SW] Syncing progress...');
    return Promise.resolve();
}

// Push notification handler
self.addEventListener('push', (event) => {
    console.log('[SW] Push event received');

    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Color Union';
    const options = {
        body: data.body || '새로운 알림이 있습니다',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: data.url || '/',
        actions: [
            {
                action: 'open',
                title: '열기'
            },
            {
                action: 'close',
                title: '닫기'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click:', event.action);

    event.notification.close();

    if (event.action === 'open') {
        const urlToOpen = event.notification.data || '/';

        event.waitUntil(
            clients.openWindow(urlToOpen)
        );
    }
});

// Message handler - communicate with app
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(RUNTIME_CACHE).then((cache) => {
                return cache.addAll(event.data.urls);
            })
        );
    }

    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

// Periodic background sync (experimental)
self.addEventListener('periodicsync', (event) => {
    console.log('[SW] Periodic sync:', event.tag);

    if (event.tag === 'update-content') {
        event.waitUntil(updateContent());
    }
});

// Update cached content
async function updateContent() {
    const cache = await caches.open(CACHE_NAME);

    for (const url of PRECACHE_URLS) {
        try {
            const response = await fetch(url);
            if (response && response.status === 200) {
                await cache.put(url, response);
                console.log('[SW] Updated cache for:', url);
            }
        } catch (error) {
            console.error('[SW] Failed to update:', url, error);
        }
    }
}

console.log('[SW] Service Worker loaded');
