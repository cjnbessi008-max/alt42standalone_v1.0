/**
 * Shape Explainer Configuration
 */

const CONFIG = {
    // API Configuration
    API_BASE_URL: '/backend/api',
    API_VERSION: 'v1',

    // Moodle Configuration (will be passed via URL params)
    MOODLE_QUESTION_ID: null,
    MOODLE_USER_ID: null,
    MOODLE_COURSE_ID: null,

    // Animation Settings
    ANIMATION: {
        DEFAULT_DURATION: 1000, // milliseconds
        FPS: 60,
        EASING: 'ease-in-out'
    },

    // Canvas Settings
    CANVAS: {
        WIDTH: 300,
        HEIGHT: 300,
        BACKGROUND_COLOR: '#ffffff',
        DEFAULT_SHAPE_COLOR: '#667eea',
        HIGHLIGHT_COLOR: '#ff6b6b',
        EDGE_COLOR: '#4ecdc4'
    },

    // Debug Mode
    DEBUG: true,

    // Language
    LANGUAGE: 'ko' // 'ko' or 'en'
};

/**
 * Get URL parameters
 */
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        questionId: params.get('question_id'),
        userId: params.get('user_id'),
        courseId: params.get('course_id'),
        shapeId: params.get('shape_id')
    };
}

/**
 * Initialize configuration with URL parameters
 */
function initConfig() {
    const params = getUrlParams();

    CONFIG.MOODLE_QUESTION_ID = params.questionId;
    CONFIG.MOODLE_USER_ID = params.userId;
    CONFIG.MOODLE_COURSE_ID = params.courseId;

    // If in debug mode, use test values
    if (CONFIG.DEBUG && !CONFIG.MOODLE_QUESTION_ID) {
        CONFIG.MOODLE_QUESTION_ID = 1;
        CONFIG.MOODLE_USER_ID = 1;
        CONFIG.MOODLE_COURSE_ID = 1;
    }

    return CONFIG;
}

/**
 * Debug logger
 */
function debug(...args) {
    if (CONFIG.DEBUG) {
        console.log('[ShapeExplainer]', ...args);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initConfig();
    debug('Configuration initialized:', CONFIG);
});
