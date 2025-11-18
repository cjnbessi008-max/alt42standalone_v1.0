// This file is part of Moodle - http://moodle.org/
//
// Meditation Routine Module
// Provides 5-second meditation routine before complex quiz problems

define(['jquery', 'core/ajax', 'core/notification'], function($, Ajax, Notification) {

    var MeditationRoutine = {

        // Configuration
        config: {
            duration: 5,
            animationStyle: 'breathing',
            quizid: null,
            attemptid: null,
            userid: null
        },

        // Meditation prompts for each second
        prompts: [
            {time: 5, text: '깊게 숨을 들이마시세요... (Breathe in deeply...)', emoji: '🌬️'},
            {time: 4, text: '마음을 가라앉히세요... (Calm your mind...)', emoji: '🧘'},
            {time: 3, text: '천천히 숨을 내쉬세요... (Exhale slowly...)', emoji: '💨'},
            {time: 2, text: '집중하세요... (Focus...)', emoji: '🎯'},
            {time: 1, text: '준비되었습니다! (Ready!)', emoji: '✨'}
        ],

        /**
         * Initialize meditation routine
         */
        init: function(quizid, attemptid, userid, settings) {
            this.config.quizid = quizid;
            this.config.attemptid = attemptid;
            this.config.userid = userid;

            if (settings) {
                this.config.duration = settings.duration || 5;
                this.config.animationStyle = settings.animation_style || 'breathing';
            }

            // Check if meditation should be shown
            this.checkAndShow();
        },

        /**
         * Check if meditation routine should be displayed
         */
        checkAndShow: function() {
            var self = this;

            Ajax.call([{
                methodname: 'local_meditation_routine_check_should_show',
                args: {
                    quizid: self.config.quizid,
                    attemptid: self.config.attemptid,
                    userid: self.config.userid
                },
                done: function(response) {
                    if (response.should_show) {
                        self.show();
                    }
                },
                fail: Notification.exception
            }]);
        },

        /**
         * Display meditation routine overlay
         */
        show: function() {
            var self = this;

            // Create overlay HTML
            var overlayHtml = this.createOverlayHtml();

            // Append to body
            $('body').append(overlayHtml);

            // Start animation and countdown
            setTimeout(function() {
                $('#meditation-overlay').addClass('active');
                self.startCountdown();
            }, 100);
        },

        /**
         * Create meditation overlay HTML
         */
        createOverlayHtml: function() {
            return `
                <div id="meditation-overlay" class="meditation-overlay">
                    <div class="meditation-container">
                        <div class="meditation-header">
                            <h2>🧘 정신 통일 (Mental Preparation)</h2>
                            <p>복잡한 문제를 시작하기 전 잠시 준비하세요</p>
                        </div>

                        <div class="breathing-animation">
                            <div class="breathing-circle"></div>
                            <div class="breathing-circle-inner"></div>
                        </div>

                        <div class="meditation-prompt">
                            <span class="prompt-emoji">🌬️</span>
                            <p class="prompt-text">깊게 숨을 들이마시세요...</p>
                        </div>

                        <div class="countdown-display">
                            <span class="countdown-number">${this.config.duration}</span>
                        </div>

                        <div class="meditation-footer">
                            <button class="btn-skip">건너뛰기 (Skip)</button>
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Start countdown timer
         */
        startCountdown: function() {
            var self = this;
            var timeLeft = this.config.duration;
            var startTime = Date.now();

            var countdownInterval = setInterval(function() {
                timeLeft--;

                // Update countdown display
                $('.countdown-number').text(timeLeft);

                // Update prompt
                self.updatePrompt(timeLeft);

                // Pulse animation
                self.pulseAnimation();

                if (timeLeft <= 0) {
                    clearInterval(countdownInterval);
                    self.complete(true, Date.now() - startTime);
                }
            }, 1000);

            // Handle skip button
            $('.btn-skip').off('click').on('click', function() {
                clearInterval(countdownInterval);
                self.complete(false, Date.now() - startTime);
            });
        },

        /**
         * Update meditation prompt text
         */
        updatePrompt: function(timeLeft) {
            var prompt = this.prompts.find(p => p.time === timeLeft);

            if (prompt) {
                $('.prompt-emoji').text(prompt.emoji);
                $('.prompt-text').text(prompt.text);
            }
        },

        /**
         * Trigger breathing pulse animation
         */
        pulseAnimation: function() {
            $('.breathing-circle').addClass('pulse');

            setTimeout(function() {
                $('.breathing-circle').removeClass('pulse');
            }, 900);
        },

        /**
         * Complete meditation routine
         */
        complete: function(completed, duration) {
            var self = this;

            // Log session
            Ajax.call([{
                methodname: 'local_meditation_routine_log_session',
                args: {
                    userid: self.config.userid,
                    quizid: self.config.quizid,
                    attemptid: self.config.attemptid,
                    duration: Math.round(duration / 1000),
                    completed: completed ? 1 : 0
                },
                done: function() {
                    self.hide();
                },
                fail: function() {
                    // Still hide even if logging fails
                    self.hide();
                }
            }]);
        },

        /**
         * Hide and remove meditation overlay
         */
        hide: function() {
            $('#meditation-overlay').removeClass('active');

            setTimeout(function() {
                $('#meditation-overlay').remove();
            }, 300);
        }
    };

    return {
        init: function(quizid, attemptid, userid, settings) {
            MeditationRoutine.init(quizid, attemptid, userid, settings);
        }
    };
});
