/**
 * Thinking Tempo Tracker - Client-side event tracking
 *
 * @module     local_thinking_tempo/tracker
 * @package    local_thinking_tempo
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['jquery'], function($) {
    'use strict';

    /**
     * Thinking Tempo Tracker Class
     */
    class ThinkingTempoTracker {
        /**
         * Constructor
         * @param {Object} config Configuration object
         */
        constructor(config) {
            this.config = config;
            this.sessionId = null;
            this.eventBuffer = [];
            this.bufferSize = 20; // Send events in batches
            this.lastEventTime = null;
            this.questionElements = [];
            this.isActive = false;
            this.flushInterval = null;
        }

        /**
         * Initialize tracker
         */
        async init() {
            console.log('Thinking Tempo Tracker initialized', this.config);

            // Find question containers
            this.findQuestionElements();

            // Start session for current question
            await this.startSession();

            // Attach event listeners
            this.attachEventListeners();

            // Start periodic flush
            this.startPeriodicFlush();

            // Handle page unload
            window.addEventListener('beforeunload', () => this.handleUnload());
        }

        /**
         * Find question elements in the page
         */
        findQuestionElements() {
            // Moodle quiz question containers
            this.questionElements = document.querySelectorAll('.que, .formulation');

            if (this.questionElements.length === 0) {
                console.warn('No question elements found');
            }
        }

        /**
         * Start a new tracking session
         */
        async startSession() {
            const questionId = this.getCurrentQuestionId();
            if (!questionId) {
                console.error('Could not determine question ID');
                return;
            }

            try {
                const response = await $.ajax({
                    url: this.config.apiurl,
                    method: 'POST',
                    data: {
                        action: 'start_session',
                        quizid: this.config.quizid,
                        questionid: questionId,
                        attemptid: this.config.attemptid
                    }
                });

                if (response.success) {
                    this.sessionId = response.sessionid;
                    this.isActive = true;
                    console.log('Session started:', this.sessionId);

                    // Track session start event
                    this.trackEvent({
                        type: 'session_start',
                        data: {
                            questionId: questionId,
                            timestamp: response.timestamp
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to start session:', error);
            }
        }

        /**
         * Get current question ID from page
         */
        getCurrentQuestionId() {
            // Try to extract from question element
            const questionEl = document.querySelector('.que');
            if (questionEl) {
                const match = questionEl.id.match(/question-(\d+)/);
                if (match) {
                    return parseInt(match[1]);
                }
            }

            // Fallback: try URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('questionid') || 1;
        }

        /**
         * Attach event listeners
         */
        attachEventListeners() {
            // Keyboard events
            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
            document.addEventListener('keyup', (e) => this.handleKeyUp(e));

            // Mouse events
            document.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
            document.addEventListener('click', (e) => this.handleClick(e));

            // Focus events
            document.addEventListener('focusin', (e) => this.handleFocusIn(e));
            document.addEventListener('focusout', (e) => this.handleFocusOut(e));

            // Input events (for text inputs)
            const inputs = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
            inputs.forEach(input => {
                input.addEventListener('input', (e) => this.handleInput(e));
                input.addEventListener('paste', (e) => this.handlePaste(e));
                input.addEventListener('cut', (e) => this.handleCut(e));
            });

            // Form submission
            const form = document.querySelector('form');
            if (form) {
                form.addEventListener('submit', (e) => this.handleSubmit(e));
            }
        }

        /**
         * Handle keyboard down event
         */
        handleKeyDown(e) {
            if (!this.isActive) return;

            this.trackEvent({
                type: 'keydown',
                keyCode: e.keyCode,
                keyChar: e.key,
                elementId: e.target.id || null,
                elementType: e.target.tagName.toLowerCase(),
                data: {
                    ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey
                }
            });
        }

        /**
         * Handle keyboard up event
         */
        handleKeyUp(e) {
            if (!this.isActive) return;

            this.trackEvent({
                type: 'keyup',
                keyCode: e.keyCode,
                keyChar: e.key,
                elementId: e.target.id || null,
                elementType: e.target.tagName.toLowerCase()
            });
        }

        /**
         * Handle mouse move event (throttled)
         */
        handleMouseMove(e) {
            if (!this.isActive) return;

            // Throttle mouse move events to every 100ms
            const now = performance.now();
            if (this.lastMouseMove && (now - this.lastMouseMove) < 100) {
                return;
            }
            this.lastMouseMove = now;

            this.trackEvent({
                type: 'mousemove',
                x: e.clientX,
                y: e.clientY,
                data: {
                    targetElement: e.target.tagName.toLowerCase()
                }
            });
        }

        /**
         * Handle click event
         */
        handleClick(e) {
            if (!this.isActive) return;

            this.trackEvent({
                type: 'click',
                x: e.clientX,
                y: e.clientY,
                elementId: e.target.id || null,
                elementType: e.target.tagName.toLowerCase(),
                data: {
                    button: e.button,
                    targetText: e.target.textContent?.substring(0, 50)
                }
            });
        }

        /**
         * Handle focus in event
         */
        handleFocusIn(e) {
            if (!this.isActive) return;

            this.trackEvent({
                type: 'focus',
                elementId: e.target.id || null,
                elementType: e.target.tagName.toLowerCase(),
                data: {
                    inputType: e.target.type || null
                }
            });
        }

        /**
         * Handle focus out event
         */
        handleFocusOut(e) {
            if (!this.isActive) return;

            this.trackEvent({
                type: 'blur',
                elementId: e.target.id || null,
                elementType: e.target.tagName.toLowerCase()
            });
        }

        /**
         * Handle input event
         */
        handleInput(e) {
            if (!this.isActive) return;

            this.trackEvent({
                type: 'input',
                elementId: e.target.id || null,
                elementType: e.target.tagName.toLowerCase(),
                inputValue: e.target.value,
                data: {
                    inputLength: e.target.value?.length || 0,
                    selectionStart: e.target.selectionStart,
                    selectionEnd: e.target.selectionEnd
                }
            });
        }

        /**
         * Handle paste event
         */
        handlePaste(e) {
            if (!this.isActive) return;

            const pastedText = e.clipboardData?.getData('text') || '';

            this.trackEvent({
                type: 'paste',
                elementId: e.target.id || null,
                elementType: e.target.tagName.toLowerCase(),
                data: {
                    pastedLength: pastedText.length,
                    pastedText: pastedText.substring(0, 100) // Store first 100 chars
                }
            });
        }

        /**
         * Handle cut event
         */
        handleCut(e) {
            if (!this.isActive) return;

            this.trackEvent({
                type: 'cut',
                elementId: e.target.id || null,
                elementType: e.target.tagName.toLowerCase()
            });
        }

        /**
         * Handle form submit event
         */
        handleSubmit(e) {
            if (!this.isActive) return;

            this.trackEvent({
                type: 'submit',
                data: {
                    formId: e.target.id || null
                }
            });

            // Close session
            this.closeSession();
        }

        /**
         * Track an event
         * @param {Object} event Event data
         */
        trackEvent(event) {
            if (!this.isActive || !this.sessionId) {
                return;
            }

            // Add client-side timestamp (microsecond precision if available)
            const timestamp = performance.now() * 1000; // Convert to microseconds
            event.clientTimestamp = timestamp;

            // Add to buffer
            this.eventBuffer.push(event);

            // Check if we should flush
            if (this.eventBuffer.length >= this.bufferSize) {
                this.flushEvents();
            }
        }

        /**
         * Flush events to server
         */
        async flushEvents() {
            if (this.eventBuffer.length === 0) {
                return;
            }

            const eventsToSend = this.eventBuffer.splice(0, this.bufferSize);

            try {
                // Send events in batch
                for (const event of eventsToSend) {
                    await $.ajax({
                        url: this.config.apiurl,
                        method: 'POST',
                        data: {
                            action: 'track_event',
                            sessionid: this.sessionId,
                            event: JSON.stringify(event)
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to send events:', error);
                // Re-add events to buffer for retry
                this.eventBuffer.unshift(...eventsToSend);
            }
        }

        /**
         * Start periodic flush of events
         */
        startPeriodicFlush() {
            // Flush every 5 seconds
            this.flushInterval = setInterval(() => {
                this.flushEvents();
            }, 5000);
        }

        /**
         * Close the current session
         */
        async closeSession() {
            if (!this.sessionId) {
                return;
            }

            // Flush remaining events
            await this.flushEvents();

            // Get final answer
            const finalAnswer = this.getFinalAnswer();

            try {
                await $.ajax({
                    url: this.config.apiurl,
                    method: 'POST',
                    data: {
                        action: 'close_session',
                        sessionid: this.sessionId,
                        finalanswer: finalAnswer
                    }
                });

                console.log('Session closed:', this.sessionId);
                this.isActive = false;
            } catch (error) {
                console.error('Failed to close session:', error);
            }
        }

        /**
         * Get final answer from form
         */
        getFinalAnswer() {
            // Try to get answer from various input types
            const inputs = document.querySelectorAll('input[type="text"], textarea, input[type="radio"]:checked');
            const answers = [];

            inputs.forEach(input => {
                if (input.value) {
                    answers.push(input.value);
                }
            });

            return answers.join(' | ');
        }

        /**
         * Handle page unload
         */
        handleUnload() {
            // Clear interval
            if (this.flushInterval) {
                clearInterval(this.flushInterval);
            }

            // Synchronously close session using sendBeacon
            if (this.sessionId && this.isActive) {
                const data = new FormData();
                data.append('action', 'close_session');
                data.append('sessionid', this.sessionId);
                data.append('finalanswer', this.getFinalAnswer());

                navigator.sendBeacon(this.config.apiurl, data);
            }
        }
    }

    /**
     * Module interface
     */
    return {
        /**
         * Initialize the tracker
         * @param {Object} config Configuration object
         */
        init: function(config) {
            const tracker = new ThinkingTempoTracker(config);
            tracker.init();
        }
    };
});
