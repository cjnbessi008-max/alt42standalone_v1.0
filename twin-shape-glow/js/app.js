/**
 * Twin Shape Glow - Main Application
 * Initialize and control the game
 */

// Global game instance
let game;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 */
async function initializeApp() {
    const gameCanvas = document.getElementById('game-canvas');

    if (!gameCanvas) {
        console.error('Game canvas not found');
        return;
    }

    // Create game instance
    game = new TwinShapeGame(gameCanvas, {
        userId: APP_CONFIG.userId,
        problemId: APP_CONFIG.problemId,
        difficulty: 1
    });

    // Register callbacks
    setupGameCallbacks();

    // Setup UI controls
    setupControls();

    // Update screen time
    updateScreenTime();
    setInterval(updateScreenTime, 60000); // Update every minute

    // Load and initialize game
    try {
        await game.initialize();
        showMessage('게임 준비 완료! 시작 버튼을 눌러주세요. / Game ready! Press start button.');
        updatePairsRemaining();
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showMessage('게임 로딩 실패 / Failed to load game', 'error');
    }

    // Load user progress if available
    if (APP_CONFIG.problemId) {
        loadUserProgress();
    }
}

/**
 * Setup game callbacks
 */
function setupGameCallbacks() {
    game.on('onScoreChange', function(score) {
        updateScore(score);
    });

    game.on('onPairMatch', function(shape1, shape2, matchedCount) {
        updatePairsRemaining();
        console.log(`Matched pair ${matchedCount}: ${shape1.id} & ${shape2.id}`);
    });

    game.on('onGameComplete', function(state) {
        console.log('Game completed!', state);
        showCompletionMessage(state);
    });

    game.on('onTimeUpdate', function(timeElapsed) {
        updateTimer(timeElapsed);
    });
}

/**
 * Setup UI controls
 */
function setupControls() {
    const btnStart = document.getElementById('btn-start');
    const btnReset = document.getElementById('btn-reset');
    const btnHint = document.getElementById('btn-hint');

    if (btnStart) {
        btnStart.addEventListener('click', function() {
            game.start();
            btnStart.textContent = '재시작 / Restart';
            showMessage('게임 시작! / Game started!', 'success');
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', function() {
            if (confirm('게임을 초기화하시겠습니까? / Reset the game?')) {
                game.reset();
                updateScore(0);
                updateTimer(0);
                updatePairsRemaining();
                showMessage('게임이 초기화되었습니다. / Game reset.', 'info');
            }
        });
    }

    if (btnHint) {
        btnHint.addEventListener('click', function() {
            game.showHint();
        });
    }
}

/**
 * Update score display
 */
function updateScore(score) {
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
        scoreEl.textContent = score;

        // Add animation
        scoreEl.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreEl.style.transform = 'scale(1)';
        }, 200);
    }
}

/**
 * Update timer display
 */
function updateTimer(seconds) {
    const timerEl = document.getElementById('timer');
    if (timerEl) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

/**
 * Update pairs remaining
 */
function updatePairsRemaining() {
    const pairsEl = document.getElementById('pairs-remaining');
    if (pairsEl && game.state) {
        const remaining = game.state.totalPairs - game.state.matchedPairs.length;
        pairsEl.textContent = remaining;

        // Add animation
        pairsEl.style.transform = 'scale(1.2)';
        setTimeout(() => {
            pairsEl.style.transform = 'scale(1)';
        }, 200);
    }
}

/**
 * Show message
 */
function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('game-message');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = `game-message ${type}`;
    }
}

/**
 * Show completion message
 */
function showCompletionMessage(state) {
    const accuracy = ((state.matchedPairs.length / state.attempts) * 100).toFixed(1);

    let message = `완료! 점수: ${state.score}, 시간: ${game.formatTime(state.timeElapsed)}, 정확도: ${accuracy}%`;
    message += ` / Complete! Score: ${state.score}, Time: ${game.formatTime(state.timeElapsed)}, Accuracy: ${accuracy}%`;

    showMessage(message, 'success');
}

/**
 * Update screen time in smartphone header
 */
function updateScreenTime() {
    const screenTimeEl = document.getElementById('screen-time');
    if (screenTimeEl) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        screenTimeEl.textContent = `${hours}:${minutes}`;
    }
}

/**
 * Load user progress from server
 */
async function loadUserProgress() {
    try {
        const response = await fetch(
            `api/get_progress.php?user_id=${APP_CONFIG.userId}&problem_id=${APP_CONFIG.problemId}`
        );

        const data = await response.json();

        if (data.success && data.progress) {
            displayProgressInfo(data.progress);
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

/**
 * Display user progress information
 */
function displayProgressInfo(progress) {
    const progressInfo = document.getElementById('progress-info');

    if (!progressInfo) return;

    const lastAttempt = progress.last_attempt_at
        ? new Date(progress.last_attempt_at).toLocaleString('ko-KR')
        : '없음 / None';

    progressInfo.innerHTML = `
        <h3>학습 진행 상황 / Progress</h3>
        <p><strong>시도 횟수 / Attempts:</strong> ${progress.attempts}</p>
        <p><strong>최고 점수 / Best Score:</strong> ${progress.score}</p>
        <p><strong>완료 여부 / Completed:</strong> ${progress.completed ? '✓ 완료 / Yes' : '✗ 미완료 / No'}</p>
        <p><strong>총 시간 / Total Time:</strong> ${game.formatTime(progress.time_spent)}</p>
        <p><strong>마지막 시도 / Last Attempt:</strong> ${lastAttempt}</p>
    `;

    progressInfo.style.display = 'block';
}

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', function(event) {
    if (!game) return;

    switch(event.key) {
        case 'r':
        case 'R':
            // Reset game
            game.reset();
            updateScore(0);
            updateTimer(0);
            updatePairsRemaining();
            break;

        case 's':
        case 'S':
            // Start game
            if (!game.state.isPlaying) {
                game.start();
            }
            break;

        case 'h':
        case 'H':
            // Show hint
            game.showHint();
            break;

        case 'Escape':
            // Deselect shape
            game.deselectShape();
            break;
    }
});

/**
 * Handle window resize
 */
window.addEventListener('resize', function() {
    // Could add responsive adjustments here if needed
    console.log('Window resized');
});

/**
 * Visibility change handler (pause when tab is hidden)
 */
document.addEventListener('visibilitychange', function() {
    if (document.hidden && game && game.state.isPlaying) {
        // Optionally pause the timer when tab is hidden
        console.log('Tab hidden - game continues');
    } else if (!document.hidden && game) {
        console.log('Tab visible');
    }
});

/**
 * Export game instance for debugging
 */
window.TwinShapeGameInstance = game;
