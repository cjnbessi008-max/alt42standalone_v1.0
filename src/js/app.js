/**
 * Main Application - Root Glow 애플리케이션 초기화 및 제어
 */

// 전역 객체
let graphRenderer;
let phoneDisplay;
let glowManager;
let moodleIntegration;

// 현재 상태
let currentFunction = null;
let currentRoots = [];
let currentProblem = null;

/**
 * 애플리케이션 초기화
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Root Glow 시스템 초기화 중...');

    // 컴포넌트 초기화
    initializeComponents();

    // 이벤트 리스너 설정
    setupEventListeners();

    // LMS 연결 (선택적)
    await initializeLMS();

    // 초기 문제 로드
    loadInitialProblem();

    console.log('시스템 준비 완료!');
});

/**
 * 컴포넌트 초기화
 */
function initializeComponents() {
    // 그래프 렌더러
    graphRenderer = new GraphRenderer('main-graph', 600, 400);
    graphRenderer.startAnimation();

    // 스마트폰 디스플레이
    phoneDisplay = new SmartphoneDisplay();

    // Glow 효과 관리자
    glowManager = new GlowEffectsManager();

    // Moodle 연동
    moodleIntegration = new MoodleIntegration();

    console.log('✓ 컴포넌트 초기화 완료');
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 근 찾기 버튼
    const solveBtn = document.getElementById('solve-btn');
    if (solveBtn) {
        solveBtn.addEventListener('click', handleSolveClick);
    }

    // 함수 입력 (엔터 키)
    const functionInput = document.getElementById('function-input');
    if (functionInput) {
        functionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSolveClick();
            }
        });
    }

    // Glow 설정
    const glowIntensity = document.getElementById('glow-intensity');
    if (glowIntensity) {
        glowIntensity.addEventListener('input', (e) => {
            const intensity = parseInt(e.target.value);
            document.getElementById('intensity-value').textContent = intensity;
            updateGlowSettings();
        });
    }

    const glowColor = document.getElementById('glow-color');
    if (glowColor) {
        glowColor.addEventListener('input', updateGlowSettings);
    }

    const glowEnabled = document.getElementById('glow-enabled');
    if (glowEnabled) {
        glowEnabled.addEventListener('change', updateGlowSettings);
    }

    console.log('✓ 이벤트 리스너 설정 완료');
}

/**
 * LMS 초기화
 */
async function initializeLMS() {
    try {
        const connected = await moodleIntegration.initialize();

        if (connected) {
            console.log('✓ LMS 연결 성공');
            updateProblemInfo('LMS에 연결되었습니다.');
        } else {
            console.log('⚠ LMS 연결 실패 - 모의 데이터 사용');
            updateProblemInfo('LMS 연결 실패 - 모의 데이터로 작동합니다.');
        }
    } catch (error) {
        console.error('LMS 초기화 오류:', error);
        updateProblemInfo('LMS 연결 실패 - 독립 실행 모드');
    }
}

/**
 * 초기 문제 로드
 */
async function loadInitialProblem() {
    let problem;

    if (moodleIntegration.isReady()) {
        // LMS에서 문제 가져오기
        problem = await moodleIntegration.fetchProblem();
    }

    if (!problem) {
        // 모의 데이터 사용
        problem = moodleIntegration.getMockProblem();
    }

    if (problem) {
        loadProblem(problem);
    }
}

/**
 * 문제 로드
 */
function loadProblem(problem) {
    currentProblem = problem;

    // 문제 정보 표시
    updateProblemInfo(`
        <h3>${problem.title}</h3>
        <p><strong>문제 ID:</strong> ${problem.id}</p>
        <p><strong>난이도:</strong> ${problem.difficulty}</p>
        <p><strong>함수:</strong> <code>f(x) = ${problem.function}</code></p>
        <p>${problem.description}</p>
    `);

    // 함수 입력란에 자동 입력
    const functionInput = document.getElementById('function-input');
    if (functionInput) {
        functionInput.value = problem.function;
    }

    // 스마트폰에 표시
    phoneDisplay.displayProblem(problem);

    console.log('문제 로드:', problem);
}

/**
 * 근 찾기 버튼 클릭 처리
 */
