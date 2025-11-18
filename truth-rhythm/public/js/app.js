/**
 * Truth Rhythm - Main Application
 * 앱 로직 및 상태 관리
 */

// API 설정
const API_BASE = '../api';
const API_ENDPOINTS = {
    auth: `${API_BASE}/auth.php`,
    questions: `${API_BASE}/questions.php`,
    moodle: `${API_BASE}/moodle-connector.php`
};

// 앱 상태
const AppState = {
    user: null,
    currentQuestion: null,
    currentSession: null,
    quizQuestions: [],
    currentQuestionIndex: 0,
    correctAnswers: 0,
    totalQuestions: 10,
    startTime: null
};

// DOM 요소
const elements = {
    // 화면
    loginScreen: document.getElementById('loginScreen'),
    mainScreen: document.getElementById('mainScreen'),
    quizScreen: document.getElementById('quizScreen'),
    resultScreen: document.getElementById('resultScreen'),

    // 로그인
    usernameInput: document.getElementById('usernameInput'),
    loginBtn: document.getElementById('loginBtn'),

    // 메인 화면
    displayUsername: document.getElementById('displayUsername'),
    accuracyRate: document.getElementById('accuracyRate'),
    currentStreak: document.getElementById('currentStreak'),
    bestStreak: document.getElementById('bestStreak'),
    logoutBtn: document.getElementById('logoutBtn'),

    // 메뉴
    startQuizBtn: document.getElementById('startQuizBtn'),
    practiceBtn: document.getElementById('practiceBtn'),
    statsBtn: document.getElementById('statsBtn'),
    settingsBtn: document.getElementById('settingsBtn'),

    // 퀴즈
    backBtn: document.getElementById('backBtn'),
    questionText: document.getElementById('questionText'),
    trueBtn: document.getElementById('trueBtn'),
    falseBtn: document.getElementById('falseBtn'),
    feedbackArea: document.getElementById('feedbackArea'),
    quizProgress: document.getElementById('quizProgress'),

    // 결과
    resultIcon: document.getElementById('resultIcon'),
    resultTitle: document.getElementById('resultTitle'),
    correctCount: document.getElementById('correctCount'),
    totalCount: document.getElementById('totalCount'),
    resultAccuracy: document.getElementById('resultAccuracy'),
    retryBtn: document.getElementById('retryBtn'),
    homeBtn: document.getElementById('homeBtn'),

    // 기타
    statusTime: document.getElementById('statusTime'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

/**
 * 초기화
 */
function init() {
    setupEventListeners();
    updateStatusTime();
    setInterval(updateStatusTime, 60000); // 1분마다 시간 업데이트

    // 세션 확인
    checkSession();
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 로그인
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // 로그아웃
    elements.logoutBtn.addEventListener('click', handleLogout);

    // 메뉴
    elements.startQuizBtn.addEventListener('click', startQuiz);
    elements.practiceBtn.addEventListener('click', startPractice);
    elements.statsBtn.addEventListener('click', showStats);
    elements.settingsBtn.addEventListener('click', showSettings);

    // 퀴즈
    elements.backBtn.addEventListener('click', () => showScreen('mainScreen'));
    elements.trueBtn.addEventListener('click', () => submitAnswer(true));
    elements.falseBtn.addEventListener('click', () => submitAnswer(false));

    // 결과
    elements.retryBtn.addEventListener('click', startQuiz);
    elements.homeBtn.addEventListener('click', () => showScreen('mainScreen'));
}

/**
 * 화면 전환
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    elements[screenId].classList.add('active');
}

/**
 * 로딩 표시
 */
function showLoading(show = true) {
    if (show) {
        elements.loadingOverlay.classList.add('active');
    } else {
        elements.loadingOverlay.classList.remove('active');
    }
}

/**
 * 상태바 시간 업데이트
 */
function updateStatusTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    elements.statusTime.textContent = `${hours}:${minutes}`;
}

/**
 * API 호출
 */
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include' // 세션 쿠키 포함
        });

        const data = await response.json();

        if (!data.success && data.error) {
            throw new Error(data.error);
        }

        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

