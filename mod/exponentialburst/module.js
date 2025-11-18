/**
 * JavaScript for mod_exponentialburst
 * Implements exponential burst visualization with firework effects
 *
 * @package    mod_exponentialburst
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

(function() {
    'use strict';

    // Global state
    var config = null;
    var currentQuestion = null;
    var startTime = null;
    var canvas = null;
    var ctx = null;
    var particles = [];

    /**
     * Initialize the app when DOM is ready
     */
    function init() {
        // Wait for config to be available
        if (typeof EXPONENTIALBURST_CONFIG === 'undefined') {
            setTimeout(init, 100);
            return;
        }

        config = EXPONENTIALBURST_CONFIG;

        // Get canvas
        canvas = document.getElementById('burst-canvas');
        if (canvas) {
            ctx = canvas.getContext('2d');
        }

        // Hide loading, show app
        setTimeout(function() {
            document.getElementById('loading-indicator').style.display = 'none';
            document.getElementById('burst-app').style.display = 'flex';
            loadNewQuestion();
        }, 1000);

        // Set up event listeners
        setupEventListeners();

        // Start animation loop
        if (canvas) {
            requestAnimationFrame(animate);
        }
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        var submitBtn = document.getElementById('submit-btn');
        var answerInput = document.getElementById('answer-input');

        if (submitBtn) {
            submitBtn.addEventListener('click', submitAnswer);
        }

        if (answerInput) {
            answerInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    submitAnswer();
                }
            });
        }
    }

    /**
     * Load a new question
     */
    function loadNewQuestion() {
        // Generate exponential question based on difficulty
        var base = Math.floor(Math.random() * 4) + 2; // 2-5
        var maxExp = Math.min(5, config.difficulty + 2);
        var exponent = Math.floor(Math.random() * maxExp) + 1;

        currentQuestion = {
            id: Date.now(),
            base: base,
            exponent: exponent,
            correctAnswer: Math.pow(base, exponent),
            questionText: 'What is ' + base + '<sup>' + exponent + '</sup>?'
        };

        // Display question
        var questionEl = document.getElementById('question-text');
        if (questionEl) {
            questionEl.innerHTML = currentQuestion.questionText;
        }

        // Clear answer input
        var answerInput = document.getElementById('answer-input');
        if (answerInput) {
            answerInput.value = '';
            answerInput.focus();
        }

        // Clear feedback
        var feedback = document.getElementById('feedback-area');
        if (feedback) {
            feedback.className = 'feedback-area';
            feedback.textContent = '';
        }

        startTime = Date.now();
    }

    /**
     * Submit answer
     */
    function submitAnswer() {
        var answerInput = document.getElementById('answer-input');
        if (!answerInput || !currentQuestion) return;

        var answer = parseFloat(answerInput.value);
        if (isNaN(answer)) {
            showFeedback('Please enter a valid number', false);
            return;
        }

        var isCorrect = Math.abs(answer - currentQuestion.correctAnswer) < 0.001;
        var timeSpent = Math.floor((Date.now() - startTime) / 1000);

        // Show feedback
        if (isCorrect) {
            showFeedback('Correct! Watch the exponential burst!', true);
            createExponentialBurst(currentQuestion.base, currentQuestion.exponent);

            // Load new question after burst animation
            setTimeout(loadNewQuestion, 3000);
        } else {
            showFeedback('Not quite! The answer is ' + currentQuestion.correctAnswer, false);
            var answerContainer = document.querySelector('.answer-container');
            if (answerContainer) {
                answerContainer.classList.add('shake');
                setTimeout(function() {
                    answerContainer.classList.remove('shake');
                }, 500);
            }
        }

        // Record attempt
        recordAttempt(answer, isCorrect, timeSpent);
    }

    /**
     * Show feedback message
     */
    function showFeedback(message, isCorrect) {
        var feedback = document.getElementById('feedback-area');
        if (!feedback) return;

        feedback.textContent = message;
        feedback.className = 'feedback-area show ' + (isCorrect ? 'correct' : 'incorrect');

        setTimeout(function() {
            feedback.classList.remove('show');
        }, 2500);
    }

    /**
     * Create exponential burst visualization
     * The number of particles grows exponentially based on the answer
     */
    function createExponentialBurst(base, exponent) {
        if (!canvas || !ctx) return;

        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;

        // Calculate exponential growth stages
        var stages = exponent;
        var stageDelay = 200; // milliseconds between stages

        for (var stage = 1; stage <= stages; stage++) {
            (function(s) {
                setTimeout(function() {
                    var particleCount = Math.pow(base, s);
                    createBurstStage(centerX, centerY, particleCount, s);
                }, s * stageDelay);
            })(stage);
        }
    }

    /**
     * Create a single stage of the burst
     */
    function createBurstStage(x, y, count, stage) {
        var colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
        ];

        for (var i = 0; i < count; i++) {
            var angle = (Math.PI * 2 * i) / count;
            var speed = 2 + Math.random() * 3;
            var size = 3 + Math.random() * 5;

            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: size,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                decay: 0.01 + Math.random() * 0.02,
                stage: stage
            });
        }
    }

    /**
     * Animation loop
     */
    function animate() {
        if (!canvas || !ctx) return;

        // Clear canvas with fade effect
        ctx.fillStyle = 'rgba(26, 26, 46, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];

            // Update position
            p.x += p.vx;
            p.y += p.vy;

            // Apply gravity
            p.vy += 0.1;

            // Fade out
            p.alpha -= p.decay;

            // Draw particle
            if (p.alpha > 0) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();

                // Add glow effect for larger particles
                if (p.radius > 4) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = p.color;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }

                ctx.globalAlpha = 1;
            } else {
                // Remove dead particle
                particles.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    /**
     * Record attempt to server
     */
    function recordAttempt(answer, isCorrect, timeSpent) {
        // Prepare data
        var data = {
            exponentialburstid: config.activityid,
            userid: config.userid,
            questionid: currentQuestion.id,
            answer: answer,
            iscorrect: isCorrect ? 1 : 0,
            timespent: timeSpent,
            visualdata: JSON.stringify({
                base: currentQuestion.base,
                exponent: currentQuestion.exponent,
                particles: particles.length
            })
        };

        // Send via AJAX (using Moodle's AJAX API)
        var xhr = new XMLHttpRequest();
        xhr.open('POST', config.wwwroot + '/mod/exponentialburst/ajax.php', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
            if (xhr.status === 200) {
                console.log('Attempt recorded successfully');
            } else {
                console.error('Failed to record attempt');
            }
        };
        xhr.send(JSON.stringify(data));
    }

    /**
     * Particle class for better organization (optional enhancement)
     */
    function Particle(x, y, vx, vy, radius, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.alpha = 1;
        this.decay = 0.01 + Math.random() * 0.02;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
