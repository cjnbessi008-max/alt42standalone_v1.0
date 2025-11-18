/**
 * Main Application Script
 * Initializes and coordinates all modules
 */

// Global instances
window.canvasManager = null;
window.shapeManager = null;
window.difficultySelector = null;

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing Area Recombination App...');

    // Initialize managers
    window.canvasManager = new CanvasManager('shape-canvas');
    window.shapeManager = new ShapeManager();
    window.difficultySelector = new DifficultySelector();

    // Initialize UI event listeners
    initializeUIEvents();

    // Load initial data
    loadInitialData();

    console.log('App initialized successfully');
}

/**
 * Initialize UI event listeners
 */
function initializeUIEvents() {
    // Header buttons
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            UIHelpers.switchScreen('shape-selection-screen');
            backBtn.style.display = 'none';
        });
    }

    const infoBtn = document.getElementById('info-btn');
    if (infoBtn) {
        infoBtn.addEventListener('click', showInfo);
    }

    // Tool buttons
    const cutModeBtn = document.getElementById('cut-mode-btn');
    if (cutModeBtn) {
        cutModeBtn.addEventListener('click', () => {
            setToolMode('cut');
        });
    }

    const moveModeBtn = document.getElementById('move-mode-btn');
    if (moveModeBtn) {
        moveModeBtn.addEventListener('click', () => {
            setToolMode('move');
        });
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (window.canvasManager) {
                window.canvasManager.reset();
            }
        });
    }

    // Validate button
    const validateBtn = document.getElementById('validate-btn');
    if (validateBtn) {
        validateBtn.addEventListener('click', handleValidation);
    }

    // Result screen buttons
    const tryAgainBtn = document.getElementById('try-again-btn');
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
            UIHelpers.switchScreen('canvas-screen');
            if (window.canvasManager) {
                window.canvasManager.reset();
            }
        });
    }

    const nextShapeBtn = document.getElementById('next-shape-btn');
    if (nextShapeBtn) {
        nextShapeBtn.addEventListener('click', () => {
            UIHelpers.switchScreen('shape-selection-screen');
            document.getElementById('back-btn').style.display = 'none';
            // Reload progress
            UIHelpers.updateProgressDisplay();
        });
    }
}

/**
 * Load initial data
 */
async function loadInitialData() {
    try {
        // Load shapes for default difficulty
        const shapes = await window.shapeManager.loadShapes(1);
        window.shapeManager.displayShapes(shapes);

        // Load user progress
        await UIHelpers.updateProgressDisplay();

    } catch (error) {
        console.error('Failed to load initial data:', error);
        UIHelpers.showToast('초기 데이터를 불러오는데 실패했습니다', 'error');
    }
}

/**
 * Set tool mode (cut or move)
 */
function setToolMode(mode) {
    // Update button states
    const cutBtn = document.getElementById('cut-mode-btn');
    const moveBtn = document.getElementById('move-mode-btn');

    if (mode === 'cut') {
        cutBtn.classList.add('active');
        moveBtn.classList.remove('active');
    } else {
        cutBtn.classList.remove('active');
        moveBtn.classList.add('active');
    }

    // Update canvas mode
    if (window.canvasManager) {
        window.canvasManager.setMode(mode);
    }
}

/**
 * Handle area validation
 */
async function handleValidation() {
    if (!window.canvasManager) {
        UIHelpers.showToast('캔버스가 초기화되지 않았습니다', 'error');
        return;
    }

    const result = await window.canvasManager.validate();

    if (!result) {
        return; // Error already handled
    }

    // Show result screen
    displayResult(result);
}

/**
 * Display validation result
 */
function displayResult(result) {
    UIHelpers.switchScreen('result-screen');

    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resultDetails = document.getElementById('result-details');
    const resultScore = document.getElementById('result-score');

    if (result.is_valid) {
        // Success
        resultIcon.className = 'result-icon success';
        resultIcon.textContent = '✓';
        resultTitle.textContent = '성공!';
        resultDetails.innerHTML = `
            <p>${result.message}</p>
            <p style="margin-top: 10px;">
                <strong>원래 넓이:</strong> ${Math.round(result.original_area)}<br>
                <strong>계산된 넓이:</strong> ${Math.round(result.calculated_area)}<br>
                <strong>차이:</strong> ${Math.round(result.difference)}
            </p>
        `;
        resultScore.textContent = `${result.score}점`;

        // Play success sound (if enabled)
        playSound('success');

    } else {
        // Failed
        resultIcon.className = 'result-icon error';
        resultIcon.textContent = '✗';
        resultTitle.textContent = '다시 시도해보세요';
        resultDetails.innerHTML = `
            <p>${result.message}</p>
            <p style="margin-top: 10px;">
                <strong>원래 넓이:</strong> ${Math.round(result.original_area)}<br>
                <strong>계산된 넓이:</strong> ${Math.round(result.calculated_area)}<br>
                <strong>차이:</strong> ${Math.round(result.difference)}
            </p>
        `;
        resultScore.textContent = `시도 횟수: ${result.attempts}`;

        // Play error sound (if enabled)
        playSound('error');
    }
}

/**
 * Show info dialog
 */
function showInfo() {
    UIHelpers.showToast('도형을 자르고 재배열해도 넓이는 변하지 않습니다!', 'info');
}

/**
 * Play sound effect
 */
function playSound(type) {
    // Implement sound effects if needed
    // For now, just use Web Audio API beep

    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'success') {
            oscillator.frequency.value = 523.25; // C5
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } else if (type === 'error') {
            oscillator.frequency.value = 220; // A3
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    } catch (error) {
        // Sound not supported or disabled
        console.log('Sound not available');
    }
}

/**
 * Handle window resize
 */
function handleResize() {
    // Adjust canvas if needed
    if (window.canvasManager) {
        window.canvasManager.draw();
    }
}

/**
 * Debug mode toggle (Ctrl+Shift+D)
 */
function initDebugMode() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            console.log('=== DEBUG INFO ===');
            console.log('Moodle User ID:', CONFIG.MOODLE_USER_ID);
            console.log('Moodle Course ID:', CONFIG.MOODLE_COURSE_ID);
            console.log('Canvas Manager:', window.canvasManager);
            console.log('Shape Manager:', window.shapeManager);
            console.log('Current Shapes:', window.shapeManager?.shapes);
            console.log('Current Pieces:', window.canvasManager?.pieces);
            console.log('==================');
        }
    });
}

/**
 * Service Worker registration (for offline support)
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered:', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
    }
}

/**
 * Check for updates
 */
async function checkForUpdates() {
    try {
        const response = await fetch('/version.json');
        const data = await response.json();

        if (data.version !== CONFIG.APP_VERSION) {
            UIHelpers.showToast('새로운 버전이 있습니다! 새로고침하세요.', 'info');
        }
    } catch (error) {
        // Silently fail
    }
}

/**
 * Error handler
 */
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);

    if (CONFIG.APP_DEBUG) {
        UIHelpers.showToast(`오류: ${e.error.message}`, 'error');
    } else {
        UIHelpers.showToast('오류가 발생했습니다. 페이지를 새로고침해주세요.', 'error');
    }
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e.reason);

    if (CONFIG.APP_DEBUG) {
        UIHelpers.showToast(`Promise 오류: ${e.reason}`, 'error');
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Initialize debug mode
initDebugMode();

// Handle window resize
window.addEventListener('resize', handleResize);

// Register service worker (optional)
// registerServiceWorker();

// Check for updates periodically (optional)
// setInterval(checkForUpdates, 60000); // Every minute
