/**
 * Convergence Glow App - Main Entry Point
 * 독립형 PWA 메인 로직
 */

import './styles/main.css';
import { getDatabase } from './core/database.js';
import { getSequenceEngine } from './core/sequence-engine.js';
import { Visualizer } from './core/visualizer.js';

class ConvergenceGlowApp {
    constructor() {
        this.db = null;
        this.engine = null;
        this.visualizer = null;
        this.currentProblem = null;
        this.startTime = null;

        this.elements = {};

        this.init();
    }

    async init() {
        try {
            // 데이터베이스 초기화
            this.db = await getDatabase();

            // 수열 엔진 초기화
            this.engine = getSequenceEngine();

            // UI 렌더링
            this.render();

            // 요소 참조
            this.initElements();

            // 이벤트 리스너 등록
            this.attachEventListeners();

            // 시각화 엔진 초기화
            this.initVisualizer();

            // 첫 문제 로드
            await this.loadRandomProblem();

            // 로딩 화면 숨기기
            this.hideLoading();

        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('앱을 초기화하는 중 오류가 발생했습니다.');
        }
    }

    render() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="app-container">
                <!-- 좌측 컨트롤 패널 -->
                <div class="control-panel">
                    <!-- 헤더 -->
                    <div class="panel-section">
                        <h2>🌟 Convergence Glow</h2>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                            수열의 수렴과 발산을 색감으로 체험하세요
                        </p>
                    </div>

                    <!-- 문제 정보 -->
                    <div class="panel-section">
                        <h3>현재 문제</h3>
                        <div id="problem-info"></div>
                        <button id="btn-new-problem" class="btn btn-secondary">
                            🔄 새로운 문제
                        </button>
                    </div>

                    <!-- 컨트롤 -->
                    <div class="panel-section">
                        <h3>시각화 설정</h3>

                        <div class="control-group">
                            <label for="num-terms">표시할 항의 개수:</label>
                            <input type="range" id="num-terms" min="10" max="100" value="50" step="5">
                            <span class="value" id="num-terms-value">50</span>
                        </div>

                        <div class="control-group">
                            <label for="anim-speed">애니메이션 속도:</label>
                            <input type="range" id="anim-speed" min="0.5" max="3" value="1" step="0.1">
                            <span class="value" id="anim-speed-value">1.0x</span>
                        </div>

                        <button id="btn-start" class="btn btn-primary">
                            ▶️ 시각화 시작
                        </button>
                        <button id="btn-reset" class="btn btn-secondary">
                            🔄 다시 시작
                        </button>
                    </div>

                    <!-- 답변 -->
                    <div class="panel-section" id="answer-section" style="display: none;">
                        <h3>이 수열은 어떻게 동작할까요?</h3>
                        <div class="answer-grid">
                            <button class="answer-btn" data-answer="convergent">
                                <span class="icon">📉</span>
                                <span class="text">수렴</span>
                            </button>
                            <button class="answer-btn" data-answer="divergent">
                                <span class="icon">📈</span>
                                <span class="text">발산</span>
                            </button>
                            <button class="answer-btn" data-answer="oscillating">
                                <span class="icon">〰️</span>
                                <span class="text">진동수렴</span>
                            </button>
                        </div>
                        <div id="feedback" class="feedback"></div>
                    </div>

                    <!-- 통계 -->
                    <div class="panel-section">
                        <h3>오늘의 학습</h3>
                        <div id="statistics"></div>
                    </div>
                </div>

