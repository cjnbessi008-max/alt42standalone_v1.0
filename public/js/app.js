/**
 * Color Pattern Classifier - Frontend JavaScript
 * Handles user interactions and API calls
 */

// Global state
const state = {
    userId: 1, // Default user ID (would come from Moodle in production)
    courseId: 1, // Default course ID
    currentProblem: null,
    currentAttempt: null,
    selectedColor: null,
    templates: [],
    startTime: null,
    timerInterval: null
};

// API endpoints
const API = {
    baseUrl: '/api',
    getProblem: '/api/get_problem.php',
    startAttempt: '/api/start_attempt.php',
    submitAnswer: '/api/submit_answer.php',
    getProgress: '/api/get_progress.php'
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('Color Pattern App initialized');
    loadPatternTemplates();
    loadUserProgress();
});

// Show/Hide screens
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showWelcomeScreen() {
    showScreen('welcome-screen');
    stopTimer();
}

function showGameScreen() {
    showScreen('game-screen');
}

function showResultScreen() {
    showScreen('result-screen');
    stopTimer();
}

function showProgressScreen() {
    showScreen('progress-screen');
    loadUserProgress();
}

// Loading overlay
function showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

// Load pattern templates
async function loadPatternTemplates() {
    try {
        const response = await fetch(`${API.getProblem}?random=1`);
        const data = await response.json();

        if (data.success && data.templates) {
            state.templates = data.templates;
            displayPatternTemplates(data.templates);
        }
    } catch (error) {
        console.error('Failed to load pattern templates:', error);
    }
}

function displayPatternTemplates(templates) {
    const container = document.getElementById('pattern-templates');
    container.innerHTML = templates.map(template => `
        <div class="pattern-item">
            <div class="pattern-color" style="background-color: ${template.color_code}"></div>
            <div style="flex: 1;">
                <div class="pattern-name">${template.name}</div>
                <div class="pattern-desc">${template.description}</div>
            </div>
        </div>
    `).join('');
}

// Timer functions
function startTimer() {
    state.startTime = Date.now();
    state.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!state.startTime) return;

    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    document.getElementById('timer').textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

function getElapsedTime() {
    if (!state.startTime) return 0;
    return Math.floor((Date.now() - state.startTime) / 1000);
}

