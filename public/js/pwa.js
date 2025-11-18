/**
 * PWA Initialization
 * Service Worker 등록 및 PWA 기능
 */

// Service Worker 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration.scope);

      // 업데이트 확인
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 새 버전 사용 가능
            showUpdateNotification();
          }
        });
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}

// 업데이트 알림
function showUpdateNotification() {
  const updateNotif = document.getElementById('update-notification');
  if (updateNotif) {
    updateNotif.style.display = 'flex';

    document.getElementById('update-btn')?.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => {
  document.getElementById('offline-notification').style.display = 'none';
  console.log('✅ Online');
});

window.addEventListener('offline', () => {
  document.getElementById('offline-notification').style.display = 'flex';
  console.log('❌ Offline');
});

// 설치 프롬프트
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('💾 Install prompt available');

  // 설치 버튼 표시 (향후 추가 가능)
  // showInstallButton();
});

// 설치 함수
async function installPWA() {
  if (!deferredPrompt) {
    return;
  }

  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to the install prompt: ${outcome}`);

  deferredPrompt = null;
}

// Export
window.installPWA = installPWA;
