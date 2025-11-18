/**
 * PWA Installation and Update Handler
 * Handles installation prompts, service worker updates, and offline detection
 */

class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isOnline = navigator.onLine;
        this.swRegistration = null;

        this.init();
    }

    async init() {
        // Check if already installed
        this.checkInstallStatus();

        // Setup event listeners
        this.setupEventListeners();

        // Register service worker
        await this.registerServiceWorker();

        // Show install prompt if not installed
        if (!this.isInstalled) {
            this.showInstallBanner();
        }

        // Check for updates
        this.checkForUpdates();
    }

    checkInstallStatus() {
        // Check if running as standalone
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                            window.navigator.standalone ||
                            document.referrer.includes('android-app://');

        this.isInstalled = isStandalone;

        // Store installation status
        if (isStandalone) {
            localStorage.setItem('pwaInstalled', 'true');
        }
    }

    setupEventListeners() {
        // Before Install Prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('[PWA] Install prompt triggered');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // App Installed
        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App installed successfully');
            this.isInstalled = true;
            localStorage.setItem('pwaInstalled', 'true');
            this.hideInstallButton();
            this.showNotification('앱이 설치되었습니다!', 'success');
        });

        // Online/Offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.hideOfflineBanner();
            console.log('[PWA] Back online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineBanner();
            console.log('[PWA] Gone offline');
        });

        // Service Worker controller change (update available)
        navigator.serviceWorker?.addEventListener('controllerchange', () => {
            console.log('[PWA] Service Worker updated');
            this.showUpdateBanner();
        });
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('[PWA] Service Worker not supported');
            return null;
        }

        try {
            this.swRegistration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('[PWA] Service Worker registered:', this.swRegistration);

            // Check for updates every hour
            setInterval(() => {
                this.swRegistration.update();
            }, 3600000);

            return this.swRegistration;

        } catch (error) {
            console.error('[PWA] Service Worker registration failed:', error);
            return null;
        }
    }

    async checkForUpdates() {
        if (!this.swRegistration) return;

        this.swRegistration.addEventListener('updatefound', () => {
            const newWorker = this.swRegistration.installing;

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] Update available');
                    this.showUpdateBanner();
                }
            });
        });
    }

    showInstallButton() {
        const existingButton = document.getElementById('pwa-install-btn');
        if (existingButton) return;

        const button = document.createElement('button');
        button.id = 'pwa-install-btn';
        button.className = 'pwa-install-btn';
        button.innerHTML = `
            <span class="install-icon">📱</span>
            <span>앱으로 설치</span>
        `;

        button.addEventListener('click', () => this.installApp());

        document.body.appendChild(button);

        // Animate in
        setTimeout(() => button.classList.add('show'), 100);
    }

    hideInstallButton() {
        const button = document.getElementById('pwa-install-btn');
        if (button) {
            button.classList.remove('show');
            setTimeout(() => button.remove(), 300);
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            console.warn('[PWA] Install prompt not available');
            return;
        }

        // Show the install prompt
        this.deferredPrompt.prompt();

        // Wait for the user to respond
        const { outcome } = await this.deferredPrompt.userChoice;

        console.log('[PWA] User choice:', outcome);

        if (outcome === 'accepted') {
            this.showNotification('앱 설치를 시작합니다...', 'info');
        } else {
            this.showNotification('설치가 취소되었습니다', 'warning');
        }

        // Clear the deferred prompt
        this.deferredPrompt = null;
        this.hideInstallButton();
    }

    showInstallBanner() {
        // Don't show if already dismissed recently
        const dismissed = localStorage.getItem('installBannerDismissed');
        if (dismissed && Date.now() - parseInt(dismissed) < 604800000) {
            return; // Dismissed within last 7 days
        }

        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.className = 'pwa-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <div class="banner-icon">📱</div>
                <div class="banner-text">
                    <strong>Curvy Log를 앱으로 설치하세요!</strong>
                    <p>오프라인에서도 사용하고 빠르게 접근하세요</p>
                </div>
                <div class="banner-actions">
                    <button class="banner-btn primary" onclick="pwaInstaller.installApp()">설치</button>
                    <button class="banner-btn secondary" onclick="pwaInstaller.dismissInstallBanner()">나중에</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);
        setTimeout(() => banner.classList.add('show'), 100);
    }

    dismissInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }

        localStorage.setItem('installBannerDismissed', Date.now().toString());
    }

    showUpdateBanner() {
        const existing = document.getElementById('pwa-update-banner');
        if (existing) return;

        const banner = document.createElement('div');
        banner.id = 'pwa-update-banner';
        banner.className = 'pwa-banner update';
        banner.innerHTML = `
            <div class="banner-content">
                <div class="banner-icon">🔄</div>
                <div class="banner-text">
                    <strong>새로운 버전이 있습니다!</strong>
                    <p>최신 기능을 사용하려면 새로고침하세요</p>
                </div>
                <div class="banner-actions">
                    <button class="banner-btn primary" onclick="pwaInstaller.applyUpdate()">업데이트</button>
                    <button class="banner-btn secondary" onclick="pwaInstaller.dismissUpdateBanner()">나중에</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);
        setTimeout(() => banner.classList.add('show'), 100);
    }

    dismissUpdateBanner() {
        const banner = document.getElementById('pwa-update-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }
    }

    async applyUpdate() {
        if (!this.swRegistration?.waiting) {
            window.location.reload();
            return;
        }

        // Tell the waiting service worker to activate
        this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Wait for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }

    showOfflineBanner() {
        const existing = document.getElementById('pwa-offline-banner');
        if (existing) return;

        const banner = document.createElement('div');
        banner.id = 'pwa-offline-banner';
        banner.className = 'pwa-banner offline';
        banner.innerHTML = `
            <div class="banner-content">
                <div class="banner-icon">📡</div>
                <div class="banner-text">
                    <strong>오프라인 모드</strong>
                    <p>인터넷 연결이 끊겼습니다. 일부 기능이 제한될 수 있습니다.</p>
                </div>
            </div>
        `;

        document.body.appendChild(banner);
        setTimeout(() => banner.classList.add('show'), 100);
    }

    hideOfflineBanner() {
        const banner = document.getElementById('pwa-offline-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `pwa-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Request notification permission
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('[PWA] Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    // Send a notification
    async sendNotification(title, options = {}) {
        const hasPermission = await this.requestNotificationPermission();

        if (!hasPermission) {
            console.warn('[PWA] Notification permission not granted');
            return;
        }

        if (this.swRegistration) {
            await this.swRegistration.showNotification(title, {
                icon: '/assets/icons/icon-192x192.png',
                badge: '/assets/icons/badge-72x72.png',
                vibrate: [200, 100, 200],
                ...options
            });
        } else {
            new Notification(title, options);
        }
    }

    // Get app info
    getAppInfo() {
        return {
            isInstalled: this.isInstalled,
            isOnline: this.isOnline,
            hasServiceWorker: !!this.swRegistration,
            canInstall: !!this.deferredPrompt
        };
    }
}

// Initialize PWA Installer
let pwaInstaller;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pwaInstaller = new PWAInstaller();
    });
} else {
    pwaInstaller = new PWAInstaller();
}

