/**
 * Similarity Detector Mobile App
 * JavaScript Application Logic
 */

class SimilarityApp {
    constructor() {
        this.apiUrl = '/api';
        this.currentProblemId = null;
        this.currentHints = [];
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('Similarity Detector App initialized');
        this.setupEventListeners();
        this.loadInitialProblem();
        this.startConnectionCheck();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const detectBtn = document.getElementById('detectBtn');
        const refreshBtn = document.getElementById('refreshBtn');

        detectBtn.addEventListener('click', () => this.detectHints());
        refreshBtn.addEventListener('click', () => this.refreshProblem());
    }

    /**
     * Load initial problem from Moodle
     */
    async loadInitialProblem() {
        try {
            // Get problem from URL parameter or load default
            const urlParams = new URLSearchParams(window.location.search);
            const problemId = urlParams.get('problem_id');

            if (problemId) {
                await this.loadProblem(problemId);
            } else {
                // Load a sample problem
                this.displaySampleProblem();
            }
        } catch (error) {
            console.error('Error loading problem:', error);
            this.showError('문제를 불러올 수 없습니다.');
        }
    }

    /**
     * Display sample problem for demonstration
     */
    displaySampleProblem() {
        const problem = {
            id: 1001,
            text: '두 삼각형 ABC와 DEF에서 AB=6cm, BC=8cm, AC=10cm이고, DE=3cm, EF=4cm, DF=5cm일 때, 두 삼각형이 닮았는지 판단하시오.'
        };

        this.currentProblemId = problem.id;
        document.getElementById('problemNumber').textContent = `#${problem.id}`;
        document.getElementById('problemContent').textContent = problem.text;
    }

    /**
     * Load problem from server
     */
    async loadProblem(problemId) {
        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiUrl}/problems/${problemId}`);
            if (!response.ok) throw new Error('Failed to load problem');

            const data = await response.json();

            this.currentProblemId = data.id;
            document.getElementById('problemNumber').textContent = `#${data.moodle_question_id}`;
            document.getElementById('problemContent').textContent = data.question_text;

            // Load existing hints
            await this.loadHints(data.id);

        } catch (error) {
            console.error('Error:', error);
            this.showError('문제를 불러오는데 실패했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Detect similarity hints
     */
    async detectHints() {
        if (!this.currentProblemId) {
            this.showError('문제를 먼저 선택해주세요.');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiUrl}/detect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    problem_id: this.currentProblemId
                })
            });

            if (!response.ok) throw new Error('Detection failed');

            const data = await response.json();

            if (data.success) {
                this.currentHints = data.hints;
                this.displayHints(data.hints);
                this.showSuccess(`${data.hints.length}개의 힌트를 찾았습니다!`);
            }

        } catch (error) {
            console.error('Error:', error);
            // Show sample hints for demonstration
            this.displaySampleHints();
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Load existing hints for a problem
     */
    async loadHints(problemId) {
        try {
            const response = await fetch(`${this.apiUrl}/hints/${problemId}`);
            if (!response.ok) return;

            const data = await response.json();
            if (data.hints && data.hints.length > 0) {
                this.currentHints = data.hints;
                this.displayHints(data.hints);
            }
        } catch (error) {
            console.error('Error loading hints:', error);
        }
    }

    /**
     * Display hints in the UI
     */
    displayHints(hints) {
        const container = document.getElementById('hintsContainer');
        const hintsCount = document.getElementById('hintsCount');

        hintsCount.textContent = `${hints.length}개`;

        if (hints.length === 0) {
            container.innerHTML = `
                <div class="no-hints">
                    <p>아직 힌트가 없습니다.</p>
                    <p class="hint-suggestion">문제를 선택하면 자동으로 닮음 힌트를 찾아드려요!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = hints.map((hint, index) => `
            <div class="hint-card ${hint.hint_type || hint.type}" style="animation-delay: ${index * 0.1}s">
                <div class="hint-header">
                    <span class="hint-type ${hint.hint_type || hint.type}">
                        ${this.getHintTypeLabel(hint.hint_type || hint.type)}
                    </span>
                    <div class="hint-confidence">
                        <span>${Math.round((hint.confidence_score || hint.confidence) * 100)}%</span>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${(hint.confidence_score || hint.confidence) * 100}%"></div>
                        </div>
                    </div>
                </div>
                <p class="hint-text">${hint.hint_text || hint.text}</p>
            </div>
        `).join('');
    }

    /**
     * Display sample hints for demonstration
     */
    displaySampleHints() {
        const sampleHints = [
            {
                type: 'ratio',
                text: '두 삼각형의 대응하는 변의 길이의 비를 확인해보세요. AB:DE = 6:3 = 2:1',
                confidence: 0.95
            },
            {
                type: 'angle',
                text: '두 삼각형 모두 직각삼각형입니다. 대응하는 각의 크기를 비교해보세요.',
                confidence: 0.90
            },
            {
                type: 'proportion',
                text: '세 변의 길이 비가 모두 2:1로 같으므로 두 삼각형은 닮음입니다.',
                confidence: 0.93
            }
        ];

        this.currentHints = sampleHints;
        this.displayHints(sampleHints);
    }

    /**
     * Get Korean label for hint type
     */
    getHintTypeLabel(type) {
        const labels = {
            'ratio': '비율',
            'angle': '각도',
            'proportion': '비례',
            'transformation': '변환',
            'shape': '도형'
        };
        return labels[type] || type;
    }

    /**
     * Refresh problem and hints
     */
    async refreshProblem() {
        if (this.currentProblemId) {
            await this.loadProblem(this.currentProblemId);
        } else {
            this.loadInitialProblem();
        }
    }

    /**
     * Show/hide loading overlay
     */
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Simple alert for now, could be replaced with toast notification
        alert('오류: ' + message);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // Simple console log for now, could be replaced with toast notification
        console.log('성공:', message);
    }

    /**
     * Check connection status
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            const isConnected = response.ok;

            const statusEl = document.getElementById('connectionStatus');
            statusEl.textContent = isConnected ? '연결됨' : '연결 끊김';

            return isConnected;
        } catch (error) {
            document.getElementById('connectionStatus').textContent = '연결 끊김';
            return false;
        }
    }

    /**
     * Start periodic connection check
     */
    startConnectionCheck() {
        // Check connection every 30 seconds
        setInterval(() => {
            this.checkConnection();
        }, 30000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.similarityApp = new SimilarityApp();
});
