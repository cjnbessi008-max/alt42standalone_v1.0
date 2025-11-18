/**
 * Mobile App Controller
 * Handles the mobile screen simulation and app logic
 */

class MobileApp {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element with id "${containerId}" not found`);
        }

        this.starMap = null;
        this.currentProblem = null;
        this.studentId = 1; // Default student ID
        this.courseId = 101; // Default course ID
        this.startTime = null;

        this.init();
    }

    /**
     * Initialize mobile app
     */
    async init() {
        this.renderUI();

        // Initialize Vector Star Map
        this.starMap = new VectorStarMap('starMapCanvas', {
            width: 350,
            height: 600,
            enableParticles: true,
            enableGlow: true
        });

        // Load data
        try {
            await this.starMap.loadData(this.courseId, this.studentId);
            this.updateStats();
        } catch (error) {
            this.showError('문제 데이터를 불러오는데 실패했습니다: ' + error.message);
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Render mobile UI structure
     */
    renderUI() {
        this.container.innerHTML = `
            <div class="mobile-header">
                <div class="status-bar">
                    <span class="time">${this.getCurrentTime()}</span>
                    <span class="battery">🔋 95%</span>
                </div>
                <div class="app-header">
                    <h2>📚 학습 별자리</h2>
                    <button class="refresh-btn" id="refreshBtn">⟳</button>
                </div>
            </div>

            <div class="mobile-content">
                <div class="canvas-container">
                    <canvas id="starMapCanvas"></canvas>
                </div>

                <div class="stats-panel" id="statsPanel">
                    <div class="stat-item">
                        <span class="stat-label">완료</span>
                        <span class="stat-value" id="completedCount">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">진행중</span>
                        <span class="stat-value" id="inProgressCount">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">평균점수</span>
                        <span class="stat-value" id="avgScore">-</span>
                    </div>
                </div>

                <div class="problem-detail" id="problemDetail" style="display: none;">
                    <div class="detail-header">
                        <h3 id="problemTitle">문제 제목</h3>
                        <button class="close-btn" id="closeDetailBtn">✕</button>
                    </div>
                    <div class="detail-content">
                        <p id="problemDescription"></p>
                        <div class="problem-meta">
                            <span class="meta-item" id="problemDifficulty"></span>
                            <span class="meta-item" id="problemType"></span>
                        </div>
                        <div class="progress-info" id="progressInfo"></div>
                        <div class="action-buttons">
                            <button class="btn btn-primary" id="startProblemBtn">시작하기</button>
                            <button class="btn btn-secondary" id="viewConnectionsBtn">연결된 개념 보기</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mobile-footer">
                <div class="nav-item active">
                    <span>🗺️</span>
                    <small>별자리</small>
                </div>
                <div class="nav-item">
                    <span>📊</span>
                    <small>진도</small>
                </div>
                <div class="nav-item">
                    <span>⚙️</span>
                    <small>설정</small>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Star click event
        const canvas = document.getElementById('starMapCanvas');
        canvas.addEventListener('starclick', (e) => {
            this.showProblemDetail(e.detail);
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refresh();
        });

        // Close detail button
        document.getElementById('closeDetailBtn').addEventListener('click', () => {
            this.hideProblemDetail();
        });

        // Start problem button
        document.getElementById('startProblemBtn').addEventListener('click', () => {
            this.startProblem();
        });

        // View connections button
        document.getElementById('viewConnectionsBtn').addEventListener('click', () => {
            this.viewConnections();
        });

