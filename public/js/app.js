/**
 * Hidden Length - Main Application Logic
 * Handles API calls, state management, and UI updates
 */

// Application state
const AppState = {
    currentUser: null,
    currentShape: null,
    shapes: [],
    progress: [],
    renderer: null,
    startTime: null,
    hintUsed: false,
    lightBeamUsed: false
};

// API configuration
const API_BASE_URL = '../api';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Hidden Length App initialized');

    // Initialize shape renderer
    AppState.renderer = new ShapeRenderer('shape-canvas');

    // Check for Moodle integration
    checkMoodleIntegration();

    // Load demo user (in production, this would come from authentication)
    AppState.currentUser = {
        id: 1,
        name: 'Demo Student',
        moodle_user_id: null
    };

    // Load shapes
    loadShapes();

    // Load user progress
    loadProgress();
});

/**
 * Check if Moodle integration is enabled
 */
function checkMoodleIntegration() {
    // In production, this would check via API
    const moodleEnabled = false; // Set via server config

    if (moodleEnabled) {
        document.getElementById('moodle-info').style.display = 'block';
    }
}

/**
 * Start learning (hide welcome screen)
 */
function startLearning() {
    document.getElementById('welcome-screen').style.display = 'none';
}

/**
 * Load all shapes from API
 */