// Start game
async function startGame() {
    showLoading();

    try {
        const difficultyLevel = document.getElementById('difficulty-select').value;

        // Get random problem
        const problemResponse = await fetch(
            `${API.getProblem}?random=1&difficulty_level=${difficultyLevel}`
        );
        const problemData = await problemResponse.json();

        if (!problemData.success) {
            throw new Error(problemData.error || 'Failed to load problem');
        }

        state.currentProblem = problemData.problem;

        // Start attempt
        const attemptResponse = await fetch(API.startAttempt, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: state.userId,
                problem_id: state.currentProblem.id
            })
        });

        const attemptData = await attemptResponse.json();

        if (!attemptData.success) {
            throw new Error(attemptData.error || 'Failed to start attempt');
        }

        state.currentAttempt = attemptData.attempt;
        state.selectedColor = null;

        // Display problem
        displayProblem(state.currentProblem);
        displayColorOptions(problemData.templates);

        // Update UI
        document.getElementById('attempt-number').textContent =
            state.currentAttempt.attempt_number;

        showGameScreen();
        startTimer();

    } catch (error) {
        console.error('Start game error:', error);
        alert('게임을 시작할 수 없습니다: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Display problem
function displayProblem(problem) {
    const container = document.getElementById('sequence-display');
    container.innerHTML = problem.sequence_data.map(num => `
        <div class="sequence-number">${num}</div>
    `).join('');
}

// Display color options
function displayColorOptions(templates) {
    const container = document.getElementById('color-options');
    container.innerHTML = templates.map(template => `
        <div class="color-btn" onclick="selectColor('${template.pattern_type}', '${template.color_code}', '${template.name}')">
            <div class="color-indicator" style="background-color: ${template.color_code}"></div>
            <div class="color-name">${template.name}</div>
        </div>
    `).join('');
}

// Select color
function selectColor(patternType, colorCode, colorName) {
    state.selectedColor = {
        type: patternType,
        code: colorCode,
        name: colorName
    };

    // Update UI
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.closest('.color-btn').classList.add('selected');

    const selectedBox = document.getElementById('selected-color');
    selectedBox.textContent = colorName;
    selectedBox.style.backgroundColor = colorCode;
    selectedBox.style.color = 'white';
}

// Submit answer
async function submitAnswer() {
    if (!state.selectedColor) {
        alert('패턴을 선택해주세요!');
        return;
    }

    showLoading();

    try {
        const timeSpent = getElapsedTime();

        // Prepare answer (for now, single classification)
        const studentAnswer = [state.selectedColor.type];

        const response = await fetch(API.submitAnswer, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                attempt_id: state.currentAttempt.id,
                problem_id: state.currentProblem.id,
                student_answer: studentAnswer,
                time_spent: timeSpent,
                sync_to_moodle: false // Set to true in production
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to submit answer');
        }

        displayResult(data);
        showResultScreen();

    } catch (error) {
        console.error('Submit answer error:', error);
        alert('답안 제출에 실패했습니다: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Display result
function displayResult(data) {
    const result = data.result;

    // Result icon
    const icon = document.getElementById('result-icon');
    if (result.is_correct) {
        icon.textContent = '🎉';
    } else if (result.score >= 70) {
        icon.textContent = '😊';
    } else {
        icon.textContent = '🤔';
    }

    // Result title and message
    document.getElementById('result-title').textContent =
        result.is_correct ? '정답입니다!' : '다시 도전!';
    document.getElementById('result-message').textContent = data.message;

    // Score
    document.getElementById('result-score').textContent = Math.round(result.score);

    // Detailed feedback
    const detailsContainer = document.getElementById('result-details');
    detailsContainer.innerHTML = `
        <p><strong>정답:</strong> ${result.correct_count} / ${result.total_count}</p>
        <p><strong>소요 시간:</strong> ${formatTime(data.attempt.time_spent)}</p>
    `;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
}

// Next problem
function nextProblem() {
    startGame();
}

// Load user progress
async function loadUserProgress() {
    try {
        const response = await fetch(`${API.getProgress}?user_id=${state.userId}&type=statistics`);
        const data = await response.json();

        if (data.success) {
            displayUserProgress(data);
        }
    } catch (error) {
        console.error('Failed to load progress:', error);
    }
}

function displayUserProgress(data) {
    const stats = data.statistics;

    // Update header
    const level = Math.floor((stats.problems_attempted || 0) / 5) + 1;
    document.getElementById('user-level').textContent = `Lv. ${level}`;
    document.getElementById('user-score').textContent =
        `${Math.round(stats.average_score || 0)}점`;

    // Progress screen
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.problems_attempted || 0}</div>
                <div class="stat-label">도전한 문제</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.correct_attempts || 0}</div>
                <div class="stat-label">정답 수</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(stats.average_score || 0)}</div>
                <div class="stat-label">평균 점수</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.success_rate || 0}%</div>
                <div class="stat-label">정답률</div>
            </div>
        `;
    }

    // Pattern progress
    const patternProgress = document.getElementById('pattern-progress');
    if (patternProgress && data.by_pattern && data.by_pattern.length > 0) {
        patternProgress.innerHTML = `
            <h3>패턴별 진행률</h3>
            ${data.by_pattern.map(pattern => `
                <div class="progress-bar-container">
                    <div class="progress-bar-label">
                        <span>${pattern.pattern_type}</span>
                        <span>${Math.round(pattern.average_score || 0)}점</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${pattern.average_score || 0}%"></div>
                    </div>
                </div>
            `).join('')}
        `;
    }
}

// Leaderboard
async function showLeaderboard() {
    showLoading();

    try {
        const response = await fetch(`${API.getProgress}?type=leaderboard&limit=10`);
        const data = await response.json();

        if (data.success) {
            // TODO: Display leaderboard
            alert('리더보드 기능은 곧 제공됩니다!');
        }
    } catch (error) {
        console.error('Failed to load leaderboard:', error);
        alert('리더보드를 불러올 수 없습니다.');
    } finally {
        hideLoading();
    }
}
