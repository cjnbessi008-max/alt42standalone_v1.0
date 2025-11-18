/**
 * Cognitive Recovery Detector
 * Real-time detection and UI feedback for cognitive recovery periods
 */

class CognitiveDetector {
    constructor(tracker, config = {}) {
        this.tracker = tracker;
        this.config = {
            showNotifications: config.showNotifications !== false,
            showVisualIndicator: config.showVisualIndicator !== false,
            notificationDuration: config.notificationDuration || 5000,
            recoveryThreshold: config.recoveryThreshold || 10000, // 10 seconds
            dropoutThreshold: config.dropoutThreshold || 300000, // 5 minutes
            checkInterval: config.checkInterval || 1000 // 1 second
        };

        this.currentState = 'active';
        this.lastState = 'active';
        this.recoveryStartTime = null;
        this.detectionInterval = null;
        this.visualIndicator = null;
        this.notificationContainer = null;

        this.init();
    }

    /**
     * Initialize detector
     */
    init() {
        // Create visual indicator
        if (this.config.showVisualIndicator) {
            this.createVisualIndicator();
        }

        // Create notification container
        if (this.config.showNotifications) {
            this.createNotificationContainer();
        }

        // Listen to recovery updates
        document.addEventListener('cognitiveRecoveryUpdate', (event) => {
            this.handleRecoveryUpdate(event.detail);
        });

        // Start detection loop
        this.startDetection();
    }

    /**
     * Start detection loop
     */
    startDetection() {
        this.detectionInterval = setInterval(() => {
            this.detectCurrentState();
        }, this.config.checkInterval);
    }

