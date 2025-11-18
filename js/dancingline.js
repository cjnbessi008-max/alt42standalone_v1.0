/**
 * Dancing Line Main Application
 * Manages the vertical line sorting visualization
 */

class DancingLineApp {
    constructor() {
        this.numbers = [];
        this.sortingAlgo = new SortingAlgorithms();
        this.steps = [];
        this.currentStep = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.speed = 5; // 1-10 scale
        this.animationTimer = null;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.generateRandomNumbers();
    }

    /**
     * Setup event listeners for controls
     */
    setupEventListeners() {
        const generateBtn = document.getElementById('generate-btn');
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        const algoSelect = document.getElementById('algorithm-select');
        const speedSlider = document.getElementById('speed-slider');

        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateRandomNumbers());
        }

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startSorting());
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        if (algoSelect) {
            algoSelect.addEventListener('change', () => {
                if (this.isPlaying) {
                    this.reset();
                }
            });
        }

        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.speed = parseInt(e.target.value);
                document.getElementById('speed-value').textContent = this.speed;
            });
        }
    }

    /**
     * Setup canvas for additional visualizations if needed
     */
    setupCanvas() {
        const canvas = document.getElementById('dancing-line-canvas');
        if (canvas) {
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }
    }

    /**
     * Generate random numbers for sorting
     */
    generateRandomNumbers(count = 8) {
        this.numbers = [];
        const usedNumbers = new Set();

        while (this.numbers.length < count) {
            const num = Math.floor(Math.random() * 99) + 1;
            if (!usedNumbers.has(num)) {
                this.numbers.push(num);
                usedNumbers.add(num);
            }
        }

        this.displayNumbers();
        this.updateProblemInfo();
        this.enableStartButton();
        this.resetStats();
    }

    /**
     * Display numbers on the vertical line
     */
    displayNumbers() {
        const container = document.getElementById('numbers-container');
        if (!container) return;

        container.innerHTML = '';

        const containerHeight = container.clientHeight;
        const maxNumber = Math.max(...this.numbers);
        const minNumber = Math.min(...this.numbers);
        const range = maxNumber - minNumber || 1;

        this.numbers.forEach((num, index) => {
            const item = document.createElement('div');
            item.className = 'number-item';
            item.textContent = num;
            item.setAttribute('data-value', num);
            item.setAttribute('data-index', index);

            // Calculate position on vertical line
            const normalizedValue = (num - minNumber) / range;
            const position = (1 - normalizedValue) * (containerHeight * 0.8) + (containerHeight * 0.1);
            item.style.top = `${position}px`;

            // Add slight horizontal offset for visibility
            const offset = (index % 2 === 0) ? -80 : 80;
            item.style.left = `calc(50% + ${offset}px)`;

            container.appendChild(item);

            // Add entrance animation
            setTimeout(() => {
                item.classList.add('dancing');
            }, index * 100);
        });

        // Remove dancing class after entrance
        setTimeout(() => {
            const items = container.querySelectorAll('.number-item');
            items.forEach(item => item.classList.remove('dancing'));
        }, this.numbers.length * 100 + 800);
    }

    /**
     * Update problem information panel
     */
    updateProblemInfo() {
        const descEl = document.getElementById('problem-description');
        const numsEl = document.getElementById('problem-numbers');

        if (descEl) {
            descEl.innerHTML = `
                <p><strong>정렬할 숫자:</strong> ${this.numbers.length}개</p>
                <p><strong>범위:</strong> ${Math.min(...this.numbers)} ~ ${Math.max(...this.numbers)}</p>
                <p><strong>목표:</strong> 숫자들을 오름차순으로 정렬하기</p>
            `;
        }

        if (numsEl) {
            numsEl.innerHTML = `<strong>현재 배열:</strong> [${this.numbers.join(', ')}]`;
        }
    }

    /**
     * Start the sorting visualization
     */
    startSorting() {
        if (this.isPlaying && !this.isPaused) return;

        if (this.isPaused) {
            this.isPaused = false;
            this.updateButtonStates();
            this.resumeAnimation();
            return;
        }

        const algoSelect = document.getElementById('algorithm-select');
        const algorithm = algoSelect ? algoSelect.value : 'bubble';

        // Generate sorting steps
        switch (algorithm) {
            case 'bubble':
                this.steps = this.sortingAlgo.bubbleSort(this.numbers);
                break;
            case 'selection':
                this.steps = this.sortingAlgo.selectionSort(this.numbers);
                break;
            case 'insertion':
                this.steps = this.sortingAlgo.insertionSort(this.numbers);
                break;
            case 'quick':
                this.steps = this.sortingAlgo.quickSort(this.numbers);
                break;
            default:
                this.steps = this.sortingAlgo.bubbleSort(this.numbers);
        }

        this.currentStep = 0;
        this.isPlaying = true;
        this.isPaused = false;
        this.startTime = Date.now();

        this.updateButtonStates();
        this.startTimer();
        this.playNextStep();
    }

    /**
     * Play the next step in the sorting visualization
     */
    playNextStep() {
        if (!this.isPlaying || this.isPaused) return;

        if (this.currentStep >= this.steps.length) {
            this.finishSorting();
            return;
        }

        const step = this.steps[this.currentStep];
        this.visualizeStep(step);

        // Update statistics
        this.updateStats(step.comparisons, step.swaps);

        this.currentStep++;

        // Calculate delay based on speed (1-10 scale, inverted)
        const delay = 1000 - (this.speed * 90);

        this.animationTimer = setTimeout(() => {
            this.playNextStep();
        }, delay);
    }

    /**
     * Visualize a single step
     */
    visualizeStep(step) {
        const container = document.getElementById('numbers-container');
        if (!container) return;

        const items = Array.from(container.querySelectorAll('.number-item'));
        const containerHeight = container.clientHeight;
        const currentArray = step.data.array;

        // Remove all state classes
        items.forEach(item => {
            item.classList.remove('comparing', 'swapping', 'sorted');
        });

        // Update positions based on current array state
        const maxNumber = Math.max(...currentArray);
        const minNumber = Math.min(...currentArray);
        const range = maxNumber - minNumber || 1;

        items.forEach(item => {
            const value = parseInt(item.getAttribute('data-value'));
            const arrayIndex = currentArray.indexOf(value);

            if (arrayIndex !== -1) {
                const normalizedValue = (value - minNumber) / range;
                const position = (1 - normalizedValue) * (containerHeight * 0.8) + (containerHeight * 0.1);
                item.style.top = `${position}px`;

                // Update horizontal position based on array order
                const offset = (arrayIndex % 2 === 0) ? -80 : 80;
                item.style.left = `calc(50% + ${offset}px)`;
            }
        });

        // Apply state-specific styling
        if (step.type === 'compare') {
            step.data.indices.forEach(idx => {
                const value = currentArray[idx];
                const item = items.find(el => parseInt(el.getAttribute('data-value')) === value);
                if (item) {
                    item.classList.add('comparing');
                }
            });
        } else if (step.type === 'swap') {
            step.data.indices.forEach(idx => {
                const value = currentArray[idx];
                const item = items.find(el => parseInt(el.getAttribute('data-value')) === value);
                if (item) {
                    item.classList.add('swapping');
                }
            });
        } else if (step.type === 'sorted') {
            step.data.indices.forEach(idx => {
                const value = currentArray[idx];
                const item = items.find(el => parseInt(el.getAttribute('data-value')) === value);
                if (item) {
                    item.classList.add('sorted');
                }
            });
        }
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        if (!this.isPlaying) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            clearTimeout(this.animationTimer);
            this.stopTimer();
        } else {
            this.startTimer();
            this.playNextStep();
        }

        this.updateButtonStates();
    }

    /**
     * Reset the visualization
     */
    reset() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentStep = 0;

        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
        }

        this.stopTimer();
        this.displayNumbers();
        this.resetStats();
        this.updateButtonStates();
    }

    /**
     * Finish sorting and show completion
     */
    finishSorting() {
        this.isPlaying = false;
        this.stopTimer();

        const container = document.getElementById('numbers-container');
        if (container) {
            const items = container.querySelectorAll('.number-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('sorted', 'dancing');
                }, index * 100);
            });

            setTimeout(() => {
                items.forEach(item => item.classList.remove('dancing'));
            }, items.length * 100 + 1000);
        }

        this.updateButtonStates();

        // Save attempt to database (if Moodle integration is active)
        this.saveAttempt();
    }

    /**
     * Update button states based on current state
     */
    updateButtonStates() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const generateBtn = document.getElementById('generate-btn');

        if (startBtn) {
            startBtn.disabled = this.isPlaying && !this.isPaused;
            startBtn.textContent = this.isPaused ? 'Resume' : 'Start Sorting';
        }

        if (pauseBtn) {
            pauseBtn.disabled = !this.isPlaying;
            pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        }

        if (generateBtn) {
            generateBtn.disabled = this.isPlaying && !this.isPaused;
        }
    }

    /**
     * Enable start button
     */
    enableStartButton() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.disabled = false;
        }
    }

    /**
     * Update statistics display
     */
    updateStats(comparisons, swaps) {
        const compEl = document.getElementById('comparisons-count');
        const swapsEl = document.getElementById('swaps-count');

        if (compEl) compEl.textContent = comparisons;
        if (swapsEl) swapsEl.textContent = swaps;
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.elapsedTime = 0;
        this.updateStats(0, 0);

        const timeEl = document.getElementById('time-elapsed');
        if (timeEl) timeEl.textContent = '0s';
    }

    /**
     * Start the timer
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            const timeEl = document.getElementById('time-elapsed');
            if (timeEl) {
                timeEl.textContent = `${this.elapsedTime}s`;
            }
        }, 1000);
    }

    /**
     * Stop the timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Resume animation after pause
     */
    resumeAnimation() {
        this.startTime = Date.now() - (this.elapsedTime * 1000);
        this.startTimer();
        this.playNextStep();
    }

    /**
     * Save attempt to Moodle database
     */
    saveAttempt() {
        if (typeof moodleConfig === 'undefined') return;

        const data = {
            comparisons: this.sortingAlgo.comparisons,
            swaps: this.sortingAlgo.swaps,
            timeElapsed: this.elapsedTime,
            numbers: this.numbers,
            algorithm: document.getElementById('algorithm-select')?.value || 'bubble'
        };

        // Send to Moodle API endpoint
        fetch(moodleConfig.wwwroot + '/local/dancingline/save_attempt.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sesskey: moodleConfig.sesskey,
                userid: moodleConfig.userid,
                data: data
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log('Attempt saved:', result);
        })
        .catch(error => {
            console.error('Error saving attempt:', error);
        });
    }

    /**
     * Load problem from Moodle
     */
    loadProblemFromMoodle(problemId) {
        if (typeof moodleConfig === 'undefined') return;

        fetch(moodleConfig.wwwroot + '/local/dancingline/get_problem.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sesskey: moodleConfig.sesskey,
                problemid: problemId
            })
        })
        .then(response => response.json())
        .then(problem => {
            if (problem.numbers) {
                this.numbers = JSON.parse(problem.numbers);
                this.displayNumbers();
                this.updateProblemInfo();
                this.enableStartButton();

                // Update algorithm selection
                const algoSelect = document.getElementById('algorithm-select');
                if (algoSelect && problem.algorithm) {
                    algoSelect.value = problem.algorithm;
                }
            }
        })
        .catch(error => {
            console.error('Error loading problem:', error);
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dancingLineApp = new DancingLineApp();

    // Check if there's a problem ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const problemId = urlParams.get('problemid');

    if (problemId) {
        window.dancingLineApp.loadProblemFromMoodle(problemId);
    }
});
