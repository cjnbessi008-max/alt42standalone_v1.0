/**
 * Color Union Module Configuration
 * LMS Integration Settings for Moodle 3.7
 */

const CONFIG = {
    // Moodle Integration
    moodle: {
        baseUrl: '/moodle', // Adjust based on your Moodle installation
        apiEndpoint: '/webservice/rest/server.php',
        wstoken: '', // Will be set dynamically from PHP session
        moodlewsrestformat: 'json'
    },

    // MySQL Database
    database: {
        host: 'localhost',
        port: 3306,
        database: 'color_union_db',
        charset: 'utf8mb4'
    },

    // Color Palettes for Sets
    colors: {
        primary: [
            '#FF6B6B', // Red
            '#4ECDC4', // Teal
            '#45B7D1', // Blue
            '#FFA07A', // Light Salmon
            '#98D8C8', // Mint
            '#F7DC6F', // Yellow
            '#BB8FCE', // Purple
            '#85C1E2'  // Sky Blue
        ],
        blend: function(color1, color2) {
            // Blend two hex colors
            const c1 = this.hexToRgb(color1);
            const c2 = this.hexToRgb(color2);

            const r = Math.round((c1.r + c2.r) / 2);
            const g = Math.round((c1.g + c2.g) / 2);
            const b = Math.round((c1.b + c2.b) / 2);

            return this.rgbToHex(r, g, b);
        },
        hexToRgb: function(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        rgbToHex: function(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
    },

    // Problem Settings
    problems: {
        totalProblems: 10,
        elementRange: {
            min: 2,
            max: 8
        },
        valueRange: {
            min: 1,
            max: 20
        },
        timerEnabled: true,
        timeLimit: 300 // seconds per problem
    },

    // Animation Settings
    animation: {
        blendDuration: 2000,    // milliseconds
        expandDuration: 1000,   // milliseconds
        particleCount: 20,
        transitionDelay: 300    // milliseconds
    },

    // Scoring
    scoring: {
        correctAnswer: 10,
        incorrectAnswer: -2,
        timeBonus: true,
        timeBonusMultiplier: 0.1
    },

    // UI Text (Korean)
    text: {
        ko: {
            problemPrefix: '문제',
            showUnion: '합집합 보기',
            reset: '초기화',
            nextProblem: '다음 문제',
            checkAnswer: '확인',
            correct: '정답입니다! 🎉',
            incorrect: '틀렸습니다. 다시 생각해보세요.',
            completed: '모든 문제를 완료했습니다!',
            setA: '집합 A',
            setB: '집합 B',
            union: 'A ∪ B',
            elementCount: '합집합의 원소 개수:'
        },
        en: {
            problemPrefix: 'Problem',
            showUnion: 'Show Union',
            reset: 'Reset',
            nextProblem: 'Next Problem',
            checkAnswer: 'Check',
            correct: 'Correct! 🎉',
            incorrect: 'Try again!',
            completed: 'All problems completed!',
            setA: 'Set A',
            setB: 'Set B',
            union: 'A ∪ B',
            elementCount: 'Number of elements in union:'
        }
    },

    // Get current language text
    getText: function(lang = 'ko') {
        return this.text[lang] || this.text.ko;
    }
};

// Make CONFIG globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
