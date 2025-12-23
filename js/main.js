/**
 * Main Application Controller
 * Orchestrates all components for Dual Derivative Sync
 */

// Global instances
let mathEngine;
let derivativeSync;
let moodleIntegration;

/**
 * Initialize application on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Dual Derivative Sync Application...');

    // Initialize core components
    initializeComponents();

    // Setup event listeners
    setupEventListeners();

    // Load demo problem by default
    loadDefaultProblem();

    console.log('✅ Application initialized successfully');
});

/**
 * Initialize all core components
 */
function initializeComponents() {
    // Initialize Math Engine
    mathEngine = new MathEngine();
    console.log('✓ Math Engine initialized');

    // Initialize Derivative Sync
    derivativeSync = new DerivativeSync(mathEngine);
    derivativeSync.initialize();
    console.log('✓ Derivative Sync initialized');

    // Initialize Moodle Integration
    moodleIntegration = new MoodleIntegration();
    console.log('✓ Moodle Integration initialized');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Function input
    const functionInput = document.getElementById('function-input');
    if (functionInput) {
        functionInput.addEventListener('change', handleFunctionChange);
        functionInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                handleFunctionChange(e);
            }
        });
    }

    // X value slider
    const xValueSlider = document.getElementById('x-value');
    if (xValueSlider) {
        xValueSlider.addEventListener('input', handleXValueChange);
    }

    // Animation speed slider
    const speedSlider = document.getElementById('animation-speed');
    if (speedSlider) {
        speedSlider.addEventListener('input', handleSpeedChange);
    }

    // Control buttons
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', handlePlay);
    }

    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', handlePause);
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleReset);
    }

    // Load problem button
    const loadProblemBtn = document.getElementById('load-problem-btn');
    if (loadProblemBtn) {
        loadProblemBtn.addEventListener('click', handleLoadProblem);
    }

    console.log('✓ Event listeners setup complete');
}

/**
 * Handle function input change
 */
function handleFunctionChange(event) {
    const newFunction = event.target.value.trim();

    if (!newFunction) {
        showNotification('함수를 입력해주세요.', 'warning');
        return;
    }

    // Validate function
    const validation = mathEngine.validateExpression(newFunction);
    if (!validation.valid) {
        showNotification('오류: ' + validation.error, 'error');
        event.target.classList.add('error');
        return;
    }

    // Update function
    event.target.classList.remove('error');
    const success = derivativeSync.setFunction(newFunction);

    if (success) {
        showNotification('함수가 업데이트되었습니다: ' + newFunction, 'success');
        console.log('Function updated:', newFunction);
    }
}

/**
 * Handle X value slider change
 */
function handleXValueChange(event) {
    const xValue = parseFloat(event.target.value);
    document.getElementById('x-display').textContent = xValue.toFixed(1);
    derivativeSync.setCurrentX(xValue);
}

/**
 * Handle animation speed slider change
 */
function handleSpeedChange(event) {
    const speed = parseInt(event.target.value);
    document.getElementById('speed-display').textContent = speed + 'x';
    derivativeSync.setAnimationSpeed(speed);
}

/**
 * Handle play button click
 */
function handlePlay() {
    derivativeSync.play();
    updateControlButtons(true);
    showNotification('애니메이션 시작', 'info');
}

/**
 * Handle pause button click
 */
function handlePause() {
    derivativeSync.pause();
    updateControlButtons(false);
    showNotification('애니메이션 일시정지', 'info');
}

/**
 * Handle reset button click
 */
function handleReset() {
    derivativeSync.reset();
    updateControlButtons(false);

    // Reset slider
    const xSlider = document.getElementById('x-value');
    if (xSlider) {
        xSlider.value = -5;
        document.getElementById('x-display').textContent = '-5.0';
    }

    showNotification('초기화 완료', 'info');
}

/**
 * Update control button states
 */
function updateControlButtons(isPlaying) {
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');

    if (playBtn && pauseBtn) {
        if (isPlaying) {
            playBtn.disabled = true;
            pauseBtn.disabled = false;
            playBtn.style.opacity = '0.5';
            pauseBtn.style.opacity = '1';
        } else {
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            playBtn.style.opacity = '1';
            pauseBtn.style.opacity = '0.5';
        }
    }
}

/**
 * Handle load problem button click
 */