                <!-- 우측 시각화 패널 -->
                <div class="visualization-panel">
                    <div class="smartphone-container">
                        <div class="smartphone" id="smartphone">
                            <div class="smartphone-header">
                                <div class="camera"></div>
                                <div class="speaker"></div>
                            </div>
                            <div class="smartphone-screen">
                                <div class="app-header-bar">
                                    <h2 id="viz-title">수열 시각화</h2>
                                    <div class="status-text" id="viz-status">대기 중</div>
                                </div>
                                <canvas id="visualization-canvas"></canvas>
                                <div class="sequence-info-bar">
                                    <div class="info-row">
                                        <span class="info-label">현재 항:</span>
                                        <span class="info-value" id="current-term">-</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">현재 값:</span>
                                        <span class="info-value" id="current-value">-</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">분석:</span>
                                        <span class="info-value" id="analysis">-</span>
                                    </div>
                                </div>
                            </div>
                            <div class="smartphone-footer">
                                <div class="home-button"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initElements() {
        this.elements = {
            problemInfo: document.getElementById('problem-info'),
            numTerms: document.getElementById('num-terms'),
            numTermsValue: document.getElementById('num-terms-value'),
            animSpeed: document.getElementById('anim-speed'),
            animSpeedValue: document.getElementById('anim-speed-value'),
            btnNewProblem: document.getElementById('btn-new-problem'),
            btnStart: document.getElementById('btn-start'),
            btnReset: document.getElementById('btn-reset'),
            answerSection: document.getElementById('answer-section'),
            answerBtns: document.querySelectorAll('.answer-btn'),
            feedback: document.getElementById('feedback'),
            statistics: document.getElementById('statistics'),
            smartphone: document.getElementById('smartphone'),
            vizTitle: document.getElementById('viz-title'),
            vizStatus: document.getElementById('viz-status'),
            currentTerm: document.getElementById('current-term'),
            currentValue: document.getElementById('current-value'),
            analysis: document.getElementById('analysis')
        };
    }

    initVisualizer() {
        const canvas = document.getElementById('visualization-canvas');
        this.visualizer = new Visualizer(canvas);

        this.visualizer.on('complete', () => {
            this.onVisualizationComplete();
        });
    }

