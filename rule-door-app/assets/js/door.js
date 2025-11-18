/**
 * Rule Door - Door Visualization Controller
 */

class DoorController {
    constructor() {
        this.doorElement = document.getElementById('door');
        this.statusIndicator = document.getElementById('door-status-indicator');
        this.statusText = document.getElementById('door-status-text');
        this.reasonText = document.getElementById('door-reason');
        this.currentStatus = 'closed';
        this.animating = false;
    }

    /**
     * Open the door
     */
    open(reason = 'Submission allowed') {
        if (this.animating || this.currentStatus === 'open') return;

        Logger.log('Opening door', reason);
        this.animating = true;
        this.currentStatus = 'open';

        // Update door visual
        this.doorElement.classList.remove('closed');
        this.doorElement.classList.add('open');

        // Update status indicator
        this.statusIndicator.classList.remove('status-closed');
        this.statusIndicator.classList.add('status-open');
        this.statusText.textContent = 'OPEN';
        this.statusText.style.color = '#28a745';

        // Update reason
        this.reasonText.textContent = reason;

        // Play sound effect (optional)
        this.playSound('open');

        // Reset animation flag
        setTimeout(() => {
            this.animating = false;
        }, CONFIG.DOOR_ANIMATION_DURATION);
    }

    /**
     * Close the door
     */
    close(reason = 'Submission not allowed') {
        if (this.animating || this.currentStatus === 'closed') return;

        Logger.log('Closing door', reason);
        this.animating = true;
        this.currentStatus = 'closed';

        // Update door visual
        this.doorElement.classList.remove('open');
        this.doorElement.classList.add('closed');

        // Update status indicator
        this.statusIndicator.classList.remove('status-open');
        this.statusIndicator.classList.add('status-closed');
        this.statusText.textContent = 'CLOSED';
        this.statusText.style.color = '#dc3545';

        // Update reason
        this.reasonText.textContent = reason;

        // Play sound effect (optional)
        this.playSound('close');

        // Reset animation flag
        setTimeout(() => {
            this.animating = false;
        }, CONFIG.DOOR_ANIMATION_DURATION);
    }

    /**
     * Update door state based on API response
     */
    updateFromState(doorState) {
        Logger.log('Updating door from state', doorState);

        const status = doorState.door_status || doorState.status;
        const reason = doorState.reason || 'Unknown reason';

        if (status === 'open') {
            this.open(reason);
        } else if (status === 'closed') {
            this.close(reason);
        }
    }

    /**
     * Play sound effect
     */
    playSound(type) {
        // Placeholder for sound effects
        // Could be implemented with HTML5 Audio API
        Logger.log(`Sound effect: ${type}`);
    }

    /**
     * Get current door status
     */
    getStatus() {
        return this.currentStatus;
    }

    /**
     * Reset door to initial state
     */
    reset() {
        this.close('Waiting for answer check...');
    }
}

/**
 * Statistics Display Controller
 */
class StatisticsController {
    constructor() {
        this.attemptsElement = document.getElementById('stat-attempts');
        this.duplicatesElement = document.getElementById('stat-duplicates');
        this.correctElement = document.getElementById('stat-correct');
    }

    /**
     * Update statistics display
     */
    update(stats) {
        Logger.log('Updating statistics', stats);

        if (stats.total_attempts !== undefined) {
            this.attemptsElement.textContent = stats.total_attempts;
        }

        if (stats.duplicate_count !== undefined || stats.duplicate_attempts !== undefined) {
            this.duplicatesElement.textContent = stats.duplicate_count || stats.duplicate_attempts || 0;
        }

        if (stats.correct_count !== undefined || stats.correct_attempts !== undefined) {
            this.correctElement.textContent = stats.correct_count || stats.correct_attempts || 0;
        }
    }

    /**
     * Increment attempt counter
     */
    incrementAttempts() {
        const current = parseInt(this.attemptsElement.textContent) || 0;
        this.attemptsElement.textContent = current + 1;
        this.animateCounter(this.attemptsElement);
    }

    /**
     * Increment duplicate counter
     */
    incrementDuplicates() {
        const current = parseInt(this.duplicatesElement.textContent) || 0;
        this.duplicatesElement.textContent = current + 1;
        this.animateCounter(this.duplicatesElement);
    }

    /**
     * Increment correct counter
     */
    incrementCorrect() {
        const current = parseInt(this.correctElement.textContent) || 0;
        this.correctElement.textContent = current + 1;
        this.animateCounter(this.correctElement);
    }

    /**
     * Animate counter change
     */
    animateCounter(element) {
        element.style.transform = 'scale(1.3)';
        element.style.transition = 'transform 0.3s';

        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 300);
    }

    /**
     * Reset statistics
     */
    reset() {
        this.attemptsElement.textContent = '0';
        this.duplicatesElement.textContent = '0';
        this.correctElement.textContent = '0';
    }
}

/**
 * Loading Overlay Controller
 */
class LoadingController {
    constructor() {
        this.overlay = document.getElementById('loading-overlay');
    }

    show() {
        this.overlay.classList.remove('hidden');
    }

    hide() {
        this.overlay.classList.add('hidden');
    }
}

// Initialize controllers
const doorController = new DoorController();
const statsController = new StatisticsController();
const loadingController = new LoadingController();

Logger.log('Door controllers initialized');
