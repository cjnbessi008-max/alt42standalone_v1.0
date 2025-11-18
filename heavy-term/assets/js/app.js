/**
 * Heavy Term - Main Application
 * Coordinates physics engine, UI, and API interactions
 */

class HeavyTermApp {
    constructor() {
        this.api = new HeavyTermAPI(HeavyTermConfig.api.baseURL);
        this.physicsEngine = null;
        this.currentProblem = null;
        this.currentSession = null;
        this.terms = [];
        this.draggedTerm = null;
        this.lastMousePos = { x: 0, y: 0 };
        this.lastMouseTime = 0;
        this.mouseVelocity = { x: 0, y: 0 };

        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        console.log('Initializing Heavy Term App...');

        // Get DOM elements
        this.canvas = document.getElementById('physicsCanvas');
        this.termsContainer = document.getElementById('termsContainer');
        this.smartphoneScreen = document.getElementById('smartphoneScreen');
        this.problemDisplay = document.getElementById('problemDisplay');

        // Initialize physics engine
        await this.initPhysicsEngine();

        // Setup event listeners
        this.setupEventListeners();

        // Update debug info
        this.startDebugInfoUpdate();

        console.log('Heavy Term App initialized successfully');
    }

    /**
     * Initialize physics engine with settings from API
     */
    async initPhysicsEngine() {
        try {
            // Try to get settings from API
            const settings = await this.api.getSettings().catch(() => HeavyTermConfig.physics);

            this.physicsEngine = new PhysicsEngine(this.canvas, settings);
            this.physicsEngine.start();

            console.log('Physics engine started with settings:', settings);
        } catch (error) {
            console.error('Failed to load settings from API, using defaults:', error);
            this.physicsEngine = new PhysicsEngine(this.canvas, HeavyTermConfig.physics);
            this.physicsEngine.start();
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Load question button
        document.getElementById('loadQuestion').addEventListener('click', () => {
            this.loadQuestionFromLMS();
        });

        // Demo question button
        document.getElementById('demoQuestion').addEventListener('click', () => {
            this.loadDemoQuestion();
        });

        // Physics controls
        document.getElementById('gravityStrength').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('gravityValue').textContent = value.toFixed(1);
            this.physicsEngine.updateParams({ gravity_strength: value });
        });

