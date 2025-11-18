/**
 * Variable Dance - Main Application
 * 메인 앱 초기화 및 이벤트 핸들링
 */

// 전역 변수
let visualizer;
let variableDance;
let currentProblemId = null;

/**
 * 앱 초기화
 */
async function initApp() {
    console.log('🎭 Variable Dance 초기화 중...');

    // 시각화 엔진 초기화
    visualizer = new Visualizer('solutionCanvas');
    visualizer.clear();

    // Variable Dance 엔진 초기화
    variableDance = new VariableDance(visualizer);

    // 문제 목록 로드
    await loadProblems();

    console.log('✅ Variable Dance 초기화 완료');
}

/**
 * 문제 목록 로드
 */
async function loadProblems() {
    const problemList = document.getElementById('problemList');

    try {
        problemList.innerHTML = '<div class="loading"><div class="spinner"></div>문제를 불러오는 중...</div>';

        const problems = await API.getAllProblems();

        if (problems.length === 0) {
            problemList.innerHTML = '<p>등록된 문제가 없습니다.</p>';
            return;
        }

        problemList.innerHTML = '';

        problems.forEach(problem => {
            const card = createProblemCard(problem);
            problemList.appendChild(card);
        });

    } catch (error) {
        console.error('Failed to load problems:', error);
        problemList.innerHTML = '<p style="color: var(--error-color);">문제를 불러오는데 실패했습니다.</p>';
    }
}

/**
 * 문제 카드 생성
 */
function createProblemCard(problem) {
    const card = document.createElement('div');
    card.className = 'problem-card';
    card.dataset.problemId = problem.id;

    const difficultyClass = `badge-${problem.difficulty_level}`;
    const difficultyText = {
        'easy': '쉬움',
        'medium': '보통',
        'hard': '어려움'
    }[problem.difficulty_level] || problem.difficulty_level;

    const typeText = {
        'linear': '일차방정식',
        'quadratic': '이차방정식',
        'system': '연립방정식',
        'inequality': '부등식'
    }[problem.problem_type] || problem.problem_type;

    card.innerHTML = `
        <h3>${problem.title}</h3>
        <p>${problem.description}</p>
        <p style="font-family: monospace; color: var(--primary-color);">
            ${problem.equation.equation || ''}
        </p>
        <div>
            <span class="problem-badge ${difficultyClass}">${difficultyText}</span>
            <span class="problem-badge" style="background: var(--primary-color);">${typeText}</span>
        </div>
    `;

    card.addEventListener('click', () => {
        selectProblem(problem.id);
    });

    return card;
}

/**
 * 문제 선택
 */
async function selectProblem(problemId) {
    try {
        // 이전 선택 해제
        document.querySelectorAll('.problem-card').forEach(card => {
            card.classList.remove('active');
        });

        // 현재 선택 표시
        const selectedCard = document.querySelector(`[data-problem-id="${problemId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }

        // 스마트폰 표시
        showSmartphone();

        // 문제 로드
        currentProblemId = problemId;
        await variableDance.loadProblem(problemId);

        console.log('Problem selected:', problemId);

    } catch (error) {
        console.error('Failed to select problem:', error);
        alert('문제를 로드하는데 실패했습니다.');
    }
}

/**
 * 스마트폰 표시/숨김
 */
function toggleSmartphone() {
    const smartphone = document.querySelector('.smartphone');
    smartphone.classList.toggle('minimized');
}

function showSmartphone() {
    const smartphone = document.querySelector('.smartphone');
    smartphone.classList.remove('minimized');
}

function closeSmartphone() {
    const smartphone = document.querySelector('.smartphone');
    smartphone.classList.add('minimized');

    // 현재 선택 해제
    document.querySelectorAll('.problem-card').forEach(card => {
        card.classList.remove('active');
    });

    currentProblemId = null;
}

/**
 * Moodle 연결 테스트 (개발/디버그용)
 */
async function testMoodle() {
    try {
        console.log('Testing Moodle connection...');
        const result = await API.testMoodleConnection();
        console.log('Moodle connection result:', result);

        if (result.success) {
            alert(`Moodle 연결 성공!\nSite: ${result.sitename}\nVersion: ${result.version}`);
        } else {
            alert('Moodle 연결 실패: ' + result.error);
        }
    } catch (error) {
        console.error('Moodle connection test failed:', error);
        alert('Moodle 연결 테스트 실패: ' + error.message);
    }
}

/**
 * 키보드 단축키
 */
document.addEventListener('keydown', (e) => {
    // ESC: 스마트폰 닫기
    if (e.key === 'Escape') {
        closeSmartphone();
    }

    // Space: 스마트폰 토글
    if (e.key === ' ' && e.ctrlKey) {
        e.preventDefault();
        toggleSmartphone();
    }

    // M: Moodle 테스트 (개발용)
    if (e.key === 'm' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        testMoodle();
    }
});

/**
 * 페이지 언로드 시 세션 완료
 */
window.addEventListener('beforeunload', () => {
    if (variableDance && variableDance.sessionId) {
        // 비동기지만 브라우저가 허용하는 한 실행
        const stats = variableDance.getStatistics();
        const score = Math.min(100, stats.totalChanges * 10); // 간단한 점수 계산
        variableDance.completeSession(score);
    }
});

/**
 * 앱 시작
 */
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/**
 * 콘솔 환영 메시지
 */
console.log(`
%c🎭 Variable Dance
%c변수가 춤추는 수학 학습 시스템
%cMoodle 3.7 Integration | MySQL 5.7 | PHP 7.1.9

단축키:
- ESC: 스마트폰 닫기
- Ctrl+Space: 스마트폰 토글
- Ctrl+Shift+M: Moodle 연결 테스트
`,
    'font-size: 24px; font-weight: bold; color: #6366f1;',
    'font-size: 14px; color: #8b5cf6;',
    'font-size: 12px; color: #94a3b8;'
);
