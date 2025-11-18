/**
 * Enhanced Smooth vs Steps Animation with Quiz Features
 * Probability Distribution Visualizer with Interactive Learning
 */

var SmoothStepsEnhanced = (function() {
    'use strict';

    var canvas, ctx;
    var animationId;
    var isPlaying = false;
    var currentFrame = 0;
    var maxFrames = 300;
    var config = {
        distributiontype: 'both',
        animationspeed: 'medium',
        cmid: 0,
        sesskey: ''
    };

    var currentProblem = null;
    var startTime = null;
    var attemptNumber = 0;
    var userStats = {
        total: 0,
        correct: 0,
        avgTime: 0
    };

    // Animation speed settings
    var speedSettings = {
        slow: 30,
        medium: 60,
        fast: 120
    };

    // Distribution parameters
    var mean = 180;
    var stdDev = 50;
    var discretePoints = 15;

    /**
     * Initialize the enhanced animation system
     */
    function init(userConfig) {
        canvas = document.getElementById('probabilityCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        ctx = canvas.getContext('2d');
        config = Object.assign(config, userConfig);

        setupEventListeners();
        loadUserStats();
        reset();
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        document.getElementById('playBtn').addEventListener('click', function() {
            play();
            logInteraction('play');
        });

        document.getElementById('pauseBtn').addEventListener('click', function() {
            pause();
            logInteraction('pause');
        });

        document.getElementById('resetBtn').addEventListener('click', function() {
            reset();
            logInteraction('reset');
        });

        // Quiz button listeners
        var quizBtn = document.getElementById('loadQuizBtn');
        if (quizBtn) {
            quizBtn.addEventListener('click', loadNewProblem);
        }

        var submitBtn = document.getElementById('submitAnswerBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', submitAnswer);
        }

        // Mobile gesture support
        if (canvas) {
            var hammer = new Hammer(canvas);
            hammer.on('swipeleft', function() {
                if (isPlaying) pause();
                else play();
            });
            hammer.on('swiperight', reset);
        }
    }

    /**
     * Load user statistics
     */
    function loadUserStats() {
        if (!config.cmid) return;

        fetch('ajax.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: 'action=get_stats&cmid=' + config.cmid + '&sesskey=' + config.sesskey
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                userStats = data.data;
                updateStatsDisplay();
            }
        })
        .catch(error => console.error('Error loading stats:', error));
    }

    /**
     * Load a new problem from the server
     */
    function loadNewProblem() {
        if (!config.cmid) return;

        var loadBtn = document.getElementById('loadQuizBtn');
        if (loadBtn) {
            loadBtn.disabled = true;
            loadBtn.textContent = 'Loading...';
        }

        fetch('ajax.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: 'action=get_problem&cmid=' + config.cmid + '&sesskey=' + config.sesskey
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentProblem = data.data;
                attemptNumber++;
                startTime = Date.now();
                displayProblem(currentProblem);
            }
        })
        .catch(error => console.error('Error loading problem:', error))
        .finally(() => {
            if (loadBtn) {
                loadBtn.disabled = false;
                loadBtn.textContent = 'New Problem';
            }
        });
    }

    /**
     * Display the problem to the user
     */
    function displayProblem(problem) {
        var quizPanel = document.getElementById('quizPanel');
        if (!quizPanel) return;

        var html = '<div class="problem-question">';
        html += '<p><strong>Question:</strong> ' + problem.question + '</p>';
        html += '</div>';
        html += '<div class="problem-options">';

        problem.options.forEach((option, index) => {
            html += '<label class="option-label">';
            html += '<input type="radio" name="answer" value="' + index + '" class="option-radio">';
            html += '<span>' + option.text + '</span>';
            html += '</label>';
        });

        html += '</div>';
        html += '<button id="submitAnswerBtn" class="btn btn-success">Submit Answer</button>';

        quizPanel.innerHTML = html;

        // Reattach submit listener
        document.getElementById('submitAnswerBtn').addEventListener('click', submitAnswer);

        // Update visualization based on problem type
        if (problem.type === 'continuous') {
            mean = problem.mean || 180;
            stdDev = problem.stddev || 50;
        } else if (problem.type === 'discrete') {
            discretePoints = problem.n || 15;
        }

        reset();
    }

    /**
     * Submit the user's answer
     */
    function submitAnswer() {
        if (!currentProblem) return;

        var selectedOption = document.querySelector('input[name="answer"]:checked');
        if (!selectedOption) {
            alert('Please select an answer');
            return;
        }

        var selectedIndex = parseInt(selectedOption.value);
        var isCorrect = currentProblem.options[selectedIndex].correct;
        var timeSpent = Math.floor((Date.now() - startTime) / 1000);

        // Show feedback
        showFeedback(isCorrect);

        // Save progress
        saveProgress(attemptNumber, isCorrect ? 1 : 0, timeSpent);

        // Update stats
        userStats.total++;
        if (isCorrect) userStats.correct++;
        updateStatsDisplay();
    }

    /**
     * Show feedback to the user
     */
    function showFeedback(isCorrect) {
        var feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-message ' + (isCorrect ? 'correct' : 'incorrect');
        feedbackDiv.innerHTML = isCorrect
            ? '✓ Correct! Well done!'
            : '✗ Incorrect. Try again with a new problem.';

        var quizPanel = document.getElementById('quizPanel');
        if (quizPanel) {
            quizPanel.insertBefore(feedbackDiv, quizPanel.firstChild);

            setTimeout(() => {
                feedbackDiv.remove();
            }, 3000);
        }
    }

    /**
     * Save user progress to the server
     */
    function saveProgress(attempt, correct, timespent) {
        if (!config.cmid) return;

        var formData = 'action=save_progress';
        formData += '&cmid=' + config.cmid;
        formData += '&sesskey=' + config.sesskey;
        formData += '&attempt=' + attempt;
        formData += '&correct=' + correct;
        formData += '&timespent=' + timespent;

        fetch('ajax.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Error saving progress:', data.error);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    /**
     * Log user interaction
     */
    function logInteraction(type, data) {
        if (!config.cmid) return;

        var formData = 'action=log_interaction';
        formData += '&cmid=' + config.cmid;
        formData += '&sesskey=' + config.sesskey;
        formData += '&type=' + type;
        if (data) {
            formData += '&data=' + encodeURIComponent(JSON.stringify(data));
        }

        fetch('ajax.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: formData
        }).catch(error => console.error('Error logging interaction:', error));
    }

    /**
     * Update statistics display
     */
    function updateStatsDisplay() {
        var statsDiv = document.getElementById('userStats');
        if (!statsDiv) return;

        var accuracy = userStats.total > 0
            ? Math.round((userStats.correct / userStats.total) * 100)
            : 0;

        statsDiv.innerHTML = '<div class="stats-container">' +
            '<div class="stat-item"><span class="stat-label">Attempts:</span> <span class="stat-value">' + userStats.total + '</span></div>' +
            '<div class="stat-item"><span class="stat-label">Correct:</span> <span class="stat-value">' + userStats.correct + '</span></div>' +
            '<div class="stat-item"><span class="stat-label">Accuracy:</span> <span class="stat-value">' + accuracy + '%</span></div>' +
            '</div>';
    }

    /**
     * Normal distribution PDF
     */
    function normalPDF(x, mu, sigma) {
        var exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
        return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    }

    /**
     * Binomial probability
     */
    function binomialProbability(k, n, p) {
        function factorial(num) {
            if (num <= 1) return 1;
            return num * factorial(num - 1);
        }

        function combination(n, k) {
            return factorial(n) / (factorial(k) * factorial(n - k));
        }

        return combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    }

    /**
     * Draw continuous distribution
     */
    function drawContinuous(progress) {
        var width = canvas.width;
        var height = canvas.height / 2 - 40;
        var startY = 60;

        ctx.save();
        ctx.translate(0, startY);

        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, height);
        ctx.lineTo(width - 20, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(20, height);
        ctx.stroke();

        // Draw smooth curve
        ctx.beginPath();
        ctx.strokeStyle = '#2196F3';
        ctx.fillStyle = 'rgba(33, 150, 243, 0.3)';
        ctx.lineWidth = 3;

        var maxY = normalPDF(mean, mean, stdDev);
        var scale = height * 0.8 / maxY;
        var animatedWidth = width * (progress / maxFrames);

        ctx.moveTo(20, height);

        for (var x = 20; x <= animatedWidth && x <= width - 20; x += 2) {
            var dataX = (x - 20) / (width - 40) * 360;
            var y = normalPDF(dataX, mean, stdDev) * scale;
            ctx.lineTo(x, height - y);
        }

        if (progress > 0) {
            ctx.lineTo(animatedWidth, height);
            ctx.lineTo(20, height);
            ctx.closePath();
            ctx.fill();
        }

        ctx.stroke();

        // Labels
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Continuous (Smooth)', 30, 25);
        ctx.font = '12px Arial';
        ctx.fillText('Normal Distribution - PDF', 30, 43);

        ctx.restore();
    }

    /**
     * Draw discrete distribution
     */
    function drawDiscrete(progress) {
        var width = canvas.width;
        var height = canvas.height / 2 - 40;
        var startY = canvas.height / 2 + 20;

        ctx.save();
        ctx.translate(0, startY);

        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, height);
        ctx.lineTo(width - 20, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(20, height);
        ctx.stroke();

        // Calculate probabilities
        var n = discretePoints - 1;
        var p = 0.5;
        var maxProb = 0;
        var probabilities = [];

        for (var i = 0; i < discretePoints; i++) {
            var prob = binomialProbability(i, n, p);
            probabilities.push(prob);
            maxProb = Math.max(maxProb, prob);
        }

        var barWidth = (width - 60) / discretePoints;
        var scale = (height * 0.8) / maxProb;
        var visibleBars = Math.floor(discretePoints * (progress / maxFrames));

        for (var i = 0; i < visibleBars; i++) {
            var barHeight = probabilities[i] * scale;
            var x = 30 + i * barWidth;

            ctx.fillStyle = '#FF5722';
            ctx.strokeStyle = '#D84315';
            ctx.lineWidth = 2;
            ctx.fillRect(x, height - barHeight, barWidth - 4, barHeight);
            ctx.strokeRect(x, height - barHeight, barWidth - 4, barHeight);

            ctx.fillStyle = '#000';
            ctx.font = '9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(i.toString(), x + barWidth / 2 - 2, height + 12);
        }

        // Labels
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Discrete (Steps)', 30, 25);
        ctx.font = '12px Arial';
        ctx.fillText('Binomial Distribution - PMF', 30, 43);

        ctx.restore();
    }

    /**
     * Main animation loop
     */
    function animate() {
        if (!isPlaying) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.fillStyle = '#000';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Probability Distributions Comparison', canvas.width / 2, 30);

        // Draw distributions
        if (config.distributiontype === 'both' || config.distributiontype === 'continuous') {
            drawContinuous(currentFrame);
        }

        if (config.distributiontype === 'both' || config.distributiontype === 'discrete') {
            drawDiscrete(currentFrame);
        }

        currentFrame++;
        if (currentFrame > maxFrames) {
            currentFrame = 0;
        }

        var fps = speedSettings[config.animationspeed] || speedSettings.medium;
        var delay = 1000 / fps;

        setTimeout(function() {
            animationId = requestAnimationFrame(animate);
        }, delay);
    }

    function play() {
        if (!isPlaying) {
            isPlaying = true;
            animate();
        }
    }

    function pause() {
        isPlaying = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }

    function reset() {
        pause();
        currentFrame = 0;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Probability Distributions Comparison', canvas.width / 2, 30);

        if (config.distributiontype === 'both' || config.distributiontype === 'continuous') {
            drawContinuous(0);
        }

        if (config.distributiontype === 'both' || config.distributiontype === 'discrete') {
            drawDiscrete(0);
        }
    }

    // Public API
    return {
        init: init,
        play: play,
        pause: pause,
        reset: reset,
        loadNewProblem: loadNewProblem
    };
})();

/**
 * Initialize from PHP
 */
function initSmoothStepsAnimation(config) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            SmoothStepsEnhanced.init(config);
        });
    } else {
        SmoothStepsEnhanced.init(config);
    }
}
