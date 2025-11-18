/**
 * JavaScript for Blossom Sequence module
 * Handles the flower petal animation and sequence visualization
 *
 * @module     mod_blossomsequence/blossomsequence
 * @package    mod_blossomsequence
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

(function() {
    'use strict';

    // Global configuration
    var config = {
        canvas: null,
        ctx: null,
        centerX: 160,
        centerY: 284,
        baseRadius: 100,
        petalLength: 60,
        petalWidth: 40,
        colors: [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
            '#F8B500', '#FF69B4', '#7FDBFF', '#39CCCC'
        ],
        animationDuration: 800,
        currentStep: 0,
        sequence: [],
        petalCount: 8
    };

    /**
     * Initialize the blossom sequence visualization
     */
    function init() {
        if (typeof BLOSSOM_DATA === 'undefined') {
            console.error('BLOSSOM_DATA not found');
            return;
        }

        config.sequence = BLOSSOM_DATA.sequence || [];
        config.petalCount = BLOSSOM_DATA.petalcount || 8;

        config.canvas = document.getElementById('blossom-canvas');
        if (!config.canvas) {
            console.error('Canvas element not found');
            return;
        }

        config.ctx = config.canvas.getContext('2d');

        // Set up event listeners
        setupEventListeners();

        // Start the animation
        drawCenter();
        animateBlossomSequence();
    }

    /**
     * Set up event listeners for user interaction
     */
    function setupEventListeners() {
        var submitBtn = document.getElementById('submit-answer');
        var answerInput = document.getElementById('student-answer');

        if (submitBtn) {
            submitBtn.addEventListener('click', handleSubmit);
        }

        if (answerInput) {
            answerInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSubmit();
                }
            });
        }
    }

    /**
     * Draw the center of the blossom
     */
    function drawCenter() {
        var ctx = config.ctx;

        // Draw center circle with gradient
        var gradient = ctx.createRadialGradient(
            config.centerX, config.centerY, 5,
            config.centerX, config.centerY, 25
        );
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFA500');

        ctx.beginPath();
        ctx.arc(config.centerX, config.centerY, 25, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add a border
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    /**
     * Animate the blossom sequence - petals unfold one by one
     */
    function animateBlossomSequence() {
        if (config.currentStep >= config.sequence.length) {
            return; // Animation complete
        }

        var delay = config.currentStep * 400; // Stagger each petal

        setTimeout(function() {
            drawPetal(config.currentStep);
            config.currentStep++;
            animateBlossomSequence();
        }, delay);
    }

    /**
     * Draw a single petal with animation
     * @param {number} index - The index of the petal
     */
    function drawPetal(index) {
        var ctx = config.ctx;
        var angle = (2 * Math.PI * index) / config.petalCount;
        var value = config.sequence[index];
        var color = config.colors[index % config.colors.length];

        // Calculate petal position
        var petalX = config.centerX + Math.cos(angle) * config.baseRadius;
        var petalY = config.centerY + Math.sin(angle) * config.baseRadius;

        // Animate the petal growing
        animatePetalGrowth(petalX, petalY, angle, color, value, 0);
    }

    /**
     * Animate a petal growing from center
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} angle - Rotation angle
     * @param {string} color - Petal color
     * @param {number} value - Sequence value to display
     * @param {number} progress - Animation progress (0-1)
     */
    function animatePetalGrowth(x, y, angle, color, value, progress) {
        if (progress >= 1) {
            drawCompletePetal(x, y, angle, color, value);
            return;
        }

        var ctx = config.ctx;
        var eased = easeOutCubic(progress);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Draw petal shape with scaling
        ctx.globalAlpha = eased;
        ctx.scale(eased, eased);

        drawPetalShape(color);

        // Draw the value
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), config.petalLength / 2, 0);

        ctx.restore();

        // Continue animation
        requestAnimationFrame(function() {
            animatePetalGrowth(x, y, angle, color, value, progress + 0.05);
        });
    }

    /**
     * Draw a complete petal (final state)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} angle - Rotation angle
     * @param {string} color - Petal color
     * @param {number} value - Sequence value to display
     */
    function drawCompletePetal(x, y, angle, color, value) {
        var ctx = config.ctx;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        drawPetalShape(color);

        // Draw the value
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), config.petalLength / 2, 0);

        ctx.restore();
    }

    /**
     * Draw the petal shape
     * @param {string} color - Petal color
     */
    function drawPetalShape(color) {
        var ctx = config.ctx;

        // Create gradient for petal
        var gradient = ctx.createLinearGradient(0, -config.petalWidth / 2, 0, config.petalWidth / 2);
        gradient.addColorStop(0, lightenColor(color, 20));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, darkenColor(color, 20));

        // Draw petal using bezier curves for organic shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
            config.petalLength / 3, -config.petalWidth / 2,
            2 * config.petalLength / 3, -config.petalWidth / 2,
            config.petalLength, 0
        );
        ctx.bezierCurveTo(
            2 * config.petalLength / 3, config.petalWidth / 2,
            config.petalLength / 3, config.petalWidth / 2,
            0, 0
        );
        ctx.closePath();

        ctx.fillStyle = gradient;
        ctx.fill();

        // Add border
        ctx.strokeStyle = darkenColor(color, 30);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add highlight for 3D effect
        ctx.beginPath();
        ctx.moveTo(config.petalLength / 4, -config.petalWidth / 4);
        ctx.lineTo(3 * config.petalLength / 4, -config.petalWidth / 4);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    /**
     * Easing function for smooth animation
     * @param {number} t - Progress (0-1)
     * @return {number} Eased value
     */
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Lighten a color
     * @param {string} color - Hex color
     * @param {number} percent - Percentage to lighten
     * @return {string} Lightened color
     */
    function lightenColor(color, percent) {
        var num = parseInt(color.replace('#', ''), 16);
        var amt = Math.round(2.55 * percent);
        var R = (num >> 16) + amt;
        var G = (num >> 8 & 0x00FF) + amt;
        var B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }

    /**
     * Darken a color
     * @param {string} color - Hex color
     * @param {number} percent - Percentage to darken
     * @return {string} Darkened color
     */
    function darkenColor(color, percent) {
        var num = parseInt(color.replace('#', ''), 16);
        var amt = Math.round(2.55 * percent);
        var R = (num >> 16) - amt;
        var G = (num >> 8 & 0x00FF) - amt;
        var B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
            (G > 0 ? G : 0) * 0x100 +
            (B > 0 ? B : 0))
            .toString(16).slice(1);
    }

    /**
     * Handle answer submission
     */
    function handleSubmit() {
        var answerInput = document.getElementById('student-answer');
        var feedbackArea = document.getElementById('feedback-area');

        if (!answerInput || !feedbackArea) {
            return;
        }

        var userAnswer = parseFloat(answerInput.value);

        if (isNaN(userAnswer)) {
            feedbackArea.className = 'incorrect';
            feedbackArea.textContent = 'Please enter a valid number';
            return;
        }

        // Calculate the expected next value
        var nextValue = calculateNextInSequence();

        // Check if answer is correct
        var isCorrect = Math.abs(userAnswer - nextValue) < 0.01;

        // Submit to server
        submitAnswer(userAnswer, nextValue, isCorrect);

        // Show feedback
        if (isCorrect) {
            feedbackArea.className = 'correct';
            feedbackArea.textContent = 'Correct! Well done!';
            celebrateCorrectAnswer();
        } else {
            feedbackArea.className = 'incorrect';
            feedbackArea.textContent = 'Incorrect. The answer was ' + nextValue + '. Try another one!';
        }
    }

    /**
     * Calculate the next value in the sequence
     * @return {number} The next value
     */
    function calculateNextInSequence() {
        var seq = config.sequence;
        var type = BLOSSOM_DATA.sequencetype;

        if (seq.length < 2) {
            return 0;
        }

        switch (type) {
            case 'fibonacci':
                return seq[seq.length - 1] + seq[seq.length - 2];

            case 'arithmetic':
                var diff = seq[1] - seq[0];
                return seq[seq.length - 1] + diff;

            case 'geometric':
                var ratio = seq[1] / seq[0];
                return seq[seq.length - 1] * ratio;

            case 'square':
                var n = seq.length + 1;
                return n * n;

            case 'prime':
                // Simple prime calculation (not perfect but good enough)
                var last = seq[seq.length - 1];
                var candidate = last + 1;
                while (!isPrime(candidate)) {
                    candidate++;
                }
                return candidate;

            default:
                // For custom, try to detect pattern
                var diff = seq[seq.length - 1] - seq[seq.length - 2];
                return seq[seq.length - 1] + diff;
        }
    }

    /**
     * Check if a number is prime
     * @param {number} n - Number to check
     * @return {boolean} True if prime
     */
    function isPrime(n) {
        if (n < 2) return false;
        if (n === 2) return true;
        if (n % 2 === 0) return false;

        for (var i = 3; i <= Math.sqrt(n); i += 2) {
            if (n % i === 0) return false;
        }
        return true;
    }

    /**
     * Submit answer to server via AJAX
     * @param {number} userAnswer - User's answer
     * @param {number} correctAnswer - Correct answer
     * @param {boolean} isCorrect - Whether answer was correct
     */
    function submitAnswer(userAnswer, correctAnswer, isCorrect) {
        var data = {
            blossomsequenceid: BLOSSOM_DATA.blossomsequenceid,
            useranswer: userAnswer,
            correctanswer: correctAnswer,
            score: isCorrect ? 100 : 0
        };

        console.log('Submitting answer:', data);

        // Use Moodle's AJAX API if available
        if (typeof require !== 'undefined') {
            require(['core/ajax', 'core/notification'], function(ajax, notification) {
                ajax.call([{
                    methodname: 'mod_blossomsequence_submit_answer',
                    args: data,
                    done: function(response) {
                        console.log('Answer submitted successfully:', response);
                    },
                    fail: function(error) {
                        notification.exception(error);
                        console.error('Failed to submit answer:', error);
                    }
                }]);
            });
        } else {
            // Fallback for testing outside Moodle environment
            console.warn('Moodle AJAX API not available. Running in test mode.');
        }
    }

    /**
     * Celebrate a correct answer with animation
     */
    function celebrateCorrectAnswer() {
        var canvas = config.canvas;
        canvas.classList.add('petal-glow');

        setTimeout(function() {
            canvas.classList.remove('petal-glow');
        }, 2000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
