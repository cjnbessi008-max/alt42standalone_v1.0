/**
 * Inclusion Gate 메인 애플리케이션
 * Moodle LMS 연동 및 게임 로직 관리
 */

class InclusionGateApp {
    constructor() {
        this.currentQuestion = null;
        this.currentQuestionIndex = 0;
        this.totalQuestions = 0;
        this.score = 0;
        this.answered = false;
        this.apiBaseUrl = 'api/'; // PHP API 기본 경로

        // DOM 요소
        this.elements = {
            questionText: document.getElementById('questionText'),
            score: document.getElementById('score'),
            feedback: document.getElementById('feedback'),
            nextButton: document.getElementById('nextButton'),
            includeButton: document.getElementById('includeButton'),
            excludeButton: document.getElementById('excludeButton'),
            currentQuestion: document.getElementById('currentQuestion'),
            totalQuestions: document.getElementById('totalQuestions'),
            progressFill: document.getElementById('progressFill'),
            connectionStatus: document.getElementById('connectionStatus'),
            statusIndicator: document.getElementById('statusIndicator')
        };

        this.init();
    }

    /**
     * 애플리케이션 초기화
     */
    async init() {
        console.log('Inclusion Gate App 초기화 중...');

        // Moodle 연결 상태 확인
        await this.checkConnection();

        // 첫 번째 문제 로드
        await this.loadQuestion();
    }

    /**
     * Moodle 연결 상태 확인
     */
    async checkConnection() {
        try {
            const response = await fetch(this.apiBaseUrl + 'check-connection.php');
            const data = await response.json();

            if (data.success) {
                this.updateConnectionStatus(true, 'Moodle 연결됨');
                console.log('Moodle 연결 성공');
            } else {
                this.updateConnectionStatus(false, 'Moodle 연결 실패');
                console.error('Moodle 연결 실패:', data.message);
            }
        } catch (error) {
            console.error('연결 확인 중 오류:', error);
            this.updateConnectionStatus(false, '연결 오류');

            // 개발 모드: 샘플 데이터 사용
            console.log('개발 모드: 샘플 데이터 사용');
            this.useSampleData();
        }
    }

    /**
     * 연결 상태 UI 업데이트
     */
    updateConnectionStatus(connected, message) {
        this.elements.connectionStatus.textContent = message;
        if (connected) {
            this.elements.statusIndicator.classList.add('connected');
            this.elements.statusIndicator.classList.remove('disconnected');
        } else {
            this.elements.statusIndicator.classList.add('disconnected');
            this.elements.statusIndicator.classList.remove('connected');
        }
    }

    /**
     * 문제 로드
     */
    async loadQuestion() {
        try {
            // API에서 문제 가져오기
            const response = await fetch(this.apiBaseUrl + 'get-question.php');
            const data = await response.json();

            if (data.success) {
                this.setQuestion(data.question);
            } else {
                throw new Error(data.message || '문제 로드 실패');
            }
        } catch (error) {
            console.error('문제 로드 중 오류:', error);

            // 샘플 데이터로 폴백
            this.loadSampleQuestion();
        }
    }

    /**
     * 샘플 문제 로드 (개발/테스트용)
     */
    loadSampleQuestion() {
        const sampleQuestions = [
            {
                id: 1,
                text: '3은 {1, 2, 3, 4, 5} 집합에 포함됩니까?',
                correctAnswer: true,
                explanation: '3은 주어진 집합의 원소입니다.'
            },
            {
                id: 2,
                text: '6은 {1, 2, 3, 4, 5} 집합에 포함됩니까?',
                correctAnswer: false,
                explanation: '6은 주어진 집합에 없는 원소입니다.'
            },
            {
                id: 3,
                text: '짝수 4는 홀수 집합에 포함됩니까?',
                correctAnswer: false,
                explanation: '4는 짝수이므로 홀수 집합에 포함되지 않습니다.'
            },
            {
                id: 4,
                text: '사과는 과일 집합에 포함됩니까?',
                correctAnswer: true,
                explanation: '사과는 과일의 한 종류입니다.'
            },
            {
                id: 5,
                text: '토마토는 채소 집합에 포함됩니까?',
                correctAnswer: false,
                explanation: '토마토는 과학적으로 과일로 분류됩니다.'
            }
        ];

        const index = this.currentQuestionIndex % sampleQuestions.length;
        this.totalQuestions = sampleQuestions.length;
        this.setQuestion(sampleQuestions[index]);
    }

