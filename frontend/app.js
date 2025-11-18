/**
 * Inequality Arrow App - Main Application Logic
 * Handles UI interactions, animations, and API communication
 */

// Application State
const AppState = {
    userId: 1, // Default user ID (would come from login)
    sessionId: null,
    currentProblem: null,
    selectedOperator: null,
    startTime: null,
    score: 0,
    totalProblems: 0,
    correctAnswers: 0,
    settings: {
        animation_speed: 'medium',
        arrow_color: '#FF5722',
        enable_sound: true,
        enable_haptics: true,
        theme: 'light'
    },
    apiBaseUrl: '../backend/api.php'
};

// Animation speed mapping
const AnimationSpeeds = {
    slow: 2000,
    medium: 1500,
    fast: 1000
};

/**
 * Initialize the application
 */
async function initApp() {
    showLoading(true);

    try {
        // Load user settings
        await loadUserSettings();

        // Create new session
        await createSession();

        // Load first problem
        await loadNewProblem();

        showLoading(false);
    } catch (error) {
        console.error('Initialization error:', error);
        showError('앱을 시작하는 중 오류가 발생했습니다.');
        showLoading(false);
    }
}

/**
 * Create a new learning session
 */
async function createSession() {
    try {
        const response = await fetch(AppState.apiBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'create_session',
                user_id: AppState.userId,
                moodle_course_id: getMoodleCourseId()
            })
        });

        const data = await response.json();

        if (data.success && data.session) {
            AppState.sessionId = data.session.session_id;
            console.log('Session created:', AppState.sessionId);
        } else {
            throw new Error('Failed to create session');
        }
    } catch (error) {
        console.error('Create session error:', error);
        // Continue with local session ID
        AppState.sessionId = 'local_' + Date.now();
    }
}

/**
 * Load a new problem
 */
