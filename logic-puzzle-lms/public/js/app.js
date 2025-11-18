/**
 * Logic Puzzle LMS - Main Application
 * 앱 초기화 및 전역 상태 관리
 */

import { PuzzleEngine } from './puzzle-engine.js';
import { DragDropManager } from './drag-drop.js';
import { MoodleAPI } from './moodle-api.js';

class LogicPuzzleApp {
    constructor() {
        this.config = {
            apiBaseUrl: '../api',
            defaultStudentId: 1, // 개발용 - 실제로는 로그인에서 가져옴
            autoSaveInterval: 30000 // 30초
        };

        this.state = {
            currentProblem: null,
            session: null,
            timeElapsed: 0,
            attemptCount: 0,
            blocks: [],
            connections: []
        };

        this.api = new MoodleAPI(this.config.apiBaseUrl);
        this.puzzleEngine = new PuzzleEngine();
        this.dragDropManager = null;

        this.elements = {};
        this.timers = {
            main: null,
            autoSave: null
        };

        this.init();
    }

    /**
     * 앱 초기화
     */
    async init() {
        console.log('🚀 Logic Puzzle LMS 시작');

        // DOM 요소 캐싱
        this.cacheElements();

        // 이벤트 리스너 등록
        this.bindEvents();

        // Drag & Drop 초기화
        this.dragDropManager = new DragDropManager(
            this.elements.workspace,
            this.onBlockDropped.bind(this)
        );

        // URL에서 문제 ID 가져오기
        const problemId = this.getProblemIdFromURL();

        if (problemId) {
            await this.loadProblem(problemId);
        } else {
            // 개발 모드: 첫 번째 문제 로드
            await this.loadDefaultProblem();
        }
    }

    /**
     * DOM 요소 캐싱
     */
    cacheElements() {
        this.elements = {
            // Workspace
            workspace: document.getElementById('workspace'),
            workspaceCanvas: document.getElementById('workspaceCanvas'),
            formulaOutput: document.getElementById('formulaOutput'),

            // Problem Info
            problemTitle: document.querySelector('.problem-title'),
            problemDescription: document.querySelector('.problem-description'),
            difficultyBadge: document.querySelector('.difficulty-badge strong'),
            timeRemaining: document.getElementById('timeRemaining'),
            attemptCount: document.getElementById('attemptCount'),
            maxAttempts: document.getElementById('maxAttempts'),

            // Buttons
            clearBtn: document.getElementById('clearBtn'),
            hintBtn: document.getElementById('hintBtn'),
            submitBtn: document.getElementById('submitBtn'),

            // Mobile viewport
            mobileProblem: document.getElementById('mobileProblem'),
            mobileProblemContent: document.querySelector('.mobile-problem-content'),
            mobileFeedback: document.getElementById('mobileFeedback'),
            truthTable: document.getElementById('truthTable'),
            truthTableBody: document.getElementById('truthTableBody'),

            // Modal
            feedbackModal: document.getElementById('feedbackModal'),
            modalTitle: document.getElementById('modalTitle'),
            feedbackResult: document.getElementById('feedbackResult'),
            modalClose: document.getElementById('modalClose'),
            modalContinue: document.getElementById('modalContinue'),

            // Loading
            loadingOverlay: document.getElementById('loadingOverlay')
        };
    }