    /**
     * 문제 설정 및 UI 업데이트
     */
    setQuestion(question) {
        this.currentQuestion = question;
        this.answered = false;

        // UI 업데이트
        this.elements.questionText.textContent = question.text;
        this.currentQuestionIndex++;
        this.elements.currentQuestion.textContent = this.currentQuestionIndex;
        this.elements.totalQuestions.textContent = this.totalQuestions || '?';

        // 진행 상황 업데이트
        if (this.totalQuestions > 0) {
            const progress = (this.currentQuestionIndex / this.totalQuestions) * 100;
            this.elements.progressFill.style.width = progress + '%';
        }

        // 버튼 활성화
        this.enableButtons();

        // 피드백 초기화
        this.elements.feedback.textContent = '';
        this.elements.feedback.className = 'feedback';
        this.elements.nextButton.style.display = 'none';

        // 게이트 리셋
        if (gateAnimation) {
            gateAnimation.reset();
        }

        console.log('문제 로드됨:', question.text);
    }

    /**
     * 답안 선택 처리
     */
    async selectAnswer(isInclude) {
        if (this.answered) return;

        this.answered = true;
        this.disableButtons();

        const isCorrect = (isInclude === this.currentQuestion.correctAnswer);

        if (isCorrect) {
            await this.handleCorrectAnswer(isInclude);
        } else {
            await this.handleWrongAnswer(isInclude);
        }

        // 다음 문제 버튼 표시
        this.elements.nextButton.style.display = 'block';
    }

    /**
     * 정답 처리
     */
    async handleCorrectAnswer(isInclude) {
        console.log('정답!');

        // 점수 증가
        this.score += 10;
        this.elements.score.textContent = this.score;

        // 게이트 열기 애니메이션
        if (gateAnimation) {
            await gateAnimation.openCorrectGate(isInclude);
        }

        // 피드백 표시
        this.showFeedback(true, '정답입니다! ' + (this.currentQuestion.explanation || ''));

        // 서버에 결과 전송
        this.submitAnswer(true);
    }

    /**
     * 오답 처리
     */
    async handleWrongAnswer(isInclude) {
        console.log('오답...');

        // 게이트 흔들기 애니메이션
        if (gateAnimation) {
            gateAnimation.shakeWrongGate(isInclude);
        }

        // 피드백 표시
        this.showFeedback(false, '틀렸습니다. ' + (this.currentQuestion.explanation || ''));

        // 서버에 결과 전송
        this.submitAnswer(false);
    }

    /**
     * 피드백 표시
     */
    showFeedback(isCorrect, message) {
        this.elements.feedback.textContent = message;
        this.elements.feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
    }

    /**
     * 답안 제출 (서버에)
     */
    async submitAnswer(isCorrect) {
        try {
            const response = await fetch(this.apiBaseUrl + 'submit-answer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questionId: this.currentQuestion.id,
                    isCorrect: isCorrect,
                    score: this.score
                })
            });

            const data = await response.json();
            console.log('답안 제출 결과:', data);
        } catch (error) {
            console.error('답안 제출 중 오류:', error);
        }
    }

    /**
     * 다음 문제 로드
     */
    async loadNextQuestion() {
        await this.loadQuestion();
    }

    /**
     * 버튼 활성화
     */
    enableButtons() {
        this.elements.includeButton.disabled = false;
        this.elements.excludeButton.disabled = false;
    }

    /**
     * 버튼 비활성화
     */
    disableButtons() {
        this.elements.includeButton.disabled = true;
        this.elements.excludeButton.disabled = true;
    }

    /**
     * 샘플 데이터 사용 (개발 모드)
     */
    useSampleData() {
        console.log('샘플 데이터 모드 활성화');
        this.updateConnectionStatus(false, '개발 모드 (샘플 데이터)');
        this.loadSampleQuestion();
    }

    /**
     * 게임 리셋
     */
    reset() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.elements.score.textContent = '0';
        this.elements.progressFill.style.width = '0%';
        this.loadQuestion();
    }
}

// 전역 함수 (HTML에서 호출)
let app;

function selectAnswer(isInclude) {
    if (app) {
        app.selectAnswer(isInclude);
    }
}

function loadNextQuestion() {
    if (app) {
        app.loadNextQuestion();
    }
}

// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    app = new InclusionGateApp();
    console.log('Inclusion Gate App 시작됨');
});
