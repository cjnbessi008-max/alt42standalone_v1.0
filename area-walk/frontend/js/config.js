/**
 * Configuration
 * 앱 설정 및 상수
 */

const CONFIG = {
    // API 설정
    API_BASE_URL: '/area-walk/backend/api',
    API_VERSION: 'v1',

    // 애니메이션 설정
    ANIMATION_DURATION: 2000, // ms
    SUCCESS_ANIMATION_DURATION: 1000,
    FAILURE_ANIMATION_DURATION: 600,

    // 타이머 설정
    AUTO_START_TIMER: true,

    // UI 설정
    ENABLE_SOUND: false, // 사운드 효과 (향후 구현)
    SHOW_HINTS_LIMIT: 3, // 최대 힌트 개수

    // 디버그 모드
    DEBUG: true
};

// API 엔드포인트 빌더
const API = {
    getProblem: (id) => `${CONFIG.API_BASE_URL}/problems.php/${id}`,
    submitAnswer: (id) => `${CONFIG.API_BASE_URL}/submit.php/problems/${id}/submit`,
    getProgress: (userId) => `${CONFIG.API_BASE_URL}/progress.php/${userId}`,
    calculateIntegral: () => `${CONFIG.API_BASE_URL}/calculate.php`
};

// 로그 유틸리티
const logger = {
    log: (...args) => {
        if (CONFIG.DEBUG) {
            console.log('[Area Walk]', ...args);
        }
    },
    error: (...args) => {
        console.error('[Area Walk Error]', ...args);
    },
    warn: (...args) => {
        if (CONFIG.DEBUG) {
            console.warn('[Area Walk Warning]', ...args);
        }
    }
};
