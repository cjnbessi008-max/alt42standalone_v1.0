/**
 * Color Union - Main Logic
 * Educational module for teaching set union through color blending
 */

class ColorUnionApp {
    constructor() {
        this.currentProblem = 0;
        this.totalProblems = CONFIG.problems.totalProblems;
        this.score = 0;
        this.problems = [];
        this.userAnswers = [];
        this.startTime = null;
        this.language = 'ko';
        this.text = CONFIG.getText(this.language);

        this.init();
    }

    init() {
        this.generateProblems();
        this.setupEventListeners();
        this.loadProblem(0);
        this.updateProgress();
    }

    /**
     * Generate all problems for the session
     */
    generateProblems() {
        for (let i = 0; i < this.totalProblems; i++) {
            const problem = this.createProblem();
            this.problems.push(problem);
        }
    }

    /**
     * Create a single problem with two sets
     */
    createProblem() {
        const { elementRange, valueRange } = CONFIG.problems;

        // Generate Set A
        const sizeA = this.randomInt(elementRange.min, elementRange.max);
        const setA = this.generateUniqueSet(sizeA, valueRange.min, valueRange.max);

        // Generate Set B with some overlap
        const sizeB = this.randomInt(elementRange.min, elementRange.max);
        const overlapSize = this.randomInt(0, Math.min(sizeA, sizeB, 3));
        const setB = this.generateSetWithOverlap(setA, sizeB, overlapSize, valueRange.min, valueRange.max);

        // Calculate union
        const union = [...new Set([...setA, ...setB])].sort((a, b) => a - b);

        // Select colors
        const colorA = CONFIG.colors.primary[this.randomInt(0, CONFIG.colors.primary.length - 1)];
        const colorB = CONFIG.colors.primary[this.randomInt(0, CONFIG.colors.primary.length - 1)];
        const colorUnion = CONFIG.colors.blend(colorA, colorB);

        return {
            setA: setA.sort((a, b) => a - b),
            setB: setB.sort((a, b) => a - b),
            union: union,
            colorA: colorA,
            colorB: colorB,
            colorUnion: colorUnion,
            answer: union.length
        };
    }

    /**
     * Generate a set of unique random numbers
     */
    generateUniqueSet(size, min, max) {
        const set = new Set();
        while (set.size < size) {
            set.add(this.randomInt(min, max));
        }
        return Array.from(set);
    }

    /**
     * Generate a set with controlled overlap
     */
    generateSetWithOverlap(existingSet, size, overlapSize, min, max) {
        const newSet = new Set();

        // Add overlapping elements
        const shuffled = [...existingSet].sort(() => 0.5 - Math.random());
        for (let i = 0; i < overlapSize && i < shuffled.length; i++) {
            newSet.add(shuffled[i]);
        }

        // Add unique elements
        while (newSet.size < size) {
            const num = this.randomInt(min, max);
            newSet.add(num);
        }

        return Array.from(newSet);
    }

    /**
     * Random integer generator (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Load and display a problem
     */
    loadProblem(index) {
        if (index >= this.problems.length) {
            this.showCompletion();
            return;
        }

        this.currentProblem = index;
        const problem = this.problems[index];
        this.startTime = Date.now();

        // Update problem display
        document.getElementById('problemNumber').textContent = index + 1;
        document.getElementById('problemDescription').textContent =
            `두 집합의 합집합을 찾아보세요!`;

        // Display Set A
        const colorA = document.getElementById('colorA');
        colorA.style.setProperty('--circle-color', problem.colorA);
        colorA.style.background = problem.colorA;
        document.getElementById('elementsA').textContent =
            `{${problem.setA.join(', ')}}`;

        // Display Set B
        const colorB = document.getElementById('colorB');
        colorB.style.setProperty('--circle-color', problem.colorB);
        colorB.style.background = problem.colorB;
        document.getElementById('elementsB').textContent =
            `{${problem.setB.join(', ')}}`;

        // Reset union display
        const unionCircle = document.getElementById('unionResult');
        unionCircle.classList.remove('active', 'blending', 'expanding');
        unionCircle.style.opacity = '0';
        unionCircle.style.transform = 'scale(0)';
        document.getElementById('elementsUnion').textContent = '';

        // Reset controls
        document.getElementById('showUnionBtn').style.display = 'block';
        document.getElementById('nextProblemBtn').style.display = 'none';
        document.getElementById('feedbackArea').textContent = '';
        document.getElementById('feedbackArea').className = 'feedback-area';

        // Update progress
        this.updateProgress();
    }

