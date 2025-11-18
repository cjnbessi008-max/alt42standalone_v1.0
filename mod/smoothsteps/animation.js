/**
 * Smooth vs Steps Animation - Probability Distribution Visualizer
 * Demonstrates the difference between continuous and discrete probability distributions
 */

var SmoothStepsAnimation = (function() {
    'use strict';

    var canvas, ctx;
    var animationId;
    var isPlaying = false;
    var currentFrame = 0;
    var maxFrames = 300;
    var config = {
        distributiontype: 'both',
        animationspeed: 'medium'
    };

    // Animation speed settings (frames per second)
    var speedSettings = {
        slow: 30,
        medium: 60,
        fast: 120
    };

    // Normal distribution parameters
    var mean = 180; // Center of distribution
    var stdDev = 50; // Standard deviation
    var discretePoints = 15; // Number of discrete bars

    /**
     * Initialize the animation
     */
    function init(userConfig) {
        canvas = document.getElementById('probabilityCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        ctx = canvas.getContext('2d');
        config = Object.assign(config, userConfig);

        // Set up event listeners
        document.getElementById('playBtn').addEventListener('click', play);
        document.getElementById('pauseBtn').addEventListener('click', pause);
        document.getElementById('resetBtn').addEventListener('click', reset);

        // Initial draw
        reset();
    }

    /**
     * Calculate normal distribution probability density
     */
    function normalPDF(x, mu, sigma) {
        var exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
        return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    }

    /**
     * Calculate binomial probability for discrete distribution
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
     * Draw the continuous (smooth) probability distribution
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

        // Draw y-axis
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(20, height);
        ctx.stroke();

        // Draw the smooth curve
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

        // Fill under curve
        if (progress > 0) {
            ctx.lineTo(animatedWidth, height);
            ctx.lineTo(20, height);
            ctx.closePath();
            ctx.fill();
        }

        ctx.stroke();

        // Label
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Continuous (Smooth)', 30, 25);
        ctx.font = '12px Arial';
        ctx.fillText('Normal Distribution - Probability Density Function', 30, 43);

        // Draw axis labels
        ctx.font = '10px Arial';
        ctx.fillText('Value (x)', width - 60, height + 15);
        ctx.save();
        ctx.translate(10, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('P(X = x)', 0, 0);
        ctx.restore();

        ctx.restore();
    }

    /**
     * Draw the discrete (steps) probability distribution
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

        // Draw y-axis
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(20, height);
        ctx.stroke();

        // Calculate discrete probabilities (binomial distribution)
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

        // Draw bars with animation
        var visibleBars = Math.floor(discretePoints * (progress / maxFrames));

        for (var i = 0; i < visibleBars; i++) {
            var barHeight = probabilities[i] * scale;
            var x = 30 + i * barWidth;

            // Draw bar
            ctx.fillStyle = '#FF5722';
            ctx.strokeStyle = '#D84315';
            ctx.lineWidth = 2;
            ctx.fillRect(x, height - barHeight, barWidth - 4, barHeight);
            ctx.strokeRect(x, height - barHeight, barWidth - 4, barHeight);

            // Draw value label
            ctx.fillStyle = '#000';
            ctx.font = '9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(i.toString(), x + barWidth / 2 - 2, height + 12);
        }

        // Label
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Discrete (Steps)', 30, 25);
        ctx.font = '12px Arial';
        ctx.fillText('Binomial Distribution - Probability Mass Function', 30, 43);

        // Draw axis labels
        ctx.font = '10px Arial';
        ctx.fillText('Value (k)', width - 60, height + 15);
        ctx.save();
        ctx.translate(10, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('P(X = k)', 0, 0);
        ctx.restore();

        ctx.restore();
    }

    /**
     * Main animation loop
     */
    function animate() {
        if (!isPlaying) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.fillStyle = '#000';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Probability Distributions Comparison', canvas.width / 2, 30);

        // Draw distributions based on config
        if (config.distributiontype === 'both' || config.distributiontype === 'continuous') {
            drawContinuous(currentFrame);
        }

        if (config.distributiontype === 'both' || config.distributiontype === 'discrete') {
            drawDiscrete(currentFrame);
        }

        // Update frame
        currentFrame++;
        if (currentFrame > maxFrames) {
            currentFrame = 0;
        }

        // Calculate delay based on speed
        var fps = speedSettings[config.animationspeed] || speedSettings.medium;
        var delay = 1000 / fps;

        setTimeout(function() {
            animationId = requestAnimationFrame(animate);
        }, delay);
    }

    /**
     * Play animation
     */
    function play() {
        if (!isPlaying) {
            isPlaying = true;
            animate();
        }
    }

    /**
     * Pause animation
     */
    function pause() {
        isPlaying = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }

    /**
     * Reset animation
     */
    function reset() {
        pause();
        currentFrame = 0;

        // Clear and draw initial state
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
        reset: reset
    };
})();

/**
 * Initialize animation when called from PHP
 */
function initSmoothStepsAnimation(config) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            SmoothStepsAnimation.init(config);
        });
    } else {
        SmoothStepsAnimation.init(config);
    }
}
