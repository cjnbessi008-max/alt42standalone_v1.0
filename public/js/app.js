/**
 * Main Application Logic - Student Learning Interface
 */

const API_BASE = '/api';
let authToken = null;
let currentUser = null;
let currentSession = null;
let currentProblem = null;
let currentAttempt = null;
let focusTracker = null;
let scoringEngine = null;
let selectedDifficulty = 4;
let problemTimer = null;
let sessionTimer = null;
let problemStartTime = null;
let sessionStats = {
    correct: 0,
    incorrect: 0,
    hintsUsed: 0
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserStatistics();
    scoringEngine = new ScoringEngine();
});

/**
 * Check authentication
 */
function checkAuth() {
    authToken = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (!authToken || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = JSON.parse(userStr);
    document.getElementById('user-name').textContent = currentUser.full_name;

    // Redirect teachers to dashboard
    if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
        window.location.href = 'dashboard.html';
    }
}

/**
 * Logout
 */
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

/**
 * API Request Helper
 */
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers
    };

    const response = await fetch(API_BASE + endpoint, {
        ...options,
        headers
    });

    if (response.status === 401) {
        logout();
        return null;
    }

    return await response.json();
}

/**
 * Load user statistics
 */
async function loadUserStatistics() {
    try {
        const data = await apiRequest(`/analytics.php?action=user_statistics&user_id=${currentUser.user_id}`);

        if (data && data.statistics) {
            document.getElementById('total-sessions').textContent = data.statistics.total_sessions || 0;
            document.getElementById('avg-score').textContent =
                Math.round(data.statistics.average_final_score || 0);
            document.getElementById('avg-focus').textContent =
                Math.round(data.statistics.average_focus_score || 0);
        }
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

/**
 * Select difficulty level
 */
function selectDifficulty(level) {
    selectedDifficulty = level;
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.difficulty-btn').classList.add('active');
}

/**
 * Start learning session
 */
async function startSession() {
    try {
        // Create session
        const sessionData = await apiRequest('/sessions.php', {
            method: 'POST',
            body: JSON.stringify({
                target_difficulty: selectedDifficulty,
                device_info: {
                    screen_width: window.innerWidth,
                    screen_height: window.innerHeight
                }
            })
        });

        if (!sessionData || !sessionData.success) {
            alert('세션 시작 실패');
            return;
        }

        currentSession = sessionData;

        // Initialize focus tracker
        focusTracker = new FocusTracker({
            sessionId: currentSession.session_id,
            authToken: authToken,
            onMetricsUpdate: updateMetricsDisplay
        });

        // Reset stats
        sessionStats = { correct: 0, incorrect: 0, hintsUsed: 0 };
        updateStatsDisplay();

        // Show learning screen
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('learning-screen').classList.remove('hidden');
        document.getElementById('metrics-panel').style.display = 'block';

        // Update difficulty badge
        document.getElementById('problem-difficulty').textContent = `난이도: ${selectedDifficulty}`;

        // Start session timer
        startSessionTimer();

        // Load first problem
        await loadNextProblem();

    } catch (error) {
        console.error('Failed to start session:', error);
        alert('세션 시작 중 오류가 발생했습니다.');
    }
}

/**
 * Load next problem
 */
async function loadNextProblem() {
    try {
        document.getElementById('problem-loading').classList.remove('hidden');
        document.getElementById('problem-content').classList.add('hidden');
        document.getElementById('result-panel').classList.add('hidden');
        document.getElementById('hint-panel').classList.add('hidden');

        // Get random problem for difficulty
        const data = await apiRequest(`/problems.php?difficulty=${selectedDifficulty}&limit=1`);

        if (!data || !data.problems || data.problems.length === 0) {
            alert('문제를 불러올 수 없습니다.');
            return;
        }

        currentProblem = data.problems[0];
        problemStartTime = Date.now();

        // Update problem number
        const problemNumber = sessionStats.correct + sessionStats.incorrect + 1;
        document.getElementById('problem-number').textContent = `문제 ${problemNumber}`;

        // Display problem
        displayProblem(currentProblem);

        // Reset timer
        resetProblemTimer();

        // Hide loading, show content
        document.getElementById('problem-loading').classList.add('hidden');
        document.getElementById('problem-content').classList.remove('hidden');

        // Reset buttons
        document.getElementById('submit-btn').classList.remove('hidden');
        document.getElementById('next-btn').classList.add('hidden');

    } catch (error) {
        console.error('Failed to load problem:', error);
        alert('문제 로딩 중 오류가 발생했습니다.');
    }
}

/**
 * Display problem
 */
function displayProblem(problem) {
    document.getElementById('problem-title').textContent = problem.title;
    document.getElementById('problem-description').textContent = problem.description;

    const answerInput = document.getElementById('answer-input');
    answerInput.innerHTML = '';

    if (problem.problem_type === 'multiple_choice') {
        const choices = problem.question_data.choices;
        const choicesHtml = choices.map((choice, index) => `
            <button class="choice-btn" onclick="selectChoice('${choice}', this)">
                ${String.fromCharCode(65 + index)}. ${choice}
            </button>
        `).join('');
        answerInput.innerHTML = choicesHtml;

    } else if (problem.problem_type === 'short_answer') {
        if (problem.question_data.format === 'fraction') {
            answerInput.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="number" class="form-control" id="numerator" placeholder="분자" style="max-width: 150px;">
                    <span style="font-size: 24px;">/</span>
                    <input type="number" class="form-control" id="denominator" placeholder="분모" style="max-width: 150px;">
                </div>
            `;
        } else {
            answerInput.innerHTML = `
                <input type="text" class="form-control" id="answer-text" placeholder="답을 입력하세요">
            `;
        }
    }
}

/**
 * Select choice (for multiple choice)
 */
let selectedAnswer = null;
function selectChoice(choice, button) {
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    button.classList.add('selected');
    selectedAnswer = choice;
}

/**
 * Show hint
 */
function showHint() {
    if (!currentProblem.hints || currentProblem.hints.length === 0) {
        alert('이 문제에는 힌트가 없습니다.');
        return;
    }

    const hintPanel = document.getElementById('hint-panel');
    const hintIndex = sessionStats.hintsUsed % currentProblem.hints.length;
    hintPanel.textContent = `💡 힌트: ${currentProblem.hints[hintIndex]}`;
    hintPanel.classList.remove('hidden');

    sessionStats.hintsUsed++;
}

/**
 * Submit answer
 */
async function submitAnswer() {
    let userAnswer;

    if (currentProblem.problem_type === 'multiple_choice') {
        if (!selectedAnswer) {
            alert('답을 선택해주세요.');
            return;
        }
        userAnswer = selectedAnswer;

    } else if (currentProblem.problem_type === 'short_answer') {
        if (currentProblem.question_data.format === 'fraction') {
            const numerator = document.getElementById('numerator').value;
            const denominator = document.getElementById('denominator').value;

            if (!numerator || !denominator) {
                alert('분자와 분모를 입력해주세요.');
                return;
            }

            userAnswer = {
                numerator: parseInt(numerator),
                denominator: parseInt(denominator)
            };
        } else {
            userAnswer = document.getElementById('answer-text').value;
            if (!userAnswer) {
                alert('답을 입력해주세요.');
                return;
            }
        }
    }

    const timeSpent = Math.floor((Date.now() - problemStartTime) / 1000);

    try {
        const result = await apiRequest('/problems.php', {
            method: 'POST',
            body: JSON.stringify({
                session_id: currentSession.session_id,
                problem_id: currentProblem.id,
                answer: userAnswer,
                time_spent_seconds: timeSpent,
                hints_used: sessionStats.hintsUsed
            })
        });

        if (!result || !result.success) {
            alert('답안 제출 실패');
            return;
        }

        // Update attempt ID for focus tracker
        currentAttempt = result.attempt_id;
        focusTracker.setAttemptId(currentAttempt);

        // Update stats
        if (result.is_correct) {
            sessionStats.correct++;
        } else {
            sessionStats.incorrect++;
        }
        updateStatsDisplay();

        // Show result
        showResult(result);

        // Update buttons
        document.getElementById('submit-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.remove('hidden');

    } catch (error) {
        console.error('Failed to submit answer:', error);
        alert('답안 제출 중 오류가 발생했습니다.');
    }
}

/**
 * Show result
 */
function showResult(result) {
    const resultPanel = document.getElementById('result-panel');
    resultPanel.classList.remove('hidden');

    if (result.is_correct) {
        resultPanel.className = 'results-panel correct';
        resultPanel.innerHTML = `
            <h3 style="color: var(--success-color);">✅ 정답입니다!</h3>
            <p>점수: ${result.score}/100</p>
            ${result.explanation ? `<p><strong>설명:</strong> ${result.explanation}</p>` : ''}
        `;

        // Mark correct choice
        document.querySelectorAll('.choice-btn').forEach(btn => {
            if (btn.textContent.includes(selectedAnswer)) {
                btn.classList.add('correct');
            }
        });

    } else {
        resultPanel.className = 'results-panel incorrect';
        resultPanel.innerHTML = `
            <h3 style="color: var(--danger-color);">❌ 틀렸습니다.</h3>
            <p><strong>정답:</strong> ${JSON.stringify(result.correct_answer.answer || result.correct_answer)}</p>
            ${result.explanation ? `<p><strong>설명:</strong> ${result.explanation}</p>` : ''}
        `;

        // Mark incorrect/correct choices
        document.querySelectorAll('.choice-btn').forEach(btn => {
            if (btn.textContent.includes(selectedAnswer)) {
                btn.classList.add('incorrect');
            }
            if (result.correct_answer && btn.textContent.includes(result.correct_answer.answer)) {
                btn.classList.add('correct');
            }
        });
    }
}

/**
 * Update stats display
 */
function updateStatsDisplay() {
    document.getElementById('correct-count').textContent = sessionStats.correct;
    document.getElementById('incorrect-count').textContent = sessionStats.incorrect;
}

/**
 * Update metrics display (callback from FocusTracker)
 */
function updateMetricsDisplay(metrics) {
    document.getElementById('attention-score').textContent = Math.round(metrics.attention_score);
    document.getElementById('attention-bar').style.width = metrics.attention_score + '%';
    document.getElementById('activity-ratio').textContent = Math.round(metrics.activity_ratio * 100) + '%';
    document.getElementById('interaction-count').textContent = metrics.interaction_count;
}

/**
 * Start session timer
 */
function startSessionTimer() {
    const startTime = Date.now();
    sessionTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('session-time').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

/**
 * Reset problem timer
 */
function resetProblemTimer() {
    if (problemTimer) clearInterval(problemTimer);

    let elapsed = 0;
    problemTimer = setInterval(() => {
        elapsed++;
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timerEl = document.getElementById('timer');
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Add warning class after estimated time
        if (currentProblem && elapsed > currentProblem.estimated_time) {
            timerEl.classList.add('warning');
        }
        if (elapsed > currentProblem.estimated_time * 1.5) {
            timerEl.classList.add('danger');
        }
    }, 1000);
}

/**
 * End session
 */
async function endSession() {
    if (!confirm('세션을 종료하시겠습니까?')) {
        return;
    }

    try {
        // Stop trackers
        if (focusTracker) await focusTracker.stop();
        if (problemTimer) clearInterval(problemTimer);
        if (sessionTimer) clearInterval(sessionTimer);

        // End session
        const result = await apiRequest('/sessions.php', {
            method: 'PUT',
            body: JSON.stringify({
                session_id: currentSession.session_id,
                status: 'completed'
            })
        });

        if (!result || !result.success) {
            alert('세션 종료 실패');
            return;
        }

        // Show results
        showResults(result.scores);

    } catch (error) {
        console.error('Failed to end session:', error);
        alert('세션 종료 중 오류가 발생했습니다.');
    }
}

/**
 * Show results screen
 */
function showResults(scores) {
    document.getElementById('learning-screen').classList.add('hidden');
    document.getElementById('metrics-panel').style.display = 'none';
    document.getElementById('results-screen').classList.remove('hidden');

    const finalScore = scores.final_score || 0;
    const focusScore = scores.focus_score || 0;
    const stabilityScore = scores.stability_score || 0;
    const accuracyRate = scores.accuracy_rate || 0;
    const duration = Math.round((scores.total_focus_time + scores.total_idle_time) / 60) || 0;

    // Update score circle
    const circumference = 377;
    const offset = circumference - (finalScore / 100) * circumference;
    document.getElementById('score-circle').style.strokeDashoffset = offset;
    document.getElementById('final-score-text').textContent = Math.round(finalScore);

    // Performance rating
    const rating = scoringEngine.getPerformanceRating(finalScore);
    document.getElementById('performance-rating').textContent = rating.label;
    document.getElementById('performance-rating').style.color = rating.color;

    // Update stats
    document.getElementById('result-focus-score').textContent = Math.round(focusScore);
    document.getElementById('result-stability-score').textContent = Math.round(stabilityScore);
    document.getElementById('result-accuracy').textContent = Math.round(accuracyRate) + '%';
    document.getElementById('result-duration').textContent = duration + '분';

    // Generate feedback
    const feedback = scoringEngine.getDifficultyFeedback(scores, selectedDifficulty);
    const feedbackContainer = document.getElementById('feedback-container');

    if (feedback.length > 0) {
        feedbackContainer.innerHTML = '<h3 class="card-title">피드백</h3><div class="feedback-list">' +
            feedback.map(item => `
                <div class="feedback-item ${item.type}">
                    <div class="feedback-icon">${item.icon}</div>
                    <div class="feedback-text">${item.message}</div>
                </div>
            `).join('') + '</div>';
    }
}

/**
 * View history (placeholder)
 */
function viewHistory() {
    alert('학습 기록 페이지는 준비 중입니다.');
}