async function loadNewProblem() {
    showLoading(true);

    try {
        const response = await fetch(
            `${AppState.apiBaseUrl}?action=get_problem&difficulty=easy`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (data.success && data.problem) {
            AppState.currentProblem = data.problem;
            displayProblem(data.problem);
            resetArrowDisplay();
            AppState.startTime = Date.now();
        } else {
            throw new Error('No problem received');
        }
    } catch (error) {
        console.error('Load problem error:', error);
        // Use fallback problem
        const fallbackProblem = {
            id: Math.floor(Math.random() * 1000),
            problem_text: '두 숫자를 비교하세요',
            left_value: Math.floor(Math.random() * 20) + 1,
            right_value: Math.floor(Math.random() * 20) + 1,
            correct_operator: '>'
        };
        AppState.currentProblem = fallbackProblem;
        displayProblem(fallbackProblem);
        resetArrowDisplay();
        AppState.startTime = Date.now();
    }

    showLoading(false);
}

/**
 * Display problem on screen
 */
function displayProblem(problem) {
    document.getElementById('leftNumber').textContent = problem.left_value;
    document.getElementById('rightNumber').textContent = problem.right_value;
    document.getElementById('operatorBox').textContent = '?';
    document.getElementById('problemText').textContent = problem.problem_text || '두 숫자를 비교하세요';

    // Update smartphone display
    document.getElementById('compLeft').textContent = problem.left_value;
    document.getElementById('compRight').textContent = problem.right_value;
    document.getElementById('compOperator').textContent = '?';

    // Clear previous selection
    document.querySelectorAll('.operator-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Hide result message
    const resultMsg = document.getElementById('resultMessage');
    resultMsg.classList.remove('show', 'correct', 'incorrect');
}

/**
 * Select operator
 */
function selectOperator(operator) {
    AppState.selectedOperator = operator;

    // Highlight selected button
    document.querySelectorAll('.operator-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`[data-operator="${operator}"]`).classList.add('selected');

    // Update operator display
    document.getElementById('operatorBox').textContent = operator;
    document.getElementById('compOperator').textContent = operator;

    // Animate arrow
    animateArrow(operator);

    // Play sound effect
    playSound(operator);

    // Trigger haptic feedback
    triggerHaptic();

    // Submit response after delay
    setTimeout(() => {
        submitResponse();
    }, 1000);
}

/**
 * Animate arrow based on operator
 */
function animateArrow(operator) {
    // Hide all arrows
    document.querySelectorAll('.arrow-group').forEach(group => {
        group.style.display = 'none';
    });

    // Show appropriate arrow
    let arrowId, directionText, arrowColor;

    switch (operator) {
        case '<':
            arrowId = 'arrowLeft';
            directionText = '← 왼쪽이 작습니다';
            arrowColor = '#2196F3';
            break;
        case '>':
            arrowId = 'arrowRight';
            directionText = '→ 오른쪽이 작습니다';
            arrowColor = '#FF5722';
            break;
        case '=':
            arrowId = 'arrowEqual';
            directionText = '= 같습니다';
            arrowColor = '#4CAF50';
            break;
    }

    const arrowElement = document.getElementById(arrowId);
    if (arrowElement) {
        arrowElement.style.display = 'block';

        // Apply animation based on speed setting
        const speed = AnimationSpeeds[AppState.settings.animation_speed];
        const arrowPath = arrowElement.querySelector('.arrow-path');
        if (arrowPath) {
            arrowPath.style.animationDuration = `${speed}ms`;
        }

        // Update color if custom color is set
        if (AppState.settings.arrow_color && arrowPath) {
            arrowPath.setAttribute('fill', arrowColor);
        }
    }

    // Update direction label
    document.getElementById('directionLabel').textContent = directionText;
}

/**
 * Reset arrow display to idle state
 */
function resetArrowDisplay() {
    document.querySelectorAll('.arrow-group').forEach(group => {
        group.style.display = 'none';
    });

    document.getElementById('arrowIdle').style.display = 'block';
    document.getElementById('directionLabel').textContent = '방향을 기다리는 중...';
}

/**
 * Submit response to server
 */
async function submitResponse() {
    if (!AppState.selectedOperator || !AppState.currentProblem) {
        return;
    }

    const responseTime = Math.floor((Date.now() - AppState.startTime) / 1000);

    try {
        const response = await fetch(AppState.apiBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'submit_response',
                user_id: AppState.userId,
                problem_id: AppState.currentProblem.id,
                selected_operator: AppState.selectedOperator,
                response_time: responseTime,
                session_id: AppState.sessionId
            })
        });

        const data = await response.json();

        if (data.success && data.result) {
            handleResponseResult(data.result);
        } else {
            // Fallback: check locally
            const isCorrect = (AppState.selectedOperator === AppState.currentProblem.correct_operator);
            handleResponseResult({ is_correct: isCorrect, correct_operator: AppState.currentProblem.correct_operator });
        }
    } catch (error) {
        console.error('Submit response error:', error);
        // Fallback: check locally
        const isCorrect = (AppState.selectedOperator === AppState.currentProblem.correct_operator);
        handleResponseResult({ is_correct: isCorrect, correct_operator: AppState.currentProblem.correct_operator });
    }
}

/**
 * Handle response result
 */
function handleResponseResult(result) {
    const resultMsg = document.getElementById('resultMessage');
    resultMsg.classList.add('show');

    AppState.totalProblems++;

    if (result.is_correct) {
        resultMsg.textContent = '✅ 정답입니다!';
        resultMsg.classList.add('correct');
        resultMsg.classList.remove('incorrect');
        AppState.correctAnswers++;
        AppState.score += 10;
        playSound('correct');
    } else {
        resultMsg.textContent = `❌ 틀렸습니다. 정답은 "${result.correct_operator}" 입니다.`;
        resultMsg.classList.add('incorrect');
        resultMsg.classList.remove('correct');
        playSound('incorrect');
    }

    updateStatistics();

    // Load next problem after delay
    setTimeout(() => {
        loadNewProblem();
    }, 2000);
}

/**
 * Update statistics display
 */
function updateStatistics() {
    document.getElementById('score').textContent = AppState.score;
    document.getElementById('totalProblems').textContent = AppState.totalProblems;
    document.getElementById('correctAnswers').textContent = AppState.correctAnswers;

    const accuracy = AppState.totalProblems > 0
        ? Math.round((AppState.correctAnswers / AppState.totalProblems) * 100)
        : 0;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
}

