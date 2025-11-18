/**
 * Operation Trail 설정 파일
 * Moodle 연동 및 앱 설정
 */

const CONFIG = {
    // Moodle 연동 설정
    moodle: {
        url: 'http://localhost/moodle',  // Moodle 설치 경로
        wsToken: '',  // Web Service Token (설정 필요)
        wsFunction: 'mod_quiz_get_attempt_data',  // 사용할 Moodle 함수
        apiEndpoint: '/api/moodle-connector.php'  // 로컬 API 엔드포인트
    },

    // MySQL 데이터베이스 설정 (서버측에서 사용)
    database: {
        host: 'localhost',
        port: 3306,
        database: 'moodle',
        charset: 'utf8mb4'
    },

    // Operation Trail 시각화 설정
    operationTrail: {
        canvasWidth: 360,
        canvasHeight: 640,
        animationSpeed: 1000,  // ms
        sparkCount: 20,  // 불꽃 파티클 개수
        sparkColors: ['#fbbf24', '#f59e0b', '#ef4444', '#ec4899', '#a855f7'],
        nodeRadius: 40,
        lineWidth: 3,
        lineColor: '#3b82f6'
    },

    // 애니메이션 설정
    animation: {
        enabled: true,
        stepDelay: 800,  // 각 단계 사이 딜레이 (ms)
        sparkDuration: 1000,  // 불꽃 효과 지속 시간 (ms)
        fadeInDuration: 500,  // 페이드인 지속 시간 (ms)
        highlightDuration: 1500  // 하이라이트 지속 시간 (ms)
    },

    // 디버그 모드
    debug: true
};

// 디버그 로깅 함수
function debugLog(...args) {
    if (CONFIG.debug) {
        console.log('[Operation Trail]', ...args);
    }
}

// 에러 로깅 함수
function errorLog(...args) {
    console.error('[Operation Trail Error]', ...args);
}

// 샘플 문제 데이터 (Moodle 연결 전 테스트용)
const SAMPLE_PROBLEMS = [
    {
        id: 1,
        type: 'arithmetic',
        question: '다음 식을 계산하세요: 45 + 23 - 8',
        expression: '45 + 23 - 8',
        steps: [
            { operation: '덧셈', expression: '45 + 23', result: 68 },
            { operation: '뺄셈', expression: '68 - 8', result: 60 }
        ],
        answer: 60
    },
    {
        id: 2,
        type: 'arithmetic',
        question: '다음 식을 계산하세요: 12 × 5 + 18 ÷ 3',
        expression: '12 × 5 + 18 ÷ 3',
        steps: [
            { operation: '곱셈', expression: '12 × 5', result: 60 },
            { operation: '나눗셈', expression: '18 ÷ 3', result: 6 },
            { operation: '덧셈', expression: '60 + 6', result: 66 }
        ],
        answer: 66
    },
    {
        id: 3,
        type: 'arithmetic',
        question: '다음 식을 계산하세요: (15 + 9) × 2 - 10',
        expression: '(15 + 9) × 2 - 10',
        steps: [
            { operation: '괄호 안 덧셈', expression: '15 + 9', result: 24 },
            { operation: '곱셈', expression: '24 × 2', result: 48 },
            { operation: '뺄셈', expression: '48 - 10', result: 38 }
        ],
        answer: 38
    },
    {
        id: 4,
        type: 'arithmetic',
        question: '다음 식을 계산하세요: 100 - 25 × 2 + 10 ÷ 2',
        expression: '100 - 25 × 2 + 10 ÷ 2',
        steps: [
            { operation: '곱셈', expression: '25 × 2', result: 50 },
            { operation: '나눗셈', expression: '10 ÷ 2', result: 5 },
            { operation: '뺄셈', expression: '100 - 50', result: 50 },
            { operation: '덧셈', expression: '50 + 5', result: 55 }
        ],
        answer: 55
    }
];
