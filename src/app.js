/**
 * Area Paint 메인 애플리케이션
 * 전체 앱의 초기화 및 이벤트 핸들링
 */

class AreaPaintApp {
    constructor() {
        // 컴포넌트 초기화
        this.areaPaint = null;
        this.moodleAPI = null;

        // 상태 관리
        this.currentProblem = null;
        this.problems = [];
        this.currentProblemIndex = 0;
        this.userId = 1; // 테스트용 사용자 ID
        this.startTime = null;
        this.score = 0;
        this.totalAttempts = 0;
        this.correctAttempts = 0;

        // DOM 요소
        this.elements = {};
    }

    /**
     * 앱 초기화
     */
    async init() {
        console.log('Area Paint 앱 초기화 중...');

        // DOM 요소 참조
        this.initDOMElements();

        // Moodle API 초기화
        this.moodleAPI = new MoodleAPI({
            baseUrl: 'http://localhost/moodle',
            token: '',
            localMode: true // 로컬 모드 활성화 (Moodle 서버 없이 테스트)
        });

        // 연결 테스트
        await this.moodleAPI.testConnection();

        // Area Paint 컴포넌트 초기화
        this.areaPaint = new AreaPaint('graph-canvas');

        // 이벤트 리스너 등록
        this.setupEventListeners();

        // 문제 불러오기
        await this.loadProblems();

        // 첫 번째 문제 표시
        this.loadProblem(0);

        // 진행률 불러오기
        await this.loadUserProgress();

        console.log('Area Paint 앱 초기화 완료!');
    }

