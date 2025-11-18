/**
 * Main Application Controller
 * Coordinates all components and manages app state
 */

class App {
    constructor() {
        this.currentScreen = 'loginScreen';
        this.userStats = null;
        this.recommendation = null;
    }

    async init() {
        console.log('🌸 Blossom Sequence initializing...');

        // Set up event listeners
        this.setupEventListeners();

        // Try to restore session
        const isAuthenticated = await authManager.init();

        if (isAuthenticated) {
            await this.loadDashboard();
        } else {
            this.showScreen('loginScreen');
        }

        console.log('✅ Blossom Sequence ready!');
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register link
        const showRegister = document.getElementById('showRegister');
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                // In production, you'd show a registration form
                alert('회원가입 기능은 곧 추가됩니다!');
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => authManager.logout());
        }

        // Start recommended problem
        const startRecommendedBtn = document.getElementById('startRecommendedBtn');
        if (startRecommendedBtn) {
            startRecommendedBtn.addEventListener('click', () => this.startRecommendedProblem());
        }

        // Start manual problem
        const startManualBtn = document.getElementById('startManualBtn');
        if (startManualBtn) {
            startManualBtn.addEventListener('click', () => this.startManualProblem());
        }

        // Submit answer
        const submitAnswerBtn = document.getElementById('submitAnswerBtn');
        if (submitAnswerBtn) {
            submitAnswerBtn.addEventListener('click', () => this.handleSubmitAnswer());
        }

        // Answer input - submit on Enter
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSubmitAnswer();
                }
            });
        }

        // Game controls
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => gameController.showHint());
        }

        const skipBtn = document.getElementById('skipBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => gameController.skipProblem());
        }

        const exitGameBtn = document.getElementById('exitGameBtn');
        if (exitGameBtn) {
            exitGameBtn.addEventListener('click', () => gameController.exitGame());
        }

        // Results screen buttons
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.startRecommendedProblem());
        }

        const dashboardBtn = document.getElementById('dashboardBtn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => this.loadDashboard());
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            await authManager.login(username, password);
            await this.loadDashboard();
        } catch (error) {
            alert('로그인 실패: ' + error.message);
        }
    }

    async loadDashboard() {
        this.showScreen('dashboardScreen');

        // Load user stats
        try {
            const stats = await api.getUserStats();
            this.displayUserStats(stats);
        } catch (error) {
            console.error('Failed to load stats:', error);
            // Show default stats
            this.displayUserStats({
                totalCompleted: 0,
                avgAccuracy: 0,
                currentLevel: 1,
                totalTime: 0
            });
        }

        // Initialize recommendation engine
        await recommendationEngine.init();

        // Load recommended problem
        await this.loadRecommendation();
    }

    displayUserStats(stats) {
        document.getElementById('totalCompleted').textContent = stats.totalCompleted || 0;
        document.getElementById('avgAccuracy').textContent = `${Math.round(stats.avgAccuracy || 0)}%`;
        document.getElementById('currentLevel').textContent = stats.currentLevel || 1;

        const totalMinutes = Math.floor((stats.totalTime || 0) / 60);
        document.getElementById('totalTime').textContent = `${totalMinutes}분`;
    }

    async loadRecommendation() {
        const recommendedCard = document.getElementById('recommendedProblem');
        recommendedCard.innerHTML = '<p class="loading"><span class="loading-spinner"></span> 추천 문제를 생성하고 있습니다...</p>';

        try {
            this.recommendation = await recommendationEngine.getRecommendation();

            const typeNames = {
                'fibonacci': '피보나치 수열',
                'arithmetic': '등차수열',
                'geometric': '등비수열',
                'square': '제곱수',
                'prime': '소수'
            };

            recommendedCard.innerHTML = `
                <h4>${typeNames[this.recommendation.sequenceType] || this.recommendation.sequenceType}</h4>
                <p><strong>난이도:</strong> 레벨 ${this.recommendation.difficulty}</p>
                <p><strong>꽃잎 개수:</strong> ${this.recommendation.petalCount}개</p>
                <p class="reason">${this.recommendation.reason || '당신의 학습 패턴에 최적화된 문제입니다.'}</p>
            `;
        } catch (error) {
            console.error('Failed to load recommendation:', error);
            recommendedCard.innerHTML = '<p>추천 시스템을 사용할 수 없습니다. 직접 선택해주세요.</p>';
        }
    }

    startRecommendedProblem() {
        if (!this.recommendation) {
            alert('추천 문제를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        gameController.startGame(this.recommendation);
    }

    startManualProblem() {
        const sequenceType = document.getElementById('sequenceType').value;
        const difficulty = parseInt(document.getElementById('difficulty').value);
        const petalCount = parseInt(document.getElementById('petalCount').value);

        const config = {
            sequenceType,
            difficulty,
            petalCount
        };

        gameController.startGame(config);
    }

    handleSubmitAnswer() {
        const answerInput = document.getElementById('answerInput');
        const userAnswer = answerInput.value.trim();

        if (!userAnswer) {
            alert('답을 입력해주세요!');
            return;
        }

        const submitBtn = document.getElementById('submitAnswerBtn');
        submitBtn.disabled = true;

        gameController.submitAnswer(userAnswer);

        setTimeout(() => {
            submitBtn.disabled = false;
        }, 2000);
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
    }
}

// Initialize app when DOM is ready
let app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new App();
        app.init();
    });
} else {
    app = new App();
    app.init();
}
