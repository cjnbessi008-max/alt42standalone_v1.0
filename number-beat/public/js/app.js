/**
 * Number Beat Application
 * Main application entry point
 */

// Global game instance
let game = null;
let selectedDifficulty = 'easy';

/**
 * Initialize application
 */
function initApp() {
    // Create game instance
    game = new NumberBeatGame();

    // Setup event listeners
    setupEventListeners();

    console.log('Number Beat initialized');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Difficulty selection
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDifficulty = btn.dataset.difficulty;
        });
    });

    // Start button
    const startBtn = document.getElementById('startBtn');
    startBtn.addEventListener('click', () => {
        const studentId = parseInt(document.getElementById('studentId').value);

        if (!studentId || studentId < 1) {
            alert('올바른 학생 ID를 입력해주세요!');
            return;
        }

        game.startGame(studentId, selectedDifficulty);
    });

    // Clear button
    game.elements.clearBtn.addEventListener('click', () => {
        game.clearSelection();
    });

    // Submit button
    game.elements.submitBtn.addEventListener('click', () => {
        game.submitAnswer();
    });

    // Next button
    game.elements.nextBtn.addEventListener('click', () => {
        game.nextProblem();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Enter to submit
        if (e.key === 'Enter' && game.elements.gameScreen.classList.contains('active')) {
            game.submitAnswer();
        }

        // Escape to clear
        if (e.key === 'Escape' && game.elements.gameScreen.classList.contains('active')) {
            game.clearSelection();
        }

        // Space for next problem
        if (e.key === ' ' && game.elements.resultScreen.classList.contains('active')) {
            e.preventDefault();
            game.nextProblem();
        }

        // Number keys (1-9) to select numbers
        if (e.key >= '1' && e.key <= '9' && game.elements.gameScreen.classList.contains('active')) {
            const tiles = document.querySelectorAll('.number-tile:not(.selected)');
            const targetNumber = e.key;

            tiles.forEach(tile => {
                if (tile.textContent === targetNumber) {
                    tile.click();
                }
            });
        }
    });
}

/**
 * Load student data on page load
 */
async function loadInitialData() {
    const studentId = document.getElementById('studentId').value;

    if (studentId && game) {
        game.studentId = parseInt(studentId);
        await game.updateStatistics();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Load initial data after a short delay
setTimeout(loadInitialData, 500);
