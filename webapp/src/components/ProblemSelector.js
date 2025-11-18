/**
 * ProblemSelector - UI component for selecting problems
 */
export class ProblemSelector {
    constructor(container, onSelectCallback) {
        this.container = container;
        this.onSelectCallback = onSelectCallback;
        this.problems = [];
        this.selectedProblemId = null;

        this.create();
    }

    /**
     * Create the selector UI
     */
    create() {
        this.container.innerHTML = `
            <div class="problem-selector">
                <label for="problem-select">Select Problem:</label>
                <select id="problem-select" class="problem-select">
                    <option value="">-- Choose a problem --</option>
                </select>
                <div class="problem-info"></div>
            </div>
        `;

        const select = this.container.querySelector('#problem-select');
        select.addEventListener('change', (e) => this.handleSelection(e));
    }

    /**
     * Set available problems
     * @param {Array} problems
     */
    setProblems(problems) {
        this.problems = problems;
        const select = this.container.querySelector('#problem-select');

        // Clear existing options (except first)
        select.innerHTML = '<option value="">-- Choose a problem --</option>';

        // Add problem options
        problems.forEach(problem => {
            const option = document.createElement('option');
            option.value = problem.id;
            option.textContent = `${problem.title} (Level ${problem.difficulty || 1})`;
            select.appendChild(option);
        });

        // Auto-select first problem if available
        if (problems.length > 0) {
            select.value = problems[0].id;
            this.handleSelection({ target: select });
        }
    }

    /**
     * Handle problem selection
     * @param {Event} event
     */
    handleSelection(event) {
        const problemId = parseInt(event.target.value);

        if (!problemId) {
            this.clearInfo();
            return;
        }

        const problem = this.problems.find(p => p.id === problemId);

        if (problem) {
            this.selectedProblemId = problemId;
            this.displayInfo(problem);

            if (this.onSelectCallback) {
                this.onSelectCallback(problem);
            }
        }
    }

    /**
     * Display problem information
     * @param {object} problem
     */
    displayInfo(problem) {
        const infoDiv = this.container.querySelector('.problem-info');

        const difficultyStars = '⭐'.repeat(problem.difficulty || 1);

        infoDiv.innerHTML = `
            <div class="problem-details">
                <h4>${problem.title}</h4>
                <p class="difficulty">Difficulty: ${difficultyStars}</p>
                <p class="description">${problem.description || 'No description available'}</p>
                <p class="geometry-type">Type: <strong>${problem.geometry_type}</strong></p>
            </div>
        `;
    }

    /**
     * Clear problem information
     */
    clearInfo() {
        const infoDiv = this.container.querySelector('.problem-info');
        infoDiv.innerHTML = '';
    }

    /**
     * Get currently selected problem
     * @returns {object|null}
     */
    getSelectedProblem() {
        if (!this.selectedProblemId) {
            return null;
        }
        return this.problems.find(p => p.id === this.selectedProblemId);
    }
}