// Styles for PWA components
const pwaStyles = document.createElement('style');
pwaStyles.textContent = `
    .pwa-install-btn {
        position: fixed;
        bottom: 20px;
        left: 20px;
        padding: 15px 25px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 50px;
        font-weight: 600;
        font-size: 1em;
        cursor: pointer;
        box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
    }

    .pwa-install-btn.show {
        transform: translateY(0);
        opacity: 1;
    }

    .pwa-install-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
    }

    .pwa-install-btn .install-icon {
        font-size: 1.5em;
    }

    .pwa-banner {
        position: fixed;
        top: -200px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        border-radius: 15px;
        padding: 20px;
        z-index: 10001;
        max-width: 600px;
        width: 90%;
        transition: top 0.3s ease;
    }

    .pwa-banner.show {
        top: 20px;
    }

    .pwa-banner.update {
        background: linear-gradient(135deg, #fff4e0 0%, #ffe0b2 100%);
    }

    .pwa-banner.offline {
        background: linear-gradient(135deg, #ffe0e0 0%, #ffcccb 100%);
    }

    .banner-content {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .banner-icon {
        font-size: 2.5em;
        flex-shrink: 0;
    }

    .banner-text {
        flex: 1;
    }

    .banner-text strong {
        display: block;
        margin-bottom: 5px;
        color: #333;
        font-size: 1.1em;
    }

    .banner-text p {
        margin: 0;
        color: #666;
        font-size: 0.9em;
    }

    .banner-actions {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
    }

    .banner-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
    }

    .banner-btn.primary {
        background: #667eea;
        color: white;
    }

    .banner-btn.primary:hover {
        background: #5568d3;
    }

    .banner-btn.secondary {
        background: transparent;
        color: #667eea;
        border: 2px solid #667eea;
    }

    .banner-btn.secondary:hover {
        background: #667eea;
        color: white;
    }

    .pwa-notification {
        position: fixed;
        bottom: -100px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 30px;
        border-radius: 50px;
        color: white;
        font-weight: 600;
        z-index: 10002;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        transition: bottom 0.3s ease;
    }

    .pwa-notification.show {
        bottom: 20px;
    }

    .pwa-notification.success {
        background: linear-gradient(135deg, #50c878 0%, #3da863 100%);
    }

    .pwa-notification.warning {
        background: linear-gradient(135deg, #ffa500 0%, #ff8c00 100%);
    }

    .pwa-notification.info {
        background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
    }

    @media (max-width: 768px) {
        .pwa-install-btn {
            bottom: 80px;
        }

        .banner-content {
            flex-direction: column;
            text-align: center;
        }

        .banner-actions {
            flex-direction: column;
            width: 100%;
        }

        .banner-btn {
            width: 100%;
        }
    }
`;

document.head.appendChild(pwaStyles);

// Export for global use
window.pwaInstaller = pwaInstaller;