    /**
     * 이벤트 리스너 등록
     */
    bindEvents() {
        // 버튼 이벤트
        this.elements.clearBtn.addEventListener('click', () => this.clearWorkspace());
        this.elements.hintBtn.addEventListener('click', () => this.showHint());
        this.elements.submitBtn.addEventListener('click', () => this.submitAnswer());

        // 모달 이벤트
        this.elements.modalClose.addEventListener('click', () => this.closeModal());
        this.elements.modalContinue.addEventListener('click', () => this.closeModal());

        // 키보드 단축키
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // 페이지 이탈 경고 (작업 중일 때)
        window.addEventListener('beforeunload', (e) => {
            if (this.state.blocks.length > 0 && this.state.session?.status === 'in_progress') {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    /**
     * URL에서 문제 ID 추출
     */
    getProblemIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('problem_id');
    }

    /**
     * 기본 문제 로드 (개발용)
     */
    async loadDefaultProblem() {
        try {
            this.showLoading(true);
            const response = await this.api.getProblems({ limit: 1 });

            if (response.success && response.data.length > 0) {
                await this.loadProblem(response.data[0].id);
            } else {
                this.showError('문제를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('문제 로드 실패:', error);
            this.showError('문제 로드 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 문제 로드
     */
    async loadProblem(problemId) {
        try {
            this.showLoading(true);

            // 문제 정보 가져오기
            const problemResponse = await this.api.getProblem(problemId);
            if (!problemResponse.success) {
                throw new Error('문제를 불러올 수 없습니다.');
            }

            this.state.currentProblem = problemResponse.data;

            // 세션 생성
            const sessionResponse = await this.api.createSession(
                this.config.defaultStudentId,
                problemId
            );

            if (!sessionResponse.success) {
                throw new Error('세션을 생성할 수 없습니다.');
            }

            this.state.session = sessionResponse.data;

            // UI 업데이트
            this.updateProblemUI();

            // 퍼즐 엔진 초기화
            this.puzzleEngine.init(this.state.currentProblem);

            // 타이머 시작
            this.startTimer();

            // 자동 저장 시작
            this.startAutoSave();

            console.log('✅ 문제 로드 완료:', this.state.currentProblem.title);

        } catch (error) {
            console.error('문제 로드 실패:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 문제 UI 업데이트
     */
    updateProblemUI() {
        const problem = this.state.currentProblem;

        // Problem info
        this.elements.problemTitle.textContent = problem.title;
        this.elements.problemDescription.textContent = problem.description;
        this.elements.difficultyBadge.textContent = this.translateDifficulty(problem.difficulty_level);
        this.elements.maxAttempts.textContent = problem.max_attempts;

        // Mobile viewport
        this.elements.mobileProblemContent.innerHTML = `
            <p><strong>${problem.title}</strong></p>
            <p>${problem.description}</p>
        `;

        // 진리표 표시 (필요한 경우)
        if (problem.show_truth_table) {
            this.generateTruthTable();
        }
    }

    /**
     * 난이도 번역
     */
    translateDifficulty(level) {
        const map = {
            'easy': '쉬움',
            'medium': '보통',
            'hard': '어려움'
        };
        return map[level] || level;
    }

    /**
     * 타이머 시작
     */
    startTimer() {
        if (this.timers.main) {
            clearInterval(this.timers.main);
        }

        const timeLimit = this.state.currentProblem.time_limit_seconds;
        const startTime = Date.now();

        this.timers.main = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            this.state.timeElapsed = elapsed;

            const remaining = timeLimit - elapsed;

            if (remaining <= 0) {
                this.handleTimeout();
            } else {
                this.updateTimerDisplay(remaining);
            }
        }, 1000);
    }

    /**
     * 타이머 표시 업데이트
     */
    updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        this.elements.timeRemaining.textContent =
            `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        // 시간이 부족하면 경고 표시
        if (seconds < 60) {
            this.elements.timeRemaining.style.color = 'var(--color-danger)';
        }
    }

    /**
     * 제한 시간 초과 처리
     */
    handleTimeout() {
        clearInterval(this.timers.main);
        this.elements.timeRemaining.textContent = '00:00';
        this.elements.timeRemaining.style.color = 'var(--color-danger)';

        this.showFeedback({
            isCorrect: false,
            score: 0,
            feedback: '제한 시간이 초과되었습니다.',
            title: '시간 초과'
        });

        this.disableWorkspace();
    }

    /**
     * 블록이 드롭되었을 때
     */
    onBlockDropped(blockData, position) {
        const block = {
            id: this.generateBlockId(),
            type: blockData.type,
            value: blockData.value,
            position: position,
            inputs: []
        };

        this.state.blocks.push(block);
        this.renderBlock(block);
        this.updateFormula();

        console.log('블록 추가됨:', block);
    }

    /**
     * 블록 렌더링
     */
    renderBlock(block) {
        const blockEl = document.createElement('div');
        blockEl.className = 'puzzle-block in-workspace';
        blockEl.dataset.blockId = block.id;
        blockEl.dataset.type = block.type;
        blockEl.style.left = block.position.x + 'px';
        blockEl.style.top = block.position.y + 'px';

        const symbol = this.getBlockSymbol(block.type, block.value);
        blockEl.innerHTML = `
            <span class="block-symbol">${symbol}</span>
            <div class="block-toolbar">
                <button class="block-toolbar-btn delete" data-action="delete">🗑️</button>
            </div>
        `;

        // 이벤트 리스너
        blockEl.addEventListener('click', () => this.selectBlock(block.id));
        blockEl.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteBlock(block.id);
        });

        this.elements.workspaceCanvas.appendChild(blockEl);
    }

    /**
     * 블록 심볼 가져오기
     */
    getBlockSymbol(type, value) {
        const symbols = {
            'variable': value,
            'and': '∧',
            'or': '∨',
            'not': '¬',
            'implies': '→',
            'iff': '↔'
        };
        return symbols[type] || '?';
    }

    /**
     * 논리식 업데이트
     */
    updateFormula() {
        const formula = this.puzzleEngine.buildFormula(this.state.blocks);
        const formulaString = this.puzzleEngine.formulaToString(formula);

        if (formulaString) {
            this.elements.formulaOutput.innerHTML = formulaString;
        } else {
            this.elements.formulaOutput.innerHTML = '<span class="empty-formula">블록을 배치하면 여기에 표시됩니다</span>';
        }
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        if (this.state.blocks.length === 0) {
            alert('먼저 논리식을 구성해주세요.');
            return;
        }

        try {
            this.showLoading(true);

            const formula = this.puzzleEngine.buildFormula(this.state.blocks);

            const response = await this.api.submitAnswer(
                this.state.session.session_id,
                formula,
                this.state.timeElapsed
            );

            if (response.success) {
                this.state.attemptCount = response.data.attempt_number;
                this.elements.attemptCount.textContent = this.state.attemptCount;

                this.showFeedback(response.data);

                if (response.data.is_correct) {
                    this.handleCorrectAnswer(response.data);
                }
            }

        } catch (error) {
            console.error('제출 실패:', error);
            this.showError('답안 제출 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 피드백 표시
     */
    showFeedback(data) {
        const isCorrect = data.is_correct || data.isCorrect;
        const score = data.score;
        const feedback = data.feedback;
        const title = data.title || (isCorrect ? '정답입니다!' : '오답입니다');

        this.elements.modalTitle.textContent = title;

        const resultClass = isCorrect ? 'correct' : 'incorrect';
        const icon = isCorrect ? '🎉' : '😕';

        this.elements.feedbackResult.innerHTML = `
            <div class="feedback-result ${resultClass}">
                <div class="feedback-icon">${icon}</div>
                <div class="feedback-score">점수: ${score}점</div>
                <div class="feedback-message">${feedback}</div>
            </div>
        `;

        this.showModal();

        // Mobile viewport에도 표시
        this.showMobileFeedback(isCorrect, score, feedback);
    }

    /**
     * 모바일 피드백 표시
     */
    showMobileFeedback(isCorrect, score, feedback) {
        const alertClass = isCorrect ? 'success' : 'error';
        const icon = isCorrect ? '✓' : '✗';

        this.elements.mobileFeedback.innerHTML = `
            <div class="feedback-alert ${alertClass}">
                <span class="feedback-icon-inline">${icon}</span>
                <div class="feedback-text">
                    ${feedback}
                    <div class="feedback-score-inline">점수: ${score}점</div>
                </div>
            </div>
        `;

        this.elements.mobileFeedback.style.display = 'block';

        setTimeout(() => {
            this.elements.mobileFeedback.style.display = 'none';
        }, 5000);
    }

    /**
     * 정답 처리
     */
    handleCorrectAnswer(data) {
        // 타이머 중지
        if (this.timers.main) {
            clearInterval(this.timers.main);
        }

        // 축하 애니메이션
        this.celebrateSuccess();

        // 작업 영역 비활성화
        this.disableWorkspace();
    }

    /**
     * 성공 축하 애니메이션
     */
    celebrateSuccess() {
        // 간단한 컨페티 효과
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createConfetti();
            }, i * 20);
        }
    }

    /**
     * 컨페티 생성
     */
    createConfetti() {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.background = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'][Math.floor(Math.random() * 5)];
        confetti.style.borderRadius = '50%';
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';

        document.body.appendChild(confetti);

        let top = -10;
        const interval = setInterval(() => {
            top += 5;
            confetti.style.top = top + 'px';

            if (top > window.innerHeight) {
                clearInterval(interval);
                confetti.remove();
            }
        }, 20);
    }

    /**
     * 작업 영역 초기화
     */
    clearWorkspace() {
        if (!confirm('작업 내용을 모두 지우시겠습니까?')) {
            return;
        }

        this.state.blocks = [];
        this.state.connections = [];

        const blocks = this.elements.workspaceCanvas.querySelectorAll('.puzzle-block.in-workspace');
        blocks.forEach(block => block.remove());

        this.updateFormula();

        console.log('작업 영역 초기화됨');
    }

    /**
     * 힌트 표시
     */
    showHint() {
        alert('힌트 기능은 준비 중입니다.');
        // TODO: 힌트 로직 구현
    }

    /**
     * 모달 표시
     */
    showModal() {
        this.elements.feedbackModal.style.display = 'flex';
    }

    /**
     * 모달 닫기
     */
    closeModal() {
        this.elements.feedbackModal.style.display = 'none';
    }

    /**
     * 로딩 표시
     */
    showLoading(show) {
        this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    /**
     * 에러 표시
     */
    showError(message) {
        alert('오류: ' + message);
    }

    /**
     * 작업 영역 비활성화
     */
    disableWorkspace() {
        this.elements.submitBtn.disabled = true;
        this.elements.workspaceCanvas.style.opacity = '0.5';
        this.elements.workspaceCanvas.style.pointerEvents = 'none';
    }

    /**
     * 자동 저장 시작
     */
    startAutoSave() {
        if (this.timers.autoSave) {
            clearInterval(this.timers.autoSave);
        }

        this.timers.autoSave = setInterval(() => {
            this.autoSave();
        }, this.config.autoSaveInterval);
    }

    /**
     * 자동 저장
     */
    autoSave() {
        // TODO: 현재 작업 상태를 로컬 스토리지에 저장
        console.log('자동 저장됨');
    }

    /**
     * 키보드 단축키 처리
     */
    handleKeyboard(e) {
        // Ctrl/Cmd + Enter: 제출
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.submitAnswer();
        }

        // Ctrl/Cmd + Delete: 초기화
        if ((e.ctrlKey || e.metaKey) && e.key === 'Delete') {
            e.preventDefault();
            this.clearWorkspace();
        }

        // ESC: 모달 닫기
        if (e.key === 'Escape') {
            this.closeModal();
        }
    }

    /**
     * 블록 선택
     */
    selectBlock(blockId) {
        // 모든 블록 선택 해제
        document.querySelectorAll('.puzzle-block.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // 선택한 블록 활성화
        const blockEl = document.querySelector(`[data-block-id="${blockId}"]`);
        if (blockEl) {
            blockEl.classList.add('selected');
        }
    }

    /**
     * 블록 삭제
     */
    deleteBlock(blockId) {
        this.state.blocks = this.state.blocks.filter(b => b.id !== blockId);

        const blockEl = document.querySelector(`[data-block-id="${blockId}"]`);
        if (blockEl) {
            blockEl.classList.add('removing');
            setTimeout(() => blockEl.remove(), 300);
        }

        this.updateFormula();
    }

    /**
     * 블록 ID 생성
     */
    generateBlockId() {
        return 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 진리표 생성
     */
    generateTruthTable() {
        // TODO: 진리표 생성 로직
        console.log('진리표 생성 예정');
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LogicPuzzleApp();
});

export default LogicPuzzleApp;
