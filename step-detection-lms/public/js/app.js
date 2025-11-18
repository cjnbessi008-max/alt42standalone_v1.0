/**
 * Step Detection LMS - Student Interface
 */

const API_BASE = '/api/v1';

// Application State
const state = {
    studentId: 1, // TODO: Get from authentication
    currentProblem: null,
    currentSolution: null,
    currentStepIndex: 0,
    steps: [],
    totalStartTime: null,
    stepStartTime: null,
    hintUsed: {},
    stepSubmissions: []
};

// Utility Functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function getDifficultyStars(level) {
    return '★'.repeat(level) + '☆'.repeat(5 - level);
}

// API Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || 'API request failed');
    }

    return result.data;
}

// Problem Selection
async function loadProblems(filters = {}) {
    try {
        const params = new URLSearchParams(filters).toString();
        const problems = await apiCall(`/problems?${params}`);

        const problemList = document.getElementById('problemList');
        problemList.innerHTML = '';

        problems.forEach(problem => {
            const card = document.createElement('div');
            card.className = 'problem-card';
            card.innerHTML = `
                <h3>${problem.title}</h3>
                <p>${problem.description.substring(0, 100)}...</p>
                <div class="meta">
                    <span class="difficulty-stars">${getDifficultyStars(problem.difficulty_level)}</span>
                    <span>${problem.expected_time_seconds / 60}분</span>
                </div>
            `;
            card.onclick = () => startProblem(problem.id);
            problemList.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load problems:', error);
        alert('문제 목록을 불러올 수 없습니다.');
    }
}

// Start Problem
async function startProblem(problemId) {
    try {
        const data = await apiCall('/solutions/start', 'POST', {
            student_id: state.studentId,
            problem_id: problemId
        });

        state.currentSolution = data.solution_id;
        state.currentProblem = data.problem;
        state.steps = data.problem.steps;
        state.currentStepIndex = 0;
        state.totalStartTime = Date.now();
        state.stepSubmissions = [];
        state.hintUsed = {};

        // Show problem solving screen
        showScreen('problemSolving');

        // Display problem info
        document.getElementById('problemTitle').textContent = data.problem.title;
        document.getElementById('problemDescription').textContent = data.problem.description;

        // Start timers
        startTimers();

        // Render first step
        renderCurrentStep();

    } catch (error) {
        console.error('Failed to start problem:', error);
        alert('문제를 시작할 수 없습니다.');
    }
}

// Render Current Step
function renderCurrentStep() {
    const step = state.steps[state.currentStepIndex];

    document.getElementById('stepTitle').textContent = `${state.currentStepIndex + 1}. ${step.display_name}`;
    document.getElementById('stepDescription').textContent = step.description || '';

    // Render progress indicator
    renderProgress();

    // Render input area
    renderInputArea(step);

    // Reset step timer
    state.stepStartTime = Date.now();

    // Setup hint button
    const hintButton = document.getElementById('hintButton');
    const hintContent = document.getElementById('hintContent');

    hintButton.onclick = () => {
        hintContent.textContent = step.hint_text;
        hintContent.classList.remove('hidden');
        state.hintUsed[step.id] = true;

        // Track hint view
        apiCall('/solutions/hint', 'POST', {
            solution_id: state.currentSolution,
            step_id: step.id
        });
    };

    // Reset UI
    document.getElementById('hintContent').classList.add('hidden');
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('nextButton').classList.add('hidden');
}

function renderProgress() {
    const container = document.getElementById('stepProgress');
    container.innerHTML = '<div class="progress-steps"></div>';
    const stepsDiv = container.querySelector('.progress-steps');

    state.steps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'progress-step';

        if (index < state.currentStepIndex) {
            stepEl.classList.add('completed');
        } else if (index === state.currentStepIndex) {
            stepEl.classList.add('active');
        }

        stepEl.innerHTML = `<div>${step.display_name}</div>`;
        stepsDiv.appendChild(stepEl);
    });
}

function renderInputArea(step) {
    const inputArea = document.getElementById('inputArea');

    // Generic text input for MVP
    inputArea.innerHTML = `
        <label for="stepInput">${step.display_name}을(를) 입력하세요:</label>
        <input type="text" id="stepInput" placeholder="답을 입력하세요..." />
    `;

    // Focus on input
    document.getElementById('stepInput').focus();
}