/**
 * 세션 확인
 */
async function checkSession() {
    try {
        const response = await apiCall(API_ENDPOINTS.auth);

        if (response.logged_in && response.user) {
            AppState.user = response.user;
            updateUserInfo(response.user, response.progress);
            showScreen('mainScreen');
        } else {
            showScreen('loginScreen');
        }
    } catch (error) {
        console.error('Session check failed:', error);
        showScreen('loginScreen');
    }
}

/**
 * 로그인 처리
 */
async function handleLogin() {
    const username = elements.usernameInput.value.trim();

    if (!username) {
        alert('사용자 이름을 입력하세요.');
        return;
    }

    showLoading(true);

    try {
        const response = await apiCall(API_ENDPOINTS.auth + '?action=login', {
            method: 'POST',
            body: JSON.stringify({ username })
        });

        if (response.success) {
            AppState.user = response.data.user;
            updateUserInfo(response.data.user, response.data.progress);
            showScreen('mainScreen');
            elements.usernameInput.value = '';
        }
    } catch (error) {
        alert('로그인에 실패했습니다: ' + error.message);
    } finally {
        showLoading(false);
    }
}

/**
 * 로그아웃 처리
 */
async function handleLogout() {
    try {
        await apiCall(API_ENDPOINTS.auth + '?action=logout', {
            method: 'POST'
        });

        AppState.user = null;
        showScreen('loginScreen');
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

/**
 * 사용자 정보 업데이트
 */
function updateUserInfo(user, progress) {
    elements.displayUsername.textContent = user.username;
    elements.accuracyRate.textContent = `${progress.accuracy_rate.toFixed(1)}%`;
    elements.currentStreak.textContent = progress.current_streak;
    elements.bestStreak.textContent = progress.best_streak;
}

/**
 * 퀴즈 시작
 */
async function startQuiz() {
    showLoading(true);
    AppState.currentQuestionIndex = 0;
    AppState.correctAnswers = 0;
    AppState.quizQuestions = [];

    try {
        // 10개의 랜덤 문제 로드
        for (let i = 0; i < AppState.totalQuestions; i++) {
            const response = await apiCall(API_ENDPOINTS.questions + '?random=1');
            if (response.success && response.data) {
                AppState.quizQuestions.push(response.data);
            }
        }

        if (AppState.quizQuestions.length === 0) {
            alert('문제를 불러올 수 없습니다.');
            return;
        }

        AppState.totalQuestions = AppState.quizQuestions.length;
        showScreen('quizScreen');
        loadNextQuestion();
    } catch (error) {
        alert('문제를 불러오는 데 실패했습니다: ' + error.message);
    } finally {
        showLoading(false);
    }
}

/**
 * 연습 모드 시작
 */
async function startPractice() {
    AppState.totalQuestions = 1; // 연습은 한 문제씩
    await startQuiz();
}

/**
 * 다음 문제 로드
 */
function loadNextQuestion() {
    if (AppState.currentQuestionIndex >= AppState.quizQuestions.length) {
        showResults();
        return;
    }

    const question = AppState.quizQuestions[AppState.currentQuestionIndex];
    AppState.currentQuestion = question;
    AppState.startTime = Date.now();

    // UI 업데이트
    elements.questionText.textContent = question.question_text;
    elements.quizProgress.textContent = `${AppState.currentQuestionIndex + 1}/${AppState.totalQuestions}`;
    elements.feedbackArea.innerHTML = '';

    // 버튼 활성화
    elements.trueBtn.disabled = false;
    elements.falseBtn.disabled = false;
}

/**
 * 답안 제출
 */
async function submitAnswer(userAnswer) {
    // 버튼 비활성화
    elements.trueBtn.disabled = true;
    elements.falseBtn.disabled = true;

    const responseTime = Date.now() - AppState.startTime;

    showLoading(true);

    try {
        const response = await apiCall(API_ENDPOINTS.questions, {
            method: 'POST',
            body: JSON.stringify({
                question_id: AppState.currentQuestion.id,
                user_answer: userAnswer,
                response_time: responseTime,
                session_id: AppState.currentSession
            })
        });

        if (response.success) {
            const { is_correct, explanation, sound_file, session_id } = response.data;

            if (!AppState.currentSession) {
                AppState.currentSession = session_id;
            }

            // 사운드 재생
            if (is_correct) {
                soundManager.playEffect('correct');
                AppState.correctAnswers++;
            } else {
                soundManager.playEffect('incorrect');
            }

            // 피드백 표시
            showFeedback(is_correct, explanation);

            // 다음 문제로 이동 (2초 후)
            setTimeout(() => {
                AppState.currentQuestionIndex++;
                loadNextQuestion();
            }, 2000);
        }
    } catch (error) {
        alert('답안 제출에 실패했습니다: ' + error.message);
        elements.trueBtn.disabled = false;
        elements.falseBtn.disabled = false;
    } finally {
        showLoading(false);
    }
}

/**
 * 피드백 표시
 */
function showFeedback(isCorrect, explanation) {
    const feedbackClass = isCorrect ? 'feedback-correct' : 'feedback-incorrect';
    const feedbackIcon = isCorrect ? '✓' : '✗';
    const feedbackText = isCorrect ? '정답입니다!' : '틀렸습니다!';

    elements.feedbackArea.className = `feedback-area ${feedbackClass}`;
    elements.feedbackArea.innerHTML = `
        <div class="feedback-icon">${feedbackIcon}</div>
        <div class="feedback-text">${feedbackText}</div>
        ${explanation ? `<div class="feedback-explanation">${explanation}</div>` : ''}
    `;

    // 애니메이션 효과
    const answerBtn = isCorrect ? elements.trueBtn : elements.falseBtn;
    answerBtn.classList.add(isCorrect ? 'pulse' : 'shake');
    setTimeout(() => {
        answerBtn.classList.remove(isCorrect ? 'pulse' : 'shake');
    }, 500);
}

/**
 * 결과 표시
 */
function showResults() {
    const accuracy = (AppState.correctAnswers / AppState.totalQuestions * 100).toFixed(1);

    // 결과 아이콘 및 타이틀
    let icon, title;
    if (accuracy >= 90) {
        icon = '🎉';
        title = '완벽해요!';
        soundManager.playEffect('success');
    } else if (accuracy >= 70) {
        icon = '👏';
        title = '잘했어요!';
    } else if (accuracy >= 50) {
        icon = '👍';
        title = '괜찮아요!';
    } else {
        icon = '💪';
        title = '다시 도전해보세요!';
    }

    elements.resultIcon.textContent = icon;
    elements.resultTitle.textContent = title;
    elements.correctCount.textContent = AppState.correctAnswers;
    elements.totalCount.textContent = AppState.totalQuestions;
    elements.resultAccuracy.textContent = `${accuracy}%`;

    showScreen('resultScreen');

    // 세션 종료 처리 (선택사항)
    AppState.currentSession = null;
}

/**
 * 통계 보기
 */
function showStats() {
    alert('통계 기능은 곧 추가될 예정입니다!');
}

/**
 * 설정
 */
function showSettings() {
    const currentVolume = soundManager.volume;
    const newVolume = prompt(`사운드 볼륨 설정 (0-100):`, (currentVolume * 100).toFixed(0));

    if (newVolume !== null) {
        const volume = Math.max(0, Math.min(100, parseInt(newVolume) || 70)) / 100;
        soundManager.setVolume(volume);
        alert(`볼륨이 ${(volume * 100).toFixed(0)}%로 설정되었습니다.`);
    }
}

/**
 * 앱 시작
 */
document.addEventListener('DOMContentLoaded', init);
