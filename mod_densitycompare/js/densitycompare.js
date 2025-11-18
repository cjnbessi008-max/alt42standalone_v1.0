/**
 * Density Compare - Interactive Area Comparison
 * Visualizes area differences using color density
 */

(function() {
    'use strict';

    // Application state
    let currentProblem = null;
    let startTime = null;
    let canvas = null;
    let ctx = null;

    // Configuration
    const config = window.densityCompareConfig || {};

    /**
     * Initialize the application
     */
    function init() {
        canvas = document.getElementById('density-canvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        ctx = canvas.getContext('2d');
        setupEventListeners();
        loadNewProblem();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Answer buttons
        const answerButtons = document.querySelectorAll('.answer-btn');
        answerButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                handleAnswer(this.getAttribute('data-answer'));
            });
        });

        // Next problem button
        const nextBtn = document.getElementById('next-problem');
        if (nextBtn) {
            nextBtn.addEventListener('click', loadNewProblem);
        }
    }

    /**
     * Load a new problem from the server
     */
    function loadNewProblem() {
        const url = config.ajaxUrl + '?id=' + config.cmId + '&ajax=1&action=get_problem';

        fetch(url)
            .then(function(response) { return response.json(); })
            .then(function(data) {
                currentProblem = data;
                startTime = Date.now();
                displayProblem();
                resetUI();
            })
            .catch(function(error) {
                console.error('Error loading problem:', error);
            });
    }

    /**
     * Display the problem
     */
    function displayProblem() {
        if (!currentProblem) return;

        // Update question text
        const questionEl = document.getElementById('question-text');
        if (questionEl) {
            questionEl.textContent = currentProblem.question_text;
        }

        // Draw shapes on canvas
        drawShapes();
    }

    /**
     * Draw shapes with density visualization
     */
    function drawShapes() {
        if (!ctx || !currentProblem) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Parse shape data
        const shape1 = JSON.parse(currentProblem.shape1_data);
        const shape2 = JSON.parse(currentProblem.shape2_data);

        // Calculate areas
        const area1 = calculateArea(shape1);
        const area2 = calculateArea(shape2);
        const maxArea = Math.max(area1, area2);

        // Calculate density (opacity) based on area ratio
        const density1 = area1 / maxArea;
        const density2 = area2 / maxArea;

        // Draw Shape 1 (top)
        const y1 = 120;
        drawShape(shape1, 150, y1, currentProblem.color1, density1, 'Shape 1');

        // Draw Shape 2 (bottom)
        const y2 = 350;
        drawShape(shape2, 150, y2, currentProblem.color2, density2, 'Shape 2');

        // Draw info text
        drawInfoText(area1, area2, density1, density2);
    }

    /**
     * Calculate area of a shape
     */
    function calculateArea(shape) {
        if (shape.type === 'rectangle' || (shape.width && shape.height)) {
            return shape.width * shape.height;
        } else if (shape.type === 'circle' || shape.radius) {
            return Math.PI * shape.radius * shape.radius;
        }
        return 0;
    }

    /**
     * Draw a shape with density visualization
     */
    function drawShape(shape, x, y, color, density, label) {
        ctx.save();

        // Convert hex color to rgba with density
        const rgba = hexToRgba(color, density);
        ctx.fillStyle = rgba;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;

        if (shape.type === 'rectangle' || (shape.width && shape.height)) {
            // Draw rectangle
            const rectX = x - shape.width / 2;
            const rectY = y - shape.height / 2;
            ctx.fillRect(rectX, rectY, shape.width, shape.height);
            ctx.strokeRect(rectX, rectY, shape.width, shape.height);

        } else if (shape.type === 'circle' || shape.radius) {
            // Draw circle
            ctx.beginPath();
            ctx.arc(x, y, shape.radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }

        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y - 80);

        ctx.restore();
    }

    /**
     * Draw information text
     */
    function drawInfoText(area1, area2, density1, density2) {
        ctx.save();

        // Background for info
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(10, 10, 280, 80);

        // Info text
        ctx.fillStyle = '#2c3e50';
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';

        ctx.fillText('Density Comparison:', 20, 30);
        ctx.fillText('Higher density = Larger area', 20, 50);
        ctx.fillText('Compare the color intensity!', 20, 70);

        ctx.restore();
    }

    /**
     * Convert hex color to rgba
     */
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }

    /**
     * Handle answer submission
     */
    function handleAnswer(answer) {
        if (!currentProblem) return;

        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        // Disable buttons
        disableAnswerButtons();

        // Submit to server
        const url = config.ajaxUrl + '?id=' + config.cmId + '&ajax=1&action=submit_answer';
        const params = new URLSearchParams({
            problem_id: currentProblem.id,
            answer: answer,
            time_spent: timeSpent
        });

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            showFeedback(data.is_correct, data.message);
        })
        .catch(function(error) {
            console.error('Error submitting answer:', error);
            enableAnswerButtons();
        });
    }

    /**
     * Show feedback
     */
    function showFeedback(isCorrect, message) {
        const feedbackEl = document.getElementById('feedback');
        if (!feedbackEl) return;

        feedbackEl.textContent = message;
        feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');

        // Show next button
        const nextBtn = document.getElementById('next-problem');
        if (nextBtn) {
            nextBtn.style.display = 'block';
        }

        // Visual feedback on canvas
        drawFeedbackOnCanvas(isCorrect);
    }

    /**
     * Draw feedback animation on canvas
     */
    function drawFeedbackOnCanvas(isCorrect) {
        ctx.save();

        // Semi-transparent overlay
        ctx.fillStyle = isCorrect ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Large checkmark or X
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';

        if (isCorrect) {
            // Draw checkmark
            ctx.beginPath();
            ctx.moveTo(80, 260);
            ctx.lineTo(120, 300);
            ctx.lineTo(220, 200);
            ctx.stroke();
        } else {
            // Draw X
            ctx.beginPath();
            ctx.moveTo(100, 220);
            ctx.lineTo(200, 320);
            ctx.moveTo(200, 220);
            ctx.lineTo(100, 320);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Disable answer buttons
     */
    function disableAnswerButtons() {
        const buttons = document.querySelectorAll('.answer-btn');
        buttons.forEach(function(btn) {
            btn.disabled = true;
        });
    }

    /**
     * Enable answer buttons
     */
    function enableAnswerButtons() {
        const buttons = document.querySelectorAll('.answer-btn');
        buttons.forEach(function(btn) {
            btn.disabled = false;
        });
    }

    /**
     * Reset UI for new problem
     */
    function resetUI() {
        // Hide feedback
        const feedbackEl = document.getElementById('feedback');
        if (feedbackEl) {
            feedbackEl.style.display = 'none';
            feedbackEl.className = 'feedback';
        }

        // Hide next button
        const nextBtn = document.getElementById('next-problem');
        if (nextBtn) {
            nextBtn.style.display = 'none';
        }

        // Enable buttons
        enableAnswerButtons();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
