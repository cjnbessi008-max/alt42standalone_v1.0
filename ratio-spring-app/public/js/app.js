/**
 * Main Application
 * Ratio Spring 앱의 메인 로직
 */

// 전역 변수
let visualizer = null;
let moodleAPI = null;
let eventHandler = null;
let currentProblem = null;

/**
 * 앱 초기화
 */
function initializeApp() {
    console.log('Initializing Ratio Spring App...');

    // Ratio Visualizer 초기화
    visualizer = new RatioVisualizer('springCanvas', {
        ratioA: 2,
        ratioB: 3,
        mode: 'dual' // 'dual' 또는 'single'
    });

    // Moodle API 초기화
    moodleAPI = new MoodleAPI({
        apiEndpoint: '/api/connector.php'
    });

    // 이벤트 핸들러 초기화
    eventHandler = new MoodleEventHandler();
    eventHandler.listenToMoodle();

    // 이벤트 리스너 등록
    setupEventListeners();

    // URL 파라미터 확인
    checkURLParameters();

    // 초기 그리기
    visualizer.draw();

    console.log('App initialized successfully!');
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 비율 업데이트 버튼
    const updateBtn = document.getElementById('updateRatio');
    if (updateBtn) {
        updateBtn.addEventListener('click', handleUpdateRatio);
    }

    // Moodle 불러오기 버튼
    const loadMoodleBtn = document.getElementById('loadFromMoodle');
    if (loadMoodleBtn) {
        loadMoodleBtn.addEventListener('click', handleLoadFromMoodle);
    }

    // 애니메이션 시작 버튼
    const animateBtn = document.getElementById('animateBtn');
    if (animateBtn) {
        animateBtn.addEventListener('click', () => {
            visualizer.startAnimation();
            updateStatus('애니메이션 실행 중...');
        });
    }

    // 리셋 버튼
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            visualizer.reset();
            updateStatus('초기화됨');
        });
    }

    // 비율 입력 필드 엔터키
    const ratioInputs = document.querySelectorAll('#ratioA, #ratioB');
    ratioInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleUpdateRatio();
            }
        });
    });

    // Moodle 이벤트 리스너
    eventHandler.on('problem_received', handleProblemReceived);
    eventHandler.on('command_received', handleCommandReceived);
}

/**
 * URL 파라미터 확인 및 처리
 */
function checkURLParameters() {
    const params = moodleAPI.extractMoodleParams();

    if (params.problemId) {
        console.log('Loading problem from URL:', params.problemId);
        loadProblem(params.problemId);
    } else {
        console.log('No problem ID in URL, using default values');
    }

    if (params.token) {
        moodleAPI.token = params.token;
    }

    if (params.activityId) {
        moodleAPI.activityId = params.activityId;
    }
}

/**
 * 비율 업데이트 처리
 */
function handleUpdateRatio() {
    const ratioA = parseInt(document.getElementById('ratioA').value);
    const ratioB = parseInt(document.getElementById('ratioB').value);

    if (isNaN(ratioA) || isNaN(ratioB) || ratioA < 1 || ratioB < 1) {
        showError('올바른 비율을 입력해주세요 (1-10)');
        return;
    }

    // 비율 업데이트
    visualizer.updateRatio(ratioA, ratioB);

    // UI 업데이트
    updateRatioDisplay(ratioA, ratioB);
    updateStatus('비율 업데이트됨');

    // Moodle에 알림
    if (eventHandler) {
        eventHandler.sendToMoodle('ratio_updated', { a: ratioA, b: ratioB });
    }
}

/**
 * Moodle에서 문제 불러오기
 */
async function handleLoadFromMoodle() {
    updateStatus('Moodle에서 문제를 불러오는 중...');

    try {
        // 실제 Moodle 연동 시 사용
        // const problem = await moodleAPI.fetchRatioProblem(problemId);

        // 데모: 랜덤 문제 생성
        const problem = moodleAPI.generateRandomProblem();
        handleProblemReceived(problem);

        updateStatus('문제 불러오기 완료!');
    } catch (error) {
        console.error('Error loading from Moodle:', error);
        showError('Moodle에서 문제를 불러올 수 없습니다.');
        updateStatus('오류 발생');
    }
}

