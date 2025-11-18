/**
 * Main Application Logic
 * Ties together all components and handles user interactions
 */

// Initialize components
const calculator = new RiemannCalculator();
const renderer = new CanvasRenderer('riemannCanvas');
const moodleAPI = new MoodleAPI();

// Application state
let isDensifying = false;
let currentProblemId = 1;

// Default function: f(x) = x²
calculator.setFunction((x) => x * x, 'f(x) = x²');
calculator.setInterval(0, 2);
calculator.setSubdivisions(5);
calculator.setType('midpoint');

/**
 * Initialize the application
 */
async function init() {
    // Check Moodle connection
    updateConnectionStatus(false);

    try {
        const isConnected = await moodleAPI.checkConnection();
        updateConnectionStatus(isConnected);

        if (isConnected) {
            // Load default problem or from URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            const problemId = urlParams.get('problem') || 1;
            await loadProblem(problemId);
        } else {
            // Use default problem if not connected
            console.warn('Moodle not connected, using default problem');
            updateProblemDisplay();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        updateConnectionStatus(false);
        updateProblemDisplay();
    }

    // Setup event listeners
    setupEventListeners();

    // Initial draw
    updateVisualization();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Subdivisions slider
    const subdivisionsSlider = document.getElementById('subdivisions');
    const subdivisionsValue = document.getElementById('subdivisionsValue');

    subdivisionsSlider.addEventListener('input', (e) => {
        const n = parseInt(e.target.value);
        calculator.setSubdivisions(n);
        subdivisionsValue.textContent = n;

        if (!isDensifying) {
            updateVisualization();
        }
    });

    // Riemann type selector
    const riemannTypeSelect = document.getElementById('riemannType');
    riemannTypeSelect.addEventListener('change', (e) => {
        calculator.setType(e.target.value);

        if (!isDensifying) {
            updateVisualization();
        }
    });

    // Densify button
    const densifyBtn = document.getElementById('densifyBtn');
    densifyBtn.addEventListener('click', () => {
        if (isDensifying) {
            stopDensify();
        } else {
            startDensify();
        }
    });

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', resetVisualization);
}

/**
 * Load a problem from Moodle
 * @param {number} problemId - The problem ID
 */
async function loadProblem(problemId) {
    try {
        updateStatus('문제 불러오는 중...');

        const problem = await moodleAPI.fetchProblem(problemId);

        // Parse problem data
        if (problem.function) {
            const func = moodleAPI.parseFunctionString(problem.function);
            calculator.setFunction(func, problem.function_display || problem.function);
        }

        if (problem.interval_a !== undefined && problem.interval_b !== undefined) {
            calculator.setInterval(
                parseFloat(problem.interval_a),
                parseFloat(problem.interval_b)
            );
        }

        if (problem.riemann_type) {
            calculator.setType(problem.riemann_type);
            document.getElementById('riemannType').value = problem.riemann_type;
        }

        // Update display
        updateProblemDisplay(problem);
        updateVisualization();
        updateStatus('준비됨');

        currentProblemId = problemId;

    } catch (error) {
        console.error('Error loading problem:', error);
        updateStatus('문제 불러오기 실패');
    }
}

/**
 * Update the problem display
 * @param {Object} problem - Problem data
 */
function updateProblemDisplay(problem = null) {
    if (problem) {
        document.getElementById('problemTitle').textContent =
            problem.title || '리만 합 문제';
        document.getElementById('functionDisplay').textContent =
            problem.function_display || calculator.displayText;
        document.getElementById('intervalDisplay').textContent =
            `[${calculator.a}, ${calculator.b}]`;
    } else {
        document.getElementById('problemTitle').textContent =
            '리만 합 데모 (Moodle 미연결)';
        document.getElementById('functionDisplay').textContent =
            calculator.displayText || 'f(x) = x²';
        document.getElementById('intervalDisplay').textContent =
            `[${calculator.a}, ${calculator.b}]`;
    }
}

/**
 * Update the visualization
 */
function updateVisualization() {
    // Draw on canvas
    renderer.draw(calculator);

    // Update calculations display
    const riemannSum = calculator.calculateRiemannSum();
    const exactIntegral = calculator.calculateExactIntegral();
    const error = Math.abs(riemannSum - exactIntegral);

    document.getElementById('riemannSum').textContent = riemannSum.toFixed(4);
    document.getElementById('actualIntegral').textContent = exactIntegral.toFixed(4);
    document.getElementById('error').textContent = error.toFixed(4);

    // Color code the error
    const errorElement = document.getElementById('error');
    if (error < 0.01) {
        errorElement.className = 'success';
    } else if (error > 0.5) {
        errorElement.className = 'error';
    } else {
        errorElement.className = '';
    }
}

/**
 * Start the densify animation
 */
function startDensify() {
    if (isDensifying) return;

    isDensifying = true;

    const densifyBtn = document.getElementById('densifyBtn');
    densifyBtn.innerHTML = '<span class="icon">⏸</span> 일시정지';

    const currentN = calculator.n;
    const targetN = 100; // Maximum subdivisions

    updateStatus('Densifying...');

    // Update subdivisions slider
    const subdivisionsSlider = document.getElementById('subdivisions');
    subdivisionsSlider.disabled = true;

    renderer.animateDensify(
        calculator,
        targetN,
        (progress) => {
            // Update progress bar
            document.getElementById('densifyProgress').style.width = `${progress}%`;

            // Update slider
            const subdivisionsValue = document.getElementById('subdivisionsValue');
            subdivisionsValue.textContent = calculator.n;
            subdivisionsSlider.value = calculator.n;

            // Update calculations
            const riemannSum = calculator.calculateRiemannSum();
            const exactIntegral = calculator.calculateExactIntegral();
            const error = Math.abs(riemannSum - exactIntegral);

            document.getElementById('riemannSum').textContent = riemannSum.toFixed(4);
            document.getElementById('error').textContent = error.toFixed(4);
        },
        () => {
            // Animation complete
            isDensifying = false;
            densifyBtn.innerHTML = '<span class="icon">▶</span> Densify 시작';
            subdivisionsSlider.disabled = false;
            updateStatus('완료!');

            // Reset progress bar after 1 second
            setTimeout(() => {
                document.getElementById('densifyProgress').style.width = '0%';
                updateStatus('준비됨');
            }, 1000);
        }
    );
}

/**
 * Stop the densify animation
 */
function stopDensify() {
    if (!isDensifying) return;

    renderer.stopAnimation();
    isDensifying = false;

    const densifyBtn = document.getElementById('densifyBtn');
    densifyBtn.innerHTML = '<span class="icon">▶</span> Densify 시작';

    const subdivisionsSlider = document.getElementById('subdivisions');
    subdivisionsSlider.disabled = false;

    updateStatus('일시정지됨');

    // Reset progress bar
    setTimeout(() => {
        document.getElementById('densifyProgress').style.width = '0%';
        updateStatus('준비됨');
    }, 1000);
}

/**
 * Reset the visualization
 */
function resetVisualization() {
    if (isDensifying) {
        stopDensify();
    }

    // Reset to initial state
    calculator.setSubdivisions(5);
    document.getElementById('subdivisions').value = 5;
    document.getElementById('subdivisionsValue').textContent = 5;

    updateVisualization();
    updateStatus('초기화됨');

    setTimeout(() => {
        updateStatus('준비됨');
    }, 1000);
}

/**
 * Update connection status display
 * @param {boolean} isConnected - Connection status
 */
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');

    if (isConnected) {
        statusElement.innerHTML = `
            <span class="status-dot" style="background: #4ade80;"></span>
            <span class="status-text">Moodle 연결됨</span>
        `;
    } else {
        statusElement.innerHTML = `
            <span class="status-dot" style="background: #f87171;"></span>
            <span class="status-text">Moodle 미연결</span>
        `;
    }
}

/**
 * Update status text
 * @param {string} text - Status text
 */
function updateStatus(text) {
    document.getElementById('statusText').textContent = text;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.app = {
    calculator,
    renderer,
    moodleAPI,
    loadProblem,
    startDensify,
    stopDensify,
    resetVisualization
};
