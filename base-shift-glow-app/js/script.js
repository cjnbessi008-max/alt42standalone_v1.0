/**
 * Base Shift Glow - Main JavaScript
 * LMS Integration & Dynamic Glow Effect Controller
 */

// ========================================
// Configuration & State
// ========================================

const CONFIG = {
    BASE_COLORS: {
        2: { primary: '#FF3B30', glow: 'rgba(255, 59, 48, 0.8)', name: 'Binary' },
        8: { primary: '#FF9500', glow: 'rgba(255, 149, 0, 0.8)', name: 'Octal' },
        10: { primary: '#4CAF50', glow: 'rgba(76, 175, 80, 0.8)', name: 'Decimal' },
        16: { primary: '#007AFF', glow: 'rgba(0, 122, 255, 0.8)', name: 'Hexadecimal' }
    },
    PARTICLE_COUNT: 20,
    ANIMATION_DURATION: 1200
};

const state = {
    currentBase: 10,
    currentProblem: null,
    particles: []
};

// ========================================
// DOM Elements
// ========================================

const elements = {
    baseSelector: document.getElementById('baseSelector'),
    problemType: document.getElementById('problemType'),
    difficulty: document.getElementById('difficulty'),
    difficultyValue: document.getElementById('difficultyValue'),
    loadProblemBtn: document.getElementById('loadProblem'),
    currentBase: document.getElementById('currentBase'),
    currentProblem: document.getElementById('currentProblem'),
    connectionStatus: document.getElementById('connectionStatus'),
    baseGlow: document.getElementById('baseGlow'),
    mobileProblem: document.getElementById('mobileProblem'),
    particleSystem: document.getElementById('particleSystem'),
    debugBase: document.getElementById('debugBase'),
    debugColor: document.getElementById('debugColor'),
    debugIntensity: document.getElementById('debugIntensity')
};

// ========================================
// LMS Data Simulator (Moodle 연동 시뮬레이션)
// ========================================

class LMSSimulator {
    constructor() {
        this.problems = {
            2: {
                basic: [
                    '1010 + 1101 = ?',
                    '10011 - 1010 = ?',
                    '1001 × 10 = ?'
                ],
                conversion: [
                    '2진법 1101을 10진법으로 변환하세요',
                    '10진법 25를 2진법으로 변환하세요'
                ],
                advanced: [
                    '1011 AND 1101의 결과는?',
                    '보수를 이용한 뺄셈: 1000 - 11 = ?'
                ]
            },
            8: {
                basic: [
                    '37 + 45 = ? (8진법)',
                    '72 - 35 = ? (8진법)',
                    '23 × 4 = ? (8진법)'
                ],
                conversion: [
                    '8진법 567을 10진법으로 변환하세요',
                    '10진법 100을 8진법으로 변환하세요'
                ],
                advanced: [
                    '8진법에서 1000까지 세려면 몇 개의 숫자가 필요한가?',
                    '8진법 567.3을 2진법으로 변환하세요'
                ]
            },
            10: {
                basic: [
                    '25 + 37 = ?',
                    '84 - 29 = ?',
                    '12 × 8 = ?'
                ],
                conversion: [
                    '분수 3/4를 소수로 변환하세요',
                    '0.625를 분수로 변환하세요'
                ],
                advanced: [
                    '√144의 값은?',
                    '2³ + 3² - 4 = ?'
                ]
            },
            16: {
                basic: [
                    '1A + 2B = ? (16진법)',
                    'FF - 3C = ? (16진법)',
                    '10 × F = ? (16진법)'
                ],
                conversion: [
                    '16진법 A5를 10진법으로 변환하세요',
                    '10진법 255를 16진법으로 변환하세요'
                ],
                advanced: [
                    'RGB(255, 128, 64)를 16진법으로 표현하세요',
                    '16진법 CAFE를 2진법으로 변환하세요'
                ]
            }
        };
    }

    /**
     * LMS에서 문제를 가져오는 것을 시뮬레이션
     */
    fetchProblem(base, type, difficulty) {
        return new Promise((resolve) => {
            // 실제 Moodle API 호출을 시뮬레이션 (지연 추가)
            setTimeout(() => {
                const problemSet = this.problems[base][type];
                const randomIndex = Math.floor(Math.random() * problemSet.length);
                const problem = problemSet[randomIndex];

                resolve({
                    success: true,
                    data: {
                        base: base,
                        type: type,
                        difficulty: difficulty,
                        question: problem,
                        timestamp: new Date().toISOString(),
                        source: 'Moodle 3.7 Quiz Module'
                    }
                });
            }, 500); // 네트워크 지연 시뮬레이션
        });
    }

