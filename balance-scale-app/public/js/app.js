/**
 * Balance Scale App - Main Application
 * 메인 애플리케이션 로직
 */

class BalanceScaleApp {
    constructor() {
        this.scale = new BalanceScale();
        this.apiBase = '../api';
        this.currentProblem = null;
        this.studentId = this.getStudentId();
        this.progressId = null;
        this.startTime = null;

        this.init();
    }

    /**
     * 초기화
     */
    async init() {
        // URL 파라미터에서 문제 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const problemId = urlParams.get('problem_id');
        const moodleQuestionId = urlParams.get('moodle_question_id');

        if (problemId || moodleQuestionId) {
            await this.loadProblem(problemId, moodleQuestionId);
        } else {
            // 기본 문제 로드
            await this.loadDefaultProblem();
        }
    }

    /**
     * 학생 ID 가져오기 (세션 또는 URL에서)
     */
    getStudentId() {
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('student_id');

        if (studentId) {
            sessionStorage.setItem('student_id', studentId);
            return parseInt(studentId);
        }

        return parseInt(sessionStorage.getItem('student_id') || '1');
    }

    /**
     * 문제 로드
     */
    async loadProblem(problemId, moodleQuestionId) {
        try {
            let url = `${this.apiBase}/problems.php?`;
            if (problemId) {
                url += `id=${problemId}`;
            } else if (moodleQuestionId) {
                url += `moodle_question_id=${moodleQuestionId}`;
            }

            const response = await fetch(url);
            const result = await response.json();

            if (result.success && result.data) {
                this.currentProblem = result.data;
                this.setupProblem(result.data);
                await this.startProgress();
            } else {
                this.showFeedback('문제를 불러오는데 실패했습니다.', 'error');
                await this.loadDefaultProblem();
            }
        } catch (error) {
            console.error('Error loading problem:', error);
            this.showFeedback('문제를 불러오는데 실패했습니다.', 'error');
            await this.loadDefaultProblem();
        }
    }

    /**
     * 기본 문제 로드
     */
    async loadDefaultProblem() {
        const defaultProblem = {
            id: 0,
            title: '연습 문제',
            equation: '2x + 3 = 11',
            difficulty: 'medium'
        };

        this.currentProblem = defaultProblem;
        this.setupProblem(defaultProblem);
    }

    /**
     * 문제 설정
     */
    setupProblem(problem) {
        // UI 업데이트
        document.getElementById('problem-title').textContent = problem.title;
        document.getElementById('equation-text').textContent = problem.equation;

        // 방정식 파싱
        try {
            this.scale.parseEquation(problem.equation);
            this.updateDisplay();
            this.startTime = Date.now();
        } catch (error) {
            console.error('Error parsing equation:', error);
            this.showFeedback('방정식 형식이 올바르지 않습니다.', 'error');
        }
    }