async function handleSolveClick() {
    const functionInput = document.getElementById('function-input');
    const expression = functionInput.value.trim();

    if (!expression) {
        alert('함수를 입력해주세요!');
        return;
    }

    // 로딩 표시
    showLoading(true);
    phoneDisplay.showLoading('근을 계산하는 중...');

    // 약간의 지연 (UI 업데이트용)
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        // 함수 파싱
        const fn = MathUtils.parseFunction(expression);

        if (!fn) {
            throw new Error('함수를 파싱할 수 없습니다. 올바른 수식을 입력해주세요.');
        }

        // 근 찾기
        const roots = RootFinder.findAllRoots(fn, -10, 10, 0.3);

        // 결과 저장
        currentFunction = fn;
        currentRoots = roots;

        // 결과 표시
        displayResults(expression, roots);

        // 그래프 렌더링
        graphRenderer.render(fn, roots);

        // 스마트폰 업데이트
        phoneDisplay.update(
            currentProblem || { id: 'CUSTOM', function: expression, description: '사용자 정의 함수' },
            fn,
            roots
        );
        phoneDisplay.startAnimation(fn, roots);

        // 성공 메시지
        phoneDisplay.showSuccess(`${roots.length}개의 근을 찾았습니다!`);

        // LMS에 진행 상황 저장 (선택적)
        if (moodleIntegration.isReady() && currentProblem) {
            await moodleIntegration.saveProgress({
                problemId: currentProblem.id,
                roots: roots,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('근 찾기 오류:', error);
        alert('오류: ' + error.message);
        phoneDisplay.showError(error.message);
    } finally {
        showLoading(false);
    }
}

/**
 * 결과 표시
 */
function displayResults(expression, roots) {
    const rootsList = document.getElementById('roots-list');

    if (!rootsList) return;

    if (roots.length === 0) {
        rootsList.innerHTML = '<p style="color: #999;">구간 내에 근이 없습니다.</p>';
        return;
    }

    let html = `<div style="margin-bottom: 10px;"><strong>함수:</strong> f(x) = ${expression}</div>`;
    html += `<div style="margin-bottom: 15px;"><strong>총 ${roots.length}개의 근을 찾았습니다:</strong></div>`;

    roots.forEach((root, index) => {
        html += `
            <div class="root-item">
                <strong>근 ${index + 1}:</strong> x = ${MathUtils.formatNumber(root.x, 6)}<br>
                <small style="color: #666;">
                    방법: ${root.method === 'bisection' ? '이분법' : 'Newton법'}
                    (${root.iterations}회 반복)
                </small>
            </div>
        `;
    });

    rootsList.innerHTML = html;
}

/**
 * 문제 정보 업데이트
 */
function updateProblemInfo(html) {
    const problemInfo = document.getElementById('problem-info');
    if (problemInfo) {
        problemInfo.innerHTML = html;
    }
}

/**
 * Glow 설정 업데이트
 */
function updateGlowSettings() {
    const enabled = document.getElementById('glow-enabled').checked;
    const intensity = parseInt(document.getElementById('glow-intensity').value);
    const color = document.getElementById('glow-color').value;

    // Glow 관리자 업데이트
    glowManager.updateSettings({ enabled, intensity, color });

    // 그래프 렌더러 업데이트
    if (graphRenderer) {
        graphRenderer.updateGlowSettings(enabled, intensity, color);
    }

    console.log('Glow 설정 업데이트:', { enabled, intensity, color });
}

/**
 * 로딩 표시
 */
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

/**
 * 답안 제출
 */
async function submitAnswer() {
    if (!currentProblem || currentRoots.length === 0) {
        alert('먼저 근을 찾아주세요!');
        return;
    }

    if (!moodleIntegration.isReady()) {
        alert('LMS에 연결되어 있지 않습니다.');
        return;
    }

    showLoading(true);

    try {
        const result = await moodleIntegration.submitAnswer(currentProblem.id, currentRoots);

        if (result.success) {
            alert(`제출 완료!\n점수: ${result.score}\n피드백: ${result.feedback}`);
            phoneDisplay.showSuccess('답안 제출 완료!');
        } else {
            alert('제출 실패: ' + result.error);
        }
    } catch (error) {
        console.error('제출 오류:', error);
        alert('제출 중 오류가 발생했습니다.');
    } finally {
        showLoading(false);
    }
}

/**
 * 키보드 단축키
 */
document.addEventListener('keydown', (e) => {
    // Ctrl + Enter: 근 찾기
    if (e.ctrlKey && e.key === 'Enter') {
        handleSolveClick();
    }

    // Ctrl + S: 답안 제출
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        submitAnswer();
    }

    // Ctrl + R: 새 문제 로드
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        loadInitialProblem();
    }
});

/**
 * 유틸리티 함수
 */
window.rootGlowApp = {
    loadProblem,
    submitAnswer,
    updateGlowSettings,
    getCurrentState: () => ({
        function: currentFunction,
        roots: currentRoots,
        problem: currentProblem
    })
};

console.log('Root Glow 앱 준비 완료! 단축키: Ctrl+Enter (근 찾기), Ctrl+S (제출), Ctrl+R (새 문제)');
