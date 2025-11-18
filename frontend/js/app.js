/**
 * Main Application
 * Integrates all components and handles application logic
 */

class ShiftTrailApp {
    constructor() {
        // State
        this.state = {
            problemId: this.getUrlParam('problem_id') || 1,
            studentId: this.getUrlParam('student_id') || 1,
            sessionId: this.generateSessionId(),
            currentTrailId: null,
            isSubmitted: false
        };

        // Components
        this.smartphoneDisplay = null;
        this.shiftTrail = null;
        this.api = api; // Global api instance from api-client.js

        // DOM elements
        this.elements = {};

        // Initialize
        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        console.log('🚀 Initializing Shift Trail App...');

        try {
            // Show loading
            this.showLoading();

            // Cache DOM elements
            this.cacheElements();

            // Initialize components
            await this.initializeComponents();

            // Setup event listeners
            this.setupEventListeners();

            // Load problem data (mock for now)
            await this.loadProblemData();

            // Load student statistics (mock for now)
            await this.loadStudentStatistics();

            // Hide loading
            this.hideLoading();

            console.log('✅ App initialized successfully');

        } catch (error) {
            console.error('❌ App initialization error:', error);
            this.showError('Failed to initialize application');
            this.hideLoading();
        }
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            // Info displays
            problemId: document.getElementById('problem-id'),
            studentId: document.getElementById('student-id'),
            sessionId: document.getElementById('session-id'),

            // Trail settings
            trailColor: document.getElementById('trail-color'),
            trailWidth: document.getElementById('trail-width'),
            trailWidthValue: document.getElementById('trail-width-value'),
            animationDuration: document.getElementById('animation-duration'),
            animationDurationValue: document.getElementById('animation-duration-value'),

            // Buttons
            btnClearTrail: document.getElementById('btn-clear-trail'),
            btnAnimateTrail: document.getElementById('btn-animate-trail'),
            btnReset: document.getElementById('btn-reset'),
            btnSaveTrail: document.getElementById('btn-save-trail'),
            btnSubmit: document.getElementById('btn-submit'),

            // Translation info
            translationDistance: document.getElementById('translation-distance'),
            translationAngle: document.getElementById('translation-angle'),
            translationDx: document.getElementById('translation-dx'),
            translationDy: document.getElementById('translation-dy'),
            trailPointsCount: document.getElementById('trail-points-count'),

            // Feedback
            feedbackArea: document.getElementById('feedback-area'),

            // Statistics
            statTotalAttempts: document.getElementById('stat-total-attempts'),
            statCorrectAttempts: document.getElementById('stat-correct-attempts'),
            statAvgDistance: document.getElementById('stat-avg-distance'),
            statAvgScore: document.getElementById('stat-avg-score'),

            // Loading
            loadingOverlay: document.getElementById('loading-overlay')
        };

