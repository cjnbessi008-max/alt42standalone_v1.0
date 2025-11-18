/**
 * Angle Live - Configuration
 */

const CONFIG = {
    // API Configuration
    API_BASE_URL: window.location.origin + '/angle-live/backend/api.php',

    // Session Configuration
    SESSION_ID: 'angle-live-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    USER_ID: 1, // Default user ID, should be set from Moodle

    // Moodle Configuration
    MOODLE_COURSE_ID: null,
    MOODLE_USER_ID: null,

    // Application Settings
    AUTO_SAVE: true,
    AUTO_SAVE_INTERVAL: 3000, // 3 seconds
    SYNC_MOODLE_INTERVAL: 30000, // 30 seconds

    // Canvas Settings
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

    // Color Mapping
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

    // Debug Mode
    DEBUG: true
};

// Utility Functions
const Utils = {
    /**
     * Log message if debug mode is enabled
     */
    log: function(message, data = null) {
        if (CONFIG.DEBUG) {
            console.log('[Angle Live]', message, data || '');
        }
    },

    /**
     * Show error message
     */
    error: function(message, error = null) {
        console.error('[Angle Live Error]', message, error || '');
        // Could show user-friendly error dialog here
    },

    /**
     * Get URL parameter
     */
    getUrlParameter: function(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    /**
     * Parse Moodle parameters from URL
     */
    parseMoodleParams: function() {
        const courseId = this.getUrlParameter('course_id');
        const userId = this.getUrlParameter('user_id');

        if (courseId) {
            CONFIG.MOODLE_COURSE_ID = parseInt(courseId);
        }
        if (userId) {
            CONFIG.MOODLE_USER_ID = parseInt(userId);
            CONFIG.USER_ID = parseInt(userId);
        }

        this.log('Moodle params parsed', {
            courseId: CONFIG.MOODLE_COURSE_ID,
            userId: CONFIG.MOODLE_USER_ID
        });
    },

    /**
     * Show loading indicator
     */
    showLoading: function() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = 'flex';
        }
    },

    /**
     * Hide loading indicator
     */
    hideLoading: function() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = 'none';
        }
    },

    /**
     * Format number with decimals
     */
    formatNumber: function(num, decimals = 2) {
        return parseFloat(num).toFixed(decimals);
    }
};

// Initialize Moodle parameters on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        Utils.parseMoodleParams();
    });
} else {
    Utils.parseMoodleParams();
}
