/**
 * Moodle LMS Integration for Reflection Pair
 * Handles API communication and data synchronization
 */

class MoodleReflectionPairIntegration {
    constructor(config = {}) {
        this.config = Object.assign({
            apiBaseUrl: '/reflection_pair/api',
            courseId: null,
            userId: null,
            autoLoad: true,
            refreshInterval: 30000  // 30 seconds
        }, config);

        this.visualizer = null;
        this.currentProblem = null;
        this.refreshTimer = null;

        if (this.config.autoLoad) {
            this.init();
        }
    }

    /**
     * Initialize the integration
     */
    init() {
        this.loadCurrentProblem();

        if (this.config.refreshInterval > 0) {
            this.startAutoRefresh();
        }

        this.setupControlButtons();
    }

    /**
     * Load current problem from Moodle LMS
     */
    loadCurrentProblem() {
        this.showLoading(true);

        const url = this.config.apiBaseUrl + '/problems.php?' +
            new URLSearchParams({
                course_id: this.config.courseId,
                user_id: this.config.userId
            });

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data && data.data.length > 0) {
                    // Get the most recent problem
                    this.currentProblem = data.data[0];
                    this.displayProblem(this.currentProblem);
                    this.recordInteraction('view');
                } else {
                    this.showError('No problems found');
                }
            })
            .catch(error => {
                console.error('Error loading problem:', error);
                this.showError('Failed to load problem');
            })
            .finally(() => {
                this.showLoading(false);
            });
    }

    /**
     * Display a problem in the visualizer
     */
    displayProblem(problem) {
        if (!this.visualizer) {
            this.visualizer = new ReflectionPairVisualizer('reflection-canvas', {
                baseNumber: parseFloat(problem.base_number),
                xMin: parseFloat(problem.x_range_min),
                xMax: parseFloat(problem.x_range_max),
                showReflectionLine: problem.show_reflection_line === '1' || problem.show_reflection_line === true
            });
        } else {
            this.visualizer.setBaseNumber(parseFloat(problem.base_number));
        }

        // Update header with problem info
        this.updateHeader(problem);
    }

    /**
     * Update screen header with problem information
     */
    updateHeader(problem) {
        const header = document.querySelector('.screen-header');
        if (header) {
            const base = parseFloat(problem.base_number);
            let baseDisplay;

            if (Math.abs(base - Math.E) < 0.001) {
                baseDisplay = 'e';
            } else if (base === 10) {
                baseDisplay = '10';
            } else if (base === 2) {
                baseDisplay = '2';
            } else {
                baseDisplay = base.toFixed(2);
            }

            header.textContent = 'y = ' + baseDisplay + '^x ⟷ y = log_' + baseDisplay + '(x)';
        }
    }

    /**
     * Record user interaction with the API
     */
    recordInteraction(type, data = {}) {
        if (!this.currentProblem) return;

        const payload = {
            action: 'record_interaction',
            problem_id: this.currentProblem.id,
            moodle_user_id: this.config.userId,
            interaction_type: type,
            interaction_data: data
        };

        fetch(this.config.apiBaseUrl + '/problems.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.warn('Failed to record interaction:', data.error);
            }
        })
        .catch(error => {
            console.error('Error recording interaction:', error);
        });
    }

    /**
     * Setup control button event listeners
     */
    setupControlButtons() {
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const resetBtn = document.getElementById('reset-btn');
        const toggleLineBtn = document.getElementById('toggle-line-btn');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                if (this.visualizer) {
                    this.visualizer.zoomIn();
                    this.recordInteraction('zoom', { action: 'in' });
                }
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                if (this.visualizer) {
                    this.visualizer.zoomOut();
                    this.recordInteraction('zoom', { action: 'out' });
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (this.visualizer) {
                    this.visualizer.resetView();
                    this.recordInteraction('zoom', { action: 'reset' });
                }
            });
        }

        if (toggleLineBtn) {
            toggleLineBtn.addEventListener('click', () => {
                if (this.visualizer) {
                    this.visualizer.toggleReflectionLine();
                    toggleLineBtn.classList.toggle('active');
                    this.recordInteraction('toggle', { element: 'reflection_line' });
                }
            });
        }
    }

    /**
     * Show/hide loading indicator
     */
    showLoading(show) {
        const indicator = document.querySelector('.loading-indicator');
        if (indicator) {
            indicator.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Display error message
     */
    showError(message) {
        const container = document.querySelector('.visualization-container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            errorDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #f44336; font-family: Arial; font-size: 14px; text-align: center;';
            container.appendChild(errorDiv);

            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }

    /**
     * Start auto-refresh timer
     */
    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshTimer = setInterval(() => {
            this.loadCurrentProblem();
        }, this.config.refreshInterval);
    }

    /**
     * Stop auto-refresh timer
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.stopAutoRefresh();
        this.visualizer = null;
        this.currentProblem = null;
    }
}

// Auto-initialize if Moodle context is available
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're in a Moodle environment
    if (typeof M !== 'undefined' && M.cfg) {
        // Moodle context available
        const courseId = M.cfg.courseId || document.body.dataset.courseId;
        const userId = M.cfg.userId || document.body.dataset.userId;

        if (courseId && userId) {
            window.reflectionPairIntegration = new MoodleReflectionPairIntegration({
                courseId: courseId,
                userId: userId
            });
        }
    } else {
        // Standalone mode - use data attributes or defaults
        const courseId = document.body.dataset.courseId || 1;
        const userId = document.body.dataset.userId || 1;

        window.reflectionPairIntegration = new MoodleReflectionPairIntegration({
            courseId: courseId,
            userId: userId
        });
    }
});
