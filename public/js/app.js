/**
 * Roll Along App - Main Application Controller
 * Handles UI interactions and coordinates with physics engine
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize physics engine
    const canvas = document.getElementById('rollCanvas');
    const engine = new PhysicsEngine(canvas);

    // Get UI elements
    const functionSelect = document.getElementById('functionSelect');
    const customFunctionGroup = document.getElementById('customFunctionGroup');
    const customFunction = document.getElementById('customFunction');
    const xValue = document.getElementById('xValue');
    const xValueDisplay = document.getElementById('xValueDisplay');
    const speedControl = document.getElementById('speedControl');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const currentX = document.getElementById('currentX');
    const currentY = document.getElementById('currentY');
    const functionValue = document.getElementById('functionValue');

    // Function definitions
    const functions = {
        linear: {
            name: '일차함수 (y = x)',
            func: (x) => x
        },
        quadratic: {
            name: '이차함수 (y = x²)',
            func: (x) => x * x / 10 // Scaled for better visualization
        },
        cubic: {
            name: '삼차함수 (y = x³)',
            func: (x) => x * x * x / 100 // Scaled for better visualization
        },
        sine: {
            name: '사인함수 (y = sin(x))',
            func: (x) => Math.sin(x) * 5 // Scaled for better visualization
        },
        cosine: {
            name: '코사인함수 (y = cos(x))',
            func: (x) => Math.cos(x) * 5 // Scaled for better visualization
        },
        custom: {
            name: '사용자 정의',
            func: null // Will be set by user
        }
    };

    // Current state
    let isPlaying = false;
    let autoPlayInterval = null;
    let currentFunctionType = 'linear';

    // Initialize
    init();

    function init() {
        // Set initial function
        updateFunction('linear');

        // Set initial ball position
        engine.setBallPosition(0);
        engine.draw();

        // Setup event listeners
        setupEventListeners();
    }

    function setupEventListeners() {
        // Function selection
        functionSelect.addEventListener('change', (e) => {
            const selectedFunction = e.target.value;
            currentFunctionType = selectedFunction;

            // Show/hide custom function input
            if (selectedFunction === 'custom') {
                customFunctionGroup.style.display = 'flex';
            } else {
                customFunctionGroup.style.display = 'none';
                updateFunction(selectedFunction);
            }
        });

        // Custom function input
        customFunction.addEventListener('input', (e) => {
            if (currentFunctionType === 'custom') {
                updateCustomFunction(e.target.value);
            }
        });

        // X value slider
        xValue.addEventListener('input', (e) => {
            const x = parseFloat(e.target.value);
            xValueDisplay.textContent = x.toFixed(1);

            // Stop auto-play when manually adjusting
            stopAutoPlay();

            // Move ball to new position
            const speed = parseFloat(speedControl.value) / 50;
            engine.animateToX(x, speed);
            engine.start();

            // Update info panel
            updateInfoPanel();
        });

        // Speed control
        speedControl.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            engine.animationSpeed = speed / 50;
        });

        // Play button
        playBtn.addEventListener('click', () => {
            startAutoPlay();
        });

        // Pause button
        pauseBtn.addEventListener('click', () => {
            stopAutoPlay();
        });

        // Reset button
        resetBtn.addEventListener('click', () => {
            resetAnimation();
        });

        // Update info panel periodically
        setInterval(updateInfoPanel, 100);
    }

    function updateFunction(functionType) {
        const func = functions[functionType].func;
        if (func) {
            engine.setFunction(func);
            engine.clearTrail();
            engine.setBallPosition(parseFloat(xValue.value));
            engine.draw();
            updateInfoPanel();
        }
    }

    function updateCustomFunction(expression) {
        try {
            // Create a safe function from the expression
            // WARNING: In production, this should be properly sanitized!
            const func = new Function('x', `
                try {
                    return ${expression};
                } catch (e) {
                    return 0;
                }
            `);

            // Test the function
            const testResult = func(0);
            if (isNaN(testResult) || !isFinite(testResult)) {
                throw new Error('Invalid function');
            }

            // Update engine
            engine.setFunction(func);
            engine.clearTrail();
            engine.setBallPosition(parseFloat(xValue.value));
            engine.draw();
            updateInfoPanel();

            // Clear error styling
            customFunction.style.borderColor = '#ddd';
        } catch (e) {
            // Show error
            customFunction.style.borderColor = 'red';
            console.error('Invalid function expression:', e);
        }
    }

    function startAutoPlay() {
        if (isPlaying) return;

        isPlaying = true;
        playBtn.disabled = true;
        pauseBtn.disabled = false;

        let currentX = parseFloat(xValue.value);
        const xMin = parseFloat(xValue.min);
        const xMax = parseFloat(xValue.max);
        const step = 0.2;

        autoPlayInterval = setInterval(() => {
            currentX += step;

            if (currentX > xMax) {
                currentX = xMin;
                engine.clearTrail();
            }

            xValue.value = currentX;
            xValueDisplay.textContent = currentX.toFixed(1);

            const speed = parseFloat(speedControl.value) / 50;
            engine.animateToX(currentX, speed);
            engine.start();
        }, 100);
    }

    function stopAutoPlay() {
        isPlaying = false;
        playBtn.disabled = false;
        pauseBtn.disabled = true;

        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }

        engine.stop();
    }

    function resetAnimation() {
        stopAutoPlay();
        xValue.value = 0;
        xValueDisplay.textContent = '0';
        engine.reset();
        updateInfoPanel();
    }

    function updateInfoPanel() {
        const x = engine.ball.x;
        const y = engine.ball.y;

        currentX.textContent = x.toFixed(2);
        currentY.textContent = y.toFixed(2);
        functionValue.textContent = y.toFixed(2);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        engine.resizeCanvas();
        engine.draw();
    });

    // Expose engine for debugging
    window.rollAlongEngine = engine;

    console.log('Roll Along App initialized successfully!');
});
