/**
 * Number Beat Configuration
 */

const CONFIG = {
    // API Endpoint
    API_URL: window.location.origin + '/api/game_api.php',

    // Rhythm Settings
    RHYTHM: {
        BPM: 120, // Beats per minute
        TOLERANCE: 200, // Milliseconds tolerance for rhythm accuracy
        BEAT_DURATION: {
            'whole': 2000,
            'half': 1000,
            'quarter': 500,
            'eighth': 250
        }
    },

    // Scoring
    SCORING: {
        BASE: {
            easy: 100,
            medium: 150,
            hard: 200
        },
        TIME_BONUS_MULTIPLIER: 1.5,
        RHYTHM_BONUS_MULTIPLIER: 1.2,
        MIN_ACCURACY_FOR_BONUS: 90
    },

    // Game Settings
    GAME: {
        DEFAULT_TIME_LIMIT: 60,
        MIN_NUMBERS: 3,
        MAX_NUMBERS: 8
    },

    // Audio Settings
    AUDIO: {
        ENABLED: true,
        VOLUME: 0.5
    }
};
