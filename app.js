/**
 * Infinity Breath - LMS 연동 학습 앱
 * Moodle 3.7 / PHP 7.1.9 / MySQL 5.7 연동
 */

// LMS 설정
const LMS_CONFIG = {
    apiEndpoint: '/moodle/webservice/rest/server.php',
    wsToken: '', // Moodle Web Service Token
    format: 'json'
};

// 앱 상태 관리
class AppState {
    constructor() {
        this.currentModule = null;
        this.progress = 0;
        this.problemsCompleted = 0;
        this.totalProblems = 20;
        this.isLoading = false;
    }

    updateProgress(completed) {
        this.problemsCompleted = completed;
        this.progress = Math.round((completed / this.totalProblems) * 100);
        this.renderProgress();
    }

    renderProgress() {
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const statusText = document.querySelectorAll('.status-text')[1];

        if (progressBar) {
            progressBar.style.width = `${this.progress}%`;
        }
        if (progressText) {
            progressText.textContent = `진행률: ${this.progress}%`;
        }
        if (statusText) {
            statusText.textContent = `${this.problemsCompleted}/${this.totalProblems} 문제 완료`;
        }
    }
}

// LMS API 시뮬레이션
class LMSConnector {
    constructor(config) {
        this.config = config;
        this.connected = false;
    }

    /**
     * LMS에서 문제 정보 가져오기 (Moodle API 시뮬레이션)
     */
    async fetchProblemData(moduleId) {
        console.log(`LMS API 호출: 모듈 ${moduleId} 정보 요청`);

        // 실제 환경에서는 Moodle Web Service를 호출
        // 예: core_course_get_contents, mod_quiz_get_quizzes_by_courses 등

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    module: {
                        id: moduleId,
                        name: '수학 - 무한수열',
                        description: '무한수열의 개념을 이해하고 극한값을 계산하는 방법을 학습합니다.',
                        totalProblems: 20,
                        currentProgress: 13,
                        difficulty: 'intermediate'
                    }
                });
            }, 1000);
        });
    }

    /**
     * 문제 제출 및 결과 전송
     */
    async submitAnswer(problemId, answer) {
        console.log(`문제 ${problemId} 제출:`, answer);

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    correct: Math.random() > 0.3, // 70% 정답률
                    feedback: '잘 하셨습니다!',
                    nextProblem: problemId + 1
                });
            }, 500);
        });
    }

    /**
     * MySQL 데이터베이스 연동 시뮬레이션
     */
    async syncWithDatabase() {
        console.log('MySQL 데이터베이스 동기화 중...');

        // 실제 환경에서는 PHP 백엔드를 통해 MySQL과 통신
        // 예: 사용자 진행도, 점수, 학습 기록 등 저장

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: '데이터베이스 동기화 완료'
                });
            }, 800);
        });
    }
}

// Infinity Breath 애니메이션 컨트롤러
class InfinityBreathController {
    constructor() {
        this.symbol = document.querySelector('.infinity-symbol');
        this.container = document.querySelector('.infinity-breath-container');
        this.isPaused = false;
    }

    /**
     * 애니메이션 일시 정지/재생
     */
    toggleAnimation() {
        if (this.symbol) {
            if (this.isPaused) {
                this.symbol.style.animationPlayState = 'running';
                this.isPaused = false;
            } else {
                this.symbol.style.animationPlayState = 'paused';
                this.isPaused = true;
            }
        }
    }

    /**
     * 애니메이션 속도 조절
     */
    setAnimationSpeed(speed) {
        if (this.symbol) {
            const duration = 4 / speed; // 기본 4초
            this.symbol.style.animationDuration = `${duration}s, ${duration}s, ${duration * 2}s`;
        }
    }

    /**
     * 로딩 상태 표시
     */
    showLoading() {
        if (this.container) {
            const label = this.container.querySelector('.animation-label');
            if (label) {
                label.textContent = '데이터 로딩 중...';
                this.setAnimationSpeed(2); // 빠른 애니메이션
            }
        }
    }

    /**
     * 정상 상태 표시
     */
    showNormal() {
        if (this.container) {
            const label = this.container.querySelector('.animation-label');
            if (label) {
                label.textContent = '무한한 학습의 여정';
                this.setAnimationSpeed(1); // 정상 속도
            }
        }
    }

