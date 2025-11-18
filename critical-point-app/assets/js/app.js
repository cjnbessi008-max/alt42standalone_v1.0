/**
 * Main Application Controller
 * Connects MathEngine and GraphRenderer, handles UI events
 */

class CriticalPointApp {
    constructor() {
        this.mathEngine = new MathEngine();
        this.graphRenderer = new GraphRenderer('graphCanvas');
        this.currentProblemId = null;
        this.currentFunctionType = 1;

        this.initializeEventListeners();
        this.loadInitialProblem();
    }

    /**
     * Initialize event listeners for buttons
     */
    initializeEventListeners() {
        const loadProblemBtn = document.getElementById('loadProblemBtn');
        const showCriticalPointsBtn = document.getElementById('showCriticalPointsBtn');
        const resetBtn = document.getElementById('resetBtn');

        loadProblemBtn.addEventListener('click', () => this.loadNewProblem());
        showCriticalPointsBtn.addEventListener('click', () => this.showCriticalPoints());
        resetBtn.addEventListener('click', () => this.reset());
    }

    /**
     * Load initial problem on app start
     */
    loadInitialProblem() {
        this.loadProblemFromAPI(1);
    }

    /**
     * Load a new random problem
     */
    loadNewProblem() {
        // Cycle through different function types
        this.currentFunctionType = (this.currentFunctionType % 5) + 1;
        this.loadProblemFromAPI(this.currentFunctionType);
    }

    /**
     * Load problem from API (or use local sample for demo)
     * @param {number} functionType - Type of function to load
     */
    async loadProblemFromAPI(functionType) {
        try {
            // Try to fetch from API
            const response = await fetch(`../api/getProblem.php?type=${functionType}`);

            if (response.ok) {
                const data = await response.json();
                this.loadProblemFromData(data);
            } else {
                // Fallback to local sample
                this.loadLocalSample(functionType);
            }
        } catch (error) {
            console.log('API not available, using local samples:', error.message);
            // Fallback to local sample
            this.loadLocalSample(functionType);
        }
    }

    /**
     * Load a local sample problem
     * @param {number} functionType - Type of function
     */
    loadLocalSample(functionType) {
        const funcData = this.mathEngine.getSampleFunction(functionType);
        this.loadProblemFromData({
            id: functionType,
            name: funcData.name,
            equation: funcData.equation,
            description: funcData.description,
            func: funcData.func
        });
    }

    /**
     * Load problem from data object
     * @param {Object} data - Problem data
     */
    loadProblemFromData(data) {
        this.currentProblemId = data.id;

        // Update UI with problem information
        document.getElementById('problemDescription').textContent = data.description;
        document.getElementById('functionEquation').innerHTML = `<strong>${data.equation}</strong>`;

        // Reset graph and hide critical points
        this.graphRenderer.reset();
        this.graphRenderer.toggleCriticalPoints(false);

        // Clear critical points info
        this.updateCriticalPointsInfo([]);

        // Get the function and render
        const funcData = this.mathEngine.getCurrentFunction();
        this.graphRenderer.startAnimation(funcData.func);
    }

    /**
     * Find and show critical points
     */
    showCriticalPoints() {
        const funcData = this.mathEngine.getCurrentFunction();

        if (!funcData) {
            alert('먼저 문제를 불러와주세요!');
            return;
        }

        // Show loading message
        const infoPanel = document.getElementById('criticalPointsInfo');
        infoPanel.innerHTML = '<p class="hint">극값을 계산하는 중...</p>';

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            // Find critical points
            const criticalPoints = this.mathEngine.findCriticalPoints(
                funcData.func,
                -5, // xMin
                5,  // xMax
                0.05 // step
            );

            if (criticalPoints.length === 0) {
                infoPanel.innerHTML = '<p class="hint">이 구간에서 극값을 찾을 수 없습니다.</p>';
                return;
            }

            // Set critical points in renderer
            this.graphRenderer.setCriticalPoints(criticalPoints);
            this.graphRenderer.toggleCriticalPoints(true);

            // Update info panel
            this.updateCriticalPointsInfo(criticalPoints);

            // Log result to API (if available)
            this.logResultToAPI(criticalPoints);
        }, 100);
    }

    /**
     * Update the critical points information panel
     * @param {Array} criticalPoints - Array of critical points
     */
    updateCriticalPointsInfo(criticalPoints) {
        const infoPanel = document.getElementById('criticalPointsInfo');

        if (criticalPoints.length === 0) {
            infoPanel.innerHTML = '<p class="hint">극값 표시 버튼을 눌러보세요!</p>';
            return;
        }

        let html = '<div style="font-weight: bold; margin-bottom: 8px;">발견된 극값:</div>';

        criticalPoints.forEach((point, index) => {
            const typeText = point.type === 'maximum' ? '극댓값' : '극솟값';
            const typeClass = point.type === 'maximum' ? 'critical-point-max' : 'critical-point-min';

            html += `
                <div class="critical-point-item ${typeClass}">
                    <strong>${typeText}</strong><br>
                    점: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})
                </div>
            `;
        });

        infoPanel.innerHTML = html;
    }

    /**
     * Log student result to API
     * @param {Array} criticalPoints - Found critical points
     */
    async logResultToAPI(criticalPoints) {
        try {
            const response = await fetch('../api/logResult.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    problem_id: this.currentProblemId,
                    student_id: this.getStudentId(),
                    critical_points: criticalPoints,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                console.log('Result logged successfully');
            }
        } catch (error) {
            console.log('Could not log result to API:', error.message);
        }
    }

    /**
     * Get student ID (from session, URL parameter, or demo)
     * @returns {string} Student ID
     */
    getStudentId() {
        // Try to get from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('student_id');

        if (studentId) {
            return studentId;
        }

        // Try to get from session storage
        const storedId = sessionStorage.getItem('student_id');
        if (storedId) {
            return storedId;
        }

        // Return demo ID
        return 'demo_student';
    }

    /**
     * Reset the application
     */
    reset() {
        this.graphRenderer.reset();
        this.updateCriticalPointsInfo([]);

        // Reload current problem
        if (this.currentProblemId) {
            this.loadProblemFromAPI(this.currentFunctionType);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CriticalPointApp();
    console.log('Critical Point Highlight App initialized!');
});
