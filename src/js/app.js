/**
 * Main Application - Virtual Smartphone Math App
 * Integrates with Moodle LMS to display math problems
 */

class MathApp {
    constructor() {
        this.graphRenderer = null;
        this.currentProblem = null;
        this.apiEndpoint = '/api/problems.php';

        this.init();
    }

    async init() {
        console.log('Initializing Math App...');

        // Initialize graph renderer
        this.initGraphRenderer();

        // Load problem from URL parameter or fetch from Moodle
        await this.loadProblem();

        // Setup event listeners
        this.setupEventListeners();

        // Setup auto-refresh if needed
        this.setupAutoRefresh();
    }

    initGraphRenderer() {
        try {
            this.graphRenderer = new GraphRenderer('mathCanvas', {
                backgroundColor: '#FFFFFF',
                lineColor: '#2196F3',
                lineWidth: 3,
                extremaPointColor: '#FF5722',
                extremaPointRadius: 5,
                smoothingFactor: 0.3,
                samplingRate: 300,
                useAdaptiveSampling: true,
                enableAntiTremor: true // Critical: Enable anti-tremor algorithm
            });

            console.log('Graph renderer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize graph renderer:', error);
            this.showError('Failed to initialize graph renderer');
        }
    }

    async loadProblem() {
        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const problemId = urlParams.get('problem_id');
        const sessionId = urlParams.get('session_id');

        if (problemId) {
            await this.fetchProblemFromMoodle(problemId, sessionId);
        } else {
            // Load default/demo problem
            this.loadDemoProblem();
        }
    }

    async fetchProblemFromMoodle(problemId, sessionId) {
        try {
            this.showLoading(true);

            const response = await fetch(`${this.apiEndpoint}?problem_id=${problemId}&session_id=${sessionId || ''}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.currentProblem = data.problem;
                this.displayProblem(this.currentProblem);
            } else {
                throw new Error(data.message || 'Failed to load problem');
            }
        } catch (error) {
            console.error('Error fetching problem from Moodle:', error);
            this.showError('Failed to load problem from Moodle: ' + error.message);
            // Fallback to demo
            this.loadDemoProblem();
        } finally {
            this.showLoading(false);
        }
    }

    loadDemoProblem() {
        // Demo problem with extrema for testing tremor fix
        this.currentProblem = {
            id: 'demo',
            title: 'Find the Extrema',
            description: 'Identify all local maxima and minima of the function',
            function: 'sin(x) + 0.5 * sin(3*x)',
            xMin: -Math.PI * 2,
            xMax: Math.PI * 2,
            yMin: -2,
            yMax: 2,
            hints: [
                'Look for points where the derivative equals zero',
                'Use the second derivative test to classify extrema'
            ],
            metadata: {
                difficulty: 'medium',
                topic: 'Calculus',
                subtopic: 'Extrema'
            }
        };

        this.displayProblem(this.currentProblem);
    }

    displayProblem(problem) {
        // Update UI with problem information
        document.getElementById('problemTitle').textContent = problem.title;
        document.getElementById('problemDescription').textContent = problem.description;
        document.getElementById('functionExpression').textContent = `f(x) = ${problem.function}`;

        // Display hints if available
        const hintsContainer = document.getElementById('hintsContainer');
        if (problem.hints && problem.hints.length > 0) {
            hintsContainer.innerHTML = '<h4>Hints:</h4><ul>' +
                problem.hints.map(hint => `<li>${hint}</li>`).join('') +
                '</ul>';
        } else {
            hintsContainer.innerHTML = '';
        }

        // Display metadata
        if (problem.metadata) {
            document.getElementById('problemMeta').innerHTML = `
                <span class="badge">${problem.metadata.difficulty || ''}</span>
                <span class="badge">${problem.metadata.topic || ''}</span>
            `;
        }

        // Render the graph
        this.renderGraph(problem);

        // Display extrema information
        this.displayExtremaInfo();
    }

    renderGraph(problem) {
        try {
            // Set viewport
            this.graphRenderer.setViewport(
                problem.xMin || -10,
                problem.xMax || 10,
                problem.yMin || -10,
                problem.yMax || 10
            );

            // Set and render function
            this.graphRenderer.setFunction(problem.function);

            console.log('Graph rendered successfully');
            console.log(`Detected ${this.graphRenderer.extremaPoints.length} extrema points`);
        } catch (error) {
            console.error('Error rendering graph:', error);
            this.showError('Error rendering graph: ' + error.message);
        }
    }

    displayExtremaInfo() {
        const extremaList = document.getElementById('extremaList');

        if (this.graphRenderer.extremaPoints.length === 0) {
            extremaList.innerHTML = '<p>No extrema detected in the visible range.</p>';
            return;
        }

        let html = '<h4>Detected Extrema:</h4><ul class="extrema-list">';

        this.graphRenderer.extremaPoints.forEach((extrema, index) => {
            const typeClass = extrema.type === 'maximum' ? 'max' : 'min';
            html += `
                <li class="${typeClass}">
                    <span class="extrema-type">${extrema.type}</span>
                    <span class="extrema-coords">
                        x = ${extrema.x.toFixed(3)}, y = ${extrema.y.toFixed(3)}
                    </span>
                </li>
            `;
        });

        html += '</ul>';
        extremaList.innerHTML = html;
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadProblem();
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportGraph();
            });
        }

        // Toggle tremor fix (for debugging)
        const tremorToggle = document.getElementById('tremorToggle');
        if (tremorToggle) {
            tremorToggle.addEventListener('change', (e) => {
                this.graphRenderer.options.enableAntiTremor = e.target.checked;
                this.renderGraph(this.currentProblem);
            });
        }

        // Function input (for manual testing)
        const functionInput = document.getElementById('functionInput');
        const plotBtn = document.getElementById('plotBtn');

        if (functionInput && plotBtn) {
            plotBtn.addEventListener('click', () => {
                const funcExpr = functionInput.value.trim();
                if (funcExpr) {
                    this.currentProblem.function = funcExpr;
                    this.renderGraph(this.currentProblem);
                    this.displayExtremaInfo();
                }
            });

            // Allow Enter key to plot
            functionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    plotBtn.click();
                }
            });
        }
    }

    setupAutoRefresh() {
        // Check for session updates every 30 seconds
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (sessionId) {
            setInterval(() => {
                this.checkForUpdates(sessionId);
            }, 30000);
        }
    }

    async checkForUpdates(sessionId) {
        try {
            const response = await fetch(`${this.apiEndpoint}?action=check_updates&session_id=${sessionId}`);
            const data = await response.json();

            if (data.updated) {
                console.log('New problem available, reloading...');
                await this.loadProblem();
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }

    exportGraph() {
        try {
            const imageData = this.graphRenderer.exportImage('png');
            const link = document.createElement('a');
            link.download = `graph_${this.currentProblem.id}_${Date.now()}.png`;
            link.href = imageData;
            link.click();

            this.showMessage('Graph exported successfully');
        } catch (error) {
            console.error('Error exporting graph:', error);
            this.showError('Failed to export graph');
        }
    }

    showLoading(show) {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';

            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
        console.error(message);
    }

    showMessage(message) {
        const messageDiv = document.getElementById('successMessage');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.style.display = 'block';

            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 3000);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mathApp = new MathApp();
});