async function loadShapes() {
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/shapes.php`);
        const data = await response.json();

        if (data.success) {
            AppState.shapes = data.data;
            renderShapeList();
        } else {
            showError('Failed to load shapes: ' + data.error);
        }
    } catch (error) {
        console.error('Error loading shapes:', error);
        // Load demo shapes for offline testing
        loadDemoShapes();
    } finally {
        showLoading(false);
    }
}

/**
 * Load demo shapes (for offline testing)
 */
function loadDemoShapes() {
    AppState.shapes = [
        {
            id: 1,
            title: 'Right Triangle - Find Hypotenuse',
            description: 'A right triangle with legs 3 and 4. Find the hypotenuse.',
            shape_type: 'triangle',
            difficulty_level: 1,
            category_name: 'Basic Triangles',
            shape_data: {
                type: 'triangle',
                vertices: [
                    { x: 100, y: 300 },
                    { x: 100, y: 100 },
                    { x: 300, y: 300 }
                ],
                sides: { a: 3, b: 4, c: null },
                rightAngle: { x: 100, y: 300 }
            },
            hidden_length_data: {
                hiddenSide: 'c',
                lightBeam: {
                    start: { x: 100, y: 100 },
                    end: { x: 300, y: 300 },
                    color: '#FFD700',
                    animated: true
                },
                hints: [
                    'Use Pythagorean theorem: a² + b² = c²',
                    '3² + 4² = ?',
                    '9 + 16 = 25, so c = √25'
                ]
            },
            correct_answer: '5.00',
            hint_text: 'Remember: a² + b² = c² for right triangles',
            explanation: 'Using the Pythagorean theorem: 3² + 4² = 9 + 16 = 25, therefore c = √25 = 5'
        },
        {
            id: 2,
            title: 'Right Triangle - Find Leg',
            description: 'A right triangle with hypotenuse 10 and one leg 6. Find the other leg.',
            shape_type: 'triangle',
            difficulty_level: 1,
            category_name: 'Basic Triangles',
            shape_data: {
                type: 'triangle',
                vertices: [
                    { x: 100, y: 300 },
                    { x: 100, y: 100 },
                    { x: 260, y: 300 }
                ],
                sides: { a: 6, b: null, c: 10 },
                rightAngle: { x: 100, y: 300 }
            },
            hidden_length_data: {
                hiddenSide: 'b',
                lightBeam: {
                    start: { x: 100, y: 300 },
                    end: { x: 260, y: 300 },
                    color: '#00BFFF',
                    animated: true
                },
                hints: [
                    'Use a² + b² = c²',
                    '6² + b² = 10²',
                    '36 + b² = 100, so b² = 64'
                ]
            },
            correct_answer: '8.00',
            hint_text: 'Rearrange the Pythagorean theorem: b² = c² - a²',
            explanation: 'Using the Pythagorean theorem: 6² + b² = 10², so 36 + b² = 100, therefore b² = 64 and b = 8'
        }
    ];

    renderShapeList();
}

/**
 * Load user progress from API
 */
async function loadProgress() {
    if (!AppState.currentUser) return;

    try {
        const response = await fetch(
            `${API_BASE_URL}/progress.php?user_id=${AppState.currentUser.id}`
        );
        const data = await response.json();

        if (data.success) {
            AppState.progress = data.data.progress || [];
            updateProgressSummary(data.data.statistics);
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        // Initialize empty progress
        AppState.progress = [];
        updateProgressSummary({
            total_shapes: 0,
            completed: 0,
            mastered: 0,
            average_mastery: 0,
            total_attempts: 0,
            correct_attempts: 0
        });
    }
}

/**
 * Render shape list in left panel
 */
function renderShapeList() {
    const container = document.getElementById('shape-list');
    container.innerHTML = '';

    if (AppState.shapes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7F8C8D;">문제가 없습니다.</p>';
        return;
    }

    AppState.shapes.forEach(shape => {
        const item = document.createElement('div');
        item.className = 'shape-item';
        item.onclick = () => selectShape(shape);

        const progress = AppState.progress.find(p => p.shape_id === shape.id);
        const status = progress ? progress.status : 'not_started';
        const statusIcon = getStatusIcon(status);

        item.innerHTML = `
            <div class="shape-item-title">${statusIcon} ${shape.title}</div>
            <div class="shape-item-meta">
                <span>${shape.category_name || 'General'}</span>
                <span class="difficulty-badge">Level ${shape.difficulty_level}</span>
            </div>
        `;

        container.appendChild(item);
    });
}

/**
 * Get status icon
 */
function getStatusIcon(status) {
    switch (status) {
        case 'completed': return '✅';
        case 'mastered': return '🌟';
        case 'in_progress': return '🔄';
        default: return '⭕';
    }
}

/**
 * Update progress summary
 */
function updateProgressSummary(stats) {
    if (!stats) return;

    document.getElementById('completed-count').textContent =
        `${stats.completed + stats.mastered} / ${stats.total_shapes}`;

    document.getElementById('mastery-score').textContent =
        `${stats.average_mastery.toFixed(1)}%`;

    const accuracy = stats.total_attempts > 0
        ? ((stats.correct_attempts / stats.total_attempts) * 100).toFixed(1)
        : 0;
    document.getElementById('accuracy-rate').textContent = `${accuracy}%`;
}

/**
 * Select a shape to work on
 */
function selectShape(shape) {
    AppState.currentShape = shape;
    AppState.startTime = Date.now();
    AppState.hintUsed = false;
    AppState.lightBeamUsed = false;

    // Hide welcome screen
    startLearning();

    // Update active state in list
    document.querySelectorAll('.shape-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.shape-item').classList.add('active');

    // Update smartphone display
    document.getElementById('current-shape-title').textContent = shape.title;
    document.getElementById('problem-description').textContent = shape.description;

    // Clear previous state
    document.getElementById('light-beam-toggle').checked = false;
    document.getElementById('answer').value = '';
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('hint-overlay').style.display = 'none';

    // Draw shape
    AppState.renderer.setLightBeam(false);
    AppState.renderer.drawShape(shape.shape_data, shape.hidden_length_data);

    console.log('Selected shape:', shape);
}

/**
 * Toggle light beam
 */
function toggleLightBeam() {
    const enabled = document.getElementById('light-beam-toggle').checked;
    AppState.renderer.setLightBeam(enabled);

    if (enabled) {
        AppState.lightBeamUsed = true;
    }
}

/**
 * Toggle hint
 */
function toggleHint() {
    const overlay = document.getElementById('hint-overlay');
    const hintText = document.getElementById('hint-text');

    if (!AppState.currentShape) {
        alert('먼저 문제를 선택하세요.');
        return;
    }

    if (overlay.style.display === 'none' || !overlay.style.display) {
        // Show hint
        const hints = AppState.currentShape.hidden_length_data.hints || [];
        if (hints.length > 0) {
            hintText.textContent = hints.join('\n');
            overlay.style.display = 'block';
            AppState.hintUsed = true;
        } else {
            hintText.textContent = AppState.currentShape.hint_text || '힌트가 없습니다.';
            overlay.style.display = 'block';
            AppState.hintUsed = true;
        }
    } else {
        // Hide hint
        overlay.style.display = 'none';
    }
}

/**
 * Submit answer
 */
async function submitAnswer() {
    if (!AppState.currentShape) {
        alert('먼저 문제를 선택하세요.');
        return;
    }

    const answer = document.getElementById('answer').value.trim();

    if (!answer) {
        alert('답을 입력하세요.');
        return;
    }

    const timeSpent = Math.floor((Date.now() - AppState.startTime) / 1000);

    const attemptData = {
        user_id: AppState.currentUser.id,
        shape_id: AppState.currentShape.id,
        submitted_answer: parseFloat(answer),
        time_spent_seconds: timeSpent,
        hint_used: AppState.hintUsed,
        light_beam_activated: AppState.lightBeamUsed,
        interaction_data: {
            attempts: 1,
            timestamp: new Date().toISOString()
        }
    };

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/progress.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attemptData)
        });

        const data = await response.json();

        if (data.success) {
            showFeedback(data.data);

            // Reload progress
            await loadProgress();
        } else {
            // Fallback for offline mode
            showOfflineFeedback(attemptData.submitted_answer);
        }
    } catch (error) {
        console.error('Error submitting answer:', error);
        showOfflineFeedback(attemptData.submitted_answer);
    } finally {
        showLoading(false);
    }
}

/**
 * Show feedback
 */
function showFeedback(result) {
    const feedbackDiv = document.getElementById('feedback');
    feedbackDiv.style.display = 'block';

    if (result.is_correct) {
        feedbackDiv.className = 'feedback correct';
        feedbackDiv.innerHTML = `
            <strong>정답입니다! 🎉</strong><br>
            ${result.feedback}<br>
            <small>숙련도: ${result.mastery_score}%</small>
        `;
    } else {
        feedbackDiv.className = 'feedback incorrect';
        feedbackDiv.innerHTML = `
            <strong>다시 시도해보세요</strong><br>
            ${result.feedback}<br>
            <small>정답: ${result.correct_answer}</small>
        `;
    }
}

/**
 * Show offline feedback
 */
function showOfflineFeedback(submittedAnswer) {
    const correctAnswer = parseFloat(AppState.currentShape.correct_answer);
    const isCorrect = Math.abs(submittedAnswer - correctAnswer) < 0.01;

    const feedbackDiv = document.getElementById('feedback');
    feedbackDiv.style.display = 'block';

    if (isCorrect) {
        feedbackDiv.className = 'feedback correct';
        feedbackDiv.innerHTML = `
            <strong>정답입니다! 🎉</strong><br>
            ${AppState.currentShape.explanation || '잘하셨습니다!'}
        `;
    } else {
        feedbackDiv.className = 'feedback incorrect';
        feedbackDiv.innerHTML = `
            <strong>다시 시도해보세요</strong><br>
            정답은 ${correctAnswer}입니다.<br>
            ${AppState.currentShape.hint_text || '힌트를 참고하세요.'}
        `;
    }
}

/**
 * Back to shape list
 */
function backToList() {
    // Clear current shape
    AppState.currentShape = null;
    AppState.renderer.clear();
    AppState.renderer.setLightBeam(false);

    // Reset UI
    document.getElementById('current-shape-title').textContent = '문제를 선택하세요';
    document.getElementById('problem-description').textContent = '왼쪽에서 문제를 선택하여 시작하세요';
    document.getElementById('answer').value = '';
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('hint-overlay').style.display = 'none';
    document.getElementById('light-beam-toggle').checked = false;

    // Clear active state
    document.querySelectorAll('.shape-item').forEach(item => {
        item.classList.remove('active');
    });
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

/**
 * Show error message
 */
function showError(message) {
    alert('오류: ' + message);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (AppState.renderer) {
        AppState.renderer.destroy();
    }
});
