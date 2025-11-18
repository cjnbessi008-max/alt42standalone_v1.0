/**
 * Service Worker for Root Glow PWA
 * 오프라인 지원 및 캐싱
 */

const CACHE_NAME = 'root-glow-v1.0.0';
const RUNTIME_CACHE = 'root-glow-runtime';

// 캐시할 파일 목록
const CACHE_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/css/style.css',
    '/src/css/smartphone.css',
    '/src/css/glow-effects.css',
    '/src/js/app.js',
    '/src/js/math-utils.js',
    '/src/js/root-finder.js',
    '/src/js/graph-renderer.js',
    '/src/js/glow-effects.js',
    '/src/js/smartphone-display.js',
    '/src/js/problem-database.js',
    '/src/js/standalone-storage.js'
];

/**
 * Service Worker 설치
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('[Service Worker] Installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

/**
 * Service Worker 활성화
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activated successfully');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch 이벤트 처리 (네트워크 요청 가로채기)
 * 전략: Cache First (캐시 우선, 실패 시 네트워크)
 */
self.addEventListener('fetch', (event) => {
    // POST 요청은 캐시하지 않음
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // 캐시에 있으면 캐시 반환
                if (cachedResponse) {
                    console.log('[Service Worker] Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                // 캐시에 없으면 네트워크에서 가져오기
                console.log('[Service Worker] Fetching from network:', event.request.url);

                return fetch(event.request)
                    .then((response) => {
                        // 유효하지 않은 응답이면 그대로 반환
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 응답을 복제 (한 번만 읽을 수 있으므로)
                        const responseToCache = response.clone();

                        // 런타임 캐시에 저장
                        caches.open(RUNTIME_CACHE)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);

                        // 오프라인 폴백 페이지 (선택적)
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }

                        return new Response('오프라인 상태입니다.', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

/**
 * 메시지 처리 (앱과 통신)
 */
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);

    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }

    if (event.data.action === 'clearCache') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            }).then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});

/**
 * Background Sync (선택적)
 */
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);

    if (event.tag === 'sync-progress') {
        event.waitUntil(
            // 진행 상황 동기화 로직
            syncProgress()
        );
    }
});

/**
 * Push Notification (선택적)
 */
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received');

    const options = {
        body: event.data ? event.data.text() : '새로운 알림이 있습니다!',
        icon: '/assets/icon-192x192.png',
        badge: '/assets/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('Root Glow', options)
    );
});

/**
 * Notification Click (선택적)
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked');

    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

/**
 * 진행 상황 동기화 함수
 */
function syncProgress() {
    // 실제 동기화 로직 (예: 서버와 동기화)
    return Promise.resolve();
}

/**
 * 캐시 크기 확인
 */
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();

        for (const request of requests) {
            const response = await cache.match(request);
            const blob = await response.blob();
            totalSize += blob.size;
        }
    }

    return totalSize;
}

console.log('[Service Worker] Loaded');