        // Display initial IDs
        this.elements.problemId.textContent = this.state.problemId;
        this.elements.studentId.textContent = this.state.studentId;
        this.elements.sessionId.textContent = this.state.sessionId.substring(0, 8);
    }

    /**
     * Initialize components
     */
    async initializeComponents() {
        // Create smartphone display
        this.smartphoneDisplay = new SmartphoneDisplay({
            width: 375,
            height: 667,
            position: 'bottom-right',
            scale: 0.85,
            deviceType: 'iphone',
            onReady: (contentArea) => {
                this.onSmartphoneReady(contentArea);
            }
        });
    }

    /**
     * Callback when smartphone display is ready
     */
    onSmartphoneReady(contentArea) {
        // Add app header
        this.smartphoneDisplay.addAppHeader('Shift Trail', {
            backgroundColor: '#3498db',
            textColor: '#fff'
        });

        // Create canvas for Shift Trail
        const canvasContainer = document.createElement('div');
        canvasContainer.style.cssText = `
            width: 100%;
            height: 100%;
            padding: 10px;
            background: #f8f9fa;
        `;

        const canvas = document.createElement('canvas');
        canvas.id = 'shift-trail-canvas';
        canvas.className = 'smartphone-canvas';
        canvas.width = 355;
        canvas.height = 550;

        canvasContainer.appendChild(canvas);
        contentArea.appendChild(canvasContainer);

        // Initialize Shift Trail
        this.shiftTrail = new ShiftTrail(canvas, {
            trailColor: this.elements.trailColor.value,
            trailWidth: parseInt(this.elements.trailWidth.value),
            animationDuration: parseInt(this.elements.animationDuration.value),
            onTrailCreate: (trailData) => this.onTrailCreate(trailData),
            onTrailUpdate: (trailData) => this.onTrailUpdate(trailData)
        });

        console.log('📱 Smartphone display ready');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Trail settings
        this.elements.trailColor.addEventListener('change', (e) => {
            if (this.shiftTrail) {
                this.shiftTrail.config.trailColor = e.target.value;
                this.shiftTrail.trail.color = e.target.value;
                this.shiftTrail.render();
            }
        });

        this.elements.trailWidth.addEventListener('input', (e) => {
            const value = e.target.value;
            this.elements.trailWidthValue.textContent = value;

            if (this.shiftTrail) {
                this.shiftTrail.config.trailWidth = parseInt(value);
                this.shiftTrail.trail.width = parseInt(value);
                this.shiftTrail.render();
            }
        });

        this.elements.animationDuration.addEventListener('input', (e) => {
            const value = e.target.value;
            this.elements.animationDurationValue.textContent = `${value}ms`;

            if (this.shiftTrail) {
                this.shiftTrail.config.animationDuration = parseInt(value);
            }
        });

        // Buttons
        this.elements.btnClearTrail.addEventListener('click', () => {
            if (this.shiftTrail) {
                this.shiftTrail.clearTrail();
                this.updateTranslationInfo({
                    translation: { dx: 0, dy: 0, distance: 0, angle: 0 },
                    trail: { points: [] }
                });
                this.showFeedback('Trail이 지워졌습니다.', 'info');
            }
        });

        this.elements.btnAnimateTrail.addEventListener('click', async () => {
            if (this.shiftTrail && this.shiftTrail.trail.points.length > 0) {
                this.showFeedback('Trail 애니메이션 재생 중...', 'info');
                await this.shiftTrail.animateTrail();
                this.showFeedback('애니메이션 재생 완료!', 'success');
            } else {
                this.showFeedback('재생할 Trail이 없습니다.', 'warning');
            }
        });

        this.elements.btnReset.addEventListener('click', () => {
            if (this.shiftTrail) {
                this.shiftTrail.reset();
                this.state.currentTrailId = null;
                this.state.isSubmitted = false;
                this.updateTranslationInfo({
                    translation: { dx: 0, dy: 0, distance: 0, angle: 0 },
                    trail: { points: [] }
                });
                this.showFeedback('초기화되었습니다.', 'info');
            }
        });

        this.elements.btnSaveTrail.addEventListener('click', () => {
            this.saveTrail();
        });

        this.elements.btnSubmit.addEventListener('click', () => {
            this.submitTrail();
        });
    }

    /**
     * Load problem data
     */
    async loadProblemData() {
        // TODO: Implement when backend API is ready
        // For now, use mock data
        console.log('📚 Loading problem data...');

        // Mock problem data
        const mockProblem = {
            id: this.state.problemId,
            title: '벡터 평행이동 실습',
            description: '주어진 벡터를 목표 위치로 평행이동시키세요.',
            type: 'vector_translation',
            initial_vector: { x1: 100, y1: 100, x2: 200, y2: 200 },
            target_vector: { x1: 250, y1: 250, x2: 350, y2: 350 }
        };

        console.log('✅ Problem loaded:', mockProblem);
    }

    /**
     * Load student statistics
     */
    async loadStudentStatistics() {
        // TODO: Implement when backend API is ready
        // For now, use mock data
        console.log('📊 Loading student statistics...');

        // Mock statistics
        const mockStats = {
            total_trails: 5,
            correct_trails: 3,
            avg_distance: 156.7,
            avg_score: 7.5
        };

        this.elements.statTotalAttempts.textContent = mockStats.total_trails;
        this.elements.statCorrectAttempts.textContent = mockStats.correct_trails;
        this.elements.statAvgDistance.textContent = mockStats.avg_distance.toFixed(1);
        this.elements.statAvgScore.textContent = mockStats.avg_score.toFixed(1);

        console.log('✅ Statistics loaded:', mockStats);
    }

    /**
     * Callback when trail is created
     */
    onTrailCreate(trailData) {
        console.log('✨ Trail created:', trailData);
        this.updateTranslationInfo(trailData);
        this.showFeedback(`Trail 생성 완료! ${trailData.trail.points.length}개의 포인트가 기록되었습니다.`, 'success');
    }

    /**
     * Callback when trail is updated
     */
    onTrailUpdate(trailData) {
        this.updateTranslationInfo(trailData);
    }

    /**
     * Update translation info display
     */
    updateTranslationInfo(trailData) {
        const { translation, trail } = trailData;

        this.elements.translationDistance.textContent = translation.distance.toFixed(2);
        this.elements.translationAngle.textContent = `${translation.angle.toFixed(2)}°`;
        this.elements.translationDx.textContent = translation.dx.toFixed(2);
        this.elements.translationDy.textContent = translation.dy.toFixed(2);
        this.elements.trailPointsCount.textContent = trail.points.length;
    }

    /**
     * Save trail to backend
     */
    async saveTrail() {
        if (!this.shiftTrail || this.shiftTrail.trail.points.length === 0) {
            this.showFeedback('저장할 Trail이 없습니다.', 'warning');
            return;
        }

        try {
            this.showLoading();

            const trailData = this.shiftTrail.getTrailData();

            const payload = {
                problem_id: this.state.problemId,
                student_id: this.state.studentId,
                session_id: this.state.sessionId,
                vector_start_x: trailData.vector.startX,
                vector_start_y: trailData.vector.startY,
                vector_end_x: trailData.vector.endX,
                vector_end_y: trailData.vector.endY,
                trail_points: trailData.trail.points,
                trail_color: trailData.trail.color,
                trail_width: trailData.trail.width,
                animation_duration: this.shiftTrail.config.animationDuration,
                is_submitted: 0
            };

            // TODO: Uncomment when backend is ready
            // const result = await this.api.createTrail(payload);
            // this.state.currentTrailId = result.data.trail_id;

            // Mock success for now
            this.state.currentTrailId = Math.floor(Math.random() * 1000);

            this.hideLoading();
            this.showFeedback('Trail이 저장되었습니다!', 'success');

            console.log('💾 Trail saved:', payload);

        } catch (error) {
            this.hideLoading();
            this.showFeedback('저장 실패: ' + error.message, 'error');
            console.error('Save error:', error);
        }
    }

    /**
     * Submit trail as answer
     */
    async submitTrail() {
        if (!this.shiftTrail || this.shiftTrail.trail.points.length === 0) {
            this.showFeedback('제출할 Trail이 없습니다.', 'warning');
            return;
        }

        if (this.state.isSubmitted) {
            this.showFeedback('이미 제출되었습니다.', 'warning');
            return;
        }

        try {
            this.showLoading();

            // Save trail first if not saved
            if (!this.state.currentTrailId) {
                await this.saveTrail();
            }

            // TODO: Uncomment when backend is ready
            // Validate trail
            // const validation = await this.api.validateTrail(
            //     this.state.currentTrailId,
            //     this.state.problemId,
            //     5.0
            // );

            // Submit trail
            // const submission = await this.api.submitTrail(this.state.currentTrailId, {
            //     is_correct: validation.data.is_correct,
            //     score: validation.data.is_correct ? 10 : 0,
            //     feedback: validation.data.feedback
            // });

            // Mock validation for now
            const isCorrect = Math.random() > 0.3; // 70% chance of correct
            const feedback = isCorrect
                ? '정답입니다! 벡터를 올바르게 평행이동했습니다. 🎉'
                : '아쉽지만 목표 지점에 정확히 도달하지 못했습니다. 다시 시도해보세요.';

            this.state.isSubmitted = true;

            this.hideLoading();
            this.showFeedback(feedback, isCorrect ? 'success' : 'error');

            // Update statistics
            await this.loadStudentStatistics();

            console.log('✅ Trail submitted');

        } catch (error) {
            this.hideLoading();
            this.showFeedback('제출 실패: ' + error.message, 'error');
            console.error('Submit error:', error);
        }
    }

    /**
     * Show feedback message
     */
    showFeedback(message, type = 'info') {
        const feedbackArea = this.elements.feedbackArea;

        const typeClasses = {
            info: '',
            success: 'feedback-success',
            error: 'feedback-error',
            warning: 'feedback-warning'
        };

        feedbackArea.innerHTML = `<p class="${typeClasses[type]}">${message}</p>`;
    }

    /**
     * Show error
     */
    showError(message) {
        this.showFeedback(message, 'error');
    }

    /**
     * Show loading overlay
     */
    showLoading() {
        this.elements.loadingOverlay.classList.remove('hidden');
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.elements.loadingOverlay.classList.add('hidden');
    }

    /**
     * Generate session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    }

    /**
     * Get URL parameter
     */
    getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.shiftTrailApp = new ShiftTrailApp();
});
