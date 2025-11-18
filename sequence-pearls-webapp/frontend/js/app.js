/**
 * Main Application Logic
 * Sequence Pearls Web App
 */

class SequencePearlsApp {
    constructor() {
        this.currentProblem = null;
        this.startTime = null;
        this.hintUsed = false;
        this.pearlsRenderer = null;

        this.init();
    }

    init() {
        // Initialize pearls renderer
        this.pearlsRenderer = new PearlsRenderer('pearls-canvas');

        // Check if user is already logged in
        if (api.token) {
            this.showApp();
        } else {
            this.showLogin();
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login/Register tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Guest login
        document.getElementById('guest-login').addEventListener('click', () => {
            this.handleGuestLogin();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Submit answer
        document.getElementById('submit-answer').addEventListener('click', () => {
            this.submitAnswer();
        });

        // Enter key on answer input
        document.getElementById('user-answer').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        // Hint button
        document.getElementById('hint-btn').addEventListener('click', () => {
            this.showHint();
        });

        // Next problem
        document.getElementById('next-problem').addEventListener('click', () => {
            this.loadNextProblem();
        });

        // Fullscreen toggle
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tab}-form`);
        });
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await api.login(username, password);
            api.setToken(response.token);
            this.showApp();
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const fullName = document.getElementById('register-fullname').value;

        try {
            const response = await api.register(username, email, password, fullName);
            api.setToken(response.token);
            this.showApp();
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleGuestLogin() {
        try {
            const response = await api.guestLogin();
            api.setToken(response.token);
            this.showApp();
        } catch (error) {
            this.showError(error.message);
        }
    }

    handleLogout() {
        api.clearToken();
        this.pearlsRenderer.stopAnimation();
        this.showLogin();
    }

    showError(message) {
        const errorEl = document.getElementById('auth-error');
        errorEl.textContent = message;
        errorEl.classList.add('show');
        setTimeout(() => errorEl.classList.remove('show'), 3000);
    }

    showLogin() {
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('app-screen').classList.remove('active');
    }

    async showApp() {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app-screen').classList.add('active');

        // Load user data
        await this.loadUserData();

        // Load first problem
        await this.loadNextProblem();

        // Start pearl animation
        this.pearlsRenderer.startAnimation();
    }

    async loadUserData() {
        try {
            const user = await api.getCurrentUser();
            document.getElementById('username-display').textContent = user.username;
            this.updateProgress(user);
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    async loadNextProblem() {
        try {
            this.showLoading(true);

            // Get recommended problem
            const problem = await api.getRecommendedProblem();
            this.currentProblem = problem;
            this.startTime = Date.now();
            this.hintUsed = false;

            // Update UI
            document.getElementById('difficulty-level').textContent = problem.difficulty;
            document.getElementById('recommendation-info').textContent = problem.recommendation.reason;

            // Create pearls
            this.pearlsRenderer.createPearls(problem.sequence_data, problem.missing_position);

            // Reset UI
            document.getElementById('user-answer').value = '';
            document.getElementById('answer-section').style.display = 'block';
            document.getElementById('feedback-section').classList.remove('show');

            this.showLoading(false);

        } catch (error) {
            console.error('Failed to load problem:', error);
            this.showLoading(false);
            alert('Failed to load next problem. Please try again.');
        }
    }

    async submitAnswer() {
        const answerInput = document.getElementById('user-answer');
        const answer = parseFloat(answerInput.value);

        if (isNaN(answer)) {
            alert('Please enter a valid number');
            return;
        }

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        try {
            this.showLoading(true);

            const result = await api.submitAnswer(
                this.currentProblem.id,
                answer,
                timeSpent,
                this.hintUsed
            );

            this.showFeedback(result);
            this.updateProgress(result.progress);

            // Show achievements
            if (result.achievements && result.achievements.length > 0) {
                this.showAchievements(result.achievements);
            }

            this.showLoading(false);

        } catch (error) {
            console.error('Failed to submit answer:', error);
            this.showLoading(false);
            alert('Failed to submit answer. Please try again.');
        }
    }

    showFeedback(result) {
        // Hide answer section
        document.getElementById('answer-section').style.display = 'none';

        // Show feedback section
        const feedbackSection = document.getElementById('feedback-section');
        const feedbackMessage = document.getElementById('feedback-message');
        const explanation = document.getElementById('explanation');

        feedbackMessage.textContent = result.correct ? '🎉 정답입니다!' : '❌ 틀렸습니다';
        feedbackMessage.className = result.correct ? 'correct' : 'incorrect';

        explanation.innerHTML = `
            <strong>정답:</strong> ${result.correct_answer}<br>
            <strong>규칙:</strong> ${result.explanation}
        `;

        feedbackSection.classList.add('show');

        // Reveal answer in pearls
        if (result.correct) {
            this.pearlsRenderer.revealAnswer(result.correct_answer);
        }
    }

    updateProgress(progress) {
        document.getElementById('problems-solved').textContent = progress.total_solved || 0;
        document.getElementById('total-correct').textContent = progress.total_correct || 0;
        document.getElementById('accuracy').textContent = progress.accuracy || 0;
        document.getElementById('current-streak').textContent = progress.current_streak || 0;
        document.getElementById('best-streak').textContent = progress.best_streak || 0;
        document.getElementById('current-level').textContent = progress.current_level || 1;
    }

    showAchievements(achievements) {
        const container = document.getElementById('achievements-container');

        achievements.forEach(achievement => {
            const badge = document.createElement('div');
            badge.className = 'achievement-badge';
            badge.innerHTML = `
                <h4>🏆 ${achievement.name}</h4>
                <p>${achievement.description}</p>
            `;
            container.appendChild(badge);

            // Remove after 5 seconds
            setTimeout(() => badge.remove(), 5000);
        });
    }

    showHint() {
        if (this.currentProblem && this.currentProblem.hint) {
            alert(this.currentProblem.hint);
            this.hintUsed = true;
        }
    }

    toggleFullscreen() {
        const frame = document.querySelector('.smartphone-frame');
        const btn = document.getElementById('fullscreen-btn');

        frame.classList.toggle('fullscreen');

        if (frame.classList.contains('fullscreen')) {
            btn.textContent = '✕';
        } else {
            btn.textContent = '⛶';
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.add('show');
        } else {
            loading.classList.remove('show');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SequencePearlsApp();
});
