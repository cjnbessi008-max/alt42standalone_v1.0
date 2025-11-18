/**
 * Chaos Harmony - Main Application
 * Integrates all components and handles user interactions
 */

// Global state
let currentStudentId = null;
let currentQuizId = null;
let chaosVisualization = null;
let updateInterval = null;

// Emotion label mapping (Korean)
const emotionLabels = {
    'neutral': '중립',
    'joy': '기쁨',
    'flow': '몰입',
    'struggle': '고민',
    'breakthrough': '돌파'
};

/**
 * Initialize application
 */
function init() {
    console.log('Chaos Harmony 초기화 중...');

    // Initialize Chaos Harmony visualization
    chaosVisualization = new ChaosHarmony('chaosCanvas');

    // Set up event listeners
    setupEventListeners();

    // Update phone time
    updatePhoneTime();
    setInterval(updatePhoneTime, 1000);

    // Load saved state from localStorage
    loadSavedState();

    console.log('Chaos Harmony 초기화 완료');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Load Quiz button
    document.getElementById('loadQuiz').addEventListener('click', handleLoadQuiz);

    // Sync Moodle button
    document.getElementById('syncMoodle').addEventListener('click', handleSyncMoodle);

    // Toggle Visualization button
    document.getElementById('toggleVisualization').addEventListener('click', handleToggleVisualization);

    // Input field enter key handlers
    document.getElementById('studentId').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLoadQuiz();
    });

    document.getElementById('quizId').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLoadQuiz();
    });
}

/**
 * Update phone time display
 */
function updatePhoneTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('phoneTime').textContent = `${hours}:${minutes}`;
}

/**
 * Load saved state from localStorage
 */
function loadSavedState() {
    const savedStudentId = localStorage.getItem('chaos_harmony_student_id');
    const savedQuizId = localStorage.getItem('chaos_harmony_quiz_id');

    if (savedStudentId) {
        document.getElementById('studentId').value = savedStudentId;
        currentStudentId = parseInt(savedStudentId);
    }

    if (savedQuizId) {
        document.getElementById('quizId').value = savedQuizId;
        currentQuizId = parseInt(savedQuizId);
    }

    // Auto-load if both IDs are present
    if (currentStudentId && currentQuizId) {
        setTimeout(() => handleLoadQuiz(), 500);
    }
}

/**
 * Save state to localStorage
 */
function saveState() {
    if (currentStudentId) {
        localStorage.setItem('chaos_harmony_student_id', currentStudentId);
    }
    if (currentQuizId) {
        localStorage.setItem('chaos_harmony_quiz_id', currentQuizId);
    }
}

/**
 * Update status info
 */
function updateStatus(message, type = 'info') {
    const statusInfo = document.getElementById('statusInfo');
    const colors = {
        info: '#60a5fa',
        success: '#4ade80',
        error: '#f87171',
        warning: '#fbbf24'
    };

    statusInfo.innerHTML = `
        <p style="border-left-color: ${colors[type]}">
            ${message}
        </p>
    `;
}

/**
 * Handle Load Quiz button click
 */
async function handleLoadQuiz() {
    const studentId = parseInt(document.getElementById('studentId').value);
    const quizId = parseInt(document.getElementById('quizId').value);

    if (!studentId || !quizId) {
        updateStatus('학생 ID와 퀴즈 ID를 모두 입력해주세요.', 'warning');
        return;
    }

    currentStudentId = studentId;
    currentQuizId = quizId;
    saveState();

    updateStatus('퀴즈 데이터를 불러오는 중...', 'info');

    try {
        // Load quiz questions
        const questionsData = await api.getQuestions(quizId);
        displayQuestions(questionsData.questions);

        // Load student attempts
        const attemptsData = await api.getAttempts(studentId, quizId);
        updateStats(attemptsData.attempts);

        // Load patterns
        await updatePatterns();

        // Start periodic updates
        startPeriodicUpdates();

        updateStatus(`퀴즈 로드 완료! (${questionsData.count}개 문제)`, 'success');
    } catch (error) {
        console.error('퀴즈 로드 실패:', error);
        updateStatus(`퀴즈 로드 실패: ${error.message}`, 'error');
    }
}

/**
 * Handle Sync Moodle button click
 */
