// Main Application Logic
let currentProblem = null;
let sessionId = generateSessionId();

/**
 * Initialize the application
 */
function init() {
    console.log('🌳 Concept Tree App initialized');
    console.log('Session ID:', sessionId);

    // Load default problem
    loadProblem();

    // Test API connection
    testConnections();
}

/**
 * Test backend and Moodle connections
 */
async function testConnections() {
    try {
        const moodleTest = await api.testMoodleConnection();
        console.log('Moodle connection:', moodleTest.success ? '✓' : '✗');
    } catch (error) {
        console.warn('Could not test Moodle connection:', error.message);
    }
}

/**
 * Load problem from Moodle
 */
async function loadProblem() {
    const select = document.getElementById('problem-select');
    const problemId = parseInt(select.value);

    showStatus('문제를 불러오는 중...', 'info');

    try {
        const response = await api.getProblem(problemId);

        if (!response.success) {
            throw new Error(response.error || 'Failed to load problem');
        }

        currentProblem = response.data;

        // Display problem
        displayProblem(currentProblem);

        showStatus('✓ 문제를 성공적으로 불러왔습니다', 'success');

        // Auto-hide success message
        setTimeout(() => {
            hideStatus();
        }, 2000);

    } catch (error) {
        console.error('Error loading problem:', error);
        showStatus(`✗ 오류: ${error.message}`, 'error');
    }
}

/**
 * Display problem in the smartphone screen
 * @param {object} problem - Problem data
 */
function displayProblem(problem) {
    const titleEl = document.getElementById('problem-title');
    const contentEl = document.getElementById('problem-content');
    const numbersEl = document.getElementById('problem-numbers');

    titleEl.textContent = `문제 #${problem.moodle_problem_id}`;
    contentEl.innerHTML = `<p>${problem.problem_text}</p>`;

    // Extract and display clickable numbers
    const numbers = problem.numbers || [];

    if (numbers.length > 0) {
        numbersEl.innerHTML = numbers.map(num =>
            `<div class="number-badge" onclick="showConceptTree(${num})">${num}</div>`
        ).join('');
    } else {
        numbersEl.innerHTML = '<p style="color: #999; font-size: 0.85em;">숫자를 찾을 수 없습니다</p>';
    }
}

/**
 * Show concept tree for a number
 * @param {number} number - The number to show concepts for
 */
async function showConceptTree(number) {
    // Highlight selected number
    document.querySelectorAll('.number-badge').forEach(badge => {
        badge.classList.remove('selected');
        if (parseInt(badge.textContent) === number) {
            badge.classList.add('selected');
        }
    });

    try {
        showStatus(`${number}의 개념 트리를 불러오는 중...`, 'info');

        // Fetch concept tree
        const response = await api.getConceptTree(number);

        if (!response.success) {
            throw new Error('Failed to fetch concept tree');
        }

        // Render tree
        await conceptTree.render(response.data);

        // Track interaction
        trackInteraction(number);

        hideStatus();

    } catch (error) {
        console.error('Error showing concept tree:', error);
        showStatus(`✗ 개념 트리를 불러올 수 없습니다: ${error.message}`, 'error');

        // Still show tree with error state
        conceptTree.showEmptyState();
    }
}

/**
 * Show concept tree by number input
 */
async function showConceptTreeByNumber() {
    const input = document.getElementById('number-input');
    const number = parseInt(input.value);

    if (isNaN(number) || number < 1 || number > 100) {
        showStatus('1-100 사이의 숫자를 입력하세요', 'error');
        return;
    }

    await showConceptTree(number);
}

/**
 * Close concept tree
 */
function closeConceptTree() {
    conceptTree.hide();

    // Remove selection
    document.querySelectorAll('.number-badge').forEach(badge => {
        badge.classList.remove('selected');
    });
}

/**
 * Track user interaction
 * @param {number} clickedNumber - The number that was clicked
 */
async function trackInteraction(clickedNumber) {
    try {
        await api.trackInteraction({
            userId: null, // Set if user authentication is implemented
            problemId: currentProblem ? currentProblem.id : null,
            clickedNumber: clickedNumber,
            conceptId: null,
            sessionId: sessionId
        });
    } catch (error) {
        console.warn('Failed to track interaction:', error);
    }
}

/**
 * Show status message
 * @param {string} message - Message text
 * @param {string} type - Message type (success, error, info)
 */
function showStatus(message, type) {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
}

/**
 * Hide status message
 */
function hideStatus() {
    const statusEl = document.getElementById('status-message');
    statusEl.className = 'status-message';
}

/**
 * Generate a unique session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Handle keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
    // ESC to close concept tree
    if (e.key === 'Escape') {
        closeConceptTree();
    }

    // Enter to show concept tree from number input
    if (e.key === 'Enter' && document.activeElement.id === 'number-input') {
        showConceptTreeByNumber();
    }
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Expose functions globally
window.loadProblem = loadProblem;
window.showConceptTree = showConceptTree;
window.showConceptTreeByNumber = showConceptTreeByNumber;
window.closeConceptTree = closeConceptTree;
