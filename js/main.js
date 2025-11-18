/**
 * Main Application - Log Flow 애니메이션 앱의 메인 컨트롤러
 * PWA, Storage, Recommendation 시스템 통합
 */

// 전역 객체
let calculator = null;
let animation = null;
let moodle = null;
let storage = null;
let recommendation = null;

/**
 * 앱 초기화
 */
async function initApp() {
    // Storage 초기화
    storage = new LocalStorage();
    await storage.init();

    // Recommendation 초기화
    recommendation = new RecommendationEngine(storage);

    // 인스턴스 생성
    calculator = new LogCalculator();
    animation = new LogFlowAnimation('flowSvg');
    moodle = new MoodleIntegration();

    // 기본 문제 데이터 로드
    await loadDefaultProblems();

    // 이벤트 리스너 등록
    setupEventListeners();

    // Moodle 자동 연결 시도
    attemptAutoConnect();

    // 초기 UI 상태 설정
    await updateUIState();

    // PWA 설치 버튼 추가
    showInstallButton();

    // 추천 문제 표시
    await showRecommendedProblem();

    // 로그 추가
    addLogEntry('앱 초기화 완료', 'success');
}

/**
 * 기본 문제 데이터 로드
 */
async function loadDefaultProblems() {
    const existingProblems = await storage.getAllProblems();

    if (existingProblems.length === 0) {
        const defaultProblems = [
            { id: 'log_101', title: 'log₂(4)', base: 2, value: 4, correct_answer: 2, difficulty: 'easy', category: 'logarithm' },
            { id: 'log_102', title: 'log₂(8)', base: 2, value: 8, correct_answer: 3, difficulty: 'easy', category: 'logarithm' },
            { id: 'log_103', title: 'log₃(9)', base: 3, value: 9, correct_answer: 2, difficulty: 'easy', category: 'logarithm' },
            { id: 'log_104', title: 'log₂(16)', base: 2, value: 16, correct_answer: 4, difficulty: 'medium', category: 'logarithm' },
            { id: 'log_105', title: 'log₃(27)', base: 3, value: 27, correct_answer: 3, difficulty: 'medium', category: 'logarithm' },
            { id: 'log_106', title: 'log₅(25)', base: 5, value: 25, correct_answer: 2, difficulty: 'medium', category: 'logarithm' },
            { id: 'log_107', title: 'log₂(32)', base: 2, value: 32, correct_answer: 5, difficulty: 'medium', category: 'logarithm' },
            { id: 'log_108', title: 'log₄(64)', base: 4, value: 64, correct_answer: 3, difficulty: 'hard', category: 'logarithm' },
            { id: 'log_109', title: 'log₁₀(100)', base: 10, value: 100, correct_answer: 2, difficulty: 'easy', category: 'logarithm' },
            { id: 'log_110', title: 'log₁₀(1000)', base: 10, value: 1000, correct_answer: 3, difficulty: 'medium', category: 'logarithm' }
        ];

        for (const problem of defaultProblems) {
            await storage.saveProblem(problem);
        }

        console.log('기본 문제 데이터 로드 완료');
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // Moodle 연결 버튼
    document.getElementById('connectMoodle').addEventListener('click', connectToMoodle);

    // 계산 시작 버튼
    document.getElementById('calculateBtn').addEventListener('click', startCalculation);

    // 초기화 버튼
    document.getElementById('resetBtn').addEventListener('click', resetApp);

    // 애니메이션 속도 조절
    document.getElementById('speedControl').addEventListener('input', function(e) {
        const speed = parseFloat(e.target.value);
        animation.setSpeed(speed);
        document.getElementById('speedValue').textContent = speed + 'x';
    });

    // 자동 재생 토글
    document.getElementById('autoPlay').addEventListener('change', function(e) {
        if (e.target.checked && calculator.getAllSteps().length > 0) {
            playAutomatically();
        } else {
            animation.stop();
        }
    });

    // Moodle 로그 이벤트 리스너
    document.addEventListener('moodle-log', function(e) {
        addLogEntry(e.detail.message, e.detail.type);
    });

    // 입력 필드 엔터키 처리
    document.getElementById('logBase').addEventListener('keypress', handleEnterKey);
    document.getElementById('logValue').addEventListener('keypress', handleEnterKey);
    document.getElementById('problemId').addEventListener('keypress', handleEnterKey);
}

/**
 * PWA 설치 버튼 표시
 */
function showInstallButton() {
    // beforeinstallprompt 이벤트 대기
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();

        const installBtn = document.createElement('button');
        installBtn.className = 'install-pwa-btn';
        installBtn.textContent = '앱 설치하기';
        installBtn.onclick = () => {
            window.showInstallPrompt();
            installBtn.remove();
        };

        document.body.appendChild(installBtn);
    });
}

/**
 * 추천 문제 표시
 */
