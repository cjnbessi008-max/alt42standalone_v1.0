/**
 * Configuration Settings
 */

const CONFIG = {
    // API endpoints
    API_BASE_URL: window.location.hostname === 'localhost'
        ? 'http://localhost/alt42standalone_v1.0/api'
        : '/api',

    // Canvas settings
    CANVAS: {
        WIDTH: 300,
        HEIGHT: 400,
        BACKGROUND_COLOR: '#ffffff',
        GRID_COLOR: '#f0f0f0',
        SHOW_GRID: false
    },

    // Animation settings
    ANIMATION: {
        DURATION: 1000, // milliseconds
        EASING: 'easeInOutQuad',
        FPS: 60
    },

    // Shape settings
    SHAPES: {
        DEFAULT_SIZE: 100,
        DEFAULT_COLOR: '#3498db',
        STROKE_WIDTH: 2,
        STROKE_COLOR: '#2c3e50'
    },

    // Interaction settings
    INTERACTION: {
        TOUCH_THRESHOLD: 10, // pixels
        DOUBLE_TAP_DELAY: 300, // milliseconds
        LONG_PRESS_DELAY: 500 // milliseconds
    },

    // Moodle integration
    MOODLE: {
        ENABLED: true,
        AUTO_SYNC: true,
        SYNC_INTERVAL: 60000 // 1 minute
    },

    // Debug mode
    DEBUG: true
};

// Easing functions for animations
const EASING = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },
    easeOutElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
};

// Utility functions
const Utils = {
    /**
     * Log message if debug mode is enabled
     */
    log: (...args) => {
        if (CONFIG.DEBUG) {
            console.log('[Shape Transformer]', ...args);
        }
    },

    /**
     * Log error
     */
    error: (...args) => {
        console.error('[Shape Transformer Error]', ...args);
    },

    /**
     * Get URL parameters
     */
    getUrlParam: (name) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    /**
     * Generate unique ID
     */
    generateId: () => {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Deep clone object
     */
    clone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Calculate distance between two points
     */
    distance: (x1, y1, x2, y2) => {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },

    /**
     * Convert degrees to radians
     */
    degToRad: (degrees) => {
        return degrees * (Math.PI / 180);
    },

    /**
     * Convert radians to degrees
     */
    radToDeg: (radians) => {
        return radians * (180 / Math.PI);
    },

    /**
     * Format number with fixed decimals
     */
    formatNumber: (num, decimals = 2) => {
        return Number(num).toFixed(decimals);
    }
};
