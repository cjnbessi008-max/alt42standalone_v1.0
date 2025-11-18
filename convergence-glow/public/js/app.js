/**
 * Main Application Logic
 * Convergence Glow 메인 앱
 */

class ConvergenceGlowApp {
    constructor() {
        this.apiBaseUrl = '../api/sequence_api.php';
        this.currentProblem = null;
        this.sessionToken = null;
        this.startTime = null;

        this.visualizer = new SequenceVisualizer('visualizationCanvas');

        this.initElements();
        this.attachEventListeners();
        this.init();
    }

    initElements() {
        this.elements = {
            problemInfo: document.getElementById('problemInfo'),
            numTerms: document.getElementById('numTerms'),
            numTermsValue: document.getElementById('numTermsValue'),
            animationSpeed: document.getElementById('animationSpeed'),
            animationSpeedValue: document.getElementById('animationSpeedValue'),
            startBtn: document.getElementById('startBtn'),
            resetBtn: document.getElementById('resetBtn'),
            answerSection: document.getElementById('answerSection'),
            answerBtns: document.querySelectorAll('.answer-btn'),
            feedback: document.getElementById('feedback'),
            status: document.getElementById('status'),
            currentTerm: document.getElementById('currentTerm'),
            currentValue: document.getElementById('currentValue'),
            analysis: document.getElementById('analysis'),
            sequenceTitle: document.getElementById('sequenceTitle')
        };
    }

