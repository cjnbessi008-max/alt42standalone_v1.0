/**
 * Service Worker for Alt42 PWA
 * 오프라인 지원 및 캐싱
 */

const CACHE_NAME = 'alt42-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/pwa.css',
  '/js/app.js',
  '/js/api.js',
  '/js/auth.js',
  '/js/pwa.js',
  '/assets/css/styles.css',
  '/assets/js/slow-climb.js'
];

// Install 이벤트
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate 이벤트
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
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch 이벤트
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // API 요청은 네트워크 우선 전략
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // WebSocket 요청은 Service Worker가 처리하지 않음
  if (request.url.includes('/ws')) {
    return;
  }

  // 정적 리소스는 캐시 우선 전략
  event.respondWith(cacheFirst(request));
});

/**
 * 캐시 우선 전략
 * 캐시에 있으면 캐시에서, 없으면 네트워크에서
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // 성공적인 응답만 캐시에 저장
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);

    // 오프라인일 때 기본 페이지 반환
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }

    throw error;
  }
}

/**
 * 네트워크 우선 전략
 * 네트워크 실패 시 캐시에서
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // API 응답도 일부 캐싱 (짧은 시간)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Network request failed:', error);

    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 캐시에도 없으면 오프라인 응답 반환
    return new Response(JSON.stringify({
      success: false,
      error: 'Offline',
      message: 'You are currently offline. Please check your internet connection.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Push 알림 이벤트 (향후 구현)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  const options = {
    body: event.data ? event.data.text() : 'New activity log',
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
        title: '보기',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Alt42 Activity', options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// Background Sync (향후 구현)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-logs') {
    event.waitUntil(syncActivityLogs());
  }
});

/**
 * 활동 로그 동기화
 */
async function syncActivityLogs() {
  // IndexedDB에 저장된 오프라인 로그를 서버에 전송
  console.log('[Service Worker] Syncing activity logs...');
  // 실제 구현 시 IndexedDB 사용
}

// 메시지 수신
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
