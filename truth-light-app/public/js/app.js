/**
 * Truth Light App - Frontend Logic
 * 명제의 참/거짓을 조명 밝기로 표현하는 학습 앱
 */

// API 기본 URL (환경에 맞게 수정)
const API_BASE_URL = window.location.origin + '/api/api.php';

// 앱 상태
const AppState = {
    sessionId: null,
    sessionToken: null,
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    questions: [],
    startTime: null,
    questionStartTime: null,
    isAnswering: false
};

// DOM 요소
const elements = {
    startOverlay: document.getElementById('startOverlay'),
    questionContainer: document.getElementById('questionContainer'),
    questionNumber: document.getElementById('questionNumber'),
    questionCategory: document.getElementById('questionCategory'),
    questionText: document.getElementById('questionText'),
    btnTrue: document.getElementById('btnTrue'),
    btnFalse: document.getElementById('btnFalse'),
    answerButtons: document.getElementById('answerButtons'),
    feedbackContainer: document.getElementById('feedbackContainer'),
    feedbackMessage: document.getElementById('feedbackMessage'),
    btnNext: document.getElementById('btnNext'),
    lightBulb: document.getElementById('lightBulb'),
    lightGlow: document.getElementById('lightGlow'),
    lightLabel: document.getElementById('lightLabel'),
    ambientLight: document.getElementById('ambientLight'),
    progressFill: document.getElementById('progressFill'),
    correctCount: document.getElementById('correctCount'),
    totalCount: document.getElementById('totalCount'),
    accuracyRate: document.getElementById('accuracyRate'),
    studyTime: document.getElementById('studyTime')
};