    /**
     * 성공 상태 표시
     */
    showSuccess() {
        if (this.container) {
            const label = this.container.querySelector('.animation-label');
            if (label) {
                label.textContent = '완료! 🎉';
                this.symbol.style.animation = 'none';

                // 성공 애니메이션
                setTimeout(() => {
                    this.symbol.style.animation = '';
                    this.symbol.style.transform = 'scale(1.3)';
                    setTimeout(() => {
                        this.symbol.style.transform = '';
                        this.showNormal();
                    }, 1000);
                }, 100);
            }
        }
    }
}

// 앱 초기화
class App {
    constructor() {
        this.state = new AppState();
        this.lms = new LMSConnector(LMS_CONFIG);
        this.infinityBreath = new InfinityBreathController();
        this.init();
    }

    async init() {
        console.log('🚀 앱 초기화 시작');

        // 이벤트 리스너 등록
        this.setupEventListeners();

        // LMS 데이터 로드
        await this.loadModuleData();

        // 시간 업데이트
        this.updateTime();
        setInterval(() => this.updateTime(), 60000); // 1분마다 업데이트

        console.log('✅ 앱 초기화 완료');
    }

    setupEventListeners() {
        // Infinity 심볼 클릭 시 애니메이션 제어
        const infinitySymbol = document.querySelector('.infinity-symbol');
        if (infinitySymbol) {
            infinitySymbol.addEventListener('click', () => {
                this.infinityBreath.toggleAnimation();
            });
        }

        // 네비게이션 버튼
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.handleNavigation(index);
            });
        });

        // 모듈 카드 클릭
        const moduleCard = document.querySelector('.module-card');
        if (moduleCard) {
            moduleCard.addEventListener('click', () => {
                this.loadNextProblem();
            });
        }
    }

    async loadModuleData() {
        this.infinityBreath.showLoading();

        try {
            const data = await this.lms.fetchProblemData(1);

            if (data.success) {
                this.state.currentModule = data.module;
                this.state.updateProgress(data.module.currentProgress);
                console.log('📚 모듈 데이터 로드 완료:', data.module);
            }
        } catch (error) {
            console.error('❌ 모듈 데이터 로드 실패:', error);
        } finally {
            this.infinityBreath.showNormal();
        }
    }

    async loadNextProblem() {
        this.infinityBreath.showLoading();

        try {
            // 다음 문제 로드 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 진행도 업데이트
            if (this.state.problemsCompleted < this.state.totalProblems) {
                this.state.updateProgress(this.state.problemsCompleted + 1);

                // 데이터베이스 동기화
                await this.lms.syncWithDatabase();

                if (this.state.problemsCompleted === this.state.totalProblems) {
                    this.infinityBreath.showSuccess();
                } else {
                    this.infinityBreath.showNormal();
                }
            }
        } catch (error) {
            console.error('❌ 문제 로드 실패:', error);
        }
    }

    handleNavigation(index) {
        const pages = ['홈', '학습', '진행상황', '설정'];
        console.log(`📱 네비게이션: ${pages[index]} 페이지로 이동`);
    }

    updateTime() {
        const timeElement = document.querySelector('.time');
        if (timeElement) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            timeElement.textContent = `${hours}:${minutes}`;
        }
    }
}

// 앱 실행
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// 개발자 모드 - 콘솔에서 제어 가능
window.appControls = {
    // 애니메이션 속도 조절: appControls.setSpeed(2)
    setSpeed: (speed) => window.app?.infinityBreath.setAnimationSpeed(speed),

    // 진행도 업데이트: appControls.setProgress(15)
    setProgress: (completed) => window.app?.state.updateProgress(completed),

    // 애니메이션 토글: appControls.toggle()
    toggle: () => window.app?.infinityBreath.toggleAnimation(),

    // 데이터 동기화: appControls.sync()
    sync: async () => await window.app?.lms.syncWithDatabase(),

    // 성공 표시: appControls.success()
    success: () => window.app?.infinityBreath.showSuccess()
};

console.log('💡 개발자 모드: appControls 객체로 앱 제어 가능');
console.log('예시: appControls.setSpeed(2), appControls.setProgress(15), appControls.success()');
