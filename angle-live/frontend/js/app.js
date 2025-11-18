/**
 * Angle Live - Main Application
 */

class AngleLiveApp {
    constructor() {
        this.visualizer = null;
        this.miniVisualizer = null;
        this.currentAngle = 0;
        this.autoSaveTimer = null;
        this.moodleSyncTimer = null;
    }

    /**
     * Initialize application
     */
    async init() {
        Utils.log('Initializing Angle Live App...');

        try {
            // Initialize data
            const success = await DataManager.init();
            if (!success) {
                Utils.error('Failed to initialize data manager');
                return;
            }

            // Initialize visualizers
            this.initVisualizers();

            // Setup UI event listeners
            this.setupEventListeners();

            // Update UI with initial data
            this.updateProgressDisplay();

            // Start auto-sync if Moodle is configured
            if (CONFIG.MOODLE_USER_ID && CONFIG.MOODLE_COURSE_ID) {
                this.startMoodleSync();
            }

            // Initial draw
            this.updateAngle(0);

            Utils.log('App initialized successfully');
        } catch (error) {
            Utils.error('Failed to initialize app', error);
        }
    }

    /**
     * Initialize canvas visualizers
     */
    initVisualizers() {
        // Main visualizer
        this.visualizer = new AngleVisualizer('angleCanvas', CONFIG.CANVAS);

        // Mini visualizer for smartphone
        this.miniVisualizer = new MiniAngleVisualizer('miniAngleCanvas', CONFIG.MINI_CANVAS);

        Utils.log('Visualizers initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const slider = document.getElementById('angleSlider');

        if (slider) {
            // Slider input event (fires while dragging)
            slider.addEventListener('input', (e) => {
                const angle = parseInt(e.target.value);
                this.updateAngle(angle, false); // Update UI without saving
            });

            // Slider change event (fires when user releases)
            slider.addEventListener('change', (e) => {
                const angle = parseInt(e.target.value);
                this.updateAngle(angle, true); // Update and save
            });
        }

        Utils.log('Event listeners setup complete');
    }

    /**
     * Update angle value
     */
    async updateAngle(angle, saveToServer = true) {
        this.currentAngle = angle;

        // Update UI elements
        document.getElementById('angleValue').textContent = angle;
        document.getElementById('miniAngleValue').textContent = angle;

        // Get angle status
        let status = DataManager.findAngleStatus(angle);

        // Update status displays
        document.getElementById('angleStatus').textContent = status.name;
        document.getElementById('statusDescription').textContent = status.description;
        document.getElementById('miniStatus').textContent = status.name;

        // Update mini info
        this.updateMiniInfo(status, angle);

        // Get color from visual feedback
        const color = CONFIG.COLORS[status.visual] || CONFIG.COLORS['color-default'];

        // Update visualizers
        this.visualizer.setColor(status.visual);
        this.visualizer.draw(angle);

        this.miniVisualizer.setColor(status.visual);
        this.miniVisualizer.draw(angle);

        // Save to server if requested
        if (saveToServer && CONFIG.AUTO_SAVE) {
            try {
                const serverStatus = await DataManager.updateAngle(angle);
                Utils.log('Angle saved to server', serverStatus);

                // Refresh progress after saving
                await this.refreshProgress();
            } catch (error) {
                Utils.error('Failed to save angle', error);
            }
        }
    }

    /**
     * Update mini info panel
     */
    updateMiniInfo(status, angle) {
        const miniType = document.getElementById('miniType');
        const miniRange = document.getElementById('miniRange');

        if (miniType) {
            // Determine angle type
            let angleType = '예각';
            if (angle === 90) angleType = '직각';
            else if (angle > 90 && angle < 180) angleType = '둔각';
            else if (angle === 180) angleType = '평각';
            else if (angle > 180) angleType = '우각';

            miniType.textContent = angleType;
        }

        if (miniRange) {
            // Find the range from thresholds
            const threshold = DataManager.thresholds.find(t => {
                return angle >= parseFloat(t.angle_min) && angle <= parseFloat(t.angle_max);
            });

            if (threshold) {
                miniRange.textContent = `${threshold.angle_min}° - ${threshold.angle_max}°`;
            } else {
                miniRange.textContent = '-';
            }
        }
    }

    /**
     * Update progress display
     */
    updateProgressDisplay() {
        const progress = DataManager.userProgress;

        if (progress) {
            const totalSessions = document.getElementById('totalSessions');
            const anglesDiscovered = document.getElementById('anglesDiscovered');
            const completionRate = document.getElementById('completionRate');

            if (totalSessions) totalSessions.textContent = progress.total_sessions || 0;
            if (anglesDiscovered) anglesDiscovered.textContent = progress.angles_discovered || 0;
            if (completionRate) completionRate.textContent = Utils.formatNumber(progress.completion_percentage || 0) + '%';
        }
    }

    /**
     * Refresh progress from server
     */
    async refreshProgress() {
        const progress = await DataManager.refreshProgress();
        if (progress) {
            this.updateProgressDisplay();
        }
    }

    /**
     * Start Moodle synchronization
     */
    startMoodleSync() {
        if (this.moodleSyncTimer) {
            clearInterval(this.moodleSyncTimer);
        }

        this.moodleSyncTimer = setInterval(async () => {
            Utils.log('Syncing with Moodle...');
            await DataManager.syncWithMoodle();
        }, CONFIG.SYNC_MOODLE_INTERVAL);

        Utils.log('Moodle sync started');
    }

    /**
     * Stop Moodle synchronization
     */
    stopMoodleSync() {
        if (this.moodleSyncTimer) {
            clearInterval(this.moodleSyncTimer);
            this.moodleSyncTimer = null;
            Utils.log('Moodle sync stopped');
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            angle: this.currentAngle,
            status: DataManager.currentStatus,
            progress: DataManager.userProgress
        };
    }
}

// Global app instance
let app = null;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    Utils.log('DOM Content Loaded');

    app = new AngleLiveApp();
    await app.init();

    // Expose app to window for debugging
    if (CONFIG.DEBUG) {
        window.AngleLiveApp = app;
        window.DataManager = DataManager;
        window.API = API;
        Utils.log('Debug mode: App exposed to window');
    }
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (app) {
        app.stopMoodleSync();
    }
});
