// Absolute Mirror - Configuration

const CONFIG = {
    // Moodle LMS Integration Settings
    moodle: {
        baseUrl: '/api', // API endpoint base URL
        // For production, use your Moodle server URL
        // baseUrl: 'https://your-moodle-server.com/api',
        endpoints: {
            getProblems: '/problems.php',
            getProblem: '/problem.php',
            submitAnswer: '/submit.php',
            getProgress: '/progress.php'
        },
        // Moodle authentication token (set via backend session)
        token: null
    },

    // MySQL Database Settings (used by backend)
    database: {
        host: 'localhost',
        port: 3306,
        database: 'absolute_mirror',
        // Credentials should be in backend config, not exposed here
    },

    // Visualization Settings
    visualization: {
        // Mirror tunnel effect parameters
        tunnelDepth: 20,              // Number of mirror reflections
        animationFPS: 60,              // Frames per second
        defaultEquation: {
            type: 'absolute',          // absolute, linear, quadratic
            expression: '|x - 3| = 5', // Default equation
            leftBound: -10,            // Left x boundary
            rightBound: 10,            // Right x boundary
            axis: 3,                   // Axis of symmetry
            target: 5                  // Target value
        },
        colors: {
            primary: '#4A90E2',
            secondary: '#7B68EE',
            mirror: '#f093fb',
            grid: '#444',
            axis: '#ff6b6b',
            highlight: '#ffd93d'
        },
        effects: {
            enableGlow: true,
            enableParticles: true,
            enableTrails: true,
            perspective: true
        }
    },

    // UI Settings
    ui: {
        showDebugInfo: false,         // Show debug information
        autoLoadProblem: true,        // Auto-load problem on start
        animateTransitions: true,     // Animate UI transitions
        language: 'ko'                // 'ko' for Korean, 'en' for English
    },

    // Localization
    i18n: {
        ko: {
            loadingProblem: '문제를 불러오는 중...',
            newProblem: '새 문제 불러오기',
            showSolution: '해설 보기',
            hideSolution: '해설 숨기기',
            resetView: '뷰 초기화',
            leftValue: '좌측 값',
            rightValue: '우측 값',
            mirrorAxis: '대칭축',
            xValue: 'x 값 조절',
            animationSpeed: '애니메이션 속도',
            errorLoadingProblem: '문제를 불러오는 중 오류가 발생했습니다.',
            solutionTitle: '해설',
            problemTitle: '절댓값 방정식 문제'
        },
        en: {
            loadingProblem: 'Loading problem...',
            newProblem: 'Load New Problem',
            showSolution: 'Show Solution',
            hideSolution: 'Hide Solution',
            resetView: 'Reset View',
            leftValue: 'Left Value',
            rightValue: 'Right Value',
            mirrorAxis: 'Mirror Axis',
            xValue: 'Adjust x value',
            animationSpeed: 'Animation Speed',
            errorLoadingProblem: 'Error loading problem.',
            solutionTitle: 'Solution',
            problemTitle: 'Absolute Value Equation Problem'
        }
    },

    // Demo Mode (when not connected to Moodle)
    demo: {
        enabled: true,                // Enable demo mode with sample problems
        problems: [
            {
                id: 1,
                title: '기본 절댓값 방정식',
                description: '|x - 3| = 5를 풀어보세요. 대칭축을 기준으로 양쪽으로 5만큼 떨어진 값을 찾아야 합니다.',
                equation: '|x - 3| = 5',
                axis: 3,
                target: 5,
                solutions: [8, -2],
                explanation: '절댓값 방정식 |x - 3| = 5는 두 개의 해를 가집니다.\n\n경우 1: x - 3 = 5 → x = 8\n경우 2: x - 3 = -5 → x = -2\n\n미러 터널에서 대칭축 x=3을 기준으로 양쪽으로 5만큼 떨어진 점이 해입니다.'
            },
            {
                id: 2,
                title: '절댓값 방정식 - 작은 값',
                description: '|x + 2| = 3을 풀어보세요.',
                equation: '|x + 2| = 3',
                axis: -2,
                target: 3,
                solutions: [1, -5],
                explanation: '절댓값 방정식 |x + 2| = 3은 |x - (-2)| = 3으로 쓸 수 있습니다.\n\n경우 1: x + 2 = 3 → x = 1\n경우 2: x + 2 = -3 → x = -5\n\n대칭축은 x = -2입니다.'
            },
            {
                id: 3,
                title: '절댓값 방정식 - 정수 해',
                description: '|x| = 7을 풀어보세요.',
                equation: '|x| = 7',
                axis: 0,
                target: 7,
                solutions: [7, -7],
                explanation: '가장 기본적인 절댓값 방정식입니다.\n\n경우 1: x = 7\n경우 2: x = -7\n\n대칭축은 원점(x = 0)입니다.'
            },
            {
                id: 4,
                title: '절댓값 방정식 - 큰 값',
                description: '|x - 5| = 10을 풀어보세요.',
                equation: '|x - 5| = 10',
                axis: 5,
                target: 10,
                solutions: [15, -5],
                explanation: '절댓값 방정식 |x - 5| = 10의 해를 구합니다.\n\n경우 1: x - 5 = 10 → x = 15\n경우 2: x - 5 = -10 → x = -5\n\n대칭축 x=5를 기준으로 양쪽으로 10만큼 떨어진 점입니다.'
            }
        ]
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