    /**
     * DOM 요소 초기화
     */
    initDOMElements() {
        this.elements = {
            problemText: document.getElementById('problem-text'),
            problemMeta: document.getElementById('problem-meta'),
            startBtn: document.getElementById('start-animation'),
            resetBtn: document.getElementById('reset-animation'),
            nextBtn: document.getElementById('next-problem'),
            answerInput: document.getElementById('answer-input'),
            submitBtn: document.getElementById('submit-answer'),
            feedback: document.getElementById('feedback')
        };
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 애니메이션 시작 버튼
        this.elements.startBtn.addEventListener('click', () => {
            this.startAnimation();
        });

        // 리셋 버튼
        this.elements.resetBtn.addEventListener('click', () => {
            this.resetAnimation();
        });

        // 다음 문제 버튼
        this.elements.nextBtn.addEventListener('click', () => {
            this.nextProblem();
        });

        // 답안 제출 버튼
        this.elements.submitBtn.addEventListener('click', () => {
            this.submitAnswer();
        });

        // 답안 입력 시 엔터키 처리
        this.elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });
    }

    /**
     * 문제 목록 불러오기
     */
    async loadProblems() {
        try {
            this.problems = await this.moodleAPI.getProblems();
            console.log(`${this.problems.length}개의 문제를 불러왔습니다.`);
        } catch (error) {
            console.error('문제 불러오기 실패:', error);
            this.problems = GraphUtils.getSampleGraphs();
        }
    }

    /**
     * 특정 문제 불러오기
     * @param {number} index - 문제 인덱스
     */
    loadProblem(index) {
        if (index < 0 || index >= this.problems.length) {
            console.warn('유효하지 않은 문제 인덱스:', index);
            return;
        }

        this.currentProblemIndex = index;
        this.currentProblem = this.problems[index];
        this.startTime = Date.now();

        // UI 업데이트
        this.updateProblemUI();

        // 그래프 데이터 생성 및 표시
        const graphData = GraphUtils.createGraphDataFromProblem(this.currentProblem);
        this.areaPaint.setGraphData(graphData);

        // 입력 필드 초기화
        this.elements.answerInput.value = '';
        this.elements.feedback.style.display = 'none';
        this.elements.feedback.className = 'feedback';

        // 버튼 상태 초기화
        this.elements.startBtn.disabled = false;
        this.elements.resetBtn.disabled = false;

        console.log('문제 로드:', this.currentProblem.name);
    }

    /**
     * 문제 UI 업데이트
     */
    updateProblemUI() {
        // 문제 텍스트
        this.elements.problemText.textContent = this.currentProblem.description ||
            `함수 y = ${this.currentProblem.function}의 그래프와 x축으로 둘러싸인 영역의 넓이를 구하세요.`;

        // 문제 메타 정보
        this.elements.problemMeta.innerHTML = `
            <div class="meta-item">문제 ${this.currentProblemIndex + 1} / ${this.problems.length}</div>
            <div class="meta-item">난이도: ${this.currentProblem.difficulty}</div>
            <div class="meta-item">배점: ${this.currentProblem.points || 10}점</div>
            <div class="meta-item">함수: y = ${this.currentProblem.function}</div>
            <div class="meta-item">범위: x ∈ [${this.currentProblem.xMin}, ${this.currentProblem.xMax}]</div>
        `;

        // 애니메이션 효과
        this.elements.problemText.classList.add('fade-in');
        setTimeout(() => {
            this.elements.problemText.classList.remove('fade-in');
        }, 500);
    }

    /**
     * 애니메이션 시작
     */
    startAnimation() {
        this.areaPaint.start();
        this.elements.startBtn.disabled = true;

        // 애니메이션 완료 시 자동으로 답안 입력 포커스
        setTimeout(() => {
            this.elements.answerInput.focus();
            this.elements.startBtn.disabled = false;
        }, 3000);
    }

    /**
     * 애니메이션 리셋
     */
    resetAnimation() {
        this.areaPaint.reset();
        this.elements.answerInput.value = '';
        this.elements.feedback.style.display = 'none';
        this.elements.startBtn.disabled = false;
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        const userAnswer = parseFloat(this.elements.answerInput.value);

        if (isNaN(userAnswer) || userAnswer < 0) {
            this.showFeedback('올바른 숫자를 입력해주세요.', false);
            return;
        }

        // 정답 확인
        const calculatedArea = this.areaPaint.getCalculatedArea();
        const result = GraphUtils.checkAnswer(userAnswer, calculatedArea, 5);

        this.totalAttempts++;

        if (result.isCorrect) {
            this.correctAttempts++;
            this.score += this.currentProblem.points || 10;

            this.showFeedback(
                `정답입니다! 🎉<br>
                계산된 넓이: ${calculatedArea.toFixed(2)}<br>
                정확도: ${result.accuracy}%<br>
                획득 점수: ${this.currentProblem.points || 10}점`,
                true
            );

            // 다음 문제 버튼 활성화
            this.elements.nextBtn.disabled = false;
        } else {
            this.showFeedback(
                `아쉽네요. 다시 시도해보세요!<br>
                차이: ${result.difference}<br>
                힌트: 그래프의 넓이를 다시 계산해보세요.`,
                false
            );
        }

        // 소요 시간 계산
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        // Moodle에 답안 제출
        await this.moodleAPI.submitAnswer(
            this.currentProblem.id,
            this.userId,
            userAnswer,
            timeSpent
        );

        // 진행률 저장
        await this.saveUserProgress();
    }

    /**
     * 피드백 표시
     * @param {string} message - 피드백 메시지
     * @param {boolean} isCorrect - 정답 여부
     */
    showFeedback(message, isCorrect) {
        this.elements.feedback.innerHTML = message;
        this.elements.feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        this.elements.feedback.style.display = 'block';
    }

    /**
     * 다음 문제로 이동
     */
    nextProblem() {
        const nextIndex = (this.currentProblemIndex + 1) % this.problems.length;

        if (nextIndex === 0) {
            // 마지막 문제였다면 결과 요약 표시
            this.showSummary();
        } else {
            this.loadProblem(nextIndex);
            this.elements.nextBtn.disabled = true;
        }
    }

    /**
     * 학습 결과 요약 표시
     */
    showSummary() {
        const accuracy = this.totalAttempts > 0
            ? ((this.correctAttempts / this.totalAttempts) * 100).toFixed(1)
            : 0;

        const message = `
            <h2>학습 완료! 🎓</h2>
            <p>총 문제 수: ${this.problems.length}</p>
            <p>정답 수: ${this.correctAttempts} / ${this.totalAttempts}</p>
            <p>정답률: ${accuracy}%</p>
            <p>총 점수: ${this.score}점</p>
            <button onclick="app.restart()" class="btn btn-primary">다시 시작</button>
        `;

        this.elements.problemText.innerHTML = message;
        this.elements.problemMeta.innerHTML = '';
    }

    /**
     * 앱 재시작
     */
    restart() {
        this.currentProblemIndex = 0;
        this.score = 0;
        this.totalAttempts = 0;
        this.correctAttempts = 0;
        this.loadProblem(0);
    }

    /**
     * 사용자 진행률 저장
     */
    async saveUserProgress() {
        const progressData = {
            currentProblemIndex: this.currentProblemIndex,
            score: this.score,
            totalAttempts: this.totalAttempts,
            correctAttempts: this.correctAttempts,
            lastUpdated: new Date().toISOString()
        };

        await this.moodleAPI.saveProgress(this.userId, progressData);
    }

    /**
     * 사용자 진행률 불러오기
     */
    async loadUserProgress() {
        const progress = await this.moodleAPI.loadProgress(this.userId);

        if (progress) {
            this.currentProblemIndex = progress.currentProblemIndex || 0;
            this.score = progress.score || 0;
            this.totalAttempts = progress.totalAttempts || 0;
            this.correctAttempts = progress.correctAttempts || 0;

            console.log('진행률 불러오기 완료:', progress);
        }
    }
}

// 앱 인스턴스 생성 및 초기화
let app;

document.addEventListener('DOMContentLoaded', async () => {
    app = new AreaPaintApp();
    await app.init();
});

// 전역으로 노출 (디버깅 및 콘솔 접근용)
window.app = app;
