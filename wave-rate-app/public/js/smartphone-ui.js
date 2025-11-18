/**
 * Smartphone UI Controller
 * Manages UI interactions and API communication
 */

class SmartphoneUI {
    constructor() {
        this.waveEngine = null;
        this.currentProblem = null;
        this.problems = [];

        this.initializeElements();
        this.initializeWaveEngine();
        this.attachEventListeners();
        this.loadProblems();
    }

    /**
     * DOM 요소 초기화
     */
    initializeElements() {
        this.elements = {
            problemSelect: document.getElementById('problem-select'),
            questionText: document.getElementById('question-text'),
            functionExpr: document.getElementById('function-expression'),
            difficultyLevel: document.getElementById('difficulty-level'),

            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            submitBtn: document.getElementById('submit-btn'),

            speedSlider: document.getElementById('speed-slider'),
            speedValue: document.getElementById('speed-value'),
            amplitudeSlider: document.getElementById('amplitude-slider'),
            amplitudeValue: document.getElementById('amplitude-value'),

            studentId: document.getElementById('student-id'),
            moodleAttemptId: document.getElementById('moodle-attempt-id')
        };
    }

    /**
     * Wave Rate 엔진 초기화
     */
    initializeWaveEngine() {
        this.waveEngine = new WaveRateEngine('wave-canvas');
    }

