/**
 * Shape Explainer Main Application
 */

class ShapeExplainerApp {
    constructor() {
        this.currentShape = null;
        this.currentQuestion = null;
        this.progressId = null;
        this.startTime = null;
        this.renderer = null;
        this.animationEngine = null;

        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        debug('Initializing Shape Explainer App');

        // Initialize UI elements
        this.initUI();

        // Initialize canvas
        this.initCanvas();

        // Set up event listeners
        this.setupEventListeners();

        // Update time display
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);

        // Load initial data
        await this.loadData();
    }

    /**
     * Initialize UI elements
     */
    initUI() {
        this.elements = {
            loadingState: document.getElementById('loadingState'),
            questionContainer: document.getElementById('questionContainer'),
            questionText: document.getElementById('questionText'),
            shapeCanvas: document.getElementById('shapeCanvas'),
            animationCanvas: document.getElementById('animationCanvas'),
            propertiesPanel: document.getElementById('propertiesPanel'),
            propertiesList: document.getElementById('propertiesList'),
            controls: document.getElementById('controls'),
            progressBar: document.getElementById('progressBar'),
            progressFill: document.getElementById('progressFill'),
            debugPanel: document.getElementById('debugPanel'),
            debugInfo: document.getElementById('debugInfo')
        };

        // Show debug panel if in debug mode
        if (CONFIG.DEBUG) {
            this.elements.debugPanel.style.display = 'block';
        }
    }

    /**
     * Initialize canvas
     */
    initCanvas() {
        const canvas = this.elements.animationCanvas;
        this.renderer = new ShapeRenderer(canvas);
        this.animationEngine = new AnimationEngine(canvas, this.renderer);

        // Set up animation callbacks
        this.animationEngine.onStepComplete = (step, data) => {
            this.updateProgress();
            debug('Step completed:', step);
        };

        this.animationEngine.onAnimationComplete = () => {
            this.onAnimationComplete();
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Play button
        document.getElementById('playAnimation').addEventListener('click', () => {
            this.playAnimation();
        });

        // Pause button
        document.getElementById('pauseAnimation').addEventListener('click', () => {
            this.pauseAnimation();
        });

        // Reset button
        document.getElementById('resetAnimation').addEventListener('click', () => {
            this.resetAnimation();
        });

        // Show properties button
        document.getElementById('showProperties').addEventListener('click', () => {
            this.toggleProperties();
        });

        // Navigation buttons
        document.getElementById('homeBtn').addEventListener('click', () => {
            this.goHome();
        });

        document.getElementById('helpBtn').addEventListener('click', () => {
            this.showHelp();
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });
    }

    /**
     * Load initial data
     */
    async loadData() {
        try {
            this.showLoading(true);

            // Check API health
            const health = await API.healthCheck();
            debug('API Health:', health);

            // Get shape ID from URL or use default
            const params = getUrlParams();
            const shapeId = params.shapeId || 1; // Default to triangle

            // Load shape data
            const response = await API.getShape(shapeId);
            this.currentShape = response.data;

            debug('Shape loaded:', this.currentShape);

            // Start progress tracking
            if (CONFIG.MOODLE_USER_ID && CONFIG.MOODLE_QUESTION_ID) {
                const progressResponse = await API.startProgress(
                    CONFIG.MOODLE_USER_ID,
                    CONFIG.MOODLE_QUESTION_ID
                );
                this.progressId = progressResponse.progress_id;
                this.startTime = Date.now();
            }

            // Display shape
            this.displayShape();

            this.showLoading(false);

        } catch (error) {
            console.error('Failed to load data:', error);
            this.showError('데이터를 불러오는데 실패했습니다.');
        }
    }

    /**
     * Display shape
     */
    displayShape() {
        if (!this.currentShape) return;

        // Show question text
        const questionText = `"${this.currentShape.name_ko}"의 성질을 알아봅시다!`;
        this.elements.questionText.textContent = questionText;
        this.elements.questionContainer.classList.remove('hidden');

        // Draw shape
        this.renderer.clear();
        const vertices = this.renderer.drawShapeByName(
            this.currentShape.name_ko,
            this.renderer.centerX,
            this.renderer.centerY,
            80
        );

        // Load animation steps
        if (this.currentShape.animation_steps) {
            this.animationEngine.loadSteps(this.currentShape.animation_steps);
        }

        // Show canvas and controls
        this.elements.shapeCanvas.classList.remove('hidden');
        this.elements.controls.classList.remove('hidden');

        // Update debug info
        this.updateDebugInfo();
    }

    /**
     * Play animation
     */
    async playAnimation() {
        debug('Playing animation');

        // Disable play button, enable pause
        document.getElementById('playAnimation').disabled = true;
        document.getElementById('pauseAnimation').disabled = false;

        // Track interaction
        if (this.progressId) {
            await API.trackInteraction(this.progressId);
        }

        // Start animation
        await this.animationEngine.play();
    }

    /**
     * Pause animation
     */
    pauseAnimation() {
        debug('Pausing animation');

        this.animationEngine.pause();

        // Enable play button, disable pause
        document.getElementById('playAnimation').disabled = false;
        document.getElementById('pauseAnimation').disabled = true;
    }

    /**
     * Reset animation
     */
    resetAnimation() {
        debug('Resetting animation');

        this.animationEngine.reset();

        // Redraw initial shape
        this.displayShape();

        // Reset buttons
        document.getElementById('playAnimation').disabled = false;
        document.getElementById('pauseAnimation').disabled = true;

        // Reset progress bar
        this.elements.progressFill.style.width = '0%';
    }

    /**
     * Toggle properties panel
     */
    toggleProperties() {
        const panel = this.elements.propertiesPanel;
        const isHidden = panel.classList.contains('hidden');

        if (isHidden) {
            this.showProperties();
        } else {
            panel.classList.add('hidden');
        }
    }

    /**
     * Show properties
     */
    showProperties() {
        if (!this.currentShape || !this.currentShape.properties) return;

        const panel = this.elements.propertiesPanel;
        const list = this.elements.propertiesList;

        // Clear list
        list.innerHTML = '';

        // Add properties
        this.currentShape.properties.forEach(prop => {
            const li = document.createElement('li');

            const keySpan = document.createElement('span');
            keySpan.className = 'property-key';
            keySpan.textContent = prop.property_key;

            const valueSpan = document.createElement('span');
            valueSpan.className = 'property-value';
            valueSpan.textContent = prop.property_value;

            li.appendChild(keySpan);
            li.appendChild(valueSpan);

            if (prop.description_ko) {
                const descDiv = document.createElement('div');
                descDiv.className = 'property-description';
                descDiv.textContent = prop.description_ko;
                li.appendChild(descDiv);
            }

            list.appendChild(li);
        });

        // Show panel
        panel.classList.remove('hidden');
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const progress = this.animationEngine.getProgress();
        this.elements.progressFill.style.width = `${progress}%`;
    }

    /**
     * On animation complete
     */
    async onAnimationComplete() {
        debug('Animation completed');

        // Reset buttons
        document.getElementById('playAnimation').disabled = false;
        document.getElementById('pauseAnimation').disabled = true;

        // Show properties automatically
        this.showProperties();

        // Complete progress tracking
        if (this.progressId && this.startTime) {
            const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
            const score = 100; // Full marks for completion

            try {
                await API.completeProgress(this.progressId, score, timeSpent);
                debug('Progress completed:', { score, timeSpent });

                // Submit grade to Moodle
                if (CONFIG.MOODLE_USER_ID && CONFIG.MOODLE_QUESTION_ID) {
                    await API.submitGrade(
                        CONFIG.MOODLE_USER_ID,
                        CONFIG.MOODLE_QUESTION_ID,
                        score
                    );
                }
            } catch (error) {
                console.error('Failed to complete progress:', error);
            }
        }
    }

    /**
     * Show loading state
     */
    showLoading(show) {
        if (show) {
            this.elements.loadingState.classList.remove('hidden');
        } else {
            this.elements.loadingState.classList.add('hidden');
        }
    }

    /**
     * Show error
     */
    showError(message) {
        this.showLoading(false);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            background: #ff6b6b;
            color: white;
            padding: 16px;
            border-radius: 8px;
            margin: 16px;
            text-align: center;
        `;

        this.elements.loadingState.parentElement.appendChild(errorDiv);
    }

    /**
     * Update time display
     */
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('currentTime').textContent = timeString;
    }

    /**
     * Update debug info
     */
    updateDebugInfo() {
        if (!CONFIG.DEBUG) return;

        const info = {
            Shape: this.currentShape?.name_ko,
            'Shape ID': this.currentShape?.id,
            'Animation Steps': this.currentShape?.animation_steps?.length || 0,
            'Properties': this.currentShape?.properties?.length || 0,
            'Progress ID': this.progressId,
            'User ID': CONFIG.MOODLE_USER_ID,
            'Question ID': CONFIG.MOODLE_QUESTION_ID
        };

        this.elements.debugInfo.textContent = JSON.stringify(info, null, 2);
    }

    /**
     * Go to home
     */
    goHome() {
        if (confirm('홈으로 돌아가시겠습니까?')) {
            window.location.href = '/';
        }
    }

    /**
     * Show help
     */
    showHelp() {
        alert('도움말:\n\n1. ▶️ 재생 버튼을 눌러 애니메이션을 시작하세요.\n2. 📋 성질 보기 버튼으로 도형의 성질을 확인하세요.\n3. 🔄 처음부터 버튼으로 애니메이션을 다시 볼 수 있습니다.');
    }

    /**
     * Show settings
     */
    showSettings() {
        alert('설정 메뉴는 개발 중입니다.');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShapeExplainerApp();
});
