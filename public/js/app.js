/**
 * Main Application
 */

class ShapeTransformerApp {
    constructor() {
        this.renderer = null;
        this.shapes = [];
        this.transformations = [];
        this.currentShapeId = null;
        this.initialized = false;
    }

    /**
     * Initialize application
     */
    async init() {
        Utils.log('Initializing Shape Transformer App...');

        try {
            // Show loading
            this.showLoading(true);

            // Initialize session
            await SessionManager.init();

            // Initialize renderer
            this.renderer = new ShapeRenderer('shapeCanvas');

            // Load data
            await this.loadShapes();
            await this.loadTransformations();

            // Setup UI
            this.setupShapeButtons();
            this.setupTransformButtons();

            // Load first shape by default
            if (this.shapes.length > 0) {
                await this.selectShape(this.shapes[0].shape_id);
            }

            // Start render loop
            this.renderer.startAnimationLoop();

            // Hide loading
            this.showLoading(false);

            this.initialized = true;
            Utils.log('App initialized successfully');
        } catch (error) {
            Utils.error('Failed to initialize app:', error);
            this.showError('앱을 초기화하는데 실패했습니다. 페이지를 새로고침 해주세요.');
        }
    }

    /**
     * Load shapes from API
     */
    async loadShapes() {
        try {
            const response = await API.getShapes();
            if (response.success) {
                this.shapes = response.data;
                Utils.log('Loaded shapes:', this.shapes.length);
            }
        } catch (error) {
            Utils.error('Failed to load shapes:', error);
            throw error;
        }
    }

    /**
     * Load transformations from API
     */
    async loadTransformations() {
        try {
            const response = await API.getTransformations();
            if (response.success) {
                this.transformations = response.data;
                Utils.log('Loaded transformations:', this.transformations.length);
            }
        } catch (error) {
            Utils.error('Failed to load transformations:', error);
            throw error;
        }
    }

    /**
     * Setup shape selection buttons
     */
    setupShapeButtons() {
        const container = document.getElementById('shapeButtons');
        if (!container) return;

        container.innerHTML = '';

        this.shapes.forEach(shape => {
            const button = document.createElement('button');
            button.className = 'shape-btn';
            button.textContent = shape.name;
            button.dataset.shapeId = shape.shape_id;

            button.addEventListener('click', async () => {
                await this.selectShape(shape.shape_id);

                // Update active state
                container.querySelectorAll('.shape-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
            });

            container.appendChild(button);
        });
    }

    /**
     * Setup transformation buttons
     */
    setupTransformButtons() {
        const container = document.getElementById('transformButtons');
        if (!container) return;

        container.innerHTML = '';

        this.transformations.forEach(transform => {
            const button = document.createElement('button');
            button.className = 'transform-btn';
            button.textContent = transform.name;
            button.dataset.transformId = transform.transformation_id;
            button.dataset.transformType = transform.type;

            button.addEventListener('click', () => {
                this.applyTransformation(transform);
            });

            container.appendChild(button);
        });
    }

    /**
     * Select and display a shape
     */
    async selectShape(shapeId) {
        this.currentShapeId = shapeId;
        await this.renderer.loadShape(shapeId);

        // Track interaction
        await SessionManager.trackInteraction({
            shape_id: shapeId,
            interaction_type: 'touch',
            properties_viewed: []
        });

        Utils.log('Selected shape:', shapeId);
    }

    /**
     * Apply transformation to current shape
     */
    applyTransformation(transform) {
        if (!this.renderer.currentShape) {
            this.showMessage('먼저 도형을 선택해주세요');
            return;
        }

        if (this.renderer.currentShape.isAnimating) {
            Utils.log('Shape is already animating, ignoring transform');
            return;
        }

        Utils.log('Applying transformation:', transform.name);

        const animator = new ShapeAnimator(this.renderer.currentShape);
        const transformFunc = Transformations[transform.type];

        if (transformFunc) {
            transformFunc(animator);

            // Track interaction
            SessionManager.trackInteraction({
                shape_id: this.renderer.currentShape.id,
                transformation_id: transform.transformation_id,
                interaction_type: 'tap',
                duration_ms: transform.animation_duration
            });

            // Update progress
            this.updateProgress();
        } else {
            Utils.error('Unknown transformation type:', transform.type);
        }
    }

    /**
     * Update learning progress
     */
    async updateProgress() {
        if (!SessionManager.currentSession) return;

        try {
            // Calculate completion based on interactions
            const shapesExplored = new Set();
            const transformationsUsed = new Set();

            // This is a simplified calculation
            // In production, you'd track this more accurately
            if (this.renderer.currentShape) {
                shapesExplored.add(this.renderer.currentShape.id);
            }

            const completion = Math.min(
                (shapesExplored.size / this.shapes.length) * 50 +
                (transformationsUsed.size / this.transformations.length) * 50,
                100
            );

            await SessionManager.updateProgress(completion);
        } catch (error) {
            Utils.error('Failed to update progress:', error);
        }
    }

    /**
     * Show loading overlay
     */
    showLoading(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
        }
    }

    /**
     * Show message to user
     */
    showMessage(message, duration = 3000) {
        // Simple toast message
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage('❌ ' + message, 5000);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new ShapeTransformerApp();
        app.init();
    });
} else {
    const app = new ShapeTransformerApp();
    app.init();
}
