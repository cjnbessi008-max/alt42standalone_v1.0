/**
 * Angle Live - Service Worker
 * PWA 오프라인 기능 및 캐싱
 */

const CACHE_NAME = 'angle-live-v1.0.0';
const RUNTIME_CACHE = 'angle-live-runtime';

// 캐시할 파일 목록
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/config.js',
    './js/db.js',
    './js/storage.js',
    './js/angle-visualizer.js',
    './js/app.js',
    './manifest.json'
];

// 설치 이벤트 - 정적 자산 캐싱
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
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

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
                        })
                        .map((cacheName) => {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch 이벤트 - 캐시 우선 전략
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
                    return cachedResponse;
                }

                // 캐시에 없으면 네트워크 요청
                return fetch(event.request)
                    .then((response) => {
                        // 유효한 응답이 아니면 그대로 반환
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 응답 복사 (응답은 한 번만 사용 가능)
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

                        // 오프라인 폴백
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
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

// 백그라운드 동기화 (향후 확장)
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);

    if (event.tag === 'sync-data') {
        event.waitUntil(
            // 향후 서버 동기화 로직 추가 가능
            Promise.resolve()
        );
    }
});

// 푸시 알림 (향후 확장)
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push notification received');

    const options = {
        body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
        icon: './assets/icons/icon-192x192.png',
        badge: './assets/icons/icon-72x72.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification('Angle Live', options)
    );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked');

    event.notification.close();

    event.waitUntil(
        clients.openWindow('./')
    );
});

// 메시지 이벤트 - 클라이언트와 통신
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});
