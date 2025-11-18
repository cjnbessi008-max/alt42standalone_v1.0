/**
 * Alt42 LMS Integration App
 * 메인 애플리케이션 로직
 */

class Alt42App {
    constructor() {
        this.currentProblem = null;
        this.progressData = null;
        this.isInitialized = false;
    }

    /**
     * 앱 초기화
     */
    async init() {
        console.log('Alt42 App initializing...');

        // Moodle 연결 설정
        const config = this.getConfigFromUrl();
        moodleConnector.init(config);

        // UI 초기화
        this.initUI();

        // 그래프 초기화
        this.initGraphs();

        // 데이터 로드
        await this.loadInitialData();

        // 시간 업데이트
        this.updateTime();
        setInterval(() => this.updateTime(), 60000);

        this.isInitialized = true;
        console.log('Alt42 App initialized successfully');
    }

    /**
     * URL에서 설정 가져오기
     */
    getConfigFromUrl() {
        const params = new URLSearchParams(window.location.search);

        return {
            baseUrl: params.get('moodle_url') || window.location.origin,
            wsToken: params.get('wstoken') || 'demo_token',
            userId: parseInt(params.get('userid')) || 1,
            courseId: parseInt(params.get('courseid')) || 1,
            problemId: parseInt(params.get('problemid')) || 1
        };
    }

    /**
     * UI 초기화
     */
    initUI() {
        // 로딩 인디케이터 표시
        this.showLoading();
    }

    /**
     * 그래프 초기화
     */
    initGraphs() {
        // 메인 로그 그래프 (Area Color 적용)
        logGraphManager.initMainChart('logChart');

        // 미니 로그 그래프 (스마트폰용)
        logGraphManager.initMiniChart('miniLogChart');

        console.log('Graphs initialized with area color fill');
    }

    /**
     * 초기 데이터 로드
     */
    async loadInitialData() {
        try {
            const config = this.getConfigFromUrl();

            // 문제 정보 로드
            await this.loadProblemInfo(config.problemId);

            // 진행 데이터 로드
            await this.loadProgressData(config.userId, config.courseId);

            this.hideLoading();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError('데이터를 불러오는데 실패했습니다.');
        }
    }

    /**
     * 문제 정보 로드
     */
    async loadProblemInfo(problemId) {
        this.currentProblem = await moodleConnector.getProblemInfo(problemId);

        // PC 화면에 표시
        const problemDetails = document.getElementById('problemDetails');
        if (problemDetails && this.currentProblem) {
            problemDetails.innerHTML = `
                <h3>${this.currentProblem.title}</h3>
                <p><strong>난이도:</strong> ${this.currentProblem.difficulty}</p>
                <p><strong>카테고리:</strong> ${this.currentProblem.category}</p>
                <p class="problem-text">${this.currentProblem.description}</p>
            `;
        }

        // 스마트폰 화면에 표시
        const mobileProblem = document.getElementById('mobileProblem');
        if (mobileProblem && this.currentProblem) {
            mobileProblem.innerHTML = `
                <h4>${this.currentProblem.title}</h4>
                <p>${this.currentProblem.description}</p>
                <div class="problem-actions">
                    <button onclick="app.submitAnswer()">답안 제출</button>
                </div>
            `;
        }
    }

    /**
     * 진행 데이터 로드
     */
    async loadProgressData(userId, courseId) {
        this.progressData = await moodleConnector.getUserProgress(userId, courseId);

        // 그래프 업데이트
        if (this.progressData) {
            logGraphManager.updateFromLMS(this.progressData);
            console.log('Progress data loaded and graphs updated');
        }
    }

    /**
     * 현재 시간 업데이트
     */
    updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = `${hours}:${minutes}`;
        }
    }

    /**
     * 로딩 표시
     */
    showLoading() {
        const elements = [
            document.getElementById('problemDetails'),
            document.getElementById('mobileProblem')
        ];

        elements.forEach(el => {
            if (el) {
                el.innerHTML = '<p class="loading">데이터를 불러오는 중...</p>';
            }
        });
    }

    /**
     * 로딩 숨기기
     */
    hideLoading() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(el => {
            el.classList.remove('loading');
        });
    }

    /**
     * 에러 표시
     */
    showError(message) {
        alert(message);
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        const answer = prompt('답을 입력하세요:');
        if (!answer) return;

        try {
            const result = await moodleConnector.submitAnswer(
                this.currentProblem.id,
                this.currentProblem.id,
                answer
            );

            if (result.success !== false) {
                alert('답안이 제출되었습니다!');
                // 진행 데이터 새로고침
                await this.refreshProgressData();
            } else {
                alert('답안 제출에 실패했습니다.');
            }
        } catch (error) {
            console.error('Submit answer error:', error);
            alert('답안 제출 중 오류가 발생했습니다.');
        }
    }

    /**
     * 진행 데이터 새로고침
     */
    async refreshProgressData() {
        const config = this.getConfigFromUrl();
        await this.loadProgressData(config.userId, config.courseId);
    }

    /**
     * 실시간 데이터 업데이트 시작
     */
    startRealtimeUpdates(interval = 30000) {
        setInterval(async () => {
            if (this.isInitialized) {
                await this.refreshProgressData();
                console.log('Progress data refreshed');
            }
        }, interval);
    }
}

// 전역 앱 인스턴스
const app = new Alt42App();

// 페이지 로드 시 앱 초기화
document.addEventListener('DOMContentLoaded', async () => {
    await app.init();

    // 실시간 업데이트 시작 (30초마다)
    app.startRealtimeUpdates(30000);

    console.log('Alt42 App is ready!');
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    logGraphManager.destroy();
});