async function showRecommendedProblem() {
    try {
        const recommendedProblem = await recommendation.recommendNextProblem();
        const reason = await recommendation.getRecommendationReason(recommendedProblem);

        // 문제 카드 생성
        const card = createRecommendationCard(recommendedProblem, reason);

        // 기존 카드 제거
        const existingCard = document.querySelector('.recommendation-card');
        if (existingCard) existingCard.remove();

        // 입력 섹션 전에 삽입
        const inputSection = document.querySelector('.input-section');
        inputSection.parentNode.insertBefore(card, inputSection);

    } catch (error) {
        console.error('추천 문제 로드 실패:', error);
    }
}

/**
 * 추천 문제 카드 생성
 */
function createRecommendationCard(problem, reason) {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.innerHTML = `
        <div class="badge">💡 추천 문제</div>
        <h3>${problem.title}</h3>
        <p class="reason">${reason}</p>
    `;

    card.onclick = () => {
        loadProblemToUI(problem);
        addLogEntry(`추천 문제 선택: ${problem.title}`, 'info');
    };

    return card;
}

/**
 * Moodle 자동 연결 시도
 */
async function attemptAutoConnect() {
    updateMoodleStatus('연결 시도 중...', 'connecting');

    const result = await moodle.autoConnect();

    if (result.success) {
        updateMoodleStatus('연결됨', 'connected');

        // 현재 문제가 있으면 로드
        if (moodle.currentProblem) {
            loadProblemToUI(moodle.currentProblem);
        }
    } else {
        updateMoodleStatus('연결 안됨 (데모 모드 사용 가능)', 'disconnected');
    }
}

/**
 * Moodle 연결
 */
async function connectToMoodle() {
    const btn = document.getElementById('connectMoodle');
    btn.disabled = true;
    btn.textContent = '연결 중...';

    // 데모 모드 활성화 (실제 사용시에는 모달로 URL과 토큰 입력받기)
    const demoData = moodle.enableDemoMode();

    updateMoodleStatus('연결됨 (데모)', 'connected');

    // 데모 문제 로드
    if (demoData.problem) {
        loadProblemToUI(demoData.problem);
    }

    btn.disabled = false;
    btn.textContent = 'Moodle 연결';

    addLogEntry('데모 모드로 연결되었습니다', 'success');
}

/**
 * 문제를 UI에 로드
 */
function loadProblemToUI(problem) {
    document.getElementById('problemId').value = problem.id;
    document.getElementById('logBase').value = problem.base;
    document.getElementById('logValue').value = problem.value;

    // 문제 정보 표시
    document.getElementById('problemInfo').innerHTML = `
        <span class="badge">${problem.title || problem.id}</span>
    `;

    addLogEntry(`문제 로드: ${problem.title || problem.id}`, 'info');
}

/**
 * 계산 시작
 */
async function startCalculation() {
    const base = parseInt(document.getElementById('logBase').value);
    const value = parseInt(document.getElementById('logValue').value);
    const problemId = document.getElementById('problemId').value || 'custom';

    // 유효성 검사
    if (isNaN(base) || isNaN(value) || base <= 1 || value <= 0) {
        addLogEntry('올바른 값을 입력해주세요', 'error');
        alert('밑(base)은 1보다 크고, 진수(value)는 0보다 커야 합니다.');
        return;
    }

    // 버튼 비활성화
    document.getElementById('calculateBtn').disabled = true;
    document.getElementById('calculateBtn').textContent = '계산 중...';

    try {
        // 계산기 설정
        calculator.setParameters(base, value);
        addLogEntry(`계산 시작: log${base}(${value})`, 'info');

        // 계산 실행
        const result = calculator.calculate();
        addLogEntry(`계산 완료: 결과 = ${result.result.toFixed(6)}`, 'success');

        // 수식 표시 업데이트
        updateEquationDisplay(base, value, result.result);

        // 애니메이션 단계 설정
        animation.setSteps(result.steps);

        // 자동 재생이 켜져있으면 애니메이션 시작
        if (document.getElementById('autoPlay').checked) {
            await playAutomatically();
        } else {
            // 첫 단계만 표시
            showStep(0);
        }

        // 진행상황 저장
        await storage.saveProgress(problemId, {
            base,
            value,
            result: result.result,
            steps: result.steps,
            completedAt: Date.now()
        });

        // 답안 저장 (정답으로 가정)
        await storage.saveAnswer({
            problemId,
            answer: result.result,
            isCorrect: true,
            grade: 100
        });

        // 다음 추천 문제 업데이트
        await showRecommendedProblem();

    } catch (error) {
        addLogEntry(`오류 발생: ${error.message}`, 'error');
        alert(error.message);
    } finally {
        document.getElementById('calculateBtn').disabled = false;
        document.getElementById('calculateBtn').textContent = '계산 시작';
    }
}

/**
 * 자동 애니메이션 재생
 */
async function playAutomatically() {
    animation.reset();

    await animation.playAll((step, index) => {
        showStep(index);
        updateProgress(index);
    });

    addLogEntry('애니메이션 재생 완료', 'success');
}

/**
 * 특정 단계 표시
 */