/**
 * API 호출 헬퍼 함수
 */
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}/${endpoint}`;
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showError('서버와의 통신에 실패했습니다. 다시 시도해주세요.');
        throw error;
    }
}

/**
 * 학습 시작
 */
async function startLearning() {
    try {
        // 시작 화면 숨기기
        elements.startOverlay.classList.add('hidden');

        // 세션 시작
        const sessionResponse = await apiCall('session', 'POST', {
            user_id: 1 // 기본 사용자 (추후 로그인 시스템과 연동)
        });

        AppState.sessionId = sessionResponse.session_id;
        AppState.sessionToken = sessionResponse.session_token;
        AppState.startTime = Date.now();

        console.log('Session started:', sessionResponse);

        // 문제 로드
        await loadQuestions();

        // 첫 번째 문제 표시
        loadNextQuestion();

        // 학습 시간 타이머 시작
        startStudyTimer();

    } catch (error) {
        console.error('Failed to start learning:', error);
        showError('학습을 시작하는 중 오류가 발생했습니다.');
    }
}

/**
 * 문제 목록 로드
 */
async function loadQuestions() {
    try {
        const response = await apiCall('questions?limit=10');

        if (response.success && response.data.length > 0) {
            AppState.questions = response.data;
            AppState.totalQuestions = response.data.length;
            AppState.questionIndex = 0;

            updateStats();
        } else {
            throw new Error('No questions available');
        }
    } catch (error) {
        console.error('Failed to load questions:', error);
        showError('문제를 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 다음 문제 로드
 */
function loadNextQuestion() {
    // 모든 문제를 풀었는지 확인
    if (AppState.questionIndex >= AppState.questions.length) {
        finishLearning();
        return;
    }

    // 현재 문제 설정
    AppState.currentQuestion = AppState.questions[AppState.questionIndex];
    AppState.questionStartTime = Date.now();
    AppState.isAnswering = true;

    // UI 업데이트
    elements.questionNumber.textContent = `문제 ${AppState.questionIndex + 1}`;
    elements.questionCategory.textContent = AppState.currentQuestion.category || 'General';
    elements.questionText.textContent = AppState.currentQuestion.question_text;

    // 피드백 숨기기, 버튼 활성화
    elements.feedbackContainer.style.display = 'none';
    elements.answerButtons.style.display = 'grid';
    elements.btnTrue.disabled = false;
    elements.btnFalse.disabled = false;

    // 조명 초기화
    resetLight();

    // 통계 업데이트
    updateStats();

    console.log('Question loaded:', AppState.currentQuestion);
}

/**
 * 답변 제출
 */
async function submitAnswer(userAnswer) {
    if (!AppState.isAnswering) return;

    AppState.isAnswering = false;

    // 버튼 비활성화
    elements.btnTrue.disabled = true;
    elements.btnFalse.disabled = true;

    // 소요 시간 계산
    const timeSpent = Math.floor((Date.now() - AppState.questionStartTime) / 1000);

    try {
        const response = await apiCall('answer', 'POST', {
            session_id: AppState.sessionId,
            question_id: AppState.currentQuestion.id,
            answer: userAnswer,
            time_spent: timeSpent,
            confidence_level: 100 // 추후 확신도 입력 기능 추가 가능
        });

        if (response.success) {
            // 정답 여부에 따라 조명 변경
            updateLight(response.is_correct, response.light_brightness);

            // 통계 업데이트
            if (response.is_correct) {
                AppState.correctAnswers++;
            }
            AppState.questionIndex++;

            // 피드백 표시
            showFeedback(response.is_correct, response.message);

            updateStats();

        } else {
            throw new Error('Failed to submit answer');
        }
    } catch (error) {
        console.error('Failed to submit answer:', error);
        showError('답변 제출 중 오류가 발생했습니다.');
        AppState.isAnswering = true;
        elements.btnTrue.disabled = false;
        elements.btnFalse.disabled = false;
    }
}

/**
 * 조명 상태 업데이트 (Truth Light 핵심 기능)
 */
function updateLight(isCorrect, brightness) {
    const bulbIcon = elements.lightBulb.querySelector('.bulb-icon');

    if (isCorrect) {
        // 참 - 밝은 조명
        elements.lightGlow.classList.remove('active-false');
        elements.lightGlow.classList.add('active-true');
        bulbIcon.classList.add('lit');
        elements.lightLabel.textContent = '참 (True) ✓';
        elements.lightLabel.style.color = '#52c234';
        elements.ambientLight.classList.remove('glow-false');
        elements.ambientLight.classList.add('glow-true');
    } else {
        // 거짓 - 어두운 조명
        elements.lightGlow.classList.remove('active-true');
        elements.lightGlow.classList.add('active-false');
        bulbIcon.classList.remove('lit');
        elements.lightLabel.textContent = '거짓 (False) ✗';
        elements.lightLabel.style.color = '#e74c3c';
        elements.ambientLight.classList.remove('glow-true');
        elements.ambientLight.classList.add('glow-false');
    }

    console.log(`Light updated: ${isCorrect ? 'TRUE' : 'FALSE'}, brightness: ${brightness}`);
}

/**
 * 조명 초기화
 */
function resetLight() {
    const bulbIcon = elements.lightBulb.querySelector('.bulb-icon');

    elements.lightGlow.classList.remove('active-true', 'active-false');
    bulbIcon.classList.remove('lit');
    elements.lightLabel.textContent = '답을 선택하세요';
    elements.lightLabel.style.color = '#2c3e50';
    elements.ambientLight.classList.remove('glow-true', 'glow-false');
}

/**
 * 피드백 표시
 */
function showFeedback(isCorrect, message) {
    elements.feedbackMessage.textContent = message;
    elements.feedbackMessage.className = 'feedback-message ' + (isCorrect ? 'correct' : 'incorrect');

    elements.answerButtons.style.display = 'none';
    elements.feedbackContainer.style.display = 'block';
}

/**
 * 통계 업데이트
 */
function updateStats() {
    // 진도 바
    const progress = AppState.totalQuestions > 0
        ? (AppState.questionIndex / AppState.totalQuestions) * 100
        : 0;
    elements.progressFill.style.width = `${progress}%`;

    // 정답/총 문제 수
    elements.correctCount.textContent = `정답: ${AppState.correctAnswers}`;
    elements.totalCount.textContent = `총 문제: ${AppState.questionIndex}`;

    // 정답률
    const accuracy = AppState.questionIndex > 0
        ? ((AppState.correctAnswers / AppState.questionIndex) * 100).toFixed(1)
        : 0;
    elements.accuracyRate.textContent = `${accuracy}%`;
}

/**
 * 학습 종료
 */
async function finishLearning() {
    try {
        // 세션 종료
        const response = await apiCall('session', 'PUT', {
            session_id: AppState.sessionId
        });

        // 결과 표시
        const accuracy = ((AppState.correctAnswers / AppState.totalQuestions) * 100).toFixed(1);
        const studyTimeMinutes = Math.floor((Date.now() - AppState.startTime) / 60000);

        elements.questionText.innerHTML = `
            <h2>학습 완료! 🎉</h2>
            <div style="margin-top: 1rem;">
                <p><strong>총 문제:</strong> ${AppState.totalQuestions}개</p>
                <p><strong>정답:</strong> ${AppState.correctAnswers}개</p>
                <p><strong>정답률:</strong> ${accuracy}%</p>
                <p><strong>학습 시간:</strong> ${studyTimeMinutes}분</p>
            </div>
        `;

        elements.answerButtons.style.display = 'none';
        elements.feedbackContainer.style.display = 'none';

        // 축하 조명 효과
        updateLight(true, 100);

        console.log('Learning session completed:', response);

    } catch (error) {
        console.error('Failed to finish learning:', error);
    }
}

/**
 * 학습 시간 타이머
 */
function startStudyTimer() {
    setInterval(() => {
        if (AppState.startTime) {
            const minutes = Math.floor((Date.now() - AppState.startTime) / 60000);
            elements.studyTime.textContent = `${minutes}분`;
        }
    }, 1000);
}

/**
 * 에러 표시
 */
function showError(message) {
    alert(message); // 추후 더 나은 에러 모달로 개선 가능
    console.error(message);
}

/**
 * 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Truth Light App initialized');

    // 시작 화면 표시
    elements.startOverlay.classList.remove('hidden');

    // 키보드 단축키 (선택사항)
    document.addEventListener('keydown', (e) => {
        if (AppState.isAnswering) {
            if (e.key === '1' || e.key.toLowerCase() === 't') {
                submitAnswer(true);
            } else if (e.key === '2' || e.key.toLowerCase() === 'f') {
                submitAnswer(false);
            }
        } else if (e.key === 'Enter' && elements.feedbackContainer.style.display !== 'none') {
            loadNextQuestion();
        }
    });
});

// 전역 함수로 노출 (HTML onclick에서 사용)
window.startLearning = startLearning;
window.submitAnswer = submitAnswer;
window.loadNextQuestion = loadNextQuestion;
