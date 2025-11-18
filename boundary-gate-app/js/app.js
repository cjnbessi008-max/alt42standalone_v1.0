/**
 * Main Application Logic
 * Boundary Gate 앱의 메인 로직
 */

// 앱 상태 관리
const AppState = {
    currentProblem: null,
    score: 0,
    totalProblems: 0,
    correctAnswers: 0,
    studentId: 1, // 실제로는 Moodle에서 가져와야 함
    problems: [],
    currentProblemIndex: 0
};

/**
 * 앱 초기화
 */
async function initApp() {
    console.log('Initializing Boundary Gate App...');

    // 문제 로드
    await loadProblems();

    // 첫 번째 문제 표시
    if (AppState.problems.length > 0) {
        loadProblem(AppState.problems[0]);
    } else {
        // 샘플 문제 생성
        loadRandomProblem();
    }

    // 점수 초기화
    updateScore();
}

/**
 * Moodle에서 문제 목록 로드
 */
async function loadProblems() {
    try {
        AppState.problems = await moodleAPI.getProblems();
        console.log(`Loaded ${AppState.problems.length} problems`);
    } catch (error) {
        console.error('Failed to load problems:', error);
        // 샘플 문제 사용
        AppState.problems = moodleAPI.getSampleProblems();
    }
}

/**
 * 문제 표시
 * @param {object} problem - 표시할 문제
 */
function loadProblem(problem) {
    AppState.currentProblem = problem;

    // 숫자 업데이트
    updateNumber('leftNumber', problem.left_number);
    updateNumber('rightNumber', problem.right_number);

    // 문제 설명 업데이트
    const problemDesc = document.getElementById('problemDescription');
    if (problemDesc) {
        problemDesc.innerHTML = `
            <p><strong>문제 ${AppState.currentProblemIndex + 1}:</strong> ${problem.description}</p>
            <p>난이도: ${getDifficultyLabel(problem.difficulty)}</p>
        `;
    }

    // 게이트 초기화
    boundaryGate.reset();
    boundaryGate.enter();

    // 버튼 활성화
    enableAnswerButtons();

    // 다음 문제 버튼 숨기기
    document.getElementById('nextBtn').style.display = 'none';

    // 결과 메시지 숨기기
    const resultMsg = document.getElementById('resultMessage');
    resultMsg.className = 'result-message';
    resultMsg.textContent = '';
}

/**
 * 랜덤 문제 로드
 */
function loadRandomProblem() {
    const difficulty = getCurrentDifficulty();
    const problem = moodleAPI.generateRandomProblem(difficulty);
    AppState.problems.push(problem);
    loadProblem(problem);
}

/**
 * 현재 난이도 결정
 * @returns {string} - 난이도
 */
function getCurrentDifficulty() {
    const correctRate = AppState.totalProblems > 0
        ? AppState.correctAnswers / AppState.totalProblems
        : 0;

    if (correctRate >= 0.8) return 'hard';
    if (correctRate >= 0.5) return 'medium';
    return 'easy';
}

/**
 * 난이도 라벨 반환
 * @param {string} difficulty - 난이도
 * @returns {string} - 한글 라벨
 */
function getDifficultyLabel(difficulty) {
    const labels = {
        'easy': '쉬움 ⭐',
        'medium': '보통 ⭐⭐',
        'hard': '어려움 ⭐⭐⭐'
    };
    return labels[difficulty] || '보통';
}

/**
 * 숫자 업데이트 (애니메이션 효과 포함)
 * @param {string} elementId - 요소 ID
 * @param {number} value - 새로운 값
 */
function updateNumber(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('number-change');
        element.textContent = value;

        setTimeout(() => {
            element.classList.remove('number-change');
        }, 500);
    }
}

/**
 * 답안 확인
 * @param {string} answer - 사용자가 선택한 답안 ('ge' 또는 'le')
 */
function checkAnswer(answer) {
    if (!AppState.currentProblem) return;

    // 버튼 비활성화
    disableAnswerButtons();

    // 게이트 타입 설정
    boundaryGate.setType(answer);

    // 정답 확인
    const isCorrect = answer === AppState.currentProblem.correct_answer;
    AppState.totalProblems++;

    if (isCorrect) {
        handleCorrectAnswer();
    } else {
        handleIncorrectAnswer();
    }

    // Moodle에 답안 제출
    submitAnswerToMoodle(answer, isCorrect);

    // 다음 문제 버튼 표시
    setTimeout(() => {
        document.getElementById('nextBtn').style.display = 'block';
    }, 1500);
}