/**
 * 문제 불러오기
 */
async function loadProblem(problemId) {
    try {
        // 캐시 확인
        let problem = moodleAPI.getCachedProblem(problemId);

        if (!problem) {
            // Moodle에서 가져오기
            problem = await moodleAPI.fetchRatioProblem(problemId);
            moodleAPI.cacheProblem(problemId, problem);
        }

        handleProblemReceived(problem);
    } catch (error) {
        console.error('Error loading problem:', error);
        showError('문제를 불러올 수 없습니다.');
    }
}

/**
 * Moodle에서 문제 수신 처리
 */
function handleProblemReceived(problem) {
    console.log('Problem received:', problem);
    currentProblem = problem;

    // 비율 데이터 파싱
    const problemData = moodleAPI.parseProblemData(problem);

    // 시각화 업데이트
    visualizer.updateRatio(problemData.ratioA, problemData.ratioB);

    // UI 업데이트
    updateRatioDisplay(problemData.ratioA, problemData.ratioB);

    // 입력 필드 업데이트
    const ratioAInput = document.getElementById('ratioA');
    const ratioBInput = document.getElementById('ratioB');
    if (ratioAInput) ratioAInput.value = problemData.ratioA;
    if (ratioBInput) ratioBInput.value = problemData.ratioB;

    // 문제 정보 표시 (있다면)
    if (problemData.question) {
        console.log('Question:', problemData.question);
        // TODO: UI에 문제 표시
    }

    updateStatus('새 문제 로드됨');
}

/**
 * Moodle 명령 수신 처리
 */
function handleCommandReceived(command) {
    console.log('Command received:', command);

    switch (command.action) {
        case 'reset':
            visualizer.reset();
            updateStatus('초기화됨');
            break;

        case 'animate':
            visualizer.startAnimation();
            updateStatus('애니메이션 시작');
            break;

        case 'set_mode':
            visualizer.setMode(command.mode);
            updateStatus(`모드 변경: ${command.mode}`);
            break;

        default:
            console.warn('Unknown command:', command.action);
    }
}

/**
 * 비율 표시 업데이트
 */
function updateRatioDisplay(a, b) {
    // 현재 비율 텍스트
    const currentRatioElement = document.getElementById('currentRatio');
    if (currentRatioElement) {
        currentRatioElement.textContent = `${a}:${b}`;
    }

    // 스마트폰 화면 내 비율 값
    const valueAElement = document.getElementById('valueA');
    const valueBElement = document.getElementById('valueB');
    if (valueAElement) valueAElement.textContent = a;
    if (valueBElement) valueBElement.textContent = b;

    // 비율 정보 계산
    const ratio = visualizer.getRatio();
    console.log('Ratio info:', ratio);
}

/**
 * 상태 메시지 업데이트
 */
function updateStatus(message) {
    const statusElement = document.getElementById('springStatus');
    if (statusElement) {
        statusElement.textContent = message;
    }
    console.log('Status:', message);
}

/**
 * 에러 메시지 표시
 */
function showError(message) {
    console.error(message);
    alert(message); // 간단한 구현, 나중에 더 나은 UI로 개선 가능
}

/**
 * 성공 메시지 표시
 */
function showSuccess(message) {
    console.log('Success:', message);
    // TODO: UI에 성공 메시지 표시
}

/**
 * 키보드 단축키
 */
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + R: 리셋
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        visualizer.reset();
        updateStatus('리셋됨 (단축키)');
    }

    // Space: 애니메이션 토글
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        if (visualizer.isAnimating) {
            visualizer.stopAnimation();
            updateStatus('애니메이션 정지');
        } else {
            visualizer.startAnimation();
            updateStatus('애니메이션 시작');
        }
    }
});

/**
 * 페이지 로드 시 초기화
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

/**
 * 디버깅용 전역 함수
 */
window.debugApp = {
    getVisualizer: () => visualizer,
    getMoodleAPI: () => moodleAPI,
    getCurrentProblem: () => currentProblem,
    setRatio: (a, b) => {
        visualizer.updateRatio(a, b);
        updateRatioDisplay(a, b);
    },
    loadDemoProblems: () => moodleAPI.generateDemoData()
};

console.log('Debug commands available at window.debugApp');