    /**
     * Stop detection loop
     */
    stopDetection() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    }

    /**
     * Detect current cognitive state
     */
    detectCurrentState() {
        const timeSinceLastActivity = this.tracker.getTimeSinceLastActivity();

        let newState = 'active';

        if (timeSinceLastActivity >= this.config.dropoutThreshold) {
            newState = 'potential_dropout';
        } else if (timeSinceLastActivity >= 60000) {
            newState = 'extended_pause';
        } else if (timeSinceLastActivity >= this.config.recoveryThreshold) {
            newState = 'cognitive_recovery';

            if (!this.recoveryStartTime) {
                this.recoveryStartTime = Date.now();
            }
        } else if (timeSinceLastActivity >= 3000) {
            newState = 'micro_break';
        } else {
            newState = 'active';
            this.recoveryStartTime = null;
        }

        // State changed
        if (newState !== this.currentState) {
            this.onStateChange(this.currentState, newState, timeSinceLastActivity);
            this.lastState = this.currentState;
            this.currentState = newState;
        }

        // Update visual indicator
        this.updateVisualIndicator(newState, timeSinceLastActivity);
    }

    /**
     * Handle state change
     */
    onStateChange(oldState, newState, timeSince) {
        console.log(`State changed: ${oldState} -> ${newState} (${timeSince}ms)`);

        // Emit custom event
        const event = new CustomEvent('cognitiveStateChange', {
            detail: {
                oldState: oldState,
                newState: newState,
                timeSinceLastActivity: timeSince
            }
        });
        document.dispatchEvent(event);

        // Show notification
        if (this.config.showNotifications) {
            this.showStateNotification(newState, timeSince);
        }
    }

    /**
     * Show state notification
     */
    showStateNotification(state, timeSince) {
        let message = '';
        let type = 'info';

        switch (state) {
            case 'cognitive_recovery':
                message = '인지 회복 구간이 감지되었습니다. 잠시 휴식 중이시군요! 👁️';
                type = 'success';
                break;

            case 'extended_pause':
                message = '좀 더 긴 휴식을 취하고 계시네요. 곧 돌아오시겠죠?';
                type = 'warning';
                break;

            case 'potential_dropout':
                message = '오랜 시간 자리를 비우셨습니다. 학습을 계속하시겠습니까?';
                type = 'error';
                break;

            case 'active':
                if (this.lastState === 'cognitive_recovery' ||
                    this.lastState === 'extended_pause') {
                    message = '다시 학습을 시작하셨네요! 화이팅! 💪';
                    type = 'success';
                }
                break;
        }

        if (message) {
            this.showNotification(message, type);
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (!this.notificationContainer) return;

        const notification = document.createElement('div');
        notification.className = `cr-notification cr-notification-${type}`;
        notification.innerHTML = `
            <div class="cr-notification-content">
                <span class="cr-notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="cr-notification-message">${message}</span>
                <button class="cr-notification-close">&times;</button>
            </div>
        `;

        // Close button
        notification.querySelector('.cr-notification-close').addEventListener('click', () => {
            notification.remove();
        });

        this.notificationContainer.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }
        }, this.config.notificationDuration);
    }

    /**
     * Get notification icon
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            warning: '⚠',
            error: '✕',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Create visual indicator
     */
    createVisualIndicator() {
        this.visualIndicator = document.createElement('div');
        this.visualIndicator.id = 'cr-visual-indicator';
        this.visualIndicator.innerHTML = `
            <div class="cr-indicator-pulse"></div>
            <div class="cr-indicator-label">활동 중</div>
            <div class="cr-indicator-timer">0s</div>
        `;
        document.body.appendChild(this.visualIndicator);
    }

    /**
     * Update visual indicator
     */
    updateVisualIndicator(state, timeSince) {
        if (!this.visualIndicator) return;

        const label = this.visualIndicator.querySelector('.cr-indicator-label');
        const timer = this.visualIndicator.querySelector('.cr-indicator-timer');
        const pulse = this.visualIndicator.querySelector('.cr-indicator-pulse');

        // Remove all state classes
        this.visualIndicator.classList.remove('active', 'micro-break', 'recovery', 'pause', 'dropout');

        // Update based on state
        switch (state) {
            case 'active':
                label.textContent = '활동 중';
                this.visualIndicator.classList.add('active');
                pulse.style.animationDuration = '1s';
                break;

            case 'micro_break':
                label.textContent = '짧은 휴식';
                this.visualIndicator.classList.add('micro-break');
                pulse.style.animationDuration = '2s';
                break;

            case 'cognitive_recovery':
                label.textContent = '인지 회복';
                this.visualIndicator.classList.add('recovery');
                pulse.style.animationDuration = '3s';
                break;

            case 'extended_pause':
                label.textContent = '휴식 중';
                this.visualIndicator.classList.add('pause');
                pulse.style.animationDuration = '4s';
                break;

            case 'potential_dropout':
                label.textContent = '비활성';
                this.visualIndicator.classList.add('dropout');
                pulse.style.animationDuration = '5s';
                break;
        }

        // Update timer
        const seconds = Math.floor(timeSince / 1000);
        timer.textContent = `${seconds}s`;
    }

    /**
     * Create notification container
     */
    createNotificationContainer() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'cr-notification-container';
        document.body.appendChild(this.notificationContainer);
    }

    /**
     * Handle recovery update from tracker
     */
    handleRecoveryUpdate(insights) {
        console.log('Recovery insights received:', insights);

        // Show recommendations
        if (insights.recommendations && insights.recommendations.length > 0) {
            insights.recommendations.forEach(rec => {
                this.showRecommendation(rec);
            });
        }

        // Emit event for dashboard to consume
        const event = new CustomEvent('recoveryInsightsReceived', {
            detail: insights
        });
        document.dispatchEvent(event);
    }

    /**
     * Show recommendation
     */
    showRecommendation(recommendation) {
        const message = `${recommendation.message} ${recommendation.suggestion}`;
        let type = 'info';

        if (recommendation.type === 'success') {
            type = 'success';
        } else if (recommendation.type === 'warning') {
            type = 'warning';
        }

        this.showNotification(message, type);
    }

    /**
     * Get current state
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * Get recovery duration
     */
    getRecoveryDuration() {
        if (this.recoveryStartTime) {
            return Date.now() - this.recoveryStartTime;
        }
        return 0;
    }

    /**
     * Destroy detector
     */
    destroy() {
        this.stopDetection();

        if (this.visualIndicator) {
            this.visualIndicator.remove();
            this.visualIndicator = null;
        }

        if (this.notificationContainer) {
            this.notificationContainer.remove();
            this.notificationContainer = null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CognitiveDetector;
}