        document.getElementById('gravityMultiplier').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('multiplierValue').textContent = value.toFixed(1);
            this.physicsEngine.updateParams({ gravity_multiplier: value });
        });

        document.getElementById('enableGravity').addEventListener('change', (e) => {
            this.physicsEngine.updateParams({ enable_gravity: e.target.checked });
        });

        document.getElementById('enableCollisions').addEventListener('change', (e) => {
            this.physicsEngine.updateParams({ enable_collisions: e.target.checked });
        });

        document.getElementById('resetPhysics').addEventListener('click', () => {
            this.resetPhysics();
        });

        // Term interaction listeners
        this.setupTermInteractionListeners();

        // Window resize
        window.addEventListener('resize', () => {
            this.physicsEngine.setupCanvas();
        });
    }

    /**
     * Setup term interaction listeners (drag and drop)
     */
    setupTermInteractionListeners() {
        const container = this.termsContainer;

        // Mouse events
        container.addEventListener('mousedown', (e) => this.handleDragStart(e));
        document.addEventListener('mousemove', (e) => this.handleDragMove(e));
        document.addEventListener('mouseup', (e) => this.handleDragEnd(e));

        // Touch events
        container.addEventListener('touchstart', (e) => this.handleDragStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleDragEnd(e));
    }

    /**
     * Handle drag start
     * @param {Event} e Event object
     */
    handleDragStart(e) {
        e.preventDefault();

        const target = e.target.closest('.term');
        if (!target) return;

        const termId = parseInt(target.dataset.termId);
        const term = this.terms.find(t => t.id === termId);

        if (!term) return;

        const pos = this.getEventPosition(e);
        const rect = this.termsContainer.getBoundingClientRect();
        const relativeX = pos.x - rect.left;
        const relativeY = pos.y - rect.top;

        term.startDrag(relativeX, relativeY);
        this.draggedTerm = term;
        this.lastMousePos = { x: relativeX, y: relativeY };
        this.lastMouseTime = Date.now();
        this.mouseVelocity = { x: 0, y: 0 };

        // Log interaction
        if (this.currentSession) {
            this.api.logInteraction({
                session_id: this.currentSession.session_id,
                term_id: term.id,
                interaction_type: 'drag',
                position_x: Math.round(term.x),
                position_y: Math.round(term.y)
            }).catch(err => console.error('Failed to log interaction:', err));
        }
    }

    /**
     * Handle drag move
     * @param {Event} e Event object
     */
    handleDragMove(e) {
        if (!this.draggedTerm) return;

        e.preventDefault();

        const pos = this.getEventPosition(e);
        const rect = this.termsContainer.getBoundingClientRect();
        const relativeX = pos.x - rect.left;
        const relativeY = pos.y - rect.top;

        // Calculate velocity for throw effect
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastMouseTime) / 1000;

        if (deltaTime > 0) {
            this.mouseVelocity.x = (relativeX - this.lastMousePos.x) / deltaTime;
            this.mouseVelocity.y = (relativeY - this.lastMousePos.y) / deltaTime;

            // Limit velocity
            const maxVelocity = 1000;
            const speed = Math.sqrt(
                this.mouseVelocity.x ** 2 + this.mouseVelocity.y ** 2
            );
            if (speed > maxVelocity) {
                this.mouseVelocity.x = (this.mouseVelocity.x / speed) * maxVelocity;
                this.mouseVelocity.y = (this.mouseVelocity.y / speed) * maxVelocity;
            }
        }

        this.draggedTerm.updateDrag(
            relativeX,
            relativeY,
            this.physicsEngine.width,
            this.physicsEngine.height
        );

        this.lastMousePos = { x: relativeX, y: relativeY };
        this.lastMouseTime = currentTime;
    }

    /**
     * Handle drag end
     * @param {Event} e Event object
     */
    handleDragEnd(e) {
        if (!this.draggedTerm) return;

        // Apply release velocity for throw effect
        this.draggedTerm.endDrag(this.mouseVelocity.x, this.mouseVelocity.y);

        // Log interaction
        if (this.currentSession) {
            this.api.logInteraction({
                session_id: this.currentSession.session_id,
                term_id: this.draggedTerm.id,
                interaction_type: 'release',
                position_x: Math.round(this.draggedTerm.x),
                position_y: Math.round(this.draggedTerm.y),
                data: {
                    velocity_x: this.mouseVelocity.x.toFixed(2),
                    velocity_y: this.mouseVelocity.y.toFixed(2)
                }
            }).catch(err => console.error('Failed to log interaction:', err));
        }

        this.draggedTerm = null;
        this.mouseVelocity = { x: 0, y: 0 };
    }

    /**
     * Get event position (works for both mouse and touch)
     * @param {Event} e Event object
     * @returns {Object} Position {x, y}
     */
    getEventPosition(e) {
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        return {
            x: e.clientX,
            y: e.clientY
        };
    }

    /**
     * Load question from LMS
     */
    async loadQuestionFromLMS() {
        const courseId = document.getElementById('courseId').value;
        const questionId = document.getElementById('questionId').value;

        if (!courseId || !questionId) {
            Toast.error('Course ID와 Question ID를 입력하세요');
            return;
        }

        try {
            Toast.show('LMS에서 문제를 불러오는 중...', 'warning', 2000);

            // Sync question from Moodle
            await this.api.syncQuestion(questionId, courseId);

            // Get problem with terms
            const problem = await this.api.getProblem(questionId);

            this.loadProblem(problem);
            Toast.success('문제를 성공적으로 불러왔습니다');
        } catch (error) {
            console.error('Failed to load question:', error);
            Toast.error('문제 불러오기 실패: ' + error.message);
        }
    }

    /**
     * Load demo question
     */
    loadDemoQuestion() {
        const demoProblem = {
            ...HeavyTermConfig.demo.problem,
            terms: HeavyTermConfig.demo.terms
        };

        this.loadProblem(demoProblem);
        Toast.success('데모 문제를 불러왔습니다');
    }

    /**
     * Load problem and create terms
     * @param {Object} problem Problem data
     */
    async loadProblem(problem) {
        console.log('Loading problem:', problem);

        // Clear existing terms
        this.clearTerms();

        // Set current problem
        this.currentProblem = problem;

        // Update problem display
        this.problemDisplay.innerHTML = `
            <strong>문제 유형:</strong> ${problem.question_type}<br>
            <strong>난이도:</strong> ${problem.difficulty_level || 'medium'}<br>
            <strong>문제:</strong> ${problem.question_text}
        `;

        // Create session
        try {
            this.currentSession = await this.api.createSession(
                HeavyTermConfig.user.default_user_id,
                problem.id
            );
            console.log('Session created:', this.currentSession);
        } catch (error) {
            console.error('Failed to create session:', error);
        }

        // Create terms
        this.terms = Term.createFromProblemData(problem);

        // Add terms to physics engine and DOM
        for (const term of this.terms) {
            term.addToContainer(this.termsContainer);
            this.physicsEngine.addTerm(term);
        }

        console.log(`Loaded ${this.terms.length} terms`);
    }

    /**
     * Clear all terms
     */
    clearTerms() {
        // Remove from physics engine
        this.physicsEngine.clearTerms();

        // Remove from DOM
        for (const term of this.terms) {
            term.remove();
        }

        // Clear array
        this.terms = [];
    }

    /**
     * Reset physics
     */
    resetPhysics() {
        this.physicsEngine.reset();
        Toast.show('물리 효과를 리셋했습니다', 'success', 2000);
    }

    /**
     * Start debug info update loop
     */
    startDebugInfoUpdate() {
        setInterval(() => {
            document.getElementById('activeTerms').textContent = this.physicsEngine.getTermCount();
            document.getElementById('fps').textContent = this.physicsEngine.getFPS();
            document.getElementById('currentGravity').textContent = this.physicsEngine.gravity.toFixed(1);
        }, 500);
    }

    /**
     * Submit answer
     * @param {Object} answerData Answer data
     */
    async submitAnswer(answerData) {
        if (!this.currentSession) {
            Toast.error('세션이 없습니다');
            return;
        }

        try {
            // Close session
            await this.api.closeSession(this.currentSession.session_id);

            Toast.success('답안이 제출되었습니다');

            // Could implement answer validation here
        } catch (error) {
            console.error('Failed to submit answer:', error);
            Toast.error('답안 제출 실패: ' + error.message);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.heavyTermApp = new HeavyTermApp();
});
