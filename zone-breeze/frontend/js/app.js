/**
 * Zone Breeze - Main Application
 */

const ZoneBreezeApp = {
    // Configuration
    config: {
        apiUrl: '../backend/api.php',
        activityId: null,
        userId: null,
        sessionId: null
    },

    // State
    state: {
        problem: null,
        solution: null,
        startTime: null,
        sessionStartTime: null
    },

    // Visualizer instance
    visualizer: null,

    /**
     * Initialize the application
     */
    init(activityId, userId) {
        console.log('Initializing Zone Breeze...', { activityId, userId });

        this.config.activityId = activityId;
        this.config.userId = userId;
        this.state.sessionStartTime = Date.now();

        // Initialize visualizer
        this.visualizer = new InequalityVisualizer('visualization-canvas');

        // Setup event listeners
        this.setupEventListeners();

        // Setup smartphone dragging
        this.setupSmartphoneDragging();

        // Load problem from Moodle
        this.loadProblem();
    },

    /**
     * Setup event listeners for UI interactions
     */
    setupEventListeners() {
        // Solve button
        document.getElementById('btn-solve')?.addEventListener('click', () => {
            this.solveProblem();
        });

        // Reset button
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            this.resetVisualization();
        });

        // Submit button
        document.getElementById('btn-submit')?.addEventListener('click', () => {
            this.submitSolution();
        });

        // Zoom controls
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
            this.visualizer.zoomIn();
            this.trackInteraction('zoom');
        });

        document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
            this.visualizer.zoomOut();
            this.trackInteraction('zoom');
        });

        document.getElementById('btn-center')?.addEventListener('click', () => {
            this.visualizer.resetView();
        });

        // Modal close
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modal-ok')?.addEventListener('click', () => {
            this.hideModal();
        });

        // Canvas interaction tracking
        window.addEventListener('canvas-click', (e) => {
            this.trackInteraction('click', e.detail);
        });

        // Mouse move on canvas (for hover tracking)
        const canvas = document.getElementById('visualization-canvas');
        let hoverTimeout;
        canvas?.addEventListener('mousemove', () => {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                this.trackInteraction('hover');
            }, 1000);
        });
    },

    /**
     * Setup smartphone container dragging
     */
    setupSmartphoneDragging() {
        const container = document.getElementById('smartphone-container');
        const dragHandle = container?.querySelector('.drag-handle');

        if (!dragHandle || !container) return;

        let isDragging = false;
        let startX, startY, initialX, initialY;

        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = container.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;

            container.classList.add('dragging');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            container.style.left = (initialX + deltaX) + 'px';
            container.style.top = (initialY + deltaY) + 'px';
            container.style.right = 'auto';
            container.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                container.classList.remove('dragging');
            }
        });
    },

    /**
     * Load problem from backend/Moodle
     */
    async loadProblem() {
        try {
            this.showLoading();

            const response = await this.apiCall('get_problem', {
                activity_id: this.config.activityId,
                user_id: this.config.userId
            });

            if (response.success) {
                this.state.problem = response.problem;
                this.displayProblem(response.problem);
                this.config.sessionId = Date.now(); // Temporary session ID
                this.hideLoading();
                this.showMainContent();
            } else {
                throw new Error('Failed to load problem');
            }
        } catch (error) {
            console.error('Error loading problem:', error);
            this.hideLoading();
            this.showModal('오류', '문제를 불러오는 중 오류가 발생했습니다: ' + error.message);

            // Use demo problem for testing
            this.useDemoProblem();
        }
    },

    /**
     * Use demo problem for testing/demo purposes
     */
    useDemoProblem() {
        const demoProblem = {
            id: 'demo',
            title: '연립부등식 데모 문제',
            description: '다음 연립부등식의 해 영역을 시각화합니다.',
            inequalities: [
                'x + y <= 8',
                '2x + y <= 12',
                'x >= 0',
                'y >= 0'
            ],
            visualization_bounds: {
                xMin: -2,
                xMax: 10,
                yMin: -2,
                yMax: 10
            }
        };

        this.state.problem = demoProblem;
        this.displayProblem(demoProblem);
        this.hideLoading();
        this.showMainContent();
    },

    /**
     * Display problem information
     */
    displayProblem(problem) {
        // Set title
        const titleElem = document.getElementById('problem-title');
        if (titleElem) {
            titleElem.textContent = problem.title || '연립부등식 문제';
        }

        // Set description
        const descElem = document.getElementById('problem-description');
        if (descElem) {
            descElem.textContent = problem.description || '';
        }

        // Display inequalities
        const listElem = document.getElementById('inequalities-list');
        if (listElem) {
            listElem.innerHTML = '';
            problem.inequalities.forEach((inequality, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${InequalityUtils.format(inequality)}`;
                listElem.appendChild(li);
            });
        }
    },

    /**
     * Solve problem and visualize solution
     */
    async solveProblem() {
        if (!this.state.problem) {
            this.showModal('오류', '문제가 로드되지 않았습니다.');
            return;
        }

        try {
            this.showLoading('해 영역 계산 중...');
            this.state.startTime = Date.now();

            const response = await this.apiCall('solve', {
                inequalities: this.state.problem.inequalities,
                bounds: this.state.problem.visualization_bounds
            });

            if (response.success) {
                this.state.solution = response.solution;

                // Visualize solution
                this.visualizer.setData(
                    this.state.problem.inequalities,
                    response.solution,
                    this.state.problem.visualization_bounds
                );

                // Update statistics
                this.visualizer.updateStats();

                // Add energy effect to smartphone frame
                const frame = document.querySelector('.smartphone-frame');
                if (frame) {
                    frame.classList.add('energy-active');
                }

                this.hideLoading();

                // Show success message
                const computeTime = response.computation_time_ms || 0;
                this.showModal(
                    '성공',
                    `해 영역이 계산되었습니다!\n` +
                    `꼭짓점 개수: ${response.solution.vertices.length}\n` +
                    `계산 시간: ${computeTime.toFixed(2)}ms`
                );
            } else {
                throw new Error('Failed to solve inequalities');
            }
        } catch (error) {
            console.error('Error solving problem:', error);
            this.hideLoading();
            this.showModal('오류', '해를 계산하는 중 오류가 발생했습니다: ' + error.message);
        }
    },

    /**
     * Reset visualization
     */
    resetVisualization() {
        this.visualizer.clear();
        this.visualizer.resetView();
        this.state.solution = null;

        // Remove energy effect
        const frame = document.querySelector('.smartphone-frame');
        if (frame) {
            frame.classList.remove('energy-active');
        }

        // Reset statistics
        document.getElementById('solution-area').textContent = '--';
        document.getElementById('vertex-count').textContent = '--';
    },

    /**
     * Submit solution to backend
     */
    async submitSolution() {
        if (!this.state.problem) {
            this.showModal('오류', '제출할 문제가 없습니다.');
            return;
        }

        if (!this.state.solution) {
            this.showModal('알림', '먼저 해 영역을 계산해주세요.');
            return;
        }

        try {
            this.showLoading('제출 중...');

            const timeSpent = this.state.startTime
                ? Math.floor((Date.now() - this.state.startTime) / 1000)
                : 0;

            const response = await this.apiCall('submit', {
                problem_id: this.state.problem.id,
                user_id: this.config.userId,
                solution_data: this.state.solution,
                time_spent_seconds: timeSpent
            });

            this.hideLoading();

            if (response.success) {
                this.showModal(
                    '제출 완료',
                    `문제가 성공적으로 제출되었습니다!\n` +
                    `점수: ${response.grade}/100\n` +
                    `${response.feedback || ''}`
                );
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Error submitting solution:', error);
            this.hideLoading();
            this.showModal('오류', '제출 중 오류가 발생했습니다: ' + error.message);
        }
    },

    /**
     * Track user interaction
     */
    async trackInteraction(eventType, eventData = null) {
        if (!this.config.sessionId) return;

        try {
            await this.apiCall('track', {
                session_id: this.config.sessionId,
                event_type: eventType,
                event_data: eventData
            });
        } catch (error) {
            console.error('Error tracking interaction:', error);
        }
    },

    /**
     * Make API call
     */
    async apiCall(action, data = {}) {
        const url = `${this.config.apiUrl}?action=${action}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;
    },

    /**
     * Show loading screen
     */
    showLoading(message = 'Zone Breeze 로딩 중...') {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.querySelector('p').textContent = message;
            loadingScreen.style.display = 'flex';
        }
    },

    /**
     * Hide loading screen
     */
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    },

    /**
     * Show main content
     */
    showMainContent() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.remove('hidden');
            mainContent.classList.add('fadeIn');
        }
    },

    /**
     * Show modal dialog
     */
    showModal(title, message) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');

        if (modal && modalTitle && modalMessage) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modal.classList.remove('hidden');
        }
    },

    /**
     * Hide modal dialog
     */
    hideModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
};

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZoneBreezeApp;
}