function showStep(index) {
    const step = calculator.getAllSteps()[index];

    if (!step) return;

    // 단계 설명 업데이트
    if (document.getElementById('showSteps').checked) {
        const stepContent = document.getElementById('stepContent');
        stepContent.innerHTML = `
            <div class="step-number">Step ${step.stepNumber}</div>
            <div class="step-title"><strong>${step.title}</strong></div>
            <div class="step-formula">${step.formula}</div>
            <div class="step-explanation">${step.explanation}</div>
        `;
    }

    // 진행률 업데이트
    updateProgress(index);
}

/**
 * 진행률 업데이트
 */
function updateProgress(stepIndex) {
    const steps = calculator.getAllSteps();
    if (steps.length === 0) return;

    const progress = Math.round((stepIndex / (steps.length - 1)) * 100);

    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = progress + '%';
}

/**
 * 수식 표시 업데이트
 */
function updateEquationDisplay(base, value, result) {
    document.getElementById('baseDisplay').textContent = base;
    document.getElementById('valueDisplay').textContent = value;
    document.getElementById('resultDisplay').textContent = result.toFixed(4);
}

/**
 * 앱 초기화
 */
function resetApp() {
    // 계산기 리셋
    if (calculator) {
        calculator.reset();
    }

    // 애니메이션 리셋
    if (animation) {
        animation.stop();
        animation.reset();
    }

    // UI 초기화
    document.getElementById('baseDisplay').textContent = '?';
    document.getElementById('valueDisplay').textContent = '?';
    document.getElementById('resultDisplay').textContent = '?';
    document.getElementById('stepContent').textContent = '문제를 입력하고 \'계산 시작\' 버튼을 눌러주세요.';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';

    // 로그 지우기
    document.getElementById('calculationLog').innerHTML = '';

    addLogEntry('앱이 초기화되었습니다', 'info');
}

/**
 * Moodle 상태 업데이트
 */
function updateMoodleStatus(message, status) {
    const statusElement = document.getElementById('moodleStatus');
    statusElement.textContent = message;
    statusElement.className = 'status-indicator';

    if (status === 'connected') {
        statusElement.classList.add('connected');
    } else if (status === 'error') {
        statusElement.classList.add('error');
    }
}

/**
 * UI 상태 업데이트
 */
async function updateUIState() {
    // 초기 상태 설정
    document.getElementById('speedValue').textContent = '1x';

    // 학습 통계 표시
    const stats = await storage.getTotalStatistics();
    console.log('학습 통계:', stats);

    // 사용자 수준 표시
    const userLevel = await recommendation.analyzeUserLevel();
    console.log('현재 수준:', userLevel);
}

/**
 * 로그 엔트리 추가
 */
function addLogEntry(message, type = 'info') {
    const logContainer = document.getElementById('calculationLog');
    const timestamp = new Date().toLocaleTimeString('ko-KR');

    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
        <span class="timestamp">[${timestamp}]</span>
        <span class="message">${message}</span>
    `;

    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;

    // 최대 50개 엔트리만 유지
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

/**
 * 엔터키 처리
 */
function handleEnterKey(e) {
    if (e.key === 'Enter') {
        startCalculation();
    }
}

/**
 * 키보드 단축키
 */
document.addEventListener('keydown', function(e) {
    // Ctrl + Enter: 계산 시작
    if (e.ctrlKey && e.key === 'Enter') {
        startCalculation();
    }

    // Ctrl + R: 리셋
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetApp();
    }

    // Ctrl + S: 통계 보기
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        showStatistics();
    }
});

/**
 * 학습 통계 표시
 */
async function showStatistics() {
    const stats = await storage.getTotalStatistics();
    const userLevel = await recommendation.analyzeUserLevel();

    alert(`
📊 학습 통계

총 시도 횟수: ${stats.totalAttempts}
정답 횟수: ${stats.correctAnswers}
정답률: ${stats.successRate}%
평균 점수: ${stats.averageGrade.toFixed(2)}
시도한 문제 수: ${stats.problemsAttempted}

현재 수준: ${userLevel}
    `.trim());
}

/**
 * 페이지 로드 시 앱 초기화
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

/**
 * 개발자 도구용 전역 함수
 */
window.logFlow = {
    calculator: () => calculator,
    animation: () => animation,
    moodle: () => moodle,
    storage: () => storage,
    recommendation: () => recommendation,
    version: '1.0.0',
    info: async () => {
        console.log('Log Flow Animation v1.0.0');
        console.log('Calculator:', calculator);
        console.log('Animation:', animation);
        console.log('Moodle:', moodle);
        console.log('Storage:', storage);
        console.log('Recommendation:', recommendation);
        console.log('Statistics:', await storage.getTotalStatistics());
        console.log('User Level:', await recommendation.analyzeUserLevel());
    },
    exportData: async () => {
        const data = await storage.exportData();
        console.log('데이터 내보내기:', data);
        return data;
    },
    clearData: async () => {
        if (confirm('모든 데이터를 삭제하시겠습니까?')) {
            await storage.clearAll();
            console.log('모든 데이터가 삭제되었습니다');
            window.location.reload();
        }
    }
};
