/**
 * Metaphor Log - Main Visualization Engine
 * Visualizes logarithm concepts using visual metaphors
 */

const MetaphorLog = (function() {
    'use strict';

    // Configuration
    const API_BASE = '../api';
    const ANIMATION_DURATION = 2000;

    // State
    let currentProblem = null;
    let currentMetaphor = 'tree';
    let canvas = null;
    let ctx = null;
    let animationFrame = null;
    let startTime = null;

    /**
     * Initialize the application
     */
    function init() {
        console.log('Initializing Metaphor Log...');

        // Get canvas and context
        canvas = document.getElementById('metaphorCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        ctx = canvas.getContext('2d');

        // Set canvas resolution for sharp rendering
        const scale = window.devicePixelRatio || 1;
        canvas.width = 335 * scale;
        canvas.height = 300 * scale;
        ctx.scale(scale, scale);

        // Bind event listeners
        bindEvents();

        // Load initial problem
        loadProblem();

        console.log('Metaphor Log initialized successfully');
    }

    /**
     * Bind event listeners
     */
    function bindEvents() {
        // Metaphor selection buttons
        const metaphorBtns = document.querySelectorAll('.metaphor-btn');
        metaphorBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const metaphor = this.dataset.metaphor;
                selectMetaphor(metaphor);
            });
        });

        // Submit answer
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', submitAnswer);
        }

        // Enter key in answer input
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    submitAnswer();
                }
            });
        }

        // New problem button
        const newProblemBtn = document.getElementById('newProblemBtn');
        if (newProblemBtn) {
            newProblemBtn.addEventListener('click', loadProblem);
        }

        // Hint button
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.addEventListener('click', showHint);
        }

        // Canvas interaction
        canvas.addEventListener('click', handleCanvasClick);
    }

    /**
     * Load a problem from the API
     */
    async function loadProblem(difficulty = null) {
        showLoading(true);

        try {
            let url = `${API_BASE}/get-problem.php`;
            if (difficulty) {
                url += `?difficulty=${difficulty}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                currentProblem = data.problem;
                displayProblem();
                selectMetaphor(data.problem.metaphorType);
                startTime = Date.now();

                // Clear previous answer and feedback
                document.getElementById('answerInput').value = '';
                hideFeedback();
            } else {
                console.error('Failed to load problem:', data.error);
                alert('문제를 불러오는데 실패했습니다: ' + data.error);
            }
        } catch (error) {
            console.error('Error loading problem:', error);
            alert('서버 연결에 실패했습니다.');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Display problem on screen
     */
    function displayProblem() {
        if (!currentProblem) return;

        // Update problem text
        const problemText = document.getElementById('problemText');
        problemText.textContent = currentProblem.question;

        // Update description
        const problemDescription = document.getElementById('problemDescription');
        problemDescription.textContent = currentProblem.description;

        // Update difficulty badge
        const difficultyBadge = document.getElementById('difficultyBadge');
        const difficultyMap = {
            'easy': '초급',
            'medium': '중급',
            'hard': '고급'
        };
        difficultyBadge.textContent = difficultyMap[currentProblem.difficulty] || '중급';
    }

    /**
     * Select and activate a metaphor visualization
     */
    function selectMetaphor(metaphor) {
        currentMetaphor = metaphor;

        // Update button states
        const metaphorBtns = document.querySelectorAll('.metaphor-btn');
        metaphorBtns.forEach(btn => {
            if (btn.dataset.metaphor === metaphor) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Draw the visualization
        drawMetaphor();
    }

    /**
     * Main drawing function - dispatches to specific metaphor renderers
     */
    function drawMetaphor() {
        if (!currentProblem || !ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw based on selected metaphor
        switch (currentMetaphor) {
            case 'tree':
                drawTreeMetaphor();
                break;
            case 'stairs':
                drawStairsMetaphor();
                break;
            case 'magnify':
                drawMagnifyMetaphor();
                break;
            case 'blocks':
                drawBlocksMetaphor();
                break;
            default:
                drawTreeMetaphor();
        }
    }

    /**
     * Tree Growth Metaphor
     * Shows how a tree grows by multiplying its size
     */
    function drawTreeMetaphor() {
        const { base, result, answer } = currentProblem;
        const steps = Math.round(answer);

        ctx.save();
        ctx.translate(167.5, 280); // Center bottom

        // Draw ground
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-150, 0, 300, 20);

        // Draw grass
        ctx.fillStyle = '#90EE90';
        for (let i = -150; i < 150; i += 10) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 3, -5);
            ctx.lineTo(i + 6, 0);
            ctx.fill();
        }

        // Calculate tree sizes
        let currentHeight = 20;
        const spacing = 300 / (steps + 1);

        for (let i = 0; i <= steps; i++) {
            const x = -135 + (i * spacing);
            const height = currentHeight;
            const trunkWidth = height * 0.15;

            // Draw trunk
            ctx.fillStyle = '#654321';
            ctx.fillRect(x - trunkWidth/2, -height, trunkWidth, height);

            // Draw crown
            ctx.fillStyle = i === steps ? '#228B22' : '#90EE90';
            ctx.beginPath();
            ctx.arc(x, -height, height * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Draw label
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(currentHeight), x, 30);

            // Draw multiplication arrow
            if (i < steps) {
                ctx.strokeStyle = '#FF6347';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 20, -height/2);
                ctx.lineTo(x + spacing - 20, -height/2);
                ctx.stroke();

                // Arrow head
                ctx.beginPath();
                ctx.moveTo(x + spacing - 20, -height/2);
                ctx.lineTo(x + spacing - 25, -height/2 - 5);
                ctx.lineTo(x + spacing - 25, -height/2 + 5);
                ctx.closePath();
                ctx.fillStyle = '#FF6347';
                ctx.fill();

                // Multiplication label
                ctx.fillStyle = '#FF6347';
                ctx.font = 'bold 10px Arial';
                ctx.fillText(`×${base}`, x + spacing/2, -height/2 - 10);
            }

            currentHeight *= base;
        }

        // Draw title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${base}를 ${steps}번 곱하면 ${result}`, 0, -200);

        ctx.restore();
    }

    /**
     * Stairs Metaphor
     * Shows climbing stairs with each step being a multiplication
     */
    function drawStairsMetaphor() {
        const { base, result, answer } = currentProblem;
        const steps = Math.round(answer);

        ctx.save();

        const stairWidth = 60;
        const stairHeight = 40;
        const startX = 20;
        const startY = 250;

        let currentValue = 1;

        for (let i = 0; i <= steps; i++) {
            const x = startX + (i * stairWidth);
            const y = startY - (i * stairHeight);

            // Draw stair
            ctx.fillStyle = i === steps ? '#FFD700' : '#B0C4DE';
            ctx.fillRect(x, y, stairWidth, stairHeight);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, stairWidth, stairHeight);

            // Draw value label
            ctx.fillStyle = '#333';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(currentValue), x + stairWidth/2, y + stairHeight/2 + 6);

            // Draw step number
            ctx.font = '12px Arial';
            ctx.fillText(`${i}단계`, x + stairWidth/2, y + stairHeight + 15);

            if (i < steps) {
                // Draw multiplication indicator
                ctx.fillStyle = '#FF6347';
                ctx.font = 'bold 14px Arial';
                ctx.fillText(`×${base}`, x + stairWidth + 15, y + stairHeight/2);
            }

            currentValue *= base;
        }

        // Draw title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${steps}계단을 올라 ${result}에 도달`, 167.5, 20);

        ctx.restore();
    }

    /**
     * Magnification Metaphor
     * Shows using a magnifying glass to multiply
     */
    function drawMagnifyMetaphor() {
        const { base, result, answer } = currentProblem;
        const steps = Math.round(answer);

        ctx.save();

        let currentSize = 15;
        const spacing = 300 / (steps + 1);
        const baseY = 150;

        for (let i = 0; i <= steps; i++) {
            const x = 20 + (i * spacing);

            // Draw object (circle)
            ctx.fillStyle = i === steps ? '#FF6347' : '#4169E1';
            ctx.beginPath();
            ctx.arc(x, baseY, currentSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw size label
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(Math.pow(base, i)), x, baseY + currentSize + 20);

            if (i < steps) {
                // Draw magnifying glass
                const glassX = x + spacing/2;
                const glassY = baseY - 30;

                // Handle
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(glassX, glassY + 20);
                ctx.lineTo(glassX + 15, glassY + 35);
                ctx.stroke();

                // Glass
                ctx.strokeStyle = '#4682B4';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(glassX, glassY, 15, 0, Math.PI * 2);
                ctx.stroke();

                // Magnification label
                ctx.fillStyle = '#FF6347';
                ctx.font = 'bold 12px Arial';
                ctx.fillText(`×${base}`, glassX, glassY + 5);
            }

            currentSize = Math.min(currentSize * 1.5, 50);
        }

        // Draw title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${base}배씩 ${steps}번 확대하면 ${result}`, 167.5, 30);

        ctx.restore();
    }

    /**
     * Building Blocks Metaphor
     * Shows stacking blocks exponentially
     */
    function drawBlocksMetaphor() {
        const { base, result, answer } = currentProblem;
        const steps = Math.round(answer);

        ctx.save();

        const blockSize = 25;
        const startY = 250;
        let xOffset = 20;

        for (let i = 0; i <= steps; i++) {
            const blocksInLevel = Math.pow(base, i);
            const levelWidth = blocksInLevel * blockSize;

            // Draw blocks in this level
            for (let j = 0; j < blocksInLevel; j++) {
                const x = xOffset + (j * blockSize);
                const y = startY - (i * blockSize);

                // Draw block
                const hue = (i * 40) % 360;
                ctx.fillStyle = `hsl(${hue}, 70%, ${i === steps ? 50 : 65}%)`;
                ctx.fillRect(x, y, blockSize - 2, blockSize - 2);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, blockSize - 2, blockSize - 2);
            }

            // Draw level label
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(
                `${i}층: ${blocksInLevel}개`,
                xOffset + levelWidth + 10,
                startY - (i * blockSize) + blockSize/2
            );

            // Adjust xOffset for next level (center alignment)
            if (i < steps) {
                const nextLevelWidth = Math.pow(base, i + 1) * blockSize;
                xOffset = xOffset + (levelWidth - nextLevelWidth) / 2;
            }
        }

        // Draw title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${base}배씩 ${steps}층: 총 ${result}개`, 167.5, 20);

        ctx.restore();
    }

    /**
     * Submit answer
     */
    async function submitAnswer() {
        const answerInput = document.getElementById('answerInput');
        const submittedAnswer = parseFloat(answerInput.value);

        if (isNaN(submittedAnswer)) {
            alert('올바른 숫자를 입력해주세요.');
            return;
        }

        showLoading(true);

        try {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            const moodleUserId = parseInt(document.getElementById('moodleData').dataset.userId) || 1;

            const response = await fetch(`${API_BASE}/save-progress.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    moodle_user_id: moodleUserId,
                    problem_id: currentProblem.id,
                    submitted_answer: submittedAnswer,
                    time_spent: timeSpent,
                    metaphor_interactions: {
                        metaphor_type: currentMetaphor,
                        time_spent: timeSpent
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                showFeedback(data.is_correct, data.feedback);
                if (data.is_correct) {
                    celebrateSuccess();
                }
            } else {
                console.error('Failed to save progress:', data.error);
                alert('답안 제출에 실패했습니다: ' + data.error);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('서버 연결에 실패했습니다.');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Show feedback message
     */
    function showFeedback(isCorrect, message) {
        const feedbackSection = document.getElementById('feedbackSection');
        const feedbackMessage = document.getElementById('feedbackMessage');

        feedbackSection.className = 'feedback-section ' + (isCorrect ? 'correct' : 'incorrect');
        feedbackMessage.textContent = message;
        feedbackSection.style.display = 'block';
    }

    /**
     * Hide feedback message
     */
    function hideFeedback() {
        const feedbackSection = document.getElementById('feedbackSection');
        feedbackSection.style.display = 'none';
    }

    /**
     * Celebrate correct answer
     */
    function celebrateSuccess() {
        const problemSection = document.querySelector('.problem-section');
        problemSection.classList.add('celebrate');
        setTimeout(() => {
            problemSection.classList.remove('celebrate');
        }, 500);
    }

    /**
     * Show hint for current problem
     */
    function showHint() {
        if (!currentProblem) return;

        const { base, result, answer } = currentProblem;
        const hint = `힌트: ${base}를 계속 곱해보세요.\n1 → ${base} → ${base * base} → ...`;
        alert(hint);
    }

    /**
     * Handle canvas click (for future interactive features)
     */
    function handleCanvasClick(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        console.log('Canvas clicked at:', x, y);
        // Future: Add interactive elements
    }

    /**
     * Show/hide loading overlay
     */
    function showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    // Public API
    return {
        init: init,
        loadProblem: loadProblem,
        selectMetaphor: selectMetaphor
    };
})();
