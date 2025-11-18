/**
 * Alt42 Standalone App - Main Application Logic
 * 독립형 AI 추천 학습 시스템
 */

class Alt42App {
    constructor() {
        this.currentProblem = null;
        this.currentRecommendation = null;
        this.problemStartTime = null;
        this.isInitialized = false;
    }

    /**
     * 앱 초기화
     */
    async init() {
        console.log('🚀 Alt42 Standalone App initializing...');

        try {
            // UI 이벤트 바인딩
            this.bindEvents();

            // 그래프 초기화
            this.initGraphs();

            // 사용자 정보 로드
            this.loadUserInfo();

            // 통계 로드
            this.loadStatistics();

            // 첫 문제 로드
            await this.loadNextProblem();

            // 추천 목록 로드
            this.loadRecommendedList();

            // 시간 업데이트
            this.updateTime();
            setInterval(() => this.updateTime(), 60000);

            // 연속 학습일 업데이트
            storage.updateStreak();

            this.isInitialized = true;
            console.log('✅ Alt42 App initialized successfully');
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showError('앱 초기화 중 오류가 발생했습니다.');
        }
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 답안 제출
        const submitBtn = document.getElementById('submitBtn');
        const answerInput = document.getElementById('answerInput');

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitAnswer());
        }

        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitAnswer();
                }
            });
        }

        // 힌트 보기
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => this.showHint());
        }

        // 다음 문제
        const skipBtn = document.getElementById('skipBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.loadNextProblem());
        }

        // 모달 닫기
        const modalClose = document.getElementById('modalClose');
        const nextProblemBtn = document.getElementById('nextProblemBtn');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        if (nextProblemBtn) {
            nextProblemBtn.addEventListener('click', () => {
                this.closeModal();
                this.loadNextProblem();
            });
        }

        // 모달 배경 클릭 시 닫기
        const modal = document.getElementById('resultModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    /**
     * 그래프 초기화
     */
    initGraphs() {
        graphManager.initMainChart();
        graphManager.initMiniChart();
        console.log('📊 Graphs initialized with Area Color');
    }

    /**
     * 사용자 정보 로드
     */
    loadUserInfo() {
        const user = storage.get('user');

        const userNameEl = document.getElementById('userName');
        const userLevelEl = document.getElementById('userLevel');

        if (userNameEl) {
            userNameEl.textContent = user.name;
        }

        if (userLevelEl) {
            userLevelEl.textContent = `Lv.${user.level}`;
        }
    }

    /**
     * 통계 로드
     */
    loadStatistics() {
        const stats = storage.get('statistics');

        // 전체 통계
        this.updateStat('totalProblems', stats.totalProblems);
        this.updateStat('totalPoints', stats.totalPoints);

        // 정답률
        const accuracy = stats.totalProblems > 0
            ? ((stats.correctAnswers / stats.totalProblems) * 100).toFixed(0)
            : 0;
        this.updateStat('correctRate', accuracy + '%');

        // 연속 학습
        const user = storage.get('user');
        this.updateStat('streak', user.streak);

        // 오늘 통계
        const today = new Date().toISOString().split('T')[0];
        const todayStats = stats.dailyActivity.find(d => d.date === today) || { count: 0, correct: 0 };

        this.updateStat('todayCount', todayStats.count);
        this.updateStat('todayCorrect', todayStats.correct);
    }

    /**
     * 통계 값 업데이트
     */
    updateStat(elementId, value) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = value;
        }
    }

    /**
     * 다음 문제 로드
     */
    async loadNextProblem() {
        try {
            // AI 추천 받기
            this.currentRecommendation = recommendationEngine.recommendProblem();

            if (!this.currentRecommendation || !this.currentRecommendation.problem) {
                this.showError('문제를 불러올 수 없습니다.');
                return;
            }

            this.currentProblem = this.currentRecommendation.problem;
            this.problemStartTime = Date.now();

            // UI 업데이트
            this.displayProblem();

            // 추천 이유 표시
            this.displayRecommendationReason();

            // 모바일 화면 업데이트
            this.updateMobileScreen();

            console.log('📝 New problem loaded:', this.currentProblem.id);
        } catch (error) {
            console.error('Error loading problem:', error);
            this.showError('문제를 불러오는데 실패했습니다.');
        }
    }

    /**
     * 문제 표시
     */
    displayProblem() {
        const problem = this.currentProblem;

        // 난이도
        const difficultyEl = document.getElementById('problemDifficulty');
        if (difficultyEl) {
            const diffText = {
                'easy': '초급',
                'medium': '중급',
                'hard': '고급'
            }[problem.difficulty];

            difficultyEl.textContent = diffText;
            difficultyEl.className = 'difficulty ' + problem.difficulty;
        }

        // 카테고리
        const categoryEl = document.getElementById('problemCategory');
        if (categoryEl) {
            categoryEl.textContent = problem.category;
        }

        // 점수
        const pointsEl = document.getElementById('problemPoints');
        if (pointsEl) {
            pointsEl.textContent = `+${problem.points} 점`;
        }

        // 문제 텍스트
        const problemTextEl = document.getElementById('problemText');
        if (problemTextEl) {
            problemTextEl.textContent = problem.question;
        }

        // 입력 필드 초기화
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.value = '';
            answerInput.focus();
        }

        // 힌트 숨기기
        const hintEl = document.getElementById('problemHint');
        if (hintEl) {
            hintEl.style.display = 'none';
        }

        // 추천 타입
        const recTypeEl = document.getElementById('recommendationType');
        if (recTypeEl && this.currentRecommendation) {
            recTypeEl.textContent = this.currentRecommendation.type || 'AI 추천';
        }
    }

    /**
     * 추천 이유 표시
     */
    displayRecommendationReason() {
        const reasonEl = document.getElementById('reasonContent');

        if (reasonEl && this.currentRecommendation) {
            reasonEl.innerHTML = this.currentRecommendation.reason;
        }
    }

    /**
     * 모바일 화면 업데이트
     */
    updateMobileScreen() {
        const mobileProblemEl = document.getElementById('mobileProblem');

        if (mobileProblemEl && this.currentProblem) {
            const diffText = {
                'easy': '초급',
                'medium': '중급',
                'hard': '고급'
            }[this.currentProblem.difficulty];

            mobileProblemEl.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <span style="background: #667eea; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px;">
                        ${this.currentProblem.category}
                    </span>
                    <span style="background: #f0f0f0; padding: 4px 10px; border-radius: 12px; font-size: 11px; margin-left: 5px;">
                        ${diffText}
                    </span>
                </div>
                <p style="font-size: 14px; font-weight: 600; color: #333; line-height: 1.6;">
                    ${this.currentProblem.question}
                </p>
            `;
        }
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        const answerInput = document.getElementById('answerInput');
        const userAnswer = answerInput ? answerInput.value.trim() : '';

        if (!userAnswer) {
            alert('답을 입력해주세요.');
            return;
        }

        // 문제 풀이 시간 계산
        const timeSpent = Math.floor((Date.now() - this.problemStartTime) / 1000);

        // 답안 체크
        const result = problemDB.checkAnswer(this.currentProblem.id, userAnswer);

        // 학습 기록 저장
        storage.recordProblemAttempt(
            this.currentProblem.id,
            result.isCorrect,
            this.currentProblem.difficulty,
            this.currentProblem.category,
            timeSpent
        );

        // 결과 모달 표시
        this.showResultModal(result);

        // 통계 업데이트
        this.loadStatistics();

        // 그래프 업데이트
        graphManager.updateCharts();

        // 약점/강점 분석
        storage.analyzeWeakCategories();
        storage.analyzeStrongCategories();
    }

    /**
     * 힌트 표시
     */
    showHint() {
        if (!this.currentProblem || !this.currentProblem.hint) {
            return;
        }

        const hintEl = document.getElementById('problemHint');
        const hintTextEl = document.getElementById('hintText');

        if (hintEl && hintTextEl) {
            hintTextEl.textContent = this.currentProblem.hint;
            hintEl.style.display = 'block';
        }
    }

    /**
     * 결과 모달 표시
     */
    showResultModal(result) {
        const modal = document.getElementById('resultModal');
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        const resultExplanation = document.getElementById('resultExplanation');

        if (!modal) return;

        if (result.isCorrect) {
            resultIcon.textContent = '✅';
            resultTitle.textContent = '정답입니다!';
            resultMessage.textContent = `축하합니다! +${result.points}점을 획득했습니다.`;
        } else {
            resultIcon.textContent = '❌';
            resultTitle.textContent = '오답입니다';
            resultMessage.textContent = `정답은 "${result.correctAnswer}" 입니다.`;
        }

        if (resultExplanation) {
            resultExplanation.innerHTML = `
                <strong>📖 해설:</strong><br>
                ${result.explanation}
            `;
        }

        modal.classList.add('active');
    }

    /**
     * 모달 닫기
     */
    closeModal() {
        const modal = document.getElementById('resultModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * 추천 문제 목록 로드
     */
    loadRecommendedList() {
        const listEl = document.getElementById('recommendedList');
        if (!listEl) return;

        const recommendations = recommendationEngine.recommendMultipleProblems(5);

        listEl.innerHTML = '';

        recommendations.forEach((rec, index) => {
            if (!rec.problem) return;

            const item = document.createElement('div');
            item.className = 'problem-list-item';

            const diffText = {
                'easy': '초급',
                'medium': '중급',
                'hard': '고급'
            }[rec.problem.difficulty];

            item.innerHTML = `
                <div class="item-title">${index + 1}. ${rec.problem.category}</div>
                <div class="item-meta">${diffText} · ${rec.type}</div>
            `;

            item.addEventListener('click', () => {
                this.currentProblem = rec.problem;
                this.currentRecommendation = rec;
                this.problemStartTime = Date.now();
                this.displayProblem();
                this.displayRecommendationReason();
                this.updateMobileScreen();
            });

            listEl.appendChild(item);
        });
    }

    /**
     * 시간 업데이트
     */
    updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        const phoneTimeEl = document.getElementById('phoneTime');
        if (phoneTimeEl) {
            phoneTimeEl.textContent = timeStr;
        }
    }

    /**
     * 에러 표시
     */
    showError(message) {
        alert(message);
        console.error(message);
    }

    /**
     * 데이터 내보내기
     */
    exportData() {
        const data = storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `alt42_backup_${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    /**
     * 데이터 가져오기
     */
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const success = storage.importData(event.target.result);

                if (success) {
                    alert('데이터를 성공적으로 가져왔습니다.');
                    location.reload();
                } else {
                    alert('데이터 가져오기에 실패했습니다.');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    /**
     * 앱 리셋
     */
    resetApp() {
        if (confirm('모든 데이터를 삭제하고 처음부터 시작하시겠습니까?')) {
            storage.clear();
            location.reload();
        }
    }
}

// 앱 인스턴스 생성 및 초기화
const app = new Alt42App();

// DOM이 로드되면 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    graphManager.destroy();
});

// 전역 함수 노출 (디버깅/테스트용)
window.alt42 = {
    app,
    storage,
    problemDB,
    recommendationEngine,
    analytics,
    graphManager,
    exportData: () => app.exportData(),
    importData: () => app.importData(),
    resetApp: () => app.resetApp()
};

console.log('🎓 Alt42 Standalone App loaded. Use window.alt42 for debugging.');