/**
 * 정답 처리
 */
function handleCorrectAnswer() {
    AppState.correctAnswers++;
    AppState.score += 10;

    // 게이트 정답 효과
    boundaryGate.showCorrectEffect();

    // 결과 메시지
    showResultMessage('정답입니다! 게이트가 열렸습니다! 🎉', 'correct');

    // 점수 업데이트
    updateScore();
}

/**
 * 오답 처리
 */
function handleIncorrectAnswer() {
    // 게이트 오답 효과
    boundaryGate.showIncorrectEffect();

    // 결과 메시지
    const correctSymbol = AppState.currentProblem.correct_answer === 'ge' ? '≥' : '≤';
    showResultMessage(`오답입니다. 정답은 ${correctSymbol} 입니다.`, 'incorrect');
}

/**
 * 결과 메시지 표시
 * @param {string} message - 메시지
 * @param {string} type - 'correct' 또는 'incorrect'
 */
function showResultMessage(message, type) {
    const resultMsg = document.getElementById('resultMessage');
    resultMsg.textContent = message;
    resultMsg.className = `result-message ${type}`;
}

/**
 * 점수 업데이트
 */
function updateScore() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = AppState.score;
        scoreElement.classList.add('number-change');
        setTimeout(() => {
            scoreElement.classList.remove('number-change');
        }, 500);
    }
}

/**
 * 답안 버튼 비활성화
 */
function disableAnswerButtons() {
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
    });
}

/**
 * 답안 버튼 활성화
 */
function enableAnswerButtons() {
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
        btn.disabled = false;
    });
}

/**
 * Moodle에 답안 제출
 * @param {string} answer - 답안
 * @param {boolean} isCorrect - 정답 여부
 */
async function submitAnswerToMoodle(answer, isCorrect) {
    try {
        await moodleAPI.submitAnswer(
            AppState.currentProblem.id,
            answer,
            AppState.studentId
        );
        console.log('Answer submitted to Moodle');
    } catch (error) {
        console.error('Failed to submit answer:', error);
    }
}

/**
 * 다음 문제 로드
 */
async function loadNextProblem() {
    // 게이트 사라지는 애니메이션
    await boundaryGate.exit();

    AppState.currentProblemIndex++;

    // 문제 목록에 다음 문제가 있는지 확인
    if (AppState.currentProblemIndex < AppState.problems.length) {
        loadProblem(AppState.problems[AppState.currentProblemIndex]);
    } else {
        // 새로운 랜덤 문제 생성
        loadRandomProblem();
    }
}

/**
 * 진행 상황 로드 (Moodle에서)
 */
async function loadProgress() {
    try {
        const progress = await moodleAPI.getProgress(AppState.studentId);
        AppState.score = progress.score || 0;
        AppState.totalProblems = progress.total_problems || 0;
        AppState.correctAnswers = progress.correct || 0;
        updateScore();
    } catch (error) {
        console.error('Failed to load progress:', error);
    }
}

/**
 * 힌트 표시
 */
function showHint() {
    if (!AppState.currentProblem) return;

    boundaryGate.showHint();

    const correctAnswer = AppState.currentProblem.correct_answer;
    const hintText = correctAnswer === 'ge'
        ? '힌트: 왼쪽 숫자가 오른쪽보다 크거나 같습니다'
        : '힌트: 왼쪽 숫자가 오른쪽보다 작거나 같습니다';

    boundaryGate.updateStatus(hintText);

    setTimeout(() => {
        boundaryGate.updateStatus('게이트가 닫혀있습니다');
    }, 3000);
}

// 앱 초기화 (DOM 로드 완료 후)
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    // boundaryGate가 초기화될 때까지 대기
    setTimeout(() => {
        initApp();
    }, 100);
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    if (e.key === '1') {
        checkAnswer('ge');
    } else if (e.key === '2') {
        checkAnswer('le');
    } else if (e.key === 'h' || e.key === 'H') {
        showHint();
    } else if (e.key === 'Enter') {
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn.style.display !== 'none') {
            loadNextProblem();
        }
    }
});
