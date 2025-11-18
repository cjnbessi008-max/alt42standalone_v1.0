/**
 * Main Application Controller
 * Integrates all components and manages application state
 */

class App {
    constructor() {
        this.moodleClient = new MoodleClient('/backend/api');
        this.liveGraph = null;
        this.smartphoneController = null;
        this.currentQuizId = null;
        this.currentUserId = null;
        this.updateInterval = null;

        this.init();
    }

    async init() {
        try {
            // Initialize components
            this.liveGraph = new LiveGraph('live-graph-canvas');
            this.smartphoneController = new SmartphoneController();

            // Setup UI event listeners
            this.setupEventListeners();

            // Load initial data
            await this.loadQuizList();
            await this.loadUserList();

            // Load demo data initially
            this.loadDemoData();

            console.log('ALT42 Live Graph initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('애플리케이션 초기화 중 오류가 발생했습니다.');
        }
    }

    setupEventListeners() {
        // Quiz selection
        const quizSelect = document.getElementById('quiz-select');
        if (quizSelect) {
            quizSelect.addEventListener('change', (e) => {
                this.currentQuizId = e.target.value;
                if (this.currentQuizId) {
                    this.loadGraphData();
                }
            });
        }

        // User selection
        const userSelect = document.getElementById('user-select');
        if (userSelect) {
            userSelect.addEventListener('change', (e) => {
                this.currentUserId = e.target.value || null;
                if (this.currentQuizId) {
                    this.loadGraphData();
                }
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.moodleClient.clearCache();
                this.loadGraphData();
                this.smartphoneController.vibrate();
                this.smartphoneController.showNotification('데이터 새로고침 완료');
            });
        }

        // Smartphone view change
        document.addEventListener('smartphone-view-change', (e) => {
            console.log('View changed to:', e.detail.view);
            // Handle view changes here if needed
        });
    }

    async loadQuizList() {
        try {
            const quizzes = await this.moodleClient.getQuizList();
            const select = document.getElementById('quiz-select');

            if (select) {
                quizzes.forEach(quiz => {
                    const option = document.createElement('option');
                    option.value = quiz.id;
                    option.textContent = quiz.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading quiz list:', error);
        }
    }

    async loadUserList() {
        try {
            const users = await this.moodleClient.getUserList();
            const select = document.getElementById('user-select');

            if (select) {
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id || '';
                    option.textContent = user.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading user list:', error);
        }
    }

    async loadGraphData() {
        if (!this.currentQuizId) {
            return;
        }

        try {
            const data = await this.moodleClient.getGraphData(
                this.currentQuizId,
                this.currentUserId
            );

            this.updateUI(data);
            this.startAutoUpdate(data.animation_config.update_interval);

        } catch (error) {
            console.error('Error loading graph data:', error);
            this.showError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }

    loadDemoData() {
        // Load mock data for demonstration
        const mockData = this.moodleClient.generateMockData(15);
        this.updateUI(mockData);
        this.smartphoneController.showNotification('데모 데이터 로드됨');
    }

    updateUI(data) {
        // Update statistics
        this.updateStatistics(data.statistics);

        // Update graph
        if (this.liveGraph && data.time_series) {
            this.liveGraph.setData(data.time_series);
        }

        // Update smartphone UI
        this.smartphoneController.vibrate();
    }

    updateStatistics(stats) {
        const elements = {
            'total-attempts': stats.total_attempts,
            'average-score': stats.average_score.toFixed(1) + '점',
            'completion-rate': stats.completion_rate.toFixed(1) + '%'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                // Animate value change
                element.style.animation = 'none';
                setTimeout(() => {
                    element.textContent = value;
                    element.style.animation = 'valueChange 1s ease-in-out';
                }, 10);
            }
        });
    }

    startAutoUpdate(interval) {
        // Clear existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Set new interval
        this.updateInterval = setInterval(() => {
            if (this.currentQuizId) {
                this.moodleClient.clearCache();
                this.loadGraphData();
            }
        }, interval);
    }

    showError(message) {
        console.error(message);
        this.smartphoneController.showNotification('⚠️ ' + message, 5000);

        // Also show in main UI
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f44336;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideDown 0.3s ease-out;
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        if (this.liveGraph) {
            this.liveGraph.destroy();
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new App();
    });
} else {
    window.app = new App();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
