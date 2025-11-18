/**
 * Number Memory Pulse - Configuration
 * Game constants and settings
 */

const NMP_CONFIG = {
    // API Configuration
    API_BASE_URL: '/mod/numbermemorypulse/php/api.php',

    // Game Settings
    DIFFICULTY_LEVELS: {
        EASY: 1,
        MEDIUM: 2,
        HARD: 3,
        EXPERT: 4,
        MASTER: 5
    },

    // Display durations (ms) per difficulty
    DISPLAY_DURATIONS: {
        1: 1500, // Easy
        2: 1200, // Medium
        3: 1000, // Hard
        4: 800,  // Expert
        5: 600   // Master
    },

    // Points per difficulty
    POINTS: {
        1: 10,   // Easy
        2: 15,   // Medium
        3: 20,   // Hard
        4: 30,   // Expert
        5: 50    // Master
    },

    // Level thresholds
    LEVEL_THRESHOLDS: {
        1: 0,    // Level 1 starts at 0
        2: 50,   // Level 2 at 50 points
        3: 150,  // Level 3 at 150 points
        4: 300,  // Level 4 at 300 points
        5: 500   // Level 5 at 500 points
    },

    // Animation durations (ms)
    ANIMATIONS: {
        SCREEN_TRANSITION: 300,
        NUMBER_DISPLAY: 500,
        RESULT_DISPLAY: 600,
        COUNTDOWN: 1000
    },

    // UI Settings
    UI: {
        MAX_INPUT_LENGTH: 10,
        COUNTDOWN_FROM: 3,
        SHOW_PATTERN_DELAY: 1000,
        INTER_NUMBER_DELAY: 200
    },

    // Sound effects (if enabled)
    SOUNDS: {
        CORRECT: 'assets/sounds/correct.mp3',
        INCORRECT: 'assets/sounds/incorrect.mp3',
        NUMBER_BEEP: 'assets/sounds/beep.mp3',
        LEVEL_UP: 'assets/sounds/levelup.mp3'
    },

    // Error messages
    MESSAGES: {
        NO_CONNECTION: '서버에 연결할 수 없습니다.',
        NO_PROBLEMS: '이 난이도의 문제가 없습니다.',
        SUBMIT_ERROR: '답안 제출에 실패했습니다.',
        GENERIC_ERROR: '오류가 발생했습니다. 다시 시도해주세요.'
    }
};

// Difficulty labels (Korean)
const DIFFICULTY_LABELS = {
    1: '쉬움',
    2: '보통',
    3: '어려움',
    4: '전문가',
    5: '마스터'
};

// Level labels
const LEVEL_LABELS = {
    1: '초보자',
    2: '중급자',
    3: '숙련자',
    4: '전문가',
    5: '마스터'
};

// Game state constants
const GAME_STATE = {
    IDLE: 'idle',
    LOADING: 'loading',
    READY: 'ready',
    SHOWING_PATTERN: 'showing_pattern',
    WAITING_INPUT: 'waiting_input',
    CHECKING_ANSWER: 'checking_answer',
    SHOWING_RESULT: 'showing_result'
};

// Screen constants
const SCREEN = {
    WELCOME: 'welcome-screen',
    PATTERN: 'pattern-screen',
    INPUT: 'input-screen',
    RESULT: 'result-screen'
};

// Utility functions
const NMP_UTILS = {
    /**
     * Format time in seconds to MM:SS
     */
    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Format large numbers with commas
     */
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * Get current timestamp
     */
    getTimestamp: function() {
        return Math.floor(Date.now() / 1000);
    },

    /**
     * Get current time for status bar (HH:MM)
     */
    getCurrentTime: function() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${mins}`;
    },

    /**
     * Play sound effect
     */
    playSound: function(soundKey) {
        if (!NMP_CONFIG.SOUNDS[soundKey]) return;

        try {
            const audio = new Audio(NMP_CONFIG.SOUNDS[soundKey]);
            audio.volume = 0.5;
            audio.play().catch(err => {
                console.warn('Sound play failed:', err);
            });
        } catch (err) {
            console.warn('Sound not available:', err);
        }
    },

    /**
     * Show toast notification
     */
    showToast: function(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Could implement actual toast UI here
    },

    /**
     * Vibrate device (if supported)
     */
    vibrate: function(duration = 100) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    },

    /**
     * Shuffle array
     */
    shuffleArray: function(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    /**
     * Sleep/delay function
     */
    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NMP_CONFIG, DIFFICULTY_LABELS, LEVEL_LABELS, GAME_STATE, SCREEN, NMP_UTILS };
}