        // Update time every minute
        setInterval(() => {
            const timeEl = this.container.querySelector('.time');
            if (timeEl) timeEl.textContent = this.getCurrentTime();
        }, 60000);
    }

    /**
     * Show problem detail panel
     */
    showProblemDetail(problem) {
        this.currentProblem = problem;

        const detailPanel = document.getElementById('problemDetail');
        document.getElementById('problemTitle').textContent = problem.title;
        document.getElementById('problemDescription').textContent = problem.description || '설명이 없습니다.';

        // Meta information
        const difficultyText = ['', '쉬움', '보통', '어려움', '매우 어려움', '전문가'][problem.difficulty] || '보통';
        document.getElementById('problemDifficulty').textContent = `난이도: ${difficultyText}`;

        const typeText = {
            'concept': '개념',
            'exercise': '연습',
            'quiz': '퀴즈',
            'assessment': '평가'
        }[problem.type] || '개념';
        document.getElementById('problemType').textContent = `유형: ${typeText}`;

        // Progress information
        const progressInfo = document.getElementById('progressInfo');
        if (problem.studentStatus === 'not_started') {
            progressInfo.innerHTML = '<p class="status-badge status-not-started">아직 시작하지 않음</p>';
        } else if (problem.studentStatus === 'in_progress') {
            progressInfo.innerHTML = `
                <p class="status-badge status-in-progress">진행중</p>
                <p>시도 횟수: ${problem.attempts}회</p>
                <p>현재 점수: ${problem.studentScore.toFixed(0)}점</p>
            `;
        } else if (problem.studentStatus === 'completed') {
            progressInfo.innerHTML = `
                <p class="status-badge status-completed">완료 ✓</p>
                <p>최종 점수: ${problem.studentScore.toFixed(0)}점</p>
                <p>시도 횟수: ${problem.attempts}회</p>
            `;
        } else if (problem.studentStatus === 'mastered') {
            progressInfo.innerHTML = `
                <p class="status-badge status-mastered">마스터 ★</p>
                <p>최종 점수: ${problem.studentScore.toFixed(0)}점</p>
            `;
        }

        detailPanel.style.display = 'block';
    }

    /**
     * Hide problem detail panel
     */
    hideProblemDetail() {
        document.getElementById('problemDetail').style.display = 'none';
        this.currentProblem = null;
        this.startTime = null;
    }

    /**
     * Start problem (simulate learning activity)
     */
    async startProblem() {
        if (!this.currentProblem) return;

        this.startTime = Date.now();

        // Simulate random score
        const score = 60 + Math.random() * 40; // 60-100
        const timeSpent = Math.floor(30 + Math.random() * 120); // 30-150 seconds

        const status = score >= 80 ? 'completed' : 'in_progress';

        try {
            const response = await fetch('api/save_progress.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: this.studentId,
                    problem_id: this.currentProblem.id,
                    status: status,
                    score: score,
                    time_spent: timeSpent
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(`학습 완료!\n점수: ${score.toFixed(0)}점\n상태: ${status === 'completed' ? '완료' : '진행중'}`);

                // Reload data to update visualization
                await this.starMap.loadData(this.courseId, this.studentId);
                this.updateStats();
                this.hideProblemDetail();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showError('진도 저장 실패: ' + error.message);
        }
    }

    /**
     * View connections for current problem
     */
    viewConnections() {
        if (!this.currentProblem) return;

        const connections = this.starMap.connections.filter(conn =>
            conn.from === this.currentProblem.id || conn.to === this.currentProblem.id
        );

        if (connections.length === 0) {
            alert('연결된 개념이 없습니다.');
            return;
        }

        const connectionsList = connections.map(conn => {
            const isFrom = conn.from === this.currentProblem.id;
            const relatedId = isFrom ? conn.to : conn.from;
            const relatedTitle = isFrom ? conn.toTitle : conn.fromTitle;
            const arrow = isFrom ? '→' : '←';
            const typeText = {
                'prerequisite': '선수학습',
                'related': '관련',
                'advanced': '심화',
                'similar': '유사'
            }[conn.type];

            return `${arrow} ${relatedTitle} (${typeText})`;
        }).join('\n');

        alert(`연결된 개념들:\n\n${connectionsList}`);
    }

    /**
     * Update statistics panel
     */
    updateStats() {
        if (!this.starMap || !this.starMap.problems) return;

        const problems = this.starMap.problems;

        const completed = problems.filter(p => p.studentStatus === 'completed' || p.studentStatus === 'mastered').length;
        const inProgress = problems.filter(p => p.studentStatus === 'in_progress').length;

        const scoresWithProgress = problems
            .filter(p => p.studentStatus !== 'not_started')
            .map(p => p.studentScore);

        const avgScore = scoresWithProgress.length > 0
            ? scoresWithProgress.reduce((a, b) => a + b, 0) / scoresWithProgress.length
            : 0;

        document.getElementById('completedCount').textContent = completed;
        document.getElementById('inProgressCount').textContent = inProgress;
        document.getElementById('avgScore').textContent = avgScore > 0 ? avgScore.toFixed(0) + '점' : '-';
    }

    /**
     * Refresh data
     */
    async refresh() {
        const btn = document.getElementById('refreshBtn');
        btn.textContent = '⟳';
        btn.disabled = true;

        try {
            await this.starMap.loadData(this.courseId, this.studentId);
            this.updateStats();
        } catch (error) {
            this.showError('새로고침 실패: ' + error.message);
        } finally {
            btn.disabled = false;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        alert('오류: ' + message);
        console.error(message);
    }

    /**
     * Get current time string
     */
    getCurrentTime() {
        const now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' +
               now.getMinutes().toString().padStart(2, '0');
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('mobileScreen')) {
        new MobileApp('mobileScreen');
    }
});