// Check Answer
async function checkAnswer() {
    const step = state.steps[state.currentStepIndex];
    const input = document.getElementById('stepInput').value.trim();

    if (!input) {
        alert('답을 입력해주세요.');
        return;
    }

    const timeSpent = Math.floor((Date.now() - state.stepStartTime) / 1000);

    // For MVP, accept any non-empty answer as correct
    // In production, implement proper validation
    const isCorrect = true;

    try {
        await apiCall('/solutions/submit-step', 'POST', {
            solution_id: state.currentSolution,
            step_id: step.id,
            student_input: input,
            is_correct: isCorrect,
            time_spent: timeSpent,
            hint_used: state.hintUsed[step.id] || false
        });

        state.stepSubmissions.push({
            step_id: step.id,
            input,
            is_correct: isCorrect,
            time_spent: timeSpent
        });

        // Show feedback
        const feedback = document.getElementById('feedback');
        feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
        feedback.textContent = isCorrect ? '✅ 정답입니다!' : '❌ 다시 시도해보세요.';

        if (isCorrect) {
            document.getElementById('checkButton').classList.add('hidden');
            document.getElementById('nextButton').classList.remove('hidden');
        }

    } catch (error) {
        console.error('Failed to submit step:', error);
        alert('답안 제출에 실패했습니다.');
    }
}

// Next Step
function nextStep() {
    if (state.currentStepIndex < state.steps.length - 1) {
        state.currentStepIndex++;
        renderCurrentStep();
        document.getElementById('checkButton').classList.remove('hidden');
    } else {
        // All steps completed
        submitFinalSolution();
    }
}

// Submit Final Solution
async function submitFinalSolution() {
    const totalTime = Math.floor((Date.now() - state.totalStartTime) / 1000);

    // Calculate score based on steps
    const correctSteps = state.stepSubmissions.filter(s => s.is_correct).length;
    const score = Math.round((correctSteps / state.steps.length) * 100);

    try {
        const result = await apiCall('/solutions/submit-final', 'POST', {
            solution_id: state.currentSolution,
            final_answer: state.stepSubmissions[state.stepSubmissions.length - 1].input,
            is_correct: score >= 70,
            score: score
        });

        // Show results
        showResults(score, totalTime, result.detections, result.trust_score);

    } catch (error) {
        console.error('Failed to submit final solution:', error);
        alert('최종 제출에 실패했습니다.');
    }
}

// Show Results
function showResults(score, totalTime, detections, trustScore) {
    showScreen('resultsScreen');

    document.getElementById('finalScore').textContent = score;
    document.getElementById('totalTime').textContent = formatTime(totalTime);
    document.getElementById('stepsCompleted').textContent = `${state.steps.length}/${state.steps.length}`;

    const hintsUsedCount = Object.keys(state.hintUsed).length;
    document.getElementById('hintsUsed').textContent = hintsUsedCount;
    document.getElementById('trustScore').textContent = Math.round(trustScore);

    // Show detections if any
    const detectionsSection = document.getElementById('detectionsSection');
    if (detections && detections.length > 0) {
        detectionsSection.innerHTML = '<h3>⚠️ 검토 사항</h3>';

        detections.forEach(detection => {
            const card = document.createElement('div');
            card.className = `detection-card ${detection.severity}`;
            card.innerHTML = `
                <h4>${getDetectionTitle(detection.type)}
                    <span class="confidence">신뢰도: ${detection.confidence}%</span>
                </h4>
                <p>${detection.description}</p>
            `;
            detectionsSection.appendChild(card);
        });
    } else {
        detectionsSection.innerHTML = '<div class="no-detections">✅ 모든 단계를 정상적으로 완료했습니다!</div>';
    }
}

function getDetectionTitle(type) {
    const titles = {
        'time_anomaly': '⏱️ 시간 이상',
        'logical_inconsistency': '🔗 논리적 불일치',
        'sequence_violation': '📝 순서 위반',
        'hint_dependency': '💡 힌트 의존'
    };
    return titles[type] || type;
}

// Timers
function startTimers() {
    setInterval(() => {
        if (state.totalStartTime) {
            const elapsed = Math.floor((Date.now() - state.totalStartTime) / 1000);
            document.getElementById('totalTimer').textContent = formatTime(elapsed);
        }

        if (state.stepStartTime) {
            const elapsed = Math.floor((Date.now() - state.stepStartTime) / 1000);
            document.getElementById('stepTimer').textContent = formatTime(elapsed);
        }
    }, 1000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load initial problems
    loadProblems();

    // Filter listeners
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        const filters = {
            category: e.target.value,
            difficulty: document.getElementById('difficultyFilter').value
        };
        loadProblems(filters);
    });

    document.getElementById('difficultyFilter').addEventListener('change', (e) => {
        const filters = {
            category: document.getElementById('categoryFilter').value,
            difficulty: e.target.value
        };
        loadProblems(filters);
    });

    // Back button
    document.getElementById('backButton').addEventListener('click', () => {
        if (confirm('진행 중인 풀이를 종료하시겠습니까?')) {
            showScreen('problemSelection');
            loadProblems();
        }
    });

    // Check button
    document.getElementById('checkButton').addEventListener('click', checkAnswer);

    // Next button
    document.getElementById('nextButton').addEventListener('click', nextStep);

    // New problem button
    document.getElementById('newProblemButton').addEventListener('click', () => {
        showScreen('problemSelection');
        loadProblems();
    });
});
