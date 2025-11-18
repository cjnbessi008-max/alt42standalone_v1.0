/**
 * Number Melody - Main Application JavaScript
 * Interactive number learning with musical feedback
 */

// Configuration
const CONFIG = {
    apiUrl: '../api/api.php',
    userId: 1, // Will be set from Moodle session
    soundEnabled: true,
    animationDuration: 300
};

// Application State
const state = {
    currentProblem: null,
    userSequence: [],
    startTime: null,
    timerInterval: null,
    attempts: 0,
    correct: 0
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Number Melody App Initialized');
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    loadProblem();
    loadProgress();
    setupEventListeners();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Clear button
    document.getElementById('clear-btn').addEventListener('click', clearSequence);

    // Submit button
    document.getElementById('submit-btn').addEventListener('click', submitAnswer);

    // Modal buttons
    document.getElementById('next-problem-btn').addEventListener('click', function() {
        closeModal();
        loadProblem();
    });

    document.getElementById('try-again-btn').addEventListener('click', function() {
        closeModal();
        clearSequence();
    });
}

/**
 * Load a problem from the API
 */
async function loadProblem() {
    try {
        showLoading();

        const response = await fetch(`${CONFIG.apiUrl}?action=get_problem`);
        const data = await response.json();

        if (data.success) {
            state.currentProblem = data.problem;
            displayProblem(data.problem);
            startTimer();
        } else {
            showError('Failed to load problem');
        }
    } catch (error) {
        console.error('Error loading problem:', error);
        showError('Connection error. Please try again.');
    }
}

/**
 * Display problem on the screen
 */
function displayProblem(problem) {
    // Update problem info
    document.getElementById('problem-title').textContent = problem.title;
    document.getElementById('problem-description').textContent = problem.description;
    document.getElementById('difficulty-level').textContent = `Level: ${problem.difficulty}`;

    // Create number grid
    const numberGrid = document.getElementById('number-grid');
    numberGrid.innerHTML = '';

    const numbers = problem.number_sequence || [1, 2, 3, 4, 5, 6, 7, 8, 9];

    numbers.forEach(number => {
        const numberButton = document.createElement('button');
        numberButton.className = 'number-button';
        numberButton.textContent = number;
        numberButton.dataset.number = number;

        numberButton.addEventListener('click', function() {
            handleNumberTap(number, this);
        });

        numberGrid.appendChild(numberButton);
    });

    // Reset sequence
    clearSequence();
    hideLoading();
}

/**
 * Handle number tap
 */
function handleNumberTap(number, element) {
    // Add to sequence
    state.userSequence.push(number);

    // Visual feedback
    element.classList.add('tapped');
    setTimeout(() => element.classList.remove('tapped'), CONFIG.animationDuration);

    // Play sound
    playSound(number);

    // Update display
    updateSequenceDisplay();

    // Enable submit button
    document.getElementById('submit-btn').disabled = state.userSequence.length === 0;

    // Track interaction
    trackInteraction('tap', { number: number, position: state.userSequence.length });
}

/**
 * Update sequence display
 */
function updateSequenceDisplay() {
    const display = document.getElementById('sequence-display');

    if (state.userSequence.length === 0) {
        display.innerHTML = '<span class="empty-sequence">Tap numbers to start...</span>';
    } else {
        display.innerHTML = state.userSequence.map(num =>
            `<span class="sequence-number">${num}</span>`
        ).join('');
    }
}

/**
 * Clear sequence
 */
function clearSequence() {
    state.userSequence = [];
    updateSequenceDisplay();
    document.getElementById('submit-btn').disabled = true;

    // Remove all tapped classes
    document.querySelectorAll('.number-button').forEach(btn => {
        btn.classList.remove('tapped', 'disabled');
    });
}

/**
 * Submit answer
 */
async function submitAnswer() {
    if (state.userSequence.length === 0) return;

    // Stop timer
    stopTimer();

    // Prepare answer
    const answer = state.userSequence.join('');
    const timeSpent = Math.floor((Date.now() - state.startTime) / 1000);

    try {
        const response = await fetch(`${CONFIG.apiUrl}?action=submit_answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                problem_id: state.currentProblem.id,
                user_id: CONFIG.userId,
                answer: answer,
                time_spent: timeSpent
            })
        });

        const data = await response.json();

        if (data.success) {
            showResult(data.is_correct, data.message);

            // Update stats
            state.attempts++;
            if (data.is_correct) {
                state.correct++;
            }
            updateStats();
        } else {
            showError('Failed to submit answer');
        }
    } catch (error) {
        console.error('Error submitting answer:', error);
        showError('Connection error. Please try again.');
    }
}

/**
 * Show result modal
 */
function showResult(isCorrect, message) {
    const modal = document.getElementById('result-modal');
    const icon = document.getElementById('modal-icon');
    const title = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');

    if (isCorrect) {
        icon.textContent = '🎉';
        title.textContent = 'Correct!';
        messageEl.textContent = message;
        playCelebrationSound();
    } else {
        icon.textContent = '💭';
        title.textContent = 'Not quite...';
        messageEl.textContent = message;
    }

    modal.style.display = 'flex';
}

/**
 * Close modal
 */
function closeModal() {
    document.getElementById('result-modal').style.display = 'none';
}

/**
 * Load user progress
 */
async function loadProgress() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}?action=get_progress&user_id=${CONFIG.userId}`);
        const data = await response.json();

        if (data.success) {
            updateStatsFromServer(data.progress);
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

/**
 * Update stats display
 */
function updateStats() {
    const accuracy = state.attempts > 0 ? Math.round((state.correct / state.attempts) * 100) : 0;

    document.getElementById('total-attempts').textContent = state.attempts;
    document.getElementById('correct-attempts').textContent = state.correct;
    document.getElementById('accuracy').textContent = accuracy + '%';
}

/**
 * Update stats from server data
 */
function updateStatsFromServer(progress) {
    state.attempts = progress.total_attempts;
    state.correct = progress.correct_attempts;

    document.getElementById('total-attempts').textContent = progress.total_attempts;
    document.getElementById('correct-attempts').textContent = progress.correct_attempts;
    document.getElementById('accuracy').textContent = progress.accuracy + '%';
}

/**
 * Start timer
 */
function startTimer() {
    state.startTime = Date.now();

    state.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        document.getElementById('timer-display').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

/**
 * Stop timer
 */
function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

/**
 * Track user interaction
 */
async function trackInteraction(type, data) {
    try {
        await fetch(`${CONFIG.apiUrl}?action=save_interaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: CONFIG.userId,
                problem_id: state.currentProblem?.id || 0,
                type: type,
                data: data
            })
        });
    } catch (error) {
        console.error('Error tracking interaction:', error);
    }
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('number-grid').innerHTML =
        '<div class="loading">Loading problem...</div>';
}

/**
 * Hide loading state
 */
function hideLoading() {
    // Loading is automatically hidden when content is displayed
}

/**
 * Show error message
 */
function showError(message) {
    const feedbackArea = document.getElementById('feedback-area');
    feedbackArea.querySelector('.feedback-message').textContent = message;
    feedbackArea.classList.add('error');

    setTimeout(() => {
        feedbackArea.classList.remove('error');
    }, 3000);
}

/**
 * Get user ID from Moodle (if integrated)
 */
function getMoodleUserId() {
    // Check URL parameters for user ID from Moodle
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userid');

    if (userId) {
        CONFIG.userId = parseInt(userId);
    }

    return CONFIG.userId;
}

// Initialize user ID on load
getMoodleUserId();
