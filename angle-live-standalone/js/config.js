/**
 * Angle Live Standalone - Configuration
 * 독립형 웹앱 설정
 */

const CONFIG = {
    // 앱 정보
    APP_NAME: 'Angle Live',
    APP_VERSION: '2.0.0-standalone',
    APP_DESCRIPTION: '독립형 각도 학습 웹앱',

    // 자동 저장 설정
    AUTO_SAVE: true,
    AUTO_SAVE_DEBOUNCE: 1000, // 1초 디바운스

    // Canvas 설정
    CANVAS: {
        WIDTH: 500,
        HEIGHT: 500,
        CENTER_X: 250,
        CENTER_Y: 250,
        RADIUS: 150,
        LINE_WIDTH: 3,
        FONT_SIZE: 16
    },

    MINI_CANVAS: {
        WIDTH: 280,
        HEIGHT: 280,
        CENTER_X: 140,
        CENTER_Y: 140,
        RADIUS: 100,
        LINE_WIDTH: 2,
        FONT_SIZE: 12
    },

    // 색상 매핑
    COLORS: {
        'color-blue': '#2196F3',
        'color-cyan': '#00BCD4',
        'color-green': '#4CAF50',
        'color-yellow': '#FFEB3B',
        'color-orange': '#FF9800',
        'color-red': '#F44336',
        'color-purple': '#9C27B0',
        'color-pink': '#E91E63',
        'color-brown': '#795548',
        'color-gray': '#9E9E9E',
        'color-default': '#333333'
    },

    // UI 설정
    SHOW_GRID: true,
    SHOW_PROTRACTOR: false,
    ANIMATE_CHANGES: true,

    // 오프라인 기능
    OFFLINE_MODE: true,
    CACHE_STRATEGY: 'cache-first',

    // 디버그 모드
    DEBUG: false
};

/**
 * 유틸리티 함수
 */
const Utils = {
    /**
     * 로그 출력
     */
    log: function(...args) {
        if (CONFIG.DEBUG) {
            console.log('[Angle Live]', ...args);
        }
    },

    /**
     * 에러 로그
     */
    error: function(...args) {
        console.error('[Angle Live Error]', ...args);
    },

    /**
     * 숫자 포맷팅
     */
    formatNumber: function(num, decimals = 2) {
        return parseFloat(num).toFixed(decimals);
    },

    /**
     * 날짜 포맷팅
     */
    formatDate: function(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * 디바운스 함수
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 각도를 라디안으로 변환
     */
    degToRad: function(degrees) {
        return (degrees * Math.PI) / 180;
    },

    /**
     * 라디안을 각도로 변환
     */
    radToDeg: function(radians) {
        return (radians * 180) / Math.PI;
    },

    /**
     * 로딩 표시
     */
    showLoading: function(message = '로딩 중...') {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            const text = loader.querySelector('p');
            if (text) text.textContent = message;
            loader.style.display = 'flex';
        }
    },

    /**
     * 로딩 숨기기
     */
    hideLoading: function() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = 'none';
        }
    },

    /**
     * 토스트 메시지 표시
     */
    showToast: function(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    },

    /**
     * 확인 대화상자
     */
    confirm: function(message) {
        return window.confirm(message);
    },

    /**
     * 프롬프트 대화상자
     */
    prompt: function(message, defaultValue = '') {
        return window.prompt(message, defaultValue);
    },

    /**
     * 온라인 상태 확인
     */
    isOnline: function() {
        return navigator.onLine;
    },

    /**
     * 모바일 기기 확인
     */
    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * PWA 설치 가능 여부 확인
     */
    isPWAInstallable: function() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    },

    /**
     * 로컬 스토리지 사용 가능 여부
     */
    isLocalStorageAvailable: function() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * IndexedDB 사용 가능 여부
     */
    isIndexedDBAvailable: function() {
        return 'indexedDB' in window;
    }
};

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 초기화 확인
Utils.log('Config loaded');
Utils.log('LocalStorage:', Utils.isLocalStorageAvailable());
Utils.log('IndexedDB:', Utils.isIndexedDBAvailable());
Utils.log('Online:', Utils.isOnline());
Utils.log('Mobile:', Utils.isMobile());
