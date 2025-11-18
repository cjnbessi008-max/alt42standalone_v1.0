/**
 * Next Term Vision - Main Application
 * 메인 애플리케이션 로직
 */

class NextTermApp {
    constructor() {
        // API 엔드포인트 (실제 사용 시 수정 필요)
        this.API_BASE = './backend/php/api';

        // 현재 상태
        this.currentStudent = null;
        this.currentProblem = null;
        this.startTime = null;
        this.hintShown = false;

        // DOM 요소
        this.elements = {
            studentId: document.getElementById('studentId'),
            newProblemBtn: document.getElementById('newProblemBtn'),
            difficultySelect: document.getElementById('difficultySelect'),
            hintBtn: document.getElementById('hintBtn'),
            answerInput: document.getElementById('answerInput'),
            submitBtn: document.getElementById('submitBtn'),
            feedbackArea: document.getElementById('feedbackArea'),

            // 통계 요소
            currentLevel: document.getElementById('currentLevel'),
            accuracy: document.getElementById('accuracy'),
            totalProblems: document.getElementById('totalProblems'),
            correctAnswers: document.getElementById('correctAnswers')
        };

        this.init();
    }

    /**
     * 초기화
     */
    init() {
        this.setupEventListeners();
        this.loadInitialProblem();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 새 문제 버튼
        this.elements.newProblemBtn.addEventListener('click', () => {
            this.loadProblem();
        });

        // 힌트 버튼
        this.elements.hintBtn.addEventListener('click', () => {
            this.toggleHint();
        });

        // 답안 제출 버튼
        this.elements.submitBtn.addEventListener('click', () => {
            this.submitAnswer();
        });

        // Enter 키로 제출
        this.elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        // 학생 ID 변경
        this.elements.studentId.addEventListener('change', () => {
            this.loadProblem();
        });
    }

    /**
     * 초기 문제 로드
     */
    loadInitialProblem() {
        setTimeout(() => {
            this.loadProblem();
        }, 500);
    }

