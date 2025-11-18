/**
 * Configuration
 */

const CONFIG = {
    // API Base URL - adjust based on your deployment
    API_BASE_URL: window.location.hostname === 'localhost'
        ? 'http://localhost/step-simplifier/backend/api'
        : '/step-simplifier/backend/api',

    // Moodle Integration
    MOODLE_INTEGRATION: true,

    // Default User (for testing without Moodle)
    DEFAULT_USER: {
        id: 1,
        moodle_user_id: 1,
        username: 'student',
        email: 'student@example.com'
    },

    // Default Problem ID (for testing)
    DEFAULT_PROBLEM_ID: 1,

    // Animation Delays
    ANIMATION_DELAY: 300,
    FEEDBACK_DISPLAY_TIME: 3000,

    // Debug Mode
    DEBUG: true
};

// Logger utility
const logger = {
    log: (...args) => {
        if (CONFIG.DEBUG) {
            console.log('[Step Simplifier]', ...args);
        }
    },
    error: (...args) => {
        console.error('[Step Simplifier ERROR]', ...args);
    },
    warn: (...args) => {
        if (CONFIG.DEBUG) {
            console.warn('[Step Simplifier WARN]', ...args);
        }
    }
};
