/**
 * Main Application Controller
 * Coordinates all components of the Scaling Stream app
 */

class ScalingStreamApp {
    constructor() {
        this.currentQuestionId = null;
        this.previousQuestionId = null;
        this.autoStreamEnabled = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('[App] Initializing Scaling Stream...');

        // Initialize components
        smartphoneUI.init();
        scalingStream.init();

        // Set up event listeners
        this.setupEventListeners();

        // Check API health
        await this.checkAPIHealth();

        console.log('[App] Scaling Stream initialized successfully');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Load Question button
        const loadQuestionBtn = document.getElementById('loadQuestionBtn');
        if (loadQuestionBtn) {
            loadQuestionBtn.addEventListener('click', () => this.loadRandomQuestion());
        }

        // Start Stream button
        const startStreamBtn = document.getElementById('startStreamBtn');
        if (startStreamBtn) {
            startStreamBtn.addEventListener('click', () => this.startStreaming());
        }

        // Pause Stream button
        const pauseStreamBtn = document.getElementById('pauseStreamBtn');
        if (pauseStreamBtn) {
            pauseStreamBtn.addEventListener('click', () => this.pauseStreaming());
        }

        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'l' || e.key === 'L') {
                this.loadRandomQuestion();
            } else if (e.key === 's' || e.key === 'S') {
                this.startStreaming();
            } else if (e.key === 'p' || e.key === 'P') {
                this.pauseStreaming();
            } else if (e.key === 'r' || e.key === 'R') {
                this.reset();
            }
        });
    }

    /**
     * Check API health
     */
    async checkAPIHealth() {
        try {
            const result = await api.healthCheck();

            if (result.success) {
                console.log(`[App] API Health Check: ✓ ${result.app} v${result.version}`);
                this.showNotification('API 연결 성공', 'success');
            } else {
                console.error('[App] API Health Check Failed');
                this.showNotification('API 연결 실패', 'error');
            }
        } catch (error) {
            console.error('[App] API Health Check Error:', error);
            this.showNotification('API 연결 오류', 'error');
        }
    }

    /**
     * Load random question from Moodle
     */
    async loadRandomQuestion() {
        try {
            smartphoneUI.showLoading();
            this.updateCurrentQuestionDisplay('불러오는 중...');

            const result = await api.getRandomQuestion();

            if (result.success && result.data) {
                const question = result.data;

                // Store previous question ID
                this.previousQuestionId = this.currentQuestionId;
                this.currentQuestionId = question.id;

                // Update displays
                const questionName = question.name || `Question ${question.id}`;
                this.updateCurrentQuestionDisplay(questionName);

                // Display on smartphone
                smartphoneUI.displayQuestion(question);

                // Set question in scaling stream
                scalingStream.setQuestion(question);

                // Calculate similarity if we have a previous question
                if (this.previousQuestionId && this.previousQuestionId !== this.currentQuestionId) {
                    await scalingStream.calculateSimilarity(
                        this.previousQuestionId,
                        this.currentQuestionId
                    );
                }

                // Auto-start streaming if enabled
                if (this.autoStreamEnabled) {
                    this.startStreaming();
                }

                this.showNotification('문제 불러오기 완료', 'success');
            } else {
                const errorMsg = result.error || '문제를 불러올 수 없습니다';
                smartphoneUI.showError(errorMsg);
                this.showNotification(errorMsg, 'error');
            }
        } catch (error) {
            console.error('[App] Load Question Error:', error);
            smartphoneUI.showError('문제 불러오기 실패');
            this.showNotification('문제 불러오기 실패', 'error');
        }
    }

    /**
     * Start streaming visualization
     */
    startStreaming() {
        if (!this.currentQuestionId) {
            this.showNotification('먼저 문제를 불러오세요', 'warning');
            return;
        }

        scalingStream.startStream();
        this.showNotification('스트리밍 시작', 'success');
    }

    /**
     * Pause streaming
     */
    pauseStreaming() {
        scalingStream.pauseStream();
        const isPaused = scalingStream.getState().isPaused;
        this.showNotification(isPaused ? '일시정지됨' : '재개됨', 'info');
    }

    /**
     * Reset everything
     */
    reset() {
        scalingStream.reset();
        this.currentQuestionId = null;
        this.previousQuestionId = null;

        this.updateCurrentQuestionDisplay('-');
        document.getElementById('currentScale').textContent = '1.0x';
        document.getElementById('similarityScore').textContent = '-';

        const questionContent = document.getElementById('questionContent');
        if (questionContent) {
            questionContent.textContent = '문제를 불러오려면 \'문제 불러오기\' 버튼을 클릭하세요.';
        }

        const answerOptions = document.getElementById('answerOptions');
        if (answerOptions) {
            answerOptions.innerHTML = '';
        }

        this.showNotification('초기화 완료', 'success');
    }

    /**
     * Update current question display
     */
    updateCurrentQuestionDisplay(text) {
        const element = document.getElementById('currentQuestion');
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        console.log(`[App] ${type.toUpperCase()}: ${message}`);

        // You can implement a toast notification here
        // For now, just console log
    }

    /**
     * Toggle auto-stream
     */
    toggleAutoStream() {
        this.autoStreamEnabled = !this.autoStreamEnabled;
        console.log(`[App] Auto-stream: ${this.autoStreamEnabled ? 'ON' : 'OFF'}`);
        this.showNotification(
            `자동 스트리밍 ${this.autoStreamEnabled ? '켜짐' : '꺼짐'}`,
            'info'
        );
    }

    /**
     * Load questions list (for advanced usage)
     */
    async loadQuestionsList(limit = 20) {
        try {
            const result = await api.getQuestions(limit);

            if (result.success && result.data) {
                console.log(`[App] Loaded ${result.count} questions`);
                return result.data;
            } else {
                console.error('[App] Failed to load questions list');
                return [];
            }
        } catch (error) {
            console.error('[App] Load Questions List Error:', error);
            return [];
        }
    }

    /**
     * Get app state
     */
    getState() {
        return {
            currentQuestionId: this.currentQuestionId,
            previousQuestionId: this.previousQuestionId,
            autoStreamEnabled: this.autoStreamEnabled,
            scalingStream: scalingStream.getState()
        };
    }
}

// Create and initialize app when DOM is ready
let app;

document.addEventListener('DOMContentLoaded', async () => {
    app = new ScalingStreamApp();
    await app.init();

    // Update scale display periodically
    setInterval(() => {
        const state = scalingStream.getState();
        const scaleElement = document.getElementById('currentScale');
        if (scaleElement && state.isStreaming) {
            scaleElement.textContent = `${state.scaleFactor.toFixed(2)}x`;
        }
    }, 100);
});

// Make app globally accessible for debugging
window.ScalingStreamApp = app;