    /**
     * 문제 로드
     */
    async loadProblem() {
        try {
            // 로딩 표시
            animation.showLoading(true);
            this.elements.feedbackArea.style.display = 'none';
            this.elements.answerInput.value = '';
            this.hintShown = false;
            animation.hideHint();

            const studentId = this.elements.studentId.value;
            const difficulty = this.elements.difficultySelect.value;

            // API 호출
            let url = `${this.API_BASE}/get_problem.php?student_id=${studentId}`;
            if (difficulty) {
                url += `&difficulty=${difficulty}`;
            }

            const response = await fetch(url);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to load problem');
            }

            // 문제 데이터 저장
            this.currentProblem = result.data.problem;
            this.currentStudent = studentId;
            this.startTime = Date.now();

            // UI 업데이트
            this.updateProblemDisplay();
            this.updateProgressDisplay(result.data.progress);

            // 로딩 종료
            animation.showLoading(false);

            // 알림
            smartphone.showNotification('새 문제가 준비되었습니다!');

        } catch (error) {
            console.error('Error loading problem:', error);
            this.showError('문제를 불러오는데 실패했습니다. API 설정을 확인해주세요.');

            // 데모 모드 - API가 없을 때 샘플 데이터 사용
            this.loadDemoProblem();
        }
    }

    /**
     * 문제 표시 업데이트
     */
    updateProblemDisplay() {
        if (!this.currentProblem) return;

        const { problem_type, sequence_data, animation_type, hint_text } = this.currentProblem;

        // 문제 유형 업데이트
        animation.updateProblemType(problem_type);

        // 수열 표시
        animation.displaySequence(sequence_data, animation_type);

        // 힌트 데이터 저장
        this.elements.hintBtn.dataset.hint = hint_text;
    }

    /**
     * 진행 상황 표시 업데이트
     */
    updateProgressDisplay(progress) {
        if (!progress) return;

        this.elements.currentLevel.textContent = progress.current_level || 1;
        this.elements.totalProblems.textContent = progress.total_problems || 0;
        this.elements.correctAnswers.textContent = progress.correct_answers || 0;
        this.elements.accuracy.textContent = (progress.accuracy || 0) + '%';
    }

    /**
     * 힌트 토글
     */
    toggleHint() {
        if (!this.currentProblem) return;

        if (this.hintShown) {
            animation.hideHint();
            this.elements.hintBtn.textContent = '💡 힌트 보기';
            this.hintShown = false;
        } else {
            const hint = this.elements.hintBtn.dataset.hint;
            animation.showHint(hint);
            this.elements.hintBtn.textContent = '💡 힌트 숨기기';
            this.hintShown = true;
        }
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        if (!this.currentProblem) {
            this.showError('먼저 문제를 불러와주세요.');
            return;
        }

        const answer = parseInt(this.elements.answerInput.value);

        if (isNaN(answer)) {
            this.showError('숫자를 입력해주세요.');
            smartphone.vibrate();
            return;
        }

        // 소요 시간 계산
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        // 버튼 비활성화
        this.elements.submitBtn.disabled = true;
        this.elements.submitBtn.textContent = '제출 중...';

        try {
            // API 호출
            const response = await fetch(`${this.API_BASE}/submit_answer.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: parseInt(this.currentStudent),
                    problem_id: this.currentProblem.id,
                    answer: answer,
                    time_spent: timeSpent
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to submit answer');
            }

            // 결과 표시
            this.displayFeedback(result.data.feedback);
            this.updateProgressDisplay(result.data.stats);

            // 애니메이션 표시
            animation.revealAnswer(
                result.data.feedback.correct_answer,
                result.data.feedback.is_correct
            );

            // 진동 효과
            if (result.data.feedback.is_correct) {
                smartphone.vibrate();
            }

        } catch (error) {
            console.error('Error submitting answer:', error);

            // 데모 모드 - API가 없을 때 로컬 검증
            this.validateAnswerLocally(answer);
        } finally {
            // 버튼 재활성화
            setTimeout(() => {
                this.elements.submitBtn.disabled = false;
                this.elements.submitBtn.textContent = '제출';
            }, 1000);
        }
    }

    /**
     * 피드백 표시
     */
    displayFeedback(feedback) {
        const area = this.elements.feedbackArea;
        area.innerHTML = '';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'feedback-message';
        messageDiv.textContent = feedback.message;

        const detailDiv = document.createElement('div');
        detailDiv.className = 'feedback-detail';
        detailDiv.innerHTML = `
            <p>제출한 답: ${feedback.student_answer}</p>
            <p>정답: ${feedback.correct_answer}</p>
            <p>시도 횟수: ${feedback.attempt_number}회</p>
        `;

        area.appendChild(messageDiv);
        area.appendChild(detailDiv);

        area.className = 'feedback-area ' + (feedback.is_correct ? 'correct' : 'incorrect');
        area.style.display = 'block';

        // 스크롤
        smartphone.scrollToElement(area);
    }

    /**
     * 오류 메시지 표시
     */
    showError(message) {
        const area = this.elements.feedbackArea;
        area.innerHTML = `<div class="feedback-message">${message}</div>`;
        area.className = 'feedback-area incorrect';
        area.style.display = 'block';
    }

    /**
     * 데모 모드 - 샘플 문제 로드
     */
    loadDemoProblem() {
        console.log('Loading demo problem (API not available)');

        const demoProblems = [
            {
                id: 1,
                problem_type: 'arithmetic',
                sequence_data: [2, 4, 6, 8, 10],
                difficulty_level: 1,
                hint_text: '각 항이 2씩 증가합니다.',
                animation_type: 'slide',
                correct_answer: 12
            },
            {
                id: 2,
                problem_type: 'geometric',
                sequence_data: [2, 4, 8, 16],
                difficulty_level: 3,
                hint_text: '각 항이 2배씩 증가합니다.',
                animation_type: 'grow',
                correct_answer: 32
            },
            {
                id: 3,
                problem_type: 'fibonacci',
                sequence_data: [1, 1, 2, 3, 5],
                difficulty_level: 4,
                hint_text: '앞의 두 수를 더한 값입니다.',
                animation_type: 'bounce',
                correct_answer: 8
            }
        ];

        // 랜덤 문제 선택
        this.currentProblem = demoProblems[Math.floor(Math.random() * demoProblems.length)];
        this.currentStudent = this.elements.studentId.value;
        this.startTime = Date.now();

        // UI 업데이트
        this.updateProblemDisplay();
        animation.showLoading(false);

        smartphone.showNotification('데모 모드: 샘플 문제입니다');
    }

    /**
     * 로컬 답안 검증 (데모 모드)
     */
    validateAnswerLocally(answer) {
        const isCorrect = (answer === this.currentProblem.correct_answer);

        const feedback = {
            is_correct: isCorrect,
            correct_answer: this.currentProblem.correct_answer,
            student_answer: answer,
            attempt_number: 1,
            message: isCorrect ? '정답입니다! 🎉' : '아쉽게도 틀렸습니다. 다시 한번 생각해보세요!'
        };

        this.displayFeedback(feedback);
        animation.revealAnswer(this.currentProblem.correct_answer, isCorrect);

        if (isCorrect) {
            smartphone.vibrate();
        }
    }
}

// 앱 초기화
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new NextTermApp();
    console.log('Next Term Vision App initialized');
});
