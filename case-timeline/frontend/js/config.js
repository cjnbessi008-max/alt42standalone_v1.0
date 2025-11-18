/**
 * Configuration File
 * API endpoints and global settings
 */

const CONFIG = {
    // API base URL - adjust this to your server
    API_BASE_URL: 'http://localhost/case-timeline/backend/api',

    // API endpoints
    API_ENDPOINTS: {
        GET_CASES: '/get_cases.php',
        GET_CASE: '/get_case.php',
        PROGRESS: '/progress.php'
    },

    // Default settings
    DEFAULT_CASE_ID: 1,
    DEFAULT_USER_ID: 1,
    DEFAULT_COURSE_ID: 1,

    // Animation settings
    ANIMATION_DURATION: 300,

    // Local storage keys
    STORAGE_KEYS: {
        CURRENT_CASE: 'ct_current_case',
        USER_ID: 'ct_user_id',
        PROGRESS_ID: 'ct_progress_id'
    }
};

/**
 * Utility function to get URL parameter
 */
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/**
 * Get case ID from URL or use default
 */
function getCaseId() {
    return parseInt(getUrlParameter('case_id')) || CONFIG.DEFAULT_CASE_ID;
}

/**
 * Get user ID from URL, local storage, or use default
 */
function getUserId() {
    return parseInt(getUrlParameter('user_id')) ||
           parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ID)) ||
           CONFIG.DEFAULT_USER_ID;
}

/**
 * Get course ID from URL or use default
 */
function getCourseId() {
    return parseInt(getUrlParameter('course_id')) || CONFIG.DEFAULT_COURSE_ID;
}

/**
 * Update current time in status bar
 */
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = `${hours}:${minutes}`;
    }
}

// Update time every minute
setInterval(updateTime, 60000);
updateTime();