    /**
     * 진행 상황 시작
     */
    async startProgress() {
        if (!this.currentProblem || this.currentProblem.id === 0) return;

        try {
            const response = await fetch(`${this.apiBase}/progress.php`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    student_id: this.studentId,
                    problem_id: this.currentProblem.id
                })
            });

            const result = await response.json();
            if (result.success) {
                this.progressId = result.data.id;
            }
        } catch (error) {
            console.error('Error starting progress:', error);
        }
    }

    /**
     * 화면 업데이트
     */
    updateDisplay() {
        const leftValue = this.scale.leftSide.coefficient !== 0 || this.scale.leftSide.constant !== 0 ?
                          this.scale.expressionToString(this.scale.leftSide) : '0';
        const rightValue = this.scale.expressionToString(this.scale.rightSide);

        // 좌우 무게 표시 업데이트
        document.getElementById('left-weight').textContent = leftValue;
        document.getElementById('right-weight').textContent = rightValue;

        // 방정식 텍스트 업데이트
        document.getElementById('equation-text').textContent = this.scale.getCurrentEquation();

        // 저울 기울기 업데이트
        this.updateBalance();

        // 진행률 업데이트
        this.updateProgress();

        // 애니메이션
        this.animateWeightChange();
    }

    /**
     * 저울 균형 시각화 업데이트
     */
    updateBalance() {
        const beam = document.getElementById('balance-beam');
        beam.classList.remove('tilt-left', 'tilt-right', 'balanced');

        // 간단한 균형 체크 (계수와 상수 비교)
        const leftTotal = Math.abs(this.scale.leftSide.coefficient) + Math.abs(this.scale.leftSide.constant);
        const rightTotal = Math.abs(this.scale.rightSide.coefficient) + Math.abs(this.scale.rightSide.constant);

        if (this.scale.isSolved()) {
            beam.classList.add('balanced');
            document.getElementById('left-content').classList.add('success');
            document.getElementById('right-content').classList.add('success');
        } else {
            document.getElementById('left-content').classList.remove('success');
            document.getElementById('right-content').classList.remove('success');

            if (leftTotal > rightTotal) {
                beam.classList.add('tilt-left');
            } else if (rightTotal > leftTotal) {
                beam.classList.add('tilt-right');
            } else {
                beam.classList.add('balanced');
            }
        }
    }

    /**
     * 무게 변경 애니메이션
     */
    animateWeightChange() {
        const leftWeight = document.getElementById('left-weight');
        const rightWeight = document.getElementById('right-weight');

        leftWeight.classList.remove('changing');
        rightWeight.classList.remove('changing');

        setTimeout(() => {
            leftWeight.classList.add('changing');
            rightWeight.classList.add('changing');
        }, 10);

        // 강조 효과
        document.getElementById('left-content').classList.add('highlight');
        document.getElementById('right-content').classList.add('highlight');

        setTimeout(() => {
            document.getElementById('left-content').classList.remove('highlight');
            document.getElementById('right-content').classList.remove('highlight');
        }, 600);
    }

    /**
     * 진행률 업데이트
     */
    updateProgress() {
        const steps = this.scale.getSteps();
        document.getElementById('step-count').textContent = steps.length - 1;

        // 간단한 진행률 계산 (최대 10단계 가정)
        const progress = Math.min(100, (steps.length - 1) * 20);
        document.getElementById('progress-fill').style.width = `${progress}%`;
    }

    /**
     * 양쪽에 값 더하기
     */
    addToSides(value) {
        this.scale.addToSides(value);
        this.updateDisplay();
        this.showFeedback(`양쪽에 ${value > 0 ? '+' : ''}${value}을(를) 했습니다.`, 'info');
    }

    /**
     * 양쪽에 곱하기
     */
    multiplyBoth(value) {
        try {
            this.scale.multiplyBoth(value);
            this.updateDisplay();
            this.showFeedback(`양쪽에 ×${value}을(를) 했습니다.`, 'info');
        } catch (error) {
            this.showFeedback(error.message, 'error');
        }
    }

    /**
     * 양쪽을 나누기
     */
    divideBoth(value) {
        try {
            this.scale.divideBoth(value);
            this.updateDisplay();
            this.showFeedback(`양쪽을 ÷${value}으로 나눴습니다.`, 'info');
        } catch (error) {
            this.showFeedback(error.message, 'error');
        }
    }

    /**
     * 정답 확인
     */
    async checkSolution() {
        if (this.scale.isSolved()) {
            const solution = this.scale.getSolution();
            this.showFeedback(`🎉 정답입니다! x = ${solution}`, 'success');
            this.updateBalance();

            // 진행 상황 저장
            await this.saveProgress(true);

            // 축하 효과
            this.celebrateSuccess();
        } else {
            this.showFeedback('아직 풀리지 않았습니다. 계속 도전해보세요!', 'error');
            document.getElementById('balance-beam').classList.add('error');
            setTimeout(() => {
                document.getElementById('balance-beam').classList.remove('error');
            }, 400);
        }
    }

    /**
     * 성공 축하 효과
     */
    celebrateSuccess() {
        // 간단한 축하 효과
        const beam = document.getElementById('balance-beam');
        beam.style.animation = 'none';
        setTimeout(() => {
            beam.style.animation = '';
        }, 10);
    }

    /**
     * 힌트 보기
     */
    getHint() {
        const hint = this.scale.getHint();
        this.showFeedback(`💡 힌트: ${hint}`, 'info');
    }

    /**
     * 다시 시작
     */
    reset() {
        this.scale.reset();
        this.updateDisplay();
        this.showFeedback('다시 시작합니다!', 'info');
        this.startTime = Date.now();

        // 성공 효과 제거
        document.getElementById('left-content').classList.remove('success');
        document.getElementById('right-content').classList.remove('success');
    }

    /**
     * 피드백 표시
     */
    showFeedback(message, type = 'info') {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback ${type} show`;

        setTimeout(() => {
            feedback.classList.remove('show');
        }, 3000);
    }

    /**
     * 진행 상황 저장
     */
    async saveProgress(isSolved) {
        if (!this.progressId) return;

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        try {
            await fetch(`${this.apiBase}/progress.php`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    id: this.progressId,
                    is_solved: isSolved,
                    solution_steps: this.scale.getSteps(),
                    time_spent: timeSpent
                })
            });
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }
}

// 앱 시작
let balanceApp;
document.addEventListener('DOMContentLoaded', () => {
    balanceApp = new BalanceScaleApp();
});