    attachEventListeners() {
        // 슬라이더 변경
        this.elements.numTerms.addEventListener('input', (e) => {
            this.elements.numTermsValue.textContent = e.target.value;
        });

        this.elements.animationSpeed.addEventListener('input', (e) => {
            this.elements.animationSpeedValue.textContent = e.target.value + 'x';
            this.visualizer.setConfig({ animationSpeed: parseFloat(e.target.value) });
        });

        // 버튼 클릭
        this.elements.startBtn.addEventListener('click', () => this.startVisualization());
        this.elements.resetBtn.addEventListener('click', () => this.reset());

        // 답변 버튼
        this.elements.answerBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectAnswer(btn));
        });

        // 시각화 완료 이벤트
        document.getElementById('visualizationCanvas').addEventListener('visualizationComplete', () => {
            this.onVisualizationComplete();
        });

        // 윈도우 리사이즈
        window.addEventListener('resize', () => {
            this.visualizer.setupCanvas();
        });
    }

    async init() {
        this.setStatus('초기화 중...');

        // URL 파라미터에서 quiz_id, question_id, user_id 가져오기
        const params = new URLSearchParams(window.location.search);
        const quizId = params.get('quiz_id') || 1;
        const questionId = params.get('question_id');
        const userId = params.get('user_id') || 1;

        try {
            // 세션 생성
            await this.createSession(userId, quizId);

            // 문제 로드
            await this.loadProblem(questionId, quizId);

            this.setStatus('준비 완료');
        } catch (error) {
            console.error('Initialization error:', error);
            this.setStatus('초기화 실패');
            this.showError('앱을 초기화할 수 없습니다: ' + error.message);

            // 데모 모드로 전환
            this.loadDemoProblem();
        }
    }

    async createSession(userId, quizId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    quiz_id: quizId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.sessionToken = data.data.token;
                console.log('Session created:', this.sessionToken);
            } else {
                throw new Error(data.error || 'Session creation failed');
            }
        } catch (error) {
            console.error('Session creation error:', error);
            // 데모 모드에서는 세션 없이 진행
            this.sessionToken = 'demo-token';
        }
    }

    async loadProblem(questionId, quizId) {
        const params = questionId
            ? `question_id=${questionId}`
            : `quiz_id=${quizId}`;

        try {
            const response = await fetch(`${this.apiBaseUrl}/problem?${params}`);
            const data = await response.json();

            if (data.success) {
                this.currentProblem = data.data;
                this.displayProblem();
            } else {
                throw new Error(data.error || 'Failed to load problem');
            }
        } catch (error) {
            console.error('Problem load error:', error);
            throw error;
        }
    }

    loadDemoProblem() {
        // 데모 문제 (API 없이 동작)
        this.currentProblem = {
            id: 0,
            sequence_type: 'geometric',
            sequence_formula: {
                formula: 'a_n = 1 * (1/2)^n',
                n_start: 0
            },
            initial_term: 1.0,
            common_ratio: 0.5,
            convergence_type: 'convergent',
            limit_value: 0.0,
            visualization_config: {
                color_start: '#FFE66D',
                color_end: '#4ECDC4',
                animation_speed: 1.0
            }
        };

        this.displayProblem();
        this.setStatus('데모 모드');
    }

    displayProblem() {
        const problem = this.currentProblem;

        const typeNames = {
            arithmetic: '등차수열',
            geometric: '등비수열',
            harmonic: '조화수열',
            custom: '사용자 정의 수열'
        };

        const html = `
            <div class="info-card">
                <h3>📐 ${typeNames[problem.sequence_type]}</h3>
                <div class="formula">${problem.sequence_formula.formula}</div>
                ${problem.initial_term !== null ? `<p><strong>초항:</strong> ${problem.initial_term}</p>` : ''}
                ${problem.common_ratio !== null ? `<p><strong>공비:</strong> ${problem.common_ratio}</p>` : ''}
                ${problem.common_difference !== null ? `<p><strong>공차:</strong> ${problem.common_difference}</p>` : ''}
            </div>
        `;

        this.elements.problemInfo.innerHTML = html;
        this.elements.sequenceTitle.textContent = typeNames[problem.sequence_type];
    }

    async startVisualization() {
        if (!this.currentProblem) {
            this.showError('문제를 먼저 로드해주세요.');
            return;
        }

        this.setStatus('계산 중...');
        this.elements.startBtn.disabled = true;
        this.startTime = Date.now();

        try {
            // 수열 계산
            const numTerms = parseInt(this.elements.numTerms.value);
            const terms = this.calculateSequenceLocal(numTerms);

            // 분석
            const analysis = sequenceCalculator.analyzeSequence(terms);
            console.log('Analysis:', analysis);

            // 시각화
            this.visualizer.setConfig({
                animationSpeed: parseFloat(this.elements.animationSpeed.value)
            });

            this.setStatus('시각화 중...');
            this.visualizer.start(terms, this.currentProblem.convergence_type);

            // 정보 업데이트
            this.updateSequenceInfo(terms[0], analysis);

            // 애니메이션 중 정보 업데이트
            this.startInfoUpdates(terms);

        } catch (error) {
            console.error('Visualization error:', error);
            this.setStatus('오류 발생');
            this.showError('시각화 중 오류가 발생했습니다: ' + error.message);
            this.elements.startBtn.disabled = false;
        }
    }

    calculateSequenceLocal(numTerms) {
        const problem = this.currentProblem;
        const start = problem.sequence_formula.n_start || 0;

        switch (problem.sequence_type) {
            case 'arithmetic':
                return sequenceCalculator.calculateArithmetic(
                    problem.initial_term,
                    problem.common_difference,
                    numTerms,
                    start
                );

            case 'geometric':
                return sequenceCalculator.calculateGeometric(
                    problem.initial_term,
                    problem.common_ratio,
                    numTerms,
                    start
                );

            case 'harmonic':
                return sequenceCalculator.calculateHarmonic(numTerms, start);

            case 'custom':
                return sequenceCalculator.calculateCustom(
                    problem.sequence_formula.formula,
                    numTerms,
                    start
                );

            default:
                throw new Error('Unknown sequence type');
        }
    }

    startInfoUpdates(terms) {
        let index = 0;
        const interval = setInterval(() => {
            if (index >= terms.length) {
                clearInterval(interval);
                return;
            }

            const term = terms[index];
            this.elements.currentTerm.textContent = `n = ${term.n}`;
            this.elements.currentValue.textContent = term.value.toFixed(4);

            index++;
        }, 100 / parseFloat(this.elements.animationSpeed.value));
    }

    updateSequenceInfo(firstTerm, analysis) {
        this.elements.currentTerm.textContent = `n = ${firstTerm.n}`;
        this.elements.currentValue.textContent = firstTerm.value.toFixed(4);

        const analysisTexts = {
            convergent: '수렴',
            divergent: '발산',
            oscillating: '진동하며 수렴',
            unknown: '분석 중...'
        };

        this.elements.analysis.textContent = analysisTexts[analysis.type] || '알 수 없음';
    }

    onVisualizationComplete() {
        this.setStatus('시각화 완료!');
        this.elements.startBtn.disabled = false;
        this.elements.answerSection.style.display = 'block';

        // 스마트폰에 빛나는 효과
        document.querySelector('.smartphone').classList.add('active');
    }

    selectAnswer(btn) {
        // 모든 버튼에서 선택 제거
        this.elements.answerBtns.forEach(b => b.classList.remove('selected'));

        // 현재 버튼 선택
        btn.classList.add('selected');

        const answer = btn.dataset.answer;
        this.submitAnswer(answer);
    }

    async submitAnswer(answer) {
        if (!this.currentProblem || !this.sessionToken) {
            this.showFeedback(false, '세션이 만료되었습니다.');
            return;
        }

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        try {
            const response = await fetch(`${this.apiBaseUrl}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_token: this.sessionToken,
                    problem_id: this.currentProblem.id,
                    answer: answer,
                    time_spent: timeSpent,
                    interaction_data: {
                        num_terms: this.elements.numTerms.value,
                        animation_speed: this.elements.animationSpeed.value
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showFeedback(data.data.is_correct, data.data.explanation);
            } else {
                throw new Error(data.error || 'Submission failed');
            }
        } catch (error) {
            console.error('Submit error:', error);

            // 데모 모드: 로컬에서 정답 확인
            const isCorrect = (answer === this.currentProblem.convergence_type);
            const explanations = {
                convergent: '이 수열은 수렴합니다. 항이 커질수록 특정 값에 가까워집니다.',
                divergent: '이 수열은 발산합니다. 항이 커질수록 값이 무한대로 증가합니다.',
                oscillating: '이 수열은 진동하면서 수렴합니다. 부호가 바뀌지만 절댓값은 작아집니다.'
            };

            this.showFeedback(
                isCorrect,
                explanations[this.currentProblem.convergence_type]
            );
        }
    }

    showFeedback(isCorrect, explanation) {
        const feedback = this.elements.feedback;
        feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
        feedback.innerHTML = `
            <div style="font-size: 1.5em; margin-bottom: 10px;">
                ${isCorrect ? '🎉 정답입니다!' : '❌ 다시 생각해보세요'}
            </div>
            <div>${explanation}</div>
        `;
    }

    showError(message) {
        alert(message);
    }

    setStatus(status) {
        this.elements.status.textContent = status;
    }

    reset() {
        this.visualizer.reset();
        this.elements.startBtn.disabled = false;
        this.elements.answerSection.style.display = 'none';
        this.elements.feedback.classList.remove('show');
        this.elements.answerBtns.forEach(btn => btn.classList.remove('selected'));
        document.querySelector('.smartphone').classList.remove('active');
        this.setStatus('준비 완료');

        this.elements.currentTerm.textContent = '-';
        this.elements.currentValue.textContent = '-';
        this.elements.analysis.textContent = '-';
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ConvergenceGlowApp();
});
