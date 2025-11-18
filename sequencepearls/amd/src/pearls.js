/**
 * Sequence Pearls - Main JavaScript Module
 * Handles pearl visualization and user interaction
 *
 * @module mod_sequencepearls/pearls
 * @copyright 2025 KAIST Touch Math Academy
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery', 'core/ajax', 'core/notification'], function($, Ajax, Notification) {

    var SequencePearls = {
        canvas: null,
        ctx: null,
        sequence: [],
        missingPosition: 0,
        problemId: 0,
        activityId: 0,
        userId: 0,
        startTime: 0,
        animationFrame: null,
        pearls: [],

        /**
         * Initialize the module
         */
        init: function(options) {
            this.activityId = options.activityid;
            this.userId = options.userid;

            this.setupCanvas();
            this.loadProblem();
            this.setupEventListeners();
            this.setupFullscreen();
        },

        /**
         * Setup canvas for pearl visualization
         */
        setupCanvas: function() {
            this.canvas = document.getElementById('pearls-canvas');
            if (!this.canvas) {
                console.error('Canvas element not found');
                return;
            }
            this.ctx = this.canvas.getContext('2d');
        },

        /**
         * Load problem data from hidden div
         */
        loadProblem: function() {
            var problemData = $('#problem-data');
            if (!problemData.length) {
                console.error('Problem data not found');
                return;
            }

            this.problemId = problemData.data('problemid');
            this.sequence = JSON.parse(problemData.data('sequence'));
            this.missingPosition = problemData.data('missing');
            this.startTime = Date.now();

            this.createPearls();
            this.animate();
        },

        /**
         * Create pearl objects for visualization
         */
        createPearls: function() {
            this.pearls = [];
            var numPearls = this.sequence.length;
            var canvasWidth = this.canvas.width;
            var canvasHeight = this.canvas.height;
            var spacing = canvasWidth / (numPearls + 1);

            for (var i = 0; i < numPearls; i++) {
                var pearl = {
                    x: spacing * (i + 1),
                    y: canvasHeight / 2,
                    radius: 25,
                    value: this.sequence[i],
                    isMissing: (i === this.missingPosition),
                    hue: (360 / numPearls) * i,
                    glowPhase: Math.random() * Math.PI * 2,
                    targetY: canvasHeight / 2,
                    velocity: 0
                };
                this.pearls.push(pearl);
            }
        },

        /**
         * Animation loop for pearls
         */
        animate: function() {
            var self = this;

            function render() {
                self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);

                // Draw connecting lines
                self.drawConnections();

                // Draw pearls
                for (var i = 0; i < self.pearls.length; i++) {
                    self.drawPearl(self.pearls[i], i);
                }

                self.animationFrame = requestAnimationFrame(render);
            }

            render();
        },

        /**
         * Draw connection lines between pearls
         */
        drawConnections: function() {
            this.ctx.strokeStyle = 'rgba(107, 115, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();

            for (var i = 0; i < this.pearls.length - 1; i++) {
                var p1 = this.pearls[i];
                var p2 = this.pearls[i + 1];
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
            }

            this.ctx.stroke();
        },

        /**
         * Draw a single pearl
         */
        drawPearl: function(pearl, index) {
            var time = Date.now() / 1000;
            pearl.glowPhase += 0.02;

            // Calculate glow intensity
            var glowIntensity = 0.5 + 0.5 * Math.sin(pearl.glowPhase);

            // Create radial gradient for pearl
            var gradient = this.ctx.createRadialGradient(
                pearl.x - pearl.radius * 0.3,
                pearl.y - pearl.radius * 0.3,
                0,
                pearl.x,
                pearl.y,
                pearl.radius
            );

            if (pearl.isMissing) {
                // Missing pearl - question mark
                gradient.addColorStop(0, 'rgba(200, 200, 200, 0.8)');
                gradient.addColorStop(1, 'rgba(150, 150, 150, 0.6)');
            } else {
                // Normal pearl - colorful gradient
                var hsl = 'hsl(' + pearl.hue + ', 70%, ' + (60 + glowIntensity * 20) + '%)';
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                gradient.addColorStop(0.3, hsl);
                gradient.addColorStop(1, 'hsl(' + pearl.hue + ', 60%, 40%)');
            }

            // Draw pearl shadow
            this.ctx.shadowColor = pearl.isMissing ?
                'rgba(0, 0, 0, 0.3)' :
                'hsla(' + pearl.hue + ', 70%, 50%, ' + (0.4 + glowIntensity * 0.3) + ')';
            this.ctx.shadowBlur = 15 + glowIntensity * 10;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 5;

            // Draw pearl circle
            this.ctx.beginPath();
            this.ctx.arc(pearl.x, pearl.y, pearl.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;

            // Draw pearl highlight
            this.ctx.beginPath();
            this.ctx.arc(
                pearl.x - pearl.radius * 0.3,
                pearl.y - pearl.radius * 0.3,
                pearl.radius * 0.3,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fill();

            // Draw value or question mark
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            if (pearl.isMissing) {
                this.ctx.fillStyle = '#666';
                this.ctx.font = 'bold 28px Arial';
                this.ctx.fillText('?', pearl.x, pearl.y);
            } else {
                this.ctx.fillText(pearl.value, pearl.x, pearl.y);
            }

            // Draw sequence index
            this.ctx.fillStyle = '#999';
            this.ctx.font = '12px Arial';
            this.ctx.fillText((index + 1), pearl.x, pearl.y + pearl.radius + 15);
        },

        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            var self = this;

            // Submit answer button
            $('#submit-answer').on('click', function() {
                self.submitAnswer();
            });

            // Enter key on input
            $('#user-answer').on('keypress', function(e) {
                if (e.which === 13) {
                    self.submitAnswer();
                }
            });

            // Next problem button
            $('#next-problem').on('click', function() {
                self.nextProblem();
            });

            // Canvas click for interaction
            this.canvas.addEventListener('click', function(e) {
                self.handleCanvasClick(e);
            });
        },

        /**
         * Handle canvas click
         */
        handleCanvasClick: function(e) {
            var rect = this.canvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;

            // Check if clicked on missing pearl
            for (var i = 0; i < this.pearls.length; i++) {
                var pearl = this.pearls[i];
                if (pearl.isMissing) {
                    var dx = x - pearl.x;
                    var dy = y - pearl.y;
                    var distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < pearl.radius) {
                        // Focus on answer input
                        $('#user-answer').focus();
                        break;
                    }
                }
            }
        },

        /**
         * Submit answer
         */
        submitAnswer: function() {
            var answer = parseFloat($('#user-answer').val());

            if (isNaN(answer)) {
                Notification.alert('Error', M.util.get_string('error_invalid_answer', 'mod_sequencepearls'), 'OK');
                return;
            }

            var timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

            // Call AJAX to check answer
            var self = this;
            Ajax.call([{
                methodname: 'mod_sequencepearls_submit_answer',
                args: {
                    problemid: this.problemId,
                    answer: answer,
                    timespent: timeSpent
                },
                done: function(response) {
                    self.showFeedback(response.correct, response.progress);
                },
                fail: function(error) {
                    Notification.exception(error);
                }
            }]);
        },

        /**
         * Show feedback after answer submission
         */
        showFeedback: function(isCorrect, progress) {
            $('#answer-section').hide();
            $('#feedback-section').show();

            var feedbackMsg = $('#feedback-message');
            feedbackMsg.removeClass('correct incorrect');

            if (isCorrect) {
                feedbackMsg.addClass('correct');
                feedbackMsg.text(M.util.get_string('correct', 'mod_sequencepearls'));

                // Update missing pearl with correct value
                var missingPearl = this.pearls[this.missingPosition];
                missingPearl.isMissing = false;
                this.celebrateCorrectAnswer();
            } else {
                feedbackMsg.addClass('incorrect');
                feedbackMsg.text(M.util.get_string('incorrect', 'mod_sequencepearls'));
            }

            // Update progress display
            if (progress) {
                this.updateProgressDisplay(progress);
            }
        },

        /**
         * Celebrate correct answer with animation
         */
        celebrateCorrectAnswer: function() {
            // Add sparkle effect
            var pearl = this.pearls[this.missingPosition];
            var particles = [];

            for (var i = 0; i < 20; i++) {
                particles.push({
                    x: pearl.x,
                    y: pearl.y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    life: 60,
                    hue: Math.random() * 360
                });
            }

            var self = this;
            function animateParticles() {
                for (var i = particles.length - 1; i >= 0; i--) {
                    var p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life--;

                    if (p.life > 0) {
                        self.ctx.fillStyle = 'hsla(' + p.hue + ', 100%, 60%, ' + (p.life / 60) + ')';
                        self.ctx.beginPath();
                        self.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                        self.ctx.fill();
                    } else {
                        particles.splice(i, 1);
                    }
                }

                if (particles.length > 0) {
                    requestAnimationFrame(animateParticles);
                }
            }

            animateParticles();
        },

        /**
         * Load next problem
         */
        nextProblem: function() {
            window.location.reload();
        },

        /**
         * Update progress display
         */
        updateProgressDisplay: function(progress) {
            // Update stats in progress panel
            // This would be implemented with actual DOM updates
        },

        /**
         * Setup fullscreen functionality
         */
        setupFullscreen: function() {
            $('#fullscreen-toggle').on('click', function() {
                var frame = $('.smartphone-frame');
                frame.toggleClass('fullscreen');

                if (frame.hasClass('fullscreen')) {
                    $(this).text('✕');
                } else {
                    $(this).text('⛶');
                }
            });
        }
    };

    return {
        init: function(options) {
            SequencePearls.init(options);
        }
    };
});
