/**
 * Configuration and Constants
 */

const CONFIG = {
    // API Configuration
    API_BASE_URL: window.location.origin + '/php/api.php',

    // Canvas Settings
    CANVAS_WIDTH: 340,
    CANVAS_HEIGHT: 450,

    // Moodle Integration (to be set dynamically)
    MOODLE_USER_ID: null,
    MOODLE_COURSE_ID: null,

    // App Settings
    AREA_TOLERANCE: 0.05, // 5% tolerance
    MAX_ATTEMPTS: 5,
    MIN_PIECE_SIZE: 100, // Minimum area for a torn piece

    // Colors
    COLORS: {
        primary: '#3498db',
        secondary: '#2ecc71',
        danger: '#e74c3c',
        warning: '#f39c12',
        dark: '#2c3e50',
        light: '#ecf0f1',
        shapes: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6']
    },

    // Drawing Settings
    LINE_WIDTH: 2,
    POINT_RADIUS: 6,
    CUT_LINE_COLOR: '#e74c3c',
    CUT_LINE_WIDTH: 3,
    SELECTED_PIECE_ALPHA: 0.8,
    UNSELECTED_PIECE_ALPHA: 0.5,

    // Touch/Mouse Settings
    TOUCH_TOLERANCE: 10,
    DOUBLE_TAP_DELAY: 300,

    // Animation
    ANIMATION_DURATION: 300,

    // Achievements
    ACHIEVEMENTS: {
        first_shape: {
            name: '첫 도형',
            icon: '🎯',
            description: '첫 도형 완성'
        },
        shape_master: {
            name: '도형 마스터',
            icon: '🏆',
            description: '10개 도형 완성'
        },
        perfect_score: {
            name: '완벽한 점수',
            icon: '💯',
            description: '100점 획득'
        },
        difficulty_champion: {
            name: '난이도 챔피언',
            icon: '⭐',
            description: '난이도 3 완성'
        },
        speed_demon: {
            name: '스피드 데몬',
            icon: '⚡',
            description: '60초 이내 완성'
        }
    }
};

/**
 * Initialize Moodle integration
 * Gets user_id and course_id from URL parameters or Moodle context
 */
function initMoodleIntegration() {
    // Try to get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id') || urlParams.get('userid');
    const courseId = urlParams.get('course_id') || urlParams.get('courseid');

    if (userId && courseId) {
        CONFIG.MOODLE_USER_ID = parseInt(userId);
        CONFIG.MOODLE_COURSE_ID = parseInt(courseId);
        console.log('Moodle integration initialized:', {
            userId: CONFIG.MOODLE_USER_ID,
            courseId: CONFIG.MOODLE_COURSE_ID
        });
        return true;
    }

    // Try to get from Moodle's global M object (if embedded in Moodle)
    if (typeof M !== 'undefined' && M.cfg && M.cfg.sesskey) {
        // Moodle context available
        console.log('Moodle context detected');
        // Additional Moodle integration code can go here
    }

    // For development/testing, use default values
    if (!CONFIG.MOODLE_USER_ID) {
        console.warn('Moodle user not found, using demo mode');
        CONFIG.MOODLE_USER_ID = 1; // Demo user
        CONFIG.MOODLE_COURSE_ID = 1; // Demo course
    }

    return false;
}

/**
 * Get Moodle user context
 */
function getMoodleContext() {
    return {
        user_id: CONFIG.MOODLE_USER_ID,
        course_id: CONFIG.MOODLE_COURSE_ID
    };
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    initMoodleIntegration();
});