async function handleLoadProblem() {
    const btn = document.getElementById('load-problem-btn');
    const originalText = btn.textContent;

    try {
        btn.textContent = '로딩 중...';
        btn.disabled = true;

        // For demo, load demo problem
        // In production, this would connect to actual Moodle
        const problem = moodleIntegration.loadDemoProblem();
        displayProblem(problem);

        showNotification('문제를 불러왔습니다!', 'success');
    } catch (error) {
        console.error('Error loading problem:', error);
        showNotification('문제 로딩 실패: ' + error.message, 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

/**
 * Display problem information
 */
function displayProblem(problem) {
    const problemInfo = document.getElementById('problem-info');
    if (!problemInfo) return;

    // Parse and display problem
    const parsed = moodleIntegration.parseProblemData(problem);
    problemInfo.innerHTML = moodleIntegration.formatProblemDisplay(problem);

    // Update visualization with problem data
    derivativeSync.setFunction(parsed.function);
    derivativeSync.setXRange(parsed.xRange.min, parsed.xRange.max);

    // Update slider range
    const xSlider = document.getElementById('x-value');
    if (xSlider) {
        xSlider.min = parsed.xRange.min;
        xSlider.max = parsed.xRange.max;
        xSlider.value = parsed.xRange.min;
    }

    // Update function input
    const functionInput = document.getElementById('function-input');
    if (functionInput) {
        functionInput.value = parsed.function;
    }

    // Add hints if available
    if (parsed.hints && parsed.hints.length > 0) {
        const hintsHtml = `
            <div class="problem-hints">
                <strong>💡 힌트:</strong>
                <ul>
                    ${parsed.hints.map(hint => `<li>${hint}</li>`).join('')}
                </ul>
            </div>
        `;
        problemInfo.innerHTML += hintsHtml;
    }

    console.log('Problem displayed:', parsed);
}

/**
 * Load default problem on startup
 */
function loadDefaultProblem() {
    try {
        const demoProblem = moodleIntegration.loadDemoProblem();
        displayProblem(demoProblem);
        console.log('✓ Default demo problem loaded');
    } catch (error) {
        console.error('Error loading default problem:', error);
    }
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 25px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease-out',
        maxWidth: '300px'
    });

    // Set background color based on type
    const colors = {
        success: '#48bb78',
        error: '#f56565',
        warning: '#ed8936',
        info: '#667eea'
    };
    notification.style.background = colors[type] || colors.info;

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Handle window resize
 */
window.addEventListener('resize', function() {
    if (derivativeSync && derivativeSync.originalChart && derivativeSync.derivativeChart) {
        derivativeSync.originalChart.resize();
        derivativeSync.derivativeChart.resize();
    }
});

/**
 * Handle window unload (cleanup)
 */
window.addEventListener('beforeunload', function() {
    if (derivativeSync) {
        derivativeSync.destroy();
    }
});

/**
 * Add CSS animations
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .error {
        border-color: #f56565 !important;
        background-color: #fff5f5 !important;
    }

    .problem-hints {
        margin-top: 15px;
        padding: 12px;
        background: #f0f4ff;
        border-radius: 6px;
        border-left: 4px solid #667eea;
    }

    .problem-hints ul {
        margin: 10px 0 0 20px;
        line-height: 1.8;
    }

    .problem-hints li {
        color: #555;
        font-size: 0.95rem;
    }

    .problem-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .difficulty-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .difficulty-beginner {
        background: #48bb78;
        color: white;
    }

    .difficulty-medium {
        background: #ed8936;
        color: white;
    }

    .difficulty-advanced {
        background: #f56565;
        color: white;
    }

    .problem-description {
        margin-bottom: 12px;
        line-height: 1.6;
        color: #555;
    }

    .problem-function {
        margin-bottom: 10px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 6px;
    }

    .problem-function code {
        font-family: 'Courier New', monospace;
        color: #667eea;
        font-weight: 600;
        font-size: 1.1rem;
    }

    .problem-range {
        padding: 8px;
        background: #f8f9fa;
        border-radius: 6px;
        color: #555;
    }
`;
document.head.appendChild(style);

// Export for debugging
if (typeof window !== 'undefined') {
    window.app = {
        mathEngine,
        derivativeSync,
        moodleIntegration,
        showNotification
    };
}

console.log('📱 Main application script loaded');