    /**
     * LMS 연결 상태 확인
     */
    checkConnection() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    connected: true,
                    server: 'moodle.kaist.ac.kr',
                    version: '3.7',
                    latency: Math.floor(Math.random() * 50) + 20
                });
            }, 100);
        });
    }
}

const lmsSimulator = new LMSSimulator();

// ========================================
// Base Shift Glow Controller
// ========================================

class BaseShiftGlowController {
    constructor(glowElement) {
        this.glowElement = glowElement;
        this.currentBase = 10;
    }

    /**
     * 진법 변경 시 Glow 효과 업데이트
     */
    shiftToBase(newBase) {
        if (this.currentBase === newBase) return;

        console.log(`Shifting from base ${this.currentBase} to base ${newBase}`);

        // 1. 페이드 아웃
        this.glowElement.style.opacity = '0';
        this.glowElement.style.transform = 'scale(0.8)';

        setTimeout(() => {
            // 2. Base 속성 변경
            this.glowElement.setAttribute('data-base', newBase);
            this.currentBase = newBase;

            // 3. 중심 숫자 업데이트
            const baseNumber = this.glowElement.querySelector('.base-number');
            baseNumber.textContent = newBase;

            // 4. 페이드 인
            this.glowElement.style.opacity = '1';
            this.glowElement.style.transform = 'scale(1)';

            // 5. 파티클 생성
            this.generateParticles(newBase);

            // 6. 디버그 정보 업데이트
            this.updateDebugInfo(newBase);

        }, CONFIG.ANIMATION_DURATION / 2);
    }

    /**
     * 진법에 따른 파티클 생성
     */
    generateParticles(base) {
        // 기존 파티클 제거
        elements.particleSystem.innerHTML = '';

        const config = CONFIG.BASE_COLORS[base];
        const particleCount = CONFIG.PARTICLE_COUNT;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.background = config.primary;

            // 랜덤 위치와 애니메이션
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 80 + Math.random() * 40;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.animationDelay = `${Math.random() * 2}s`;

            elements.particleSystem.appendChild(particle);
        }
    }

    /**
     * 디버그 정보 업데이트
     */
    updateDebugInfo(base) {
        const config = CONFIG.BASE_COLORS[base];
        elements.debugBase.textContent = base;
        elements.debugColor.textContent = config.primary;
        elements.debugColor.style.color = config.primary;
        elements.debugIntensity.textContent = '100%';
    }

    /**
     * Glow 강도 조절 (난이도에 따라)
     */
    setIntensity(intensity) {
        // intensity: 0-1 사이 값
        const scale = 0.8 + (intensity * 0.4); // 0.8 ~ 1.2
        this.glowElement.style.transform = `scale(${scale})`;
        elements.debugIntensity.textContent = `${Math.round(intensity * 100)}%`;
    }
}

const glowController = new BaseShiftGlowController(elements.baseGlow);

// ========================================
// Event Handlers
// ========================================

/**
 * 진법 선택 변경
 */
elements.baseSelector.addEventListener('change', (e) => {
    const newBase = parseInt(e.target.value);
    state.currentBase = newBase;
    elements.currentBase.textContent = newBase;

    // Glow 효과 변경
    glowController.shiftToBase(newBase);
});

/**
 * 난이도 슬라이더 변경
 */
elements.difficulty.addEventListener('input', (e) => {
    const difficulty = parseInt(e.target.value);
    elements.difficultyValue.textContent = difficulty;

    // 난이도에 따라 Glow 강도 조절
    const intensity = difficulty / 5; // 1~5 -> 0.2~1.0
    glowController.setIntensity(intensity);
});

/**
 * 문제 불러오기 버튼
 */