    attachEventListeners() {
        // 슬라이더
        this.elements.numTerms.addEventListener('input', (e) => {
            this.elements.numTermsValue.textContent = e.target.value;
        });

        this.elements.animSpeed.addEventListener('input', (e) => {
            const value = e.target.value;
            this.elements.animSpeedValue.textContent = value + 'x';
        });

        // 버튼
        this.elements.btnNewProblem.addEventListener('click', () => this.loadRandomProblem());
        this.elements.btnStart.addEventListener('click', () => this.startVisualization());
        this.elements.btnReset.addEventListener('click', () => this.reset());

        // 답변 버튼
        this.elements.answerBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectAnswer(btn));
        });
    }

    async loadRandomProblem() {
        try {
            this.currentProblem = await this.db.getRandomProblem();
            this.displayProblem();
            this.reset();
        } catch (error) {
            console.error('Error loading problem:', error);
            this.showError('문제를 불러오는 중 오류가 발생했습니다.');
        }
    }

    displayProblem() {
        if (!this.currentProblem) return;

        const typeNames = {
            arithmetic: '등차수열',
            geometric: '등비수열',
            harmonic: '조화수열',
            custom: '사용자 정의'
        };

        const difficultyBadges = {
            easy: '<span class="badge" style="background: #48bb78;">쉬움</span>',
            medium: '<span class="badge" style="background: #ed8936;">보통</span>',
            hard: '<span class="badge" style="background: #f56565;">어려움</span>'
        };

        this.elements.problemInfo.innerHTML = `
            <div class="problem-card">
                <div class="problem-title">${this.currentProblem.title}</div>
                <div style="margin: 0.5rem 0;">
                    <span class="badge" style="background: var(--primary);">${typeNames[this.currentProblem.type]}</span>
                    ${difficultyBadges[this.currentProblem.difficulty] || ''}
                </div>
                <div class="formula">${this.currentProblem.formula.expression}</div>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.75rem;">
                    ${this.currentProblem.description}
                </p>
            </div>
        `;

        this.elements.vizTitle.textContent = this.currentProblem.title;
    }

    async startVisualization() {
        if (!this.currentProblem) {
            this.showError('먼저 문제를 선택해주세요.');
            return;
        }

        this.elements.btnStart.disabled = true;
        this.setStatus('계산 중...');
        this.startTime = Date.now();

        try {
            // 수열 계산
            const numTerms = parseInt(this.elements.numTerms.value);
            const result = this.engine.calculate(this.currentProblem, numTerms);

            console.log('Calculation result:', result);

            // 시각화 시작
            this.setStatus('시각화 중...');

            const config = {
                ...this.currentProblem.visualConfig,
                animationSpeed: parseFloat(this.elements.animSpeed.value)
            };

            this.visualizer.start(result.terms, this.currentProblem.convergenceType, config);

            // 정보 업데이트
            this.updateInfo(result.terms[0], result.analysis);

            // 애니메이션 중 정보 업데이트
            this.startInfoUpdates(result.terms);

        } catch (error) {
            console.error('Visualization error:', error);
            this.setStatus('오류 발생');
            this.showError('시각화 중 오류가 발생했습니다: ' + error.message);
            this.elements.btnStart.disabled = false;
        }
    }

    startInfoUpdates(terms) {
        let index = 0;
        const speed = parseFloat(this.elements.animSpeed.value);
        const interval = setInterval(() => {
            if (index >= terms.length) {
                clearInterval(interval);
                return;
            }

            const term = terms[index];
            this.elements.currentTerm.textContent = `n = ${term.n}`;
            this.elements.currentValue.textContent = term.value.toFixed(6);

            index++;
        }, (100 / speed));
    }

    updateInfo(firstTerm, analysis) {
        this.elements.currentTerm.textContent = `n = ${firstTerm.n}`;
        this.elements.currentValue.textContent = firstTerm.value.toFixed(6);

        const typeTexts = {
            convergent: '수렴',
            divergent: '발산',
            oscillating: '진동수렴',
            unknown: '분석 중...'
        };

        this.elements.analysis.textContent = typeTexts[analysis.type] || '알 수 없음';
    }

    onVisualizationComplete() {
        this.setStatus('시각화 완료!');
        this.elements.btnStart.disabled = false;
        this.elements.answerSection.style.display = 'block';
        this.elements.smartphone.classList.add('active');
    }

    selectAnswer(btn) {
        // 선택 표시
        this.elements.answerBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        const answer = btn.dataset.answer;
        this.submitAnswer(answer);
    }

    async submitAnswer(answer) {
        if (!this.currentProblem) return;

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        const isCorrect = answer === this.currentProblem.convergenceType;

        // 데이터베이스에 저장
        try {
            await this.db.saveAttempt({
                problemId: this.currentProblem.id,
                answer,
                isCorrect,
                timeSpent,
                interactionData: {
                    numTerms: this.elements.numTerms.value,
                    animationSpeed: this.elements.animSpeed.value
                }
            });

            // 통계 업데이트
            await this.updateStatistics();

        } catch (error) {
            console.error('Error saving attempt:', error);
        }

        // 피드백 표시
        this.showFeedback(isCorrect);
    }

    showFeedback(isCorrect) {
        const feedback = this.elements.feedback;
        feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');

        const explanations = {
            convergent: '✅ 이 수열은 수렴합니다. 항이 커질수록 특정 값에 가까워집니다.',
            divergent: '✅ 이 수열은 발산합니다. 항이 커질수록 값이 무한대로 증가합니다.',
            oscillating: '✅ 이 수열은 진동하며 수렴합니다. 부호가 바뀌지만 절댓값은 작아집니다.'
        };

        const explanation = explanations[this.currentProblem.convergenceType] || '';

        feedback.innerHTML = `
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">
                ${isCorrect ? '🎉 정답입니다!' : '❌ 다시 생각해보세요'}
            </div>
            <div>${explanation}</div>
        `;
    }

    async updateStatistics() {
        try {
            const stats = await this.db.getTodayStatistics();

            const attempts = await this.db.getRecentAttempts(100);
            const todayAttempts = attempts.filter(a => {
                const attemptDate = new Date(a.timestamp).toISOString().split('T')[0];
                const today = new Date().toISOString().split('T')[0];
                return attemptDate === today;
            });

            const correctCount = todayAttempts.filter(a => a.isCorrect).length;
            const accuracy = todayAttempts.length > 0
                ? Math.round((correctCount / todayAttempts.length) * 100)
                : 0;

            this.elements.statistics.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: 0.5rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary);">${todayAttempts.length}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">시도</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: 0.5rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--convergent);">${accuracy}%</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">정확도</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    reset() {
        this.visualizer.reset();
        this.elements.btnStart.disabled = false;
        this.elements.answerSection.style.display = 'none';
        this.elements.feedback.classList.remove('show');
        this.elements.answerBtns.forEach(btn => btn.classList.remove('selected'));
        this.elements.smartphone.classList.remove('active');
        this.setStatus('준비 완료');

        this.elements.currentTerm.textContent = '-';
        this.elements.currentValue.textContent = '-';
        this.elements.analysis.textContent = '-';
    }

    setStatus(status) {
        this.elements.vizStatus.textContent = status;
    }

    showError(message) {
        alert(message);
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
            setTimeout(() => loading.remove(), 500);
        }
    }
}

// 앱 초기화
new ConvergenceGlowApp();
