import { SmartphoneContainer } from './SmartphoneContainer';
import { Scene3D } from './Scene3D';
import { ProblemSelector } from './ProblemSelector';

/**
 * Main application class for 3D Insight Mode
 */
export class App3DInsight {
    constructor(container, config, moodleAPI) {
        this.container = container;
        this.config = config;
        this.moodleAPI = moodleAPI;
        this.currentProblem = null;
        this.currentAttemptId = null;
        this.startTime = null;
        this.rotationCount = 0;
        this.smartphoneContainer = null;
        this.scene3D = null;
        this.problemSelector = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Load configuration from Moodle
            const courseConfig = await this.moodleAPI.getConfig();
            this.config = { ...this.config, ...courseConfig };

            // Create the UI structure
            this.createUI();

            // Load problems
            await this.loadProblems();

            // Set up event listeners
            this.setupEventListeners();

            console.log('3D Insight Mode initialized successfully');
        } catch (error) {
            console.error('Failed to initialize 3D Insight Mode:', error);
            this.showError('Failed to load 3D Insight Mode. Please refresh the page.');
        }
    }

    /**
     * Create the UI structure
     */
    createUI() {
        this.container.innerHTML = '';

        // Create smartphone container (positioned bottom-right)
        this.smartphoneContainer = new SmartphoneContainer(
            this.container,
            this.config.smartphone_position || 'bottom-right'
        );

        // Get the content area of the smartphone
        const smartphoneContent = this.smartphoneContainer.getContentArea();

        // Create problem selector
        const selectorContainer = document.createElement('div');
        selectorContainer.className = '3dinsight-problem-selector';
        smartphoneContent.appendChild(selectorContainer);

        this.problemSelector = new ProblemSelector(
            selectorContainer,
            this.onProblemSelected.bind(this)
        );

        // Create 3D scene container
        const sceneContainer = document.createElement('div');
        sceneContainer.className = '3dinsight-scene-container';
        smartphoneContent.appendChild(sceneContainer);

        // Initialize 3D scene
        this.scene3D = new Scene3D(
            sceneContainer,
            this.config,
            this.onRotation.bind(this)
        );
    }

    /**
     * Load problems from Moodle
     */
    async loadProblems() {
        try {
            const problems = await this.moodleAPI.getProblems();
            this.problemSelector.setProblems(problems);

            // Auto-select first problem if available
            if (problems.length > 0) {
                this.selectProblem(problems[0]);
            }
        } catch (error) {
            console.error('Failed to load problems:', error);
            this.showError('Failed to load problems');
        }
    }

    /**
     * Handle problem selection
     * @param {object} problem
     */
    async onProblemSelected(problem) {
        this.selectProblem(problem);
    }

    /**
     * Select and display a problem
     * @param {object} problem
     */
    async selectProblem(problem) {
        try {
            // Save current attempt if exists
            if (this.currentAttemptId) {
                await this.saveCurrentAttempt();
            }

            this.currentProblem = problem;
            this.rotationCount = 0;
            this.startTime = Date.now();

            // Load the 3D geometry
            this.scene3D.loadGeometry(problem.geometry_type, problem.geometry_data);

            // Create new attempt
            const result = await this.moodleAPI.saveAttempt(problem.id, {
                answer: {},
                rotationCount: 0,
                timeSpent: 0
            });

            this.currentAttemptId = result.attempt_id;

            console.log('Problem selected:', problem.title);
        } catch (error) {
            console.error('Failed to select problem:', error);
            this.showError('Failed to load problem');
        }
    }

    /**
     * Handle rotation event from 3D scene
     */
    onRotation() {
        this.rotationCount++;
    }

    /**
     * Save the current attempt
     */
    async saveCurrentAttempt() {
        if (!this.currentAttemptId || !this.currentProblem) {
            return;
        }

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        try {
            await this.moodleAPI.updateAttempt(this.currentAttemptId, {
                answer: this.scene3D.getCameraState(),
                rotationCount: this.rotationCount,
                timeSpent: timeSpent,
                completed: false
            });
        } catch (error) {
            console.error('Failed to save attempt:', error);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveCurrentAttempt();
        }, 30000);

        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveCurrentAttempt();
        });
    }

    /**
     * Show error message
     * @param {string} message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = '3dinsight-error';
        errorDiv.textContent = message;
        this.container.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.scene3D) {
            this.scene3D.dispose();
        }
        if (this.smartphoneContainer) {
            this.smartphoneContainer.dispose();
        }
    }
}