elements.loadProblemBtn.addEventListener('click', async () => {
    elements.loadProblemBtn.disabled = true;
    elements.loadProblemBtn.textContent = '불러오는 중...';
    elements.connectionStatus.textContent = '연결 중...';
    elements.connectionStatus.className = 'status-connecting';

    try {
        // LMS 연결 확인
        const connection = await lmsSimulator.checkConnection();

        if (connection.connected) {
            elements.connectionStatus.textContent = `연결됨 (${connection.latency}ms)`;
            elements.connectionStatus.className = 'status-connected';

            // 문제 가져오기
            const response = await lmsSimulator.fetchProblem(
                state.currentBase,
                elements.problemType.value,
                parseInt(elements.difficulty.value)
            );

            if (response.success) {
                state.currentProblem = response.data;

                // UI 업데이트
                elements.currentProblem.textContent = response.data.question;
                elements.mobileProblem.textContent = response.data.question;

                // Glow 효과 강조 (문제 로드 시 펄스 효과)
                pulseGlowEffect();
            }
        }
    } catch (error) {
        console.error('LMS 연결 오류:', error);
        elements.connectionStatus.textContent = '연결 실패';
        elements.connectionStatus.className = 'status-disconnected';
    } finally {
        elements.loadProblemBtn.disabled = false;
        elements.loadProblemBtn.textContent = '문제 불러오기';
    }
});

/**
 * 문제 로드 시 Glow 펄스 효과
 */
function pulseGlowEffect() {
    elements.baseGlow.style.transition = 'transform 0.3s ease-in-out';
    elements.baseGlow.style.transform = 'scale(1.2)';

    setTimeout(() => {
        elements.baseGlow.style.transform = 'scale(1)';
    }, 300);
}

// ========================================
// 초기화
// ========================================

function initialize() {
    console.log('🎓 Base Shift Glow - LMS Integration Demo');
    console.log('Initializing...');

    // 초기 Glow 효과 설정
    glowController.shiftToBase(state.currentBase);

    // LMS 연결 확인
    lmsSimulator.checkConnection().then((connection) => {
        if (connection.connected) {
            console.log(`✅ LMS Connected: ${connection.server} v${connection.version}`);
            elements.connectionStatus.textContent = `연결됨 (${connection.latency}ms)`;
        }
    });

    // 환영 애니메이션
    setTimeout(() => {
        elements.baseGlow.style.opacity = '1';
        elements.baseGlow.style.transform = 'scale(1)';
    }, 100);

    console.log('✅ Initialization complete');
}

// ========================================
// 추가 유틸리티 함수
// ========================================

/**
 * 진법 변환 유틸리티
 */
const BaseConverter = {
    toDecimal: (value, fromBase) => {
        return parseInt(value, fromBase);
    },
    fromDecimal: (value, toBase) => {
        return value.toString(toBase).toUpperCase();
    },
    convert: (value, fromBase, toBase) => {
        const decimal = BaseConverter.toDecimal(value, fromBase);
        return BaseConverter.fromDecimal(decimal, toBase);
    }
};

/**
 * 키보드 단축키
 */
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + 숫자키로 진법 빠른 전환
    if ((e.ctrlKey || e.metaKey) && !isNaN(e.key)) {
        const shortcuts = {
            '1': 2,  // Ctrl+1 -> Base 2
            '2': 8,  // Ctrl+2 -> Base 8
            '3': 10, // Ctrl+3 -> Base 10
            '4': 16  // Ctrl+4 -> Base 16
        };

        if (shortcuts[e.key]) {
            e.preventDefault();
            elements.baseSelector.value = shortcuts[e.key];
            elements.baseSelector.dispatchEvent(new Event('change'));
        }
    }

    // Space 키로 문제 불러오기
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        elements.loadProblemBtn.click();
    }
});

// ========================================
// 앱 시작
// ========================================

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// 개발자 도구용 전역 API
window.BaseShiftGlow = {
    controller: glowController,
    lms: lmsSimulator,
    state: state,
    utils: BaseConverter,
    shiftTo: (base) => {
        elements.baseSelector.value = base;
        elements.baseSelector.dispatchEvent(new Event('change'));
    },
    loadProblem: () => elements.loadProblemBtn.click(),
    getInfo: () => {
        console.log('Current State:', state);
        console.log('Base:', state.currentBase);
        console.log('Problem:', state.currentProblem);
    }
};

console.log('💡 Tip: 콘솔에서 window.BaseShiftGlow를 사용하여 API에 접근할 수 있습니다.');
console.log('예시: BaseShiftGlow.shiftTo(16) - 16진법으로 전환');