    /**
     * Show union with color blending animation
     */
    showUnion() {
        const problem = this.problems[this.currentProblem];
        const unionCircle = document.getElementById('unionResult');

        // Set blended color
        unionCircle.style.background = problem.colorUnion;

        // Apply animations
        unionCircle.classList.add('active', 'expanding', 'blending');

        // Create particles effect
        setTimeout(() => {
            this.createParticles(problem.colorA, problem.colorB);
        }, 300);

        // Show elements after animation
        setTimeout(() => {
            document.getElementById('elementsUnion').textContent =
                `{${problem.union.join(', ')}}`;

            // Show answer input or next button based on mode
            this.showAnswerCheck();
        }, CONFIG.animation.expandDuration);
    }

    /**
     * Create particle effect for color blending
     */
    createParticles(colorA, colorB) {
        const unionCircle = document.getElementById('unionResult');
        const rect = unionCircle.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        for (let i = 0; i < CONFIG.animation.particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const color = i % 2 === 0 ? colorA : colorB;
            particle.style.background = color;

            const angle = (Math.PI * 2 * i) / CONFIG.animation.particleCount;
            const distance = 50 + Math.random() * 30;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;

            unionCircle.appendChild(particle);

            // Remove particle after animation
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    /**
     * Show answer checking interface
     */
    showAnswerCheck() {
        document.getElementById('showUnionBtn').style.display = 'none';
        document.getElementById('nextProblemBtn').style.display = 'block';
    }

    /**
     * Check user's answer
     */
    checkAnswer() {
        const problem = this.problems[this.currentProblem];
        const userAnswer = parseInt(document.getElementById('answerInput').value);
        const feedbackArea = document.getElementById('feedbackArea');

        const isCorrect = userAnswer === problem.answer;
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        // Store answer
        this.userAnswers.push({
            problemIndex: this.currentProblem,
            userAnswer: userAnswer,
            correctAnswer: problem.answer,
            isCorrect: isCorrect,
            timeSpent: timeSpent
        });

        // Update score
        if (isCorrect) {
            let points = CONFIG.scoring.correctAnswer;
            if (CONFIG.scoring.timeBonus && timeSpent < 30) {
                points += Math.floor((30 - timeSpent) * CONFIG.scoring.timeBonusMultiplier);
            }
            this.score += points;

            feedbackArea.textContent = this.text.correct;
            feedbackArea.className = 'feedback-area correct';
        } else {
            this.score += CONFIG.scoring.incorrectAnswer;
            feedbackArea.textContent = `${this.text.incorrect} 정답: ${problem.answer}`;
            feedbackArea.className = 'feedback-area incorrect';
        }

        // Save to backend
        this.saveProgress();

        // Show next button
        document.getElementById('checkAnswerBtn').style.display = 'none';
        document.getElementById('nextProblemBtn').style.display = 'block';
    }

    /**
     * Move to next problem
     */
    nextProblem() {
        const nextIndex = this.currentProblem + 1;

        if (nextIndex < this.problems.length) {
            this.loadProblem(nextIndex);
        } else {
            this.showCompletion();
        }
    }

    /**
     * Reset current problem
     */
    resetProblem() {
        this.loadProblem(this.currentProblem);
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const progress = ((this.currentProblem) / this.totalProblems) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent =
            `${this.currentProblem}/${this.totalProblems}`;
    }

    /**
     * Show completion screen
     */
    showCompletion() {
        const feedbackArea = document.getElementById('feedbackArea');
        feedbackArea.textContent = `${this.text.completed} 점수: ${this.score}`;
        feedbackArea.className = 'feedback-area correct';

        document.getElementById('showUnionBtn').style.display = 'none';
        document.getElementById('resetBtn').style.display = 'none';
        document.getElementById('nextProblemBtn').style.display = 'none';

        // Final save
        this.saveFinalResults();
    }

    /**
     * Save progress to backend (Moodle LMS)
     */
    async saveProgress() {
        try {
            const data = {
                problemIndex: this.currentProblem,
                answer: this.userAnswers[this.userAnswers.length - 1],
                score: this.score
            };

            // Send to PHP backend
            const response = await fetch('php/save-progress.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('Progress saved:', result);
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    /**
     * Save final results to backend
     */
    async saveFinalResults() {
        try {
            const data = {
                totalProblems: this.totalProblems,
                completedProblems: this.currentProblem + 1,
                score: this.score,
                answers: this.userAnswers,
                completedAt: new Date().toISOString()
            };

            const response = await fetch('php/save-final-results.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('Final results saved:', result);
        } catch (error) {
            console.error('Error saving final results:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        document.getElementById('showUnionBtn').addEventListener('click', () => {
            this.showUnion();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetProblem();
        });

        document.getElementById('nextProblemBtn').addEventListener('click', () => {
            this.nextProblem();
        });

        document.getElementById('checkAnswerBtn')?.addEventListener('click', () => {
            this.checkAnswer();
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.colorUnionApp = new ColorUnionApp();
});
