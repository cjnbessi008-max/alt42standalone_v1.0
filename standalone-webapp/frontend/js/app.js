// Main Application Module
import { API } from './api.js';
import { DualDanceVisualization } from './visualization.js';

export class DualDanceApp {
    constructor() {
        this.currentProblem = null;
        this.startTime = null;
        this.timerInterval = null;
        this.difficulty = 3;
        this.animationSpeed = 3;
        this.visualization = null;
    }

    init() {
        this.setupVisualization();
        this.setupEventListeners();
        this.loadStats();
        this.updateSettings();
    }

    setupVisualization() {
        const canvas = document.getElementById('dance-canvas');
        if (canvas) {
            this.visualization = new DualDanceVisualization(canvas, this.animationSpeed);
            this.visualization.start();
        }
    }

    setupEventListeners() {
        // Start button
        document.getElementById('start-btn')?.addEventListener('click', () => this.startProblem());

        // Submit button
        document.getElementById('submit-btn')?.addEventListener('click', () => this.submitAnswer());

        // Next button
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextProblem());

        // Answer input (Enter key)
        document.getElementById('answer-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitAnswer();
        });

        // Settings
        document.getElementById('difficulty-select')?.addEventListener('change', (e) => {
            this.difficulty = parseInt(e.target.value);
        });

        document.getElementById('animation-speed')?.addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = this.animationSpeed;
            if (this.visualization) {
                this.visualization.setSpeed(this.animationSpeed);
            }
        });
    }

    async startProblem() {
        const btn = document.getElementById('start-btn');
        btn.disabled = true;
        btn.textContent = 'Loading...';

        try {
            const result = await API.post('/problems/generate', { difficulty: this.difficulty });
            this.currentProblem = result.problem;

            // Update UI
            document.getElementById('problem-text').innerHTML = this.currentProblem.question_text;
            document.getElementById('answer-input').disabled = false;
            document.getElementById('answer-input').value = '';
            document.getElementById('answer-input').focus();
            document.getElementById('submit-btn').disabled = false;
            document.getElementById('feedback-area').style.display = 'none';
            btn.style.display = 'none';

            // Update visualization
            if (this.visualization) {
                this.visualization.setProblem(this.currentProblem);
            }

            // Start timer
            this.startTimer();
        } catch (error) {
            alert('Failed to generate problem: ' + error.message);
            btn.disabled = false;
            btn.textContent = 'Start';
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('timer').textContent =
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    getElapsedTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    async submitAnswer() {
        const answerInput = document.getElementById('answer-input');
        const answer = parseFloat(answerInput.value);

        if (isNaN(answer)) {
            alert('Please enter a valid number');
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        answerInput.disabled = true;
        this.stopTimer();

        try {
            const result = await API.post('/attempts', {
                problem_id: this.currentProblem.id,
                answer: answer,
                time_spent: this.getElapsedTime(),
                interaction_data: this.visualization?.getState()
            });

            this.showFeedback(result.attempt);
            this.loadStats();
        } catch (error) {
            alert('Failed to submit answer: ' + error.message);
            submitBtn.disabled = false;
            answerInput.disabled = false;
        }
    }

    showFeedback(attempt) {
        const feedbackArea = document.getElementById('feedback-area');
        const feedbackMessage = document.getElementById('feedback-message');
        const nextBtn = document.getElementById('next-btn');

        let html = '';
        if (attempt.is_correct == 1) {
            html = `<div style="color: var(--success); font-weight: bold;">✓ Correct!</div>`;
            html += `<div>Grade: ${Math.round(attempt.grade)}%</div>`;
        } else {
            html = `<div style="color: var(--danger); font-weight: bold;">✗ Incorrect</div>`;
            html += `<div>Correct answer: ${attempt.correct_answer}</div>`;
        }

        feedbackMessage.innerHTML = html;
        feedbackArea.style.display = 'block';
        feedbackArea.classList.add('slide-in');
        nextBtn.style.display = 'inline-flex';
    }

    nextProblem() {
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('feedback-area').style.display = 'none';
        document.getElementById('start-btn').style.display = 'inline-flex';
        document.getElementById('start-btn').disabled = false;
        document.getElementById('start-btn').textContent = 'Start';
        document.getElementById('timer').textContent = '0:00';
        this.startProblem();
    }

    async loadStats() {
        try {
            const result = await API.get('/stats/user');
            if (result.success) {
                const stats = result.stats;
                document.getElementById('stat-accuracy').textContent =
                    `${Math.round(stats.accuracy_percentage || 0)}%`;
                document.getElementById('stat-correct').textContent = stats.correct_attempts || 0;
                document.getElementById('stat-grade').textContent =
                    Math.round(stats.average_grade || 0);
                document.getElementById('stat-streak').textContent = stats.current_streak || 0;
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    updateSettings() {
        this.difficulty = parseInt(document.getElementById('difficulty-select')?.value || 3);
        this.animationSpeed = parseInt(document.getElementById('animation-speed')?.value || 3);
    }
}