    /**
     * 이벤트 리스너 등록
     */
    attachEventListeners() {
        // 문제 선택
        this.elements.problemSelect.addEventListener('change', (e) => {
            this.onProblemSelect(e.target.value);
        });

        // 버튼 이벤트
        this.elements.startBtn.addEventListener('click', () => this.onStart());
        this.elements.pauseBtn.addEventListener('click', () => this.onPause());
        this.elements.resetBtn.addEventListener('click', () => this.onReset());
        this.elements.submitBtn.addEventListener('click', () => this.onSubmit());

        // 슬라이더 이벤트
        this.elements.speedSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.speedValue.textContent = value.toFixed(1) + 'x';
            this.waveEngine.setSpeed(value);
        });

        this.elements.amplitudeSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.amplitudeValue.textContent = value.toFixed(1) + 'x';
            this.waveEngine.setAmplitudeScale(value);
        });
    }

    /**
     * API에서 문제 목록 로드
     */
    async loadProblems() {
        try {
            const response = await fetch('../api/get_problems.php');
            const result = await response.json();

            if (result.success) {
                this.problems = result.data;
                this.populateProblemSelect();
            } else {
                this.showError('문제를 불러오는데 실패했습니다: ' + result.error);
            }
        } catch (error) {
            console.error('Failed to load problems:', error);
            this.showError('문제를 불러올 수 없습니다. API 서버를 확인하세요.');
            this.loadDefaultProblems();
        }
    }

    /**
     * 기본 문제 로드 (API 실패 시)
     */
    loadDefaultProblems() {
        this.problems = [
            {
                id: 1,
                question_text: '함수 f(x) = x²의 변화율을 파동으로 시각화하시오',
                function_expression: 'x*x',
                x_min: -5,
                x_max: 5,
                difficulty_level: 'easy'
            },
            {
                id: 2,
                question_text: '함수 f(x) = sin(x)의 변화율을 파동으로 시각화하시오',
                function_expression: 'Math.sin(x)',
                x_min: -6.28,
                x_max: 6.28,
                difficulty_level: 'medium'
            },
            {
                id: 3,
                question_text: '함수 f(x) = e^x의 변화율을 파동으로 시각화하시오',
                function_expression: 'Math.exp(x)',
                x_min: -2,
                x_max: 2,
                difficulty_level: 'hard'
            }
        ];
        this.populateProblemSelect();
    }

    /**
     * 문제 선택 드롭다운 채우기
     */
    populateProblemSelect() {
        this.elements.problemSelect.innerHTML = '<option value="">문제를 선택하세요</option>';

        this.problems.forEach(problem => {
            const option = document.createElement('option');
            option.value = problem.id;
            option.textContent = `#${problem.id} - ${problem.difficulty_level} - ${problem.question_text.substring(0, 40)}...`;
            this.elements.problemSelect.appendChild(option);
        });
    }

    /**
     * 문제 선택 이벤트
     */
    onProblemSelect(problemId) {
        if (!problemId) {
            this.currentProblem = null;
            this.elements.questionText.textContent = '문제를 선택하세요';
            this.elements.functionExpr.textContent = '-';
            this.elements.difficultyLevel.textContent = '-';
            return;
        }

        const problem = this.problems.find(p => p.id == problemId);
        if (problem) {
            this.currentProblem = problem;
            this.displayProblem(problem);
            this.loadProblemToEngine(problem);
        }
    }

    /**
     * 문제 정보 표시
     */
    displayProblem(problem) {
        this.elements.questionText.textContent = problem.question_text;
        this.elements.functionExpr.textContent = problem.function_expression;
        this.elements.difficultyLevel.textContent = problem.difficulty_level;
    }

    /**
     * 엔진에 문제 로드
     */
    loadProblemToEngine(problem) {
        const xMin = parseFloat(problem.x_min) || -10;
        const xMax = parseFloat(problem.x_max) || 10;

        this.waveEngine.setFunction(problem.function_expression, xMin, xMax);
        this.onReset(); // 리셋 상태로 시작
    }

    /**
     * 시작 버튼
     */
    onStart() {
        if (!this.currentProblem) {
            alert('먼저 문제를 선택하세요!');
            return;
        }

        this.waveEngine.start();

        this.elements.startBtn.disabled = true;
        this.elements.pauseBtn.disabled = false;
        this.elements.pauseBtn.textContent = '일시정지';
    }

    /**
     * 일시정지 버튼
     */
    onPause() {
        if (this.waveEngine.isPaused) {
            this.waveEngine.resume();
            this.elements.pauseBtn.textContent = '일시정지';
        } else {
            this.waveEngine.pause();
            this.elements.pauseBtn.textContent = '재개';
        }
    }

    /**
     * 초기화 버튼
     */
    onReset() {
        this.waveEngine.reset();

        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.pauseBtn.textContent = '일시정지';

        // 슬라이더 초기화
        this.elements.speedSlider.value = 1;
        this.elements.speedValue.textContent = '1.0x';
        this.elements.amplitudeSlider.value = 1;
        this.elements.amplitudeValue.textContent = '1.0x';
    }

    /**
     * 제출 버튼
     */
    async onSubmit() {
        if (!this.currentProblem) {
            alert('먼저 문제를 선택하세요!');
            return;
        }

        // 패턴 매칭 정확도 계산
        const accuracy = this.waveEngine.calculatePatternAccuracy();

        const responseData = {
            student_id: parseInt(this.elements.studentId.value),
            problem_id: this.currentProblem.id,
            response_data: {
                wave_pattern_match: accuracy,
                speed: parseFloat(this.elements.speedSlider.value),
                amplitude_scale: parseFloat(this.elements.amplitudeSlider.value),
                timestamp: new Date().toISOString()
            }
        };

        // Moodle attempt ID가 있으면 추가
        const attemptId = this.elements.moodleAttemptId.value;
        if (attemptId) {
            responseData.moodle_attempt_id = parseInt(attemptId);
        }

        try {
            const response = await fetch('../api/submit_answer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(responseData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(result.data);
            } else {
                this.showError('제출 실패: ' + result.error);
            }
        } catch (error) {
            console.error('Submit error:', error);
            this.showError('제출 중 오류가 발생했습니다.');
        }
    }

    /**
     * 성공 메시지 표시
     */
    showSuccess(data) {
        const message = `
${data.message}

정확도: ${(data.accuracy * 100).toFixed(1)}%
응답 ID: ${data.response_id}
        `;

        alert(message);

        // 정답인 경우 효과
        if (data.is_correct) {
            this.celebrateSuccess();
        }
    }

    /**
     * 성공 애니메이션
     */
    celebrateSuccess() {
        const smartphone = document.querySelector('.smartphone-screen');
        smartphone.style.animation = 'none';
        setTimeout(() => {
            smartphone.style.animation = 'fadeIn 0.5s ease-out';
        }, 10);
    }

    /**
     * 에러 메시지 표시
     */
    showError(message) {
        alert('오류: ' + message);
    }
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.smartphoneUI = new SmartphoneUI();
});
