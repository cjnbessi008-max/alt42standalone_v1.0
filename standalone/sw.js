/**
 * Service Worker for Alt42 Standalone App
 * 오프라인 지원 및 캐시 관리
 */

const CACHE_NAME = 'alt42-v1.0.0';
const ASSETS_TO_CACHE = [
    '/standalone/index.html',
    '/standalone/css/main.css',
    '/standalone/js/storage.js',
    '/standalone/js/problem-database.js',
    '/standalone/js/recommendation-engine.js',
    '/standalone/js/learning-analytics.js',
    '/standalone/js/graph-manager.js',
    '/standalone/js/app.js',
    '/standalone/manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[Service Worker] Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch 이벤트 - 네트워크 우선, 캐시 폴백 전략
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 성공적인 응답을 캐시에 저장
                if (response && response.status === 200) {
                    const responseClone = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                }

                return response;
            })
            .catch(() => {
                // 네트워크 실패 시 캐시에서 가져오기
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            console.log('[Service Worker] Serving from cache:', event.request.url);
                            return cachedResponse;
                        }

                        // 캐시에도 없으면 오프라인 페이지 반환 (옵션)
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

// 메시지 이벤트 - 캐시 업데이트 등
self.addEventListener('message', (event) => {
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

// 백그라운드 동기화 (옵션)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-learning-data') {
        event.waitUntil(syncLearningData());
    }
});

async function syncLearningData() {
    console.log('[Service Worker] Syncing learning data...');
    // 필요시 서버와 동기화 로직 추가
}

// 푸시 알림 (옵션)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};

    const options = {
        body: data.body || '새로운 학습 문제가 준비되었습니다!',
        icon: '/standalone/assets/icon-192.png',
        badge: '/standalone/assets/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '문제 풀기',
                icon: '/standalone/assets/checkmark.png'
            },
            {
                action: 'close',
                title: '닫기',
                icon: '/standalone/assets/close.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Alt42', options)
    );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/standalone/index.html')
        );
    }
});

console.log('[Service Worker] Loaded successfully');
