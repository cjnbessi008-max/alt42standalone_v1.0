/**
 * Service Worker for Shape Guide Lines Generator PWA
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'shapeguide-v1.0.0';
const RUNTIME_CACHE = 'shapeguide-runtime';

// Files to cache immediately
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/storage.js',
    '/js/shape-engine.js',
    '/js/ui.js',
    '/js/app.js',
    '/manifest.json'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell...');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => {
                console.log('[SW] App shell cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Cache error:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[SW] Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                console.log('[SW] Fetching from network:', event.request.url);

                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a success
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone response
                        const responseToCache = response.clone();

                        // Cache runtime files
                        caches.open(RUNTIME_CACHE)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch failed:', error);

                        // Return offline page if available
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }

                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Background sync (optional - for future features)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-shapes') {
        event.waitUntil(
            // Implement sync logic here
            Promise.resolve()
        );
    }
});

// Push notifications (optional - for future features)
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('도형 보조선 생성기', options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');

    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

// Message from clients
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(RUNTIME_CACHE)
                .then((cache) => cache.addAll(event.data.urls))
        );
    }
});

console.log('[SW] Service Worker script loaded');
