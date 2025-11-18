/**
 * Rule Door - Configuration
 */

const CONFIG = {
    // API Base URL
    API_BASE_URL: 'http://localhost/rule-door-app/api',

    // Moodle Configuration
    MOODLE_URL: 'http://localhost/moodle',

    // Default IDs for testing (should be replaced with actual session values)
    DEFAULT_QUIZ_ID: 1,
    DEFAULT_STUDENT_ID: 1,
    DEFAULT_COURSE_ID: 101,

    // Refresh intervals (in milliseconds)
    DOOR_STATE_REFRESH_INTERVAL: 5000, // 5 seconds
    STATISTICS_REFRESH_INTERVAL: 10000, // 10 seconds

    // Animation settings
    DOOR_ANIMATION_DURATION: 800, // milliseconds

    // Debug mode
    DEBUG: true
};

/**
 * Logger utility
 */
const Logger = {
    log: function(message, data = null) {
        if (CONFIG.DEBUG) {
            console.log(`[Rule Door] ${message}`, data || '');
        }
    },

    error: function(message, error = null) {
        console.error(`[Rule Door Error] ${message}`, error || '');
    },

    warn: function(message, data = null) {
        if (CONFIG.DEBUG) {
            console.warn(`[Rule Door Warning] ${message}`, data || '');
        }
    }
};

/**
 * Get query parameter from URL
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Initialize session data from URL or localStorage
 */
function initSession() {
    // Try to get from URL parameters first
    const quizId = getQueryParam('quiz_id') || localStorage.getItem('quiz_id') || CONFIG.DEFAULT_QUIZ_ID;
    const studentId = getQueryParam('student_id') || localStorage.getItem('student_id') || CONFIG.DEFAULT_STUDENT_ID;
    const courseId = getQueryParam('course_id') || localStorage.getItem('course_id') || CONFIG.DEFAULT_COURSE_ID;

    // Store in localStorage
    localStorage.setItem('quiz_id', quizId);
    localStorage.setItem('student_id', studentId);
    localStorage.setItem('course_id', courseId);

    return {
        quizId: parseInt(quizId),
        studentId: parseInt(studentId),
        courseId: parseInt(courseId)
    };
}

// Initialize session on load
const SESSION = initSession();
Logger.log('Session initialized', SESSION);