/**
 * Load user settings
 */
async function loadUserSettings() {
    try {
        const response = await fetch(
            `${AppState.apiBaseUrl}?action=get_settings&user_id=${AppState.userId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (data.success && data.settings) {
            AppState.settings = { ...AppState.settings, ...data.settings };
            applySettings();
        }
    } catch (error) {
        console.error('Load settings error:', error);
        // Use default settings
    }
}

/**
 * Apply settings to UI
 */
function applySettings() {
    document.getElementById('animSpeed').value = AppState.settings.animation_speed || 'medium';
    document.getElementById('arrowColor').value = AppState.settings.arrow_color || '#FF5722';
    document.getElementById('enableSound').checked = AppState.settings.enable_sound !== false;
    document.getElementById('enableHaptics').checked = AppState.settings.enable_haptics !== false;
}

/**
 * Update settings
 */
async function updateSettings() {
    const newSettings = {
        animation_speed: document.getElementById('animSpeed').value,
        arrow_color: document.getElementById('arrowColor').value,
        enable_sound: document.getElementById('enableSound').checked,
        enable_haptics: document.getElementById('enableHaptics').checked
    };

    AppState.settings = { ...AppState.settings, ...newSettings };

    try {
        await fetch(AppState.apiBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update_settings',
                user_id: AppState.userId,
                settings: newSettings
            })
        });
    } catch (error) {
        console.error('Update settings error:', error);
    }
}

/**
 * Toggle smartphone visibility
 */
function toggleSmartphone() {
    const container = document.getElementById('smartphoneContainer');
    const icon = document.getElementById('toggleIcon');

    container.classList.toggle('minimized');

    if (container.classList.contains('minimized')) {
        icon.textContent = '📱';
    } else {
        icon.textContent = '❌';
    }
}

/**
 * Toggle settings panel
 */
function toggleSettings() {
    const content = document.getElementById('settingsContent');
    content.classList.toggle('show');
}

/**
 * Play sound effect
 */
function playSound(type) {
    if (!AppState.settings.enable_sound) {
        return;
    }

    // Create audio context for sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case '<':
        case '>':
        case '=':
            oscillator.frequency.value = 440;
            gainNode.gain.value = 0.3;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'correct':
            oscillator.frequency.value = 880;
            gainNode.gain.value = 0.3;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'incorrect':
            oscillator.frequency.value = 220;
            gainNode.gain.value = 0.3;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
    }
}

/**
 * Trigger haptic feedback
 */
function triggerHaptic() {
    if (!AppState.settings.enable_haptics) {
        return;
    }

    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

/**
 * Show error message
 */
function showError(message) {
    alert(message);
}

/**
 * Get Moodle course ID from URL parameters
 */
function getMoodleCourseId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('course_id') || null;
}

/**
 * End session and show results
 */
async function endSession() {
    if (!AppState.sessionId) {
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(AppState.apiBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'end_session',
                session_id: AppState.sessionId
            })
        });

        const data = await response.json();

        if (data.success && data.stats) {
            showSessionResults(data.stats);
        }
    } catch (error) {
        console.error('End session error:', error);
    }

    showLoading(false);
}

/**
 * Show session results
 */
function showSessionResults(stats) {
    const message = `
세션 완료!

총 문제 수: ${stats.total_problems}
정답 수: ${stats.correct_answers}
정확도: ${stats.accuracy_percentage}%
소요 시간: ${stats.session_duration_minutes}분
    `;

    alert(message);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inequality Arrow App Starting...');
    initApp();

    // Handle page unload
    window.addEventListener('beforeunload', () => {
        endSession();
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case ',':
        case '<':
            e.preventDefault();
            selectOperator('<');
            break;
        case '=':
            e.preventDefault();
            selectOperator('=');
            break;
        case '.':
        case '>':
            e.preventDefault();
            selectOperator('>');
            break;
        case 'Escape':
            toggleSettings();
            break;
    }
});

// Export for use in HTML
window.selectOperator = selectOperator;
window.toggleSmartphone = toggleSmartphone;
window.toggleSettings = toggleSettings;
window.updateSettings = updateSettings;
