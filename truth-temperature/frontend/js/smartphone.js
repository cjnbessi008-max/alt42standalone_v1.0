/**
 * Truth Temperature - Virtual Smartphone JavaScript
 * Handles temperature display, problem submission, and API communication
 */

// Configuration
const API_BASE_URL = '/truth-temperature/backend/api/api.php';
let currentSession = null;
let currentProblemIndex = 0;
let problemStartTime = null;

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeSession();
    setupEventListeners();
    displayCurrentProblem();
});

/**
 * Initialize user session
 */
async function initializeSession() {
    try {
        // Check if session exists in localStorage
        const storedSession = localStorage.getItem('truthtemp_session');

        if (storedSession) {
            currentSession = JSON.parse(storedSession);
            console.log('Restored session:', currentSession);
        } else {
            // Create new session
            const response = await fetch(`${API_BASE_URL}/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    moodle_user_id: typeof userid !== 'undefined' ? userid : 1,
                    username: typeof username !== 'undefined' ? username : 'guest'
                })
            });

            const data = await response.json();

            if (data.success) {
                currentSession = {
                    id: data.session_id,
                    token: data.session_token
                };
                localStorage.setItem('truthtemp_session', JSON.stringify(currentSession));
                console.log('Created new session:', currentSession);
            }
        }
    } catch (error) {
        console.error('Failed to initialize session:', error);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Answer button clicks
    document.querySelectorAll('.answer-btn').forEach(button => {
        button.addEventListener('click', function() {
            const answer = this.getAttribute('data-answer') === 'true';
            submitAnswer(answer);
        });
    });
}

/**
 * Display current problem
 */
function displayCurrentProblem() {
    if (typeof problems === 'undefined' || problems.length === 0) {
        showMessage('문제가 없습니다.', 'info');
        return;
    }

    const problem = problems[currentProblemIndex];
    const problemDisplay = document.getElementById('problem-display');

    problemDisplay.innerHTML = `
        <div class="problem-card" data-problem-id="${problem.id}">
            <p class="question-text">${problem.question_text}</p>
            <p class="inequality-expression">${problem.inequality_expression}</p>
            <div class="answer-buttons">
                <button class="btn btn-success answer-btn" data-answer="true">
                    참 (True)
                </button>
                <button class="btn btn-danger answer-btn" data-answer="false">
                    거짓 (False)
                </button>
            </div>
        </div>
    `;

    // Re-attach event listeners
    setupEventListeners();

    // Reset temperature display
    updateTemperatureDisplay(null, '대기 중...');

    // Start timer
    problemStartTime = Date.now();
}

/**
 * Submit answer to the server
 */
async function submitAnswer(userAnswer) {
    if (!currentSession) {
        showMessage('세션이 없습니다. 페이지를 새로고침하세요.', 'danger');
        return;
    }

    const problem = problems[currentProblemIndex];
    const responseTime = Date.now() - problemStartTime;

    // Disable buttons during submission
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = true;
    });

    try {
        const response = await fetch(`${API_BASE_URL}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: currentSession.id,
                problem_id: problem.id,
                user_answer: userAnswer,
                response_time_ms: responseTime
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update temperature display
            updateTemperatureDisplay(
                data.temperature,
                data.is_correct ? '정답입니다!' : '오답입니다.',
                data.temperature_type
            );

            // Show result message
            const message = `
                ${data.is_correct ? '✓ 정답!' : '✗ 오답'}
                <br>정답: ${data.correct_answer ? '참 (True)' : '거짓 (False)'}
                <br>온도: ${data.temperature}°C (${getTemperatureLabel(data.temperature_type)})
            `;
            showMessage(message, data.is_correct ? 'success' : 'danger');

            // Move to next problem after delay
            setTimeout(() => {
                currentProblemIndex++;
                if (currentProblemIndex < problems.length) {
                    displayCurrentProblem();
                    hideMessage();
                } else {
                    showMessage('모든 문제를 완료했습니다!', 'success');
                    showSessionStats();
                }
            }, 3000);
        } else {
            showMessage('오류가 발생했습니다: ' + data.error, 'danger');
        }
    } catch (error) {
        console.error('Submit error:', error);
        showMessage('서버 오류가 발생했습니다.', 'danger');
    } finally {
        // Re-enable buttons
        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.disabled = false;
        });
    }
}

/**
 * Update temperature display on virtual smartphone
 */
function updateTemperatureDisplay(temperature, status, temperatureType = null) {
    const tempNumber = document.querySelector('.temp-number');
    const tempStatus = document.getElementById('temperature-status');
    const thermometerFill = document.getElementById('thermometer-fill');

    if (temperature === null) {
        tempNumber.textContent = '--';
        tempStatus.textContent = status;
        thermometerFill.style.height = '0%';
        thermometerFill.className = 'thermometer-fill';
        return;
    }

    // Update temperature value
    tempNumber.textContent = temperature;
    tempStatus.textContent = status;

    // Calculate fill percentage (-20 to 50 degrees = 70 degree range)
    const minTemp = -20;
    const maxTemp = 50;
    const fillPercentage = ((temperature - minTemp) / (maxTemp - minTemp)) * 100;

    // Update thermometer fill
    thermometerFill.style.height = fillPercentage + '%';

    // Update color based on temperature type
    thermometerFill.className = 'thermometer-fill ' + (temperatureType || getTemperatureTypeFromValue(temperature));

    // Add pulse animation
    tempNumber.parentElement.classList.add('temperature-pulse');
    setTimeout(() => {
        tempNumber.parentElement.classList.remove('temperature-pulse');
    }, 500);
}

/**
 * Get temperature type from value
 */
function getTemperatureTypeFromValue(temp) {
    if (temp < 0) return 'cold';
    if (temp < 20) return 'cool';
    if (temp < 35) return 'warm';
    return 'hot';
}

/**
 * Get temperature label in Korean
 */
function getTemperatureLabel(type) {
    const labels = {
        'cold': '매우 추움',
        'cool': '시원함',
        'warm': '따뜻함',
        'hot': '매우 뜨거움'
    };
    return labels[type] || type;
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('result-message');
    messageBox.innerHTML = message;
    messageBox.className = 'alert alert-' + type;
    messageBox.style.display = 'block';
}

/**
 * Hide message
 */
function hideMessage() {
    const messageBox = document.getElementById('result-message');
    messageBox.style.display = 'none';
}

/**
 * Show session statistics
 */
async function showSessionStats() {
    if (!currentSession) return;

    try {
        const response = await fetch(`${API_BASE_URL}/session?session_id=${currentSession.id}`);
        const data = await response.json();

        if (data.success) {
            // Calculate stats
            const totalProblems = problems.length;
            const message = `
                <h3>학습 완료!</h3>
                <p>총 문제 수: ${totalProblems}</p>
                <p>수고하셨습니다!</p>
            `;
            showMessage(message, 'success');
        }
    } catch (error) {
        console.error('Failed to fetch session stats:', error);
    }
}

/**
 * Reset application
 */
function resetApp() {
    currentProblemIndex = 0;
    localStorage.removeItem('truthtemp_session');
    location.reload();
}

// Expose functions globally if needed
window.TruthTemp = {
    resetApp,
    submitAnswer,
    updateTemperatureDisplay
};
