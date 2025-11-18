/**
 * Standalone App - 독립형 Root Glow 애플리케이션
 * PHP/MySQL 없이 브라우저만으로 실행
 */

// 전역 객체
let graphRenderer;
let phoneDisplay;
let glowManager;
let problemDB;
let storage;

// 현재 상태
let currentFunction = null;
let currentRoots = [];
let currentProblem = null;

// PWA 설치 프롬프트
let deferredPrompt;

/**
 * 애플리케이션 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Root Glow Standalone 시작...');

    // 컴포넌트 초기화
    initializeComponents();

    // 이벤트 리스너 설정
    setupEventListeners();

    // PWA 설정
    setupPWA();

    // 초기 문제 로드
    loadRandomProblem();

    // 저장된 설정 복원
    restoreSettings();

    console.log('✅ 시스템 준비 완료!');
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

    // 문제 데이터베이스
    problemDB = new ProblemDatabase();

    // 로컬 스토리지
    storage = new StandaloneStorage();

    console.log('✓ 컴포넌트 초기화 완료');
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 근 찾기 버튼
    document.getElementById('solve-btn')?.addEventListener('click', handleSolveClick);

    // 함수 입력 (엔터 키)
    document.getElementById('function-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSolveClick();
    });

    // 랜덤 문제 버튼
    document.getElementById('random-problem-btn')?.addEventListener('click', loadRandomProblem);

    // 문제 목록 버튼
    document.getElementById('problem-list-btn')?.addEventListener('click', showProblemListModal);

    // 모달 닫기
    document.getElementById('close-modal-btn')?.addEventListener('click', closeProblemListModal);

    // Glow 설정
    document.getElementById('glow-intensity')?.addEventListener('input', (e) => {
        const intensity = parseInt(e.target.value);
        document.getElementById('intensity-value').textContent = intensity;
        updateGlowSettings();
        storage.saveSettings({ glowIntensity: intensity });
    });

    document.getElementById('glow-color')?.addEventListener('input', (e) => {
        updateGlowSettings();
        storage.saveSettings({ glowColor: e.target.value });
    });

    document.getElementById('glow-enabled')?.addEventListener('change', (e) => {
        updateGlowSettings();
        storage.saveSettings({ glowEnabled: e.target.checked });
    });

    // 필터 변경
    document.getElementById('difficulty-filter')?.addEventListener('change', filterProblems);
    document.getElementById('category-filter')?.addEventListener('change', filterProblems);

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('problem-list-modal');
        if (e.target === modal) {
            closeProblemListModal();
        }
    });

    console.log('✓ 이벤트 리스너 설정 완료');
}

/**
 * PWA 설정
 */
function setupPWA() {
    // 설치 프롬프트 이벤트
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // 설치 프롬프트 표시 (3초 후)
        setTimeout(() => {
            const installPrompt = document.getElementById('install-prompt');
            if (installPrompt) {
                installPrompt.classList.remove('hidden');
            }
        }, 3000);
    });

    // 설치 버튼
    document.getElementById('install-btn')?.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`사용자 선택: ${outcome}`);
        deferredPrompt = null;

        document.getElementById('install-prompt')?.classList.add('hidden');
    });

    // 나중에 버튼
    document.getElementById('dismiss-install-btn')?.addEventListener('click', () => {
        document.getElementById('install-prompt')?.classList.add('hidden');
    });

    // 앱이 설치된 후
    window.addEventListener('appinstalled', () => {
        console.log('✅ PWA 설치 완료!');
        deferredPrompt = null;
    });
}

/**
 * 랜덤 문제 로드
 */
function loadRandomProblem() {
    const problem = problemDB.getRandomProblem();
    loadProblem(problem);
}

/**
 * 문제 로드
 */
