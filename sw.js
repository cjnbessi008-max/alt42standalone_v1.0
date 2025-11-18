/**
 * Log Flow Service Worker
 * 오프라인 지원 및 캐싱 기능
 */

const CACHE_VERSION = 'logflow-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// 캐시할 정적 파일 목록
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/smartphone.css',
    '/css/animations.css',
    '/js/logCalculator.js',
    '/js/logFlowAnimation.js',
    '/js/moodleIntegration.js',
    '/js/main.js',
    '/js/recommendation.js',
    '/js/storage.js',
    '/manifest.json'
];

// 캐시 전략
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',      // 캐시 우선
    NETWORK_FIRST: 'network-first',  // 네트워크 우선
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate' // 캐시 반환 후 업데이트
};

/**
 * 서비스 워커 설치
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...', CACHE_VERSION);

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('[SW] Static files cached');
                return self.skipWaiting(); // 즉시 활성화
            })
            .catch((error) => {
                console.error('[SW] Cache failed:', error);
            })
    );
});

/**
 * 서비스 워커 활성화
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...', CACHE_VERSION);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // 이전 버전 캐시 삭제
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('logflow-') && name !== STATIC_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim(); // 모든 클라이언트 제어
            })
    );
});

/**
 * 네트워크 요청 가로채기
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API 요청은 네트워크 우선
    if (url.pathname.includes('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // 이미지는 캐시 우선
    if (request.destination === 'image') {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
        return;
    }

    // HTML은 네트워크 우선
    if (request.destination === 'document') {
        event.respondWith(networkFirst(request));
        return;
    }

    // 정적 파일은 캐시 우선
    event.respondWith(cacheFirst(request, STATIC_CACHE));
});

/**
 * 캐시 우선 전략
 */
async function cacheFirst(request, cacheName = STATIC_CACHE) {
    try {
        const cache = await caches.open(cacheName);
        const cached = await cache.match(request);

        if (cached) {
            console.log('[SW] Cache hit:', request.url);
            return cached;
        }

        // 캐시 미스 - 네트워크 요청
        const response = await fetch(request);

        // 성공적인 응답만 캐시
        if (response && response.status === 200) {
            const responseClone = response.clone();
            cache.put(request, responseClone);
        }

        return response;
    } catch (error) {
        console.error('[SW] Cache first failed:', error);
        return offlineFallback(request);
    }
}

/**
 * 네트워크 우선 전략
 */
async function networkFirst(request, cacheName = DYNAMIC_CACHE) {
    try {
        const response = await fetch(request);

        // 성공적인 응답 캐시
        if (response && response.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);

        // 네트워크 실패 - 캐시 시도
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }

        return offlineFallback(request);
    }
}

/**
 * Stale While Revalidate 전략
 */
async function staleWhileRevalidate(request, cacheName = DYNAMIC_CACHE) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // 백그라운드에서 업데이트
    const fetchPromise = fetch(request)
        .then((response) => {
            if (response && response.status === 200) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);

    // 캐시된 버전이 있으면 즉시 반환
    return cached || fetchPromise;
}

/**
 * 오프라인 폴백
 */
function offlineFallback(request) {
    if (request.destination === 'document') {
        return caches.match('/index.html');
    }

    // 오프라인 응답 생성
    return new Response(
        JSON.stringify({
            error: 'offline',
            message: '오프라인 상태입니다. 네트워크 연결을 확인해주세요.'
        }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }
    );
}

/**
 * 백그라운드 동기화
 */
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-answers') {
        event.waitUntil(syncAnswers());
    }
});

/**
 * 답안 동기화
 */
async function syncAnswers() {
    try {
        // IndexedDB에서 동기화되지 않은 답안 가져오기
        const pendingAnswers = await getPendingAnswers();

        for (const answer of pendingAnswers) {
            try {
                await fetch('/api/moodle_connector.php', {
                    method: 'POST',
                    body: JSON.stringify(answer)
                });

                // 동기화 성공 시 삭제
                await deletePendingAnswer(answer.id);
            } catch (error) {
                console.error('[SW] Failed to sync answer:', error);
            }
        }
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

/**
 * 푸시 알림
 */
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const options = {
        body: event.data ? event.data.text() : '새로운 알림이 있습니다',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '확인하기',
                icon: '/assets/icons/checkmark.png'
            },
            {
                action: 'close',
                title: '닫기',
                icon: '/assets/icons/close.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Log Flow', options)
    );
});

/**
 * 알림 클릭 처리
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click:', event.action);

    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

/**
 * 메시지 수신
 */
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => caches.delete(name))
                );
            })
        );
    }
});

/**
 * 헬퍼 함수들 (IndexedDB 연동)
 */
async function getPendingAnswers() {
    // IndexedDB에서 동기화 대기 중인 답안 가져오기
    // 실제 구현은 storage.js와 연동
    return [];
}

async function deletePendingAnswer(id) {
    // IndexedDB에서 답안 삭제
    // 실제 구현은 storage.js와 연동
}

console.log('[SW] Service Worker loaded');