async function handleSyncMoodle() {
    const quizId = parseInt(document.getElementById('quizId').value);

    if (!quizId) {
        updateStatus('퀴즈 ID를 입력해주세요.', 'warning');
        return;
    }

    updateStatus('Moodle과 동기화 중...', 'info');

    try {
        const result = await api.syncQuiz(quizId);

        if (result.success) {
            updateStatus(`동기화 완료! (${result.records}개 문제 동기화됨)`, 'success');

            // Reload quiz data
            if (currentStudentId) {
                await handleLoadQuiz();
            }
        } else {
            updateStatus(`동기화 실패: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Moodle 동기화 실패:', error);
        updateStatus(`동기화 실패: ${error.message}`, 'error');
    }
}

/**
 * Handle Toggle Visualization button click
 */
function handleToggleVisualization() {
    if (chaosVisualization.animationId) {
        chaosVisualization.stop();
        updateStatus('시각화 일시정지', 'info');
    } else {
        chaosVisualization.start();
        updateStatus('시각화 재개', 'info');
    }
}

/**
 * Display quiz questions
 */
function displayQuestions(questions) {
    const questionList = document.getElementById('questionList');
    const quizPanel = document.getElementById('quizPanel');

    if (!questions || questions.length === 0) {
        quizPanel.style.display = 'none';
        return;
    }

    quizPanel.style.display = 'block';
    questionList.innerHTML = '';

    questions.forEach((question, index) => {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        questionItem.innerHTML = `
            <div class="question-text">${index + 1}. ${escapeHtml(question.question_text)}</div>
            <div class="question-meta">
                <span class="question-type">${question.question_type}</span>
                <span class="question-difficulty">${question.difficulty_level}</span>
            </div>
        `;
        questionList.appendChild(questionItem);
    });
}

/**
 * Update statistics display
 */
function updateStats(attempts) {
    if (!attempts || attempts.length === 0) {
        document.getElementById('totalAttempts').textContent = '0';
        document.getElementById('accuracy').textContent = '0%';
        return;
    }

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(a => a.is_correct).length;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    document.getElementById('totalAttempts').textContent = totalAttempts;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
}

/**
 * Update patterns and visualization
 */
async function updatePatterns() {
    if (!currentStudentId) return;

    try {
        // Get patterns
        const patternsData = await api.getPatterns(currentStudentId);
        const patterns = patternsData.patterns || [];

        // Update visualization
        chaosVisualization.updatePatterns(patterns);

        // Update pattern bars
        updatePatternBars(patterns);

        // Get visualization state
        const vizState = await api.getVisualization(currentStudentId);
        updateVisualizationState(vizState);

    } catch (error) {
        console.error('패턴 업데이트 실패:', error);
    }
}

/**
 * Update pattern bars
 */
function updatePatternBars(patterns) {
    // Reset bars
    document.getElementById('successRhythm').style.width = '0%';
    document.getElementById('struggleWave').style.width = '0%';
    document.getElementById('speedPattern').style.width = '0%';

    // Update based on patterns
    patterns.forEach(pattern => {
        const percentage = Math.round(pattern.intensity * 100);

        switch (pattern.type) {
            case 'success_rhythm':
                document.getElementById('successRhythm').style.width = `${percentage}%`;
                break;
            case 'struggle_wave':
                document.getElementById('struggleWave').style.width = `${percentage}%`;
                break;
            case 'speed_pattern':
                document.getElementById('speedPattern').style.width = `${percentage}%`;
                break;
        }
    });
}

/**
 * Update visualization state (emotion, colors, etc.)
 */
function updateVisualizationState(state) {
    if (!state) return;

    // Update emotion label
    const emotion = state.current_emotion || 'neutral';
    const emotionText = emotionLabels[emotion] || emotion;
    document.getElementById('emotionLabel').textContent = emotionText;

    // Update phone screen emotion state
    const phoneScreen = document.querySelector('.phone-screen');
    phoneScreen.setAttribute('data-emotion', emotion);

    // Update visualization
    chaosVisualization.setEmotion(emotion);

    if (state.animation_speed) {
        chaosVisualization.setAnimationSpeed(parseFloat(state.animation_speed));
    }

    // Update colors if provided
    if (state.color_palette) {
        try {
            const colors = typeof state.color_palette === 'string'
                ? JSON.parse(state.color_palette)
                : state.color_palette;

            if (colors.primary) {
                chaosVisualization.colors.primary = colors.primary;
            }
        } catch (e) {
            console.error('색상 파싱 실패:', e);
        }
    }
}

/**
 * Start periodic updates
 */
function startPeriodicUpdates() {
    // Clear existing interval
    if (updateInterval) {
        clearInterval(updateInterval);
    }

    // Update every 5 seconds
    updateInterval = setInterval(async () => {
        if (currentStudentId) {
            await updatePatterns();

            // Refresh attempts
            if (currentQuizId) {
                const attemptsData = await api.getAttempts(currentStudentId, currentQuizId);
                updateStats(attemptsData.attempts);
            }
        }
    }, 5000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Demo mode - simulate data for testing without Moodle
 */
function enableDemoMode() {
    console.log('데모 모드 활성화');

    // Simulate patterns
    const demoPatterns = [
        { type: 'success_rhythm', intensity: 0.7, frequency: 0.6 },
        { type: 'struggle_wave', intensity: 0.4, frequency: 0.3 },
        { type: 'speed_pattern', intensity: 0.5, frequency: 0.4 }
    ];

    chaosVisualization.updatePatterns(demoPatterns);
    updatePatternBars(demoPatterns);

    // Update stats
    document.getElementById('totalAttempts').textContent = '42';
    document.getElementById('accuracy').textContent = '78%';

    // Set emotion
    const demoState = {
        current_emotion: 'flow',
        animation_speed: 1.2
    };
    updateVisualizationState(demoState);

    updateStatus('데모 모드 활성화 - 샘플 데이터 표시 중', 'info');
}

// Expose demo mode to console for testing
window.enableDemoMode = enableDemoMode;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Log instructions
console.log('%c🎨 Chaos Harmony', 'font-size: 24px; font-weight: bold; color: #667eea;');
console.log('%c데모 모드를 활성화하려면: enableDemoMode()', 'color: #cbd5e1;');
