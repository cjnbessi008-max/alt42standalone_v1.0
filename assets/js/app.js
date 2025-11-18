/**
 * 메인 애플리케이션 로직
 * Moodle 연동과 Operation Trail을 통합합니다
 */

// 전역 변수
let currentProblem = null;

/**
 * 애플리케이션 초기화
 */
document.addEventListener('DOMContentLoaded', async () => {
    debugLog('애플리케이션 시작');

    // 모듈 초기화
    initMoodleConnector();
    initOperationTrail();

    // 이벤트 리스너 설정
    setupEventListeners();

    // 초기 UI 설정
    setupUI();

    debugLog('애플리케이션 초기화 완료');
});

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 문제 불러오기 버튼
    const btnLoadProblem = document.getElementById('btn-load-problem');
    if (btnLoadProblem) {
        btnLoadProblem.addEventListener('click', handleLoadProblem);
    }

    // 계산 과정 보기 버튼
    const btnStartTrail = document.getElementById('btn-start-trail');
    if (btnStartTrail) {
        btnStartTrail.addEventListener('click', handleStartTrail);
    }

    // 초기화 버튼
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', handleReset);
    }
}

/**
 * UI 초기 설정
 */
function setupUI() {
    // 문제 내용 초기화
    const problemContent = document.getElementById('problem-content');
    if (problemContent) {
        problemContent.innerHTML = '<p class="loading">문제를 불러오려면 "문제 불러오기" 버튼을 클릭하세요.</p>';
    }

    // 버튼 상태 설정
    updateButtonStates({
        loadProblem: true,
        startTrail: false,
        reset: false
    });
}

/**
 * 문제 불러오기 핸들러
 */
async function handleLoadProblem() {
    debugLog('문제 불러오기 시작');

    // 버튼 비활성화
    updateButtonStates({
        loadProblem: false,
        startTrail: false,
        reset: false
    });

    // 로딩 표시
    showLoading();

    try {
        // Moodle에서 문제 로드
        currentProblem = await moodleConnector.loadProblem();

        if (currentProblem) {
            displayProblem(currentProblem);

            // 버튼 활성화
            updateButtonStates({
                loadProblem: true,
                startTrail: true,
                reset: true
            });

            debugLog('문제 로드 완료:', currentProblem);
        } else {
            showError('문제를 불러올 수 없습니다.');

            updateButtonStates({
                loadProblem: true,
                startTrail: false,
                reset: false
            });
        }
    } catch (error) {
        errorLog('문제 로드 실패:', error);
        showError('문제를 불러오는 중 오류가 발생했습니다.');

        updateButtonStates({
            loadProblem: true,
            startTrail: false,
            reset: false
        });
    }
}

/**
 * 계산 과정 보기 핸들러
 */
async function handleStartTrail() {
    if (!currentProblem || !currentProblem.steps) {
        showError('표시할 계산 과정이 없습니다.');
        return;
    }

    debugLog('Operation Trail 시작');

    // 버튼 비활성화
    updateButtonStates({
        loadProblem: false,
        startTrail: false,
        reset: false
    });

    try {
        // Operation Trail 애니메이션 시작
        await operationTrail.start(currentProblem.steps);

        // 완료 후 버튼 활성화
        updateButtonStates({
            loadProblem: true,
            startTrail: true,
            reset: true
        });

        debugLog('Operation Trail 완료');
    } catch (error) {
        errorLog('Operation Trail 오류:', error);
        showError('계산 과정을 표시하는 중 오류가 발생했습니다.');

        updateButtonStates({
            loadProblem: true,
            startTrail: true,
            reset: true
        });
    }
}

/**
 * 초기화 핸들러
 */
function handleReset() {
    debugLog('초기화 시작');

    // Operation Trail 리셋
    if (operationTrail) {
        operationTrail.reset();
    }

    // 문제 초기화
    currentProblem = null;

    // UI 초기화
    setupUI();

    debugLog('초기화 완료');
}

/**
 * 문제 표시
 */
function displayProblem(problem) {
    const problemContent = document.getElementById('problem-content');

    if (!problemContent) return;

    problemContent.innerHTML = `
        <div class="problem-info">
            <p><strong>문제 ${problem.id}</strong></p>
            <p>${problem.question}</p>
        </div>
        <div class="math-expression">
            ${problem.expression}
        </div>
        <div class="problem-details">
            <p><small>총 ${problem.steps.length}단계의 계산 과정이 있습니다.</small></p>
        </div>
    `;
}

/**
 * 로딩 표시
 */
function showLoading() {
    const problemContent = document.getElementById('problem-content');

    if (problemContent) {
        problemContent.innerHTML = '<p class="loading">문제를 불러오는 중...</p>';
    }
}

/**
 * 에러 표시
 */
function showError(message) {
    const problemContent = document.getElementById('problem-content');

    if (problemContent) {
        problemContent.innerHTML = `
            <div style="color: #ef4444; padding: 20px; background: #fee2e2; border-radius: 10px;">
                <strong>오류</strong><br>
                ${message}
            </div>
        `;
    }

    // 알림 표시 (선택사항)
    if (CONFIG.debug) {
        alert(message);
    }
}

/**
 * 버튼 상태 업데이트
 */
function updateButtonStates(states) {
    const buttons = {
        loadProblem: document.getElementById('btn-load-problem'),
        startTrail: document.getElementById('btn-start-trail'),
        reset: document.getElementById('btn-reset')
    };

    for (const [key, enabled] of Object.entries(states)) {
        if (buttons[key]) {
            buttons[key].disabled = !enabled;
        }
    }
}

/**
 * 브라우저 크기 변경 시 Canvas 리사이즈
 */
window.addEventListener('resize', () => {
    if (operationTrail) {
        operationTrail.setupCanvas();

        // 현재 애니메이션이 진행 중이 아니면 다시 그리기
        if (!operationTrail.isAnimating && operationTrail.nodes.length > 0) {
            operationTrail.clear();
            operationTrail.nodes.forEach(node => {
                operationTrail.drawNode(node);
            });
        }
    }
});

/**
 * 키보드 단축키
 */
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + L: 문제 불러오기
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleLoadProblem();
    }

    // Ctrl/Cmd + Enter: 계산 과정 보기
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (currentProblem) {
            handleStartTrail();
        }
    }

    // Ctrl/Cmd + R: 초기화
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleReset();
    }
});

// 디버그 정보 출력
debugLog('앱 스크립트 로드 완료');
debugLog('사용 가능한 키보드 단축키:');
debugLog('  Ctrl/Cmd + L: 문제 불러오기');
debugLog('  Ctrl/Cmd + Enter: 계산 과정 보기');
debugLog('  Ctrl/Cmd + R: 초기화');