function loadProblem(problem) {
    currentProblem = problem;

    // 문제 정보 표시
    const problemInfo = document.getElementById('problem-info');
    if (problemInfo) {
        const completedBadge = storage.isProblemCompleted(problem.id)
            ? '<span class="badge badge-success">✅ 완료</span>'
            : '';

        problemInfo.innerHTML = `
            <div class="problem-card">
                <h3>${problem.title} ${completedBadge}</h3>
                <p class="problem-meta">
                    <span class="badge badge-${problem.difficulty}">${problem.difficulty}</span>
                    <span class="badge badge-category">${problem.category}</span>
                </p>
                <p class="problem-description">${problem.description}</p>
                <p class="problem-function"><strong>함수:</strong> <code>f(x) = ${problem.function}</code></p>
            </div>
        `;
    }

    // 함수 입력란에 자동 입력
    const functionInput = document.getElementById('function-input');
    if (functionInput) {
        functionInput.value = problem.function;
    }

    // 스마트폰에 표시
    phoneDisplay.displayProblem(problem);

    console.log('문제 로드:', problem.id);
}

/**
 * 문제 목록 모달 표시
 */
function showProblemListModal() {
    const modal = document.getElementById('problem-list-modal');
    if (!modal) return;

    // 카테고리 필터 옵션 채우기
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        const categories = problemDB.getCategories();
        categoryFilter.innerHTML = '<option value="">모든 카테고리</option>';
        categories.forEach(cat => {
            categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    }

    // 문제 목록 렌더링
    renderProblemList();

    modal.classList.remove('hidden');
}

/**
 * 문제 목록 모달 닫기
 */
function closeProblemListModal() {
    const modal = document.getElementById('problem-list-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * 문제 목록 렌더링
 */
function renderProblemList(filtered = null) {
    const container = document.getElementById('problem-list-container');
    if (!container) return;

    const problems = filtered || problemDB.getAllProblems();

    if (problems.length === 0) {
        container.innerHTML = '<p class="no-results">조건에 맞는 문제가 없습니다.</p>';
        return;
    }

    let html = '<div class="problem-grid">';

    problems.forEach(problem => {
        const completed = storage.isProblemCompleted(problem.id);
        const progress = storage.getProgress(problem.id);

        html += `
            <div class="problem-item ${completed ? 'completed' : ''}" data-problem-id="${problem.id}">
                <div class="problem-item-header">
                    <h4>${problem.title}</h4>
                    ${completed ? '<span class="completed-icon">✅</span>' : ''}
                </div>
                <p class="problem-item-meta">
                    <span class="badge badge-${problem.difficulty}">${problem.difficulty}</span>
                    <span class="badge badge-category">${problem.category}</span>
                </p>
                <p class="problem-item-function"><code>${problem.function}</code></p>
                ${progress ? `<p class="problem-item-attempts">시도: ${progress.attempts}회</p>` : ''}
                <button class="load-problem-btn" onclick="loadProblemById('${problem.id}')">
                    ${completed ? '다시 풀기' : '시작하기'}
                </button>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * 문제 필터링
 */
function filterProblems() {
    const difficulty = document.getElementById('difficulty-filter')?.value;
    const category = document.getElementById('category-filter')?.value;

    let problems = problemDB.getAllProblems();

    if (difficulty) {
        problems = problems.filter(p => p.difficulty === difficulty);
    }

    if (category) {
        problems = problems.filter(p => p.category === category);
    }

    renderProblemList(problems);
}

/**
 * ID로 문제 로드 (전역 함수)
 */
window.loadProblemById = function(problemId) {
    const problem = problemDB.getProblemById(problemId);
    if (problem) {
        loadProblem(problem);
        closeProblemListModal();
    }
};

/**
 * 근 찾기 실행
 */
async function handleSolveClick() {
    const functionInput = document.getElementById('function-input');
    const expression = functionInput?.value.trim();

    if (!expression) {
        alert('함수를 입력해주세요!');
        return;
    }

    showLoading(true);
    phoneDisplay.showLoading('근을 계산하는 중...');

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

        // 진행 상황 저장
        if (currentProblem) {
            storage.saveProgress(currentProblem.id, roots, 'solved');
        }

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

        // 답안 평가 (문제가 있는 경우)
        if (currentProblem) {
            evaluateAnswer(roots);
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
 * 답안 평가
 */
function evaluateAnswer(roots) {
    if (!currentProblem) return;

    const result = problemDB.evaluateAnswer(currentProblem.id, roots);

    if (result.success) {
        // 답안 저장
        storage.saveAnswer(
            currentProblem.id,
            roots,
            result.score,
            result.correct
        );

        // 결과 표시
        const resultDiv = document.createElement('div');
        resultDiv.className = `evaluation-result ${result.correct ? 'correct' : 'incorrect'}`;
        resultDiv.innerHTML = `
            <div class="result-header">
                <h3>${result.correct ? '🎉 정답!' : '📊 평가 결과'}</h3>
                <span class="score">${result.score}점</span>
            </div>
            <p>${result.feedback}</p>
            ${!result.correct ? `
                <p class="result-details">
                    • 찾은 근: ${result.correctCount}/${result.totalExpected}개<br>
                    ${result.missingRoots > 0 ? `• 누락된 근: ${result.missingRoots}개<br>` : ''}
                    ${result.extraRoots > 0 ? `• 잘못된 근: ${result.extraRoots}개` : ''}
                </p>
            ` : ''}
        `;

        const rootsList = document.getElementById('roots-list');
        if (rootsList) {
            rootsList.insertBefore(resultDiv, rootsList.firstChild);
        }
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
    html += `<div style="margin-bottom: 15px;"><strong>총 ${roots.length}개의 근:</strong></div>`;

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
 * Glow 설정 업데이트
 */
function updateGlowSettings() {
    const enabled = document.getElementById('glow-enabled')?.checked || true;
    const intensity = parseInt(document.getElementById('glow-intensity')?.value || 5);
    const color = document.getElementById('glow-color')?.value || '#00ffff';

    glowManager.updateSettings({ enabled, intensity, color });

    if (graphRenderer) {
        graphRenderer.updateGlowSettings(enabled, intensity, color);
    }
}

/**
 * 저장된 설정 복원
 */
function restoreSettings() {
    const settings = storage.getSettings();

    if (settings) {
        const glowEnabled = document.getElementById('glow-enabled');
        const glowIntensity = document.getElementById('glow-intensity');
        const glowColor = document.getElementById('glow-color');
        const intensityValue = document.getElementById('intensity-value');

        if (glowEnabled) glowEnabled.checked = settings.glowEnabled;
        if (glowIntensity) glowIntensity.value = settings.glowIntensity;
        if (glowColor) glowColor.value = settings.glowColor;
        if (intensityValue) intensityValue.textContent = settings.glowIntensity;

        updateGlowSettings();
    }
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
 * 키보드 단축키
 */
document.addEventListener('keydown', (e) => {
    // Ctrl + Enter: 근 찾기
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSolveClick();
    }

    // Ctrl + R: 새 문제 로드
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        loadRandomProblem();
    }

    // Ctrl + L: 문제 목록
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        showProblemListModal();
    }

    // ESC: 모달 닫기
    if (e.key === 'Escape') {
        closeProblemListModal();
    }
});

/**
 * 유틸리티 함수 (전역)
 */
window.rootGlowApp = {
    loadProblem,
    loadRandomProblem,
    updateGlowSettings,
    storage,
    problemDB,
    getCurrentState: () => ({
        function: currentFunction,
        roots: currentRoots,
        problem: currentProblem
    })
};

console.log('🎯 Root Glow 독립형 앱 준비 완료!');
console.log('단축키: Ctrl+Enter (근 찾기), Ctrl+R (새 문제), Ctrl+L (문제 목록)');
