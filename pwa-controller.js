/**
 * ALT42 PWA Controller
 * Handles PWA installation, offline detection, and updates
 */

class PWAController {
  constructor() {
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.installBtn = null;
    this.offlineIndicator = null;
    this.updateAvailable = false;

    this.init();
  }

  /**
   * Initialize PWA Controller
   */
  init() {
    console.log('[PWA] Initializing controller...');

    // Get UI elements
    this.installBtn = document.getElementById('installBtn');
    this.offlineIndicator = document.getElementById('offlineIndicator');

    // Setup event listeners
    this.setupInstallPrompt();
    this.setupOfflineDetection();
    this.setupUpdateNotification();
    this.checkStandaloneMode();

    console.log('[PWA] Controller initialized');
  }

  /**
   * Setup install prompt
   */
  setupInstallPrompt() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');

      // Prevent the mini-infobar from appearing
      e.preventDefault();

      // Store the event for later use
      this.deferredPrompt = e;

      // Show install button
      if (this.installBtn) {
        this.installBtn.style.display = 'block';
        this.installBtn.addEventListener('click', () => this.handleInstallClick());
      }
    });

    // Listen for install success
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');

      // Hide install button
      if (this.installBtn) {
        this.installBtn.style.display = 'none';
      }

      // Clear the deferred prompt
      this.deferredPrompt = null;

      // Show success message
      this.showNotification('앱이 설치되었습니다! 홈 화면에서 실행할 수 있습니다.', 'success');
    });
  }

  /**
   * Handle install button click
   */
  async handleInstallClick() {
    if (!this.deferredPrompt) {
      console.warn('[PWA] No install prompt available');
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await this.deferredPrompt.userChoice;

    console.log('[PWA] Install prompt outcome:', outcome);

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    } else {
      console.log('[PWA] User dismissed install');
    }

    // Clear the deferred prompt
    this.deferredPrompt = null;

    // Hide install button
    if (this.installBtn) {
      this.installBtn.style.display = 'none';
    }
  }

  /**
   * Setup offline detection
   */
  setupOfflineDetection() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[PWA] Back online');
      this.isOnline = true;
      this.updateOnlineStatus();
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Gone offline');
      this.isOnline = false;
      this.updateOnlineStatus();
    });

    // Initial status
    this.updateOnlineStatus();
  }

  /**
   * Update online status UI
   */
  updateOnlineStatus() {
    const statusIndicator = document.getElementById('lmsStatus');
    const statusText = document.getElementById('lmsText');

    if (this.offlineIndicator) {
      this.offlineIndicator.style.display = this.isOnline ? 'none' : 'inline-block';
    }

    if (statusIndicator && statusText) {
      if (this.isOnline) {
        statusIndicator.className = 'status-indicator connected';
        statusText.textContent = '독립형 모드 (온라인)';
      } else {
        statusIndicator.className = 'status-indicator';
        statusText.textContent = '독립형 모드 (오프라인)';
      }
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('onlinestatuschange', {
      detail: { isOnline: this.isOnline }
    }));
  }

  /**
   * Setup update notification
   */
  setupUpdateNotification() {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] New service worker activated');

      // Show update notification
      this.showUpdateNotification();
    });

    // Check for updates
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] Update available');
            this.updateAvailable = true;
            this.showUpdateNotification();
          }
        });
      });

      // Periodically check for updates (every hour)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    });
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    const message = '새 버전이 있습니다. 새로고침하시겠습니까?';

    if (confirm(message)) {
      window.location.reload();
    }
  }

  /**
   * Check if running in standalone mode
   */
  checkStandaloneMode() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');

    if (isStandalone) {
      console.log('[PWA] Running in standalone mode');
      document.body.classList.add('standalone-mode');

      // Hide install button in standalone mode
      if (this.installBtn) {
        this.installBtn.style.display = 'none';
      }
    } else {
      console.log('[PWA] Running in browser');
    }

    return isStandalone;
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Fade in
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // Auto hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');

      // Remove from DOM after transition
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();

      if (isPersisted) {
        console.log('[PWA] Storage will not be cleared');
      } else {
        console.log('[PWA] Storage may be cleared by browser');
      }

      return isPersisted;
    }

    return false;
  }

  /**
   * Estimate storage usage
   */
  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();

      console.log('[PWA] Storage estimate:', {
        usage: `${(estimate.usage / 1024 / 1024).toFixed(2)} MB`,
        quota: `${(estimate.quota / 1024 / 1024).toFixed(2)} MB`,
        percentage: `${(estimate.usage / estimate.quota * 100).toFixed(2)}%`
      });

      return estimate;
    }

    return null;
  }

  /**
   * Share content (Web Share API)
   */
  async share(data) {
    if (navigator.share) {
      try {
        await navigator.share(data);
        console.log('[PWA] Content shared successfully');
        return true;
      } catch (error) {
        console.error('[PWA] Share failed:', error);
        return false;
      }
    } else {
      console.warn('[PWA] Web Share API not supported');
      return false;
    }
  }

  /**
   * Get battery status
   */
  async getBatteryStatus() {
    if (navigator.getBattery) {
      const battery = await navigator.getBattery();

      const status = {
        level: Math.round(battery.level * 100),
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };

      console.log('[PWA] Battery status:', status);
      return status;
    }

    return null;
  }

  /**
   * Check network information
   */
  getNetworkInfo() {
    if (navigator.connection) {
      const connection = navigator.connection;

      const info = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      console.log('[PWA] Network info:', info);
      return info;
    }

    return null;
  }

  /**
   * Is online
   */
  isOnlineStatus() {
    return this.isOnline;
  }

  /**
   * Force update check
   */
  async checkForUpdate() {
    if (navigator.serviceWorker) {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      console.log('[PWA] Checked for updates');
    }
  }
}

// Initialize PWA Controller
const pwaController = new PWAController();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAController;
}
