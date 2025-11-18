/**
 * Main Application Controller
 * Manages the Number Constellation app lifecycle
 */

class App {
    constructor() {
        this.constellation = null;
        this.problem = null;
        this.config = null;
        this.sessionId = this.generateSessionId();
        this.selectedNumbers = [];

        this.initializeElements();
        this.loadProblem();
    }

    initializeElements() {
        this.canvas = document.getElementById('constellation-canvas');
        this.instructionText = document.getElementById('instruction-text');
        this.problemType = document.getElementById('problem-type');
        this.numberRange = document.getElementById('number-range');
        this.difficulty = document.getElementById('difficulty');
        this.scoreDisplay = document.getElementById('score');
        this.selectedCount = document.getElementById('selected-count');
        this.resetBtn = document.getElementById('reset-btn');
        this.submitBtn = document.getElementById('submit-btn');
        this.resultModal = document.getElementById('result-modal');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');
        this.resultDetails = document.getElementById('result-details');
        this.closeModalBtn = document.getElementById('close-modal-btn');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.resetBtn.addEventListener('click', () => this.reset());
        this.submitBtn.addEventListener('click', () => this.submit());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());

        this.canvas.addEventListener('selectionChanged', (e) => {
            this.selectedNumbers = e.detail.selected;
            this.updateSelectedCount();
        });
    }

    async loadProblem() {
        try {
            const problemId = API.getUrlParameter('problem_id');
            const userId = API.getUrlParameter('user_id') || '1';

            if (!problemId) {
                this.showError('문제 ID가 제공되지 않았습니다.');
                return;
            }

            const response = await API.getProblem(problemId);

            if (response.success) {
                this.problem = response.problem;
                this.config = response.config;
                this.userId = userId;

                this.displayProblem();
                this.initializeConstellation();
            } else {
                this.showError('문제를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('Error loading problem:', error);
            this.showError('문제를 불러오는 중 오류가 발생했습니다.');
        }
    }

    displayProblem() {
        const data = this.problem.problem_data;

        // Display instruction
        if (data && data.instruction) {
            this.instructionText.textContent = data.instruction;
        } else {
            this.instructionText.textContent = this.getDefaultInstruction();
        }

        // Display problem info
        this.problemType.textContent = this.getProblemTypeLabel(this.problem.problem_type);
        this.numberRange.textContent = `범위: ${this.problem.number_range_start}-${this.problem.number_range_end}`;
        this.difficulty.textContent = `난이도: ${this.getDifficultyLabel(this.problem.difficulty_level)}`;
    }

    getDefaultInstruction() {
        const type = this.problem.problem_type;
        switch (type) {
            case 'prime':
                return '별자리에서 소수를 모두 찾으세요 (Find all prime numbers in the constellation)';
            case 'multiple':
                return '배수를 모두 선택하세요 (Select all multiples)';
            case 'natural':
                return '자연수 패턴을 찾으세요 (Find the natural number pattern)';
            case 'composite':
                return '합성수를 모두 찾으세요 (Find all composite numbers)';
            default:
                return '조건에 맞는 수를 모두 선택하세요 (Select all numbers matching the condition)';
        }
    }

    getProblemTypeLabel(type) {
        const labels = {
            'prime': '소수 (Prime)',
            'multiple': '배수 (Multiple)',
            'natural': '자연수 (Natural)',
            'composite': '합성수 (Composite)',
            'mixed': '혼합 (Mixed)'
        };
        return labels[type] || type;
    }

    getDifficultyLabel(level) {
        const labels = {
            'easy': '쉬움 (Easy)',
            'medium': '보통 (Medium)',
            'hard': '어려움 (Hard)'
        };
        return labels[level] || level;
    }

    initializeConstellation() {
        this.constellation = new Constellation(this.canvas, this.config);
        this.constellation.generate(
            this.problem.number_range_start,
            this.problem.number_range_end,
            this.problem.problem_type
        );
    }

    updateSelectedCount() {
        this.selectedCount.textContent = this.selectedNumbers.length;
    }

    reset() {
        this.constellation.clearSelection();
        this.selectedNumbers = [];
        this.updateSelectedCount();
        this.scoreDisplay.textContent = '0';
    }

    async submit() {
        const targets = this.getTargetNumbers();
        const selected = this.selectedNumbers;

        const correct = selected.filter(n => targets.includes(n));
        const incorrect = selected.filter(n => !targets.includes(n));
        const missed = targets.filter(n => !selected.includes(n));

        const score = this.calculateScore(correct.length, incorrect.length, targets.length);

        // Show results on constellation
        this.constellation.showResults(correct, incorrect);

        // Update score display
        this.scoreDisplay.textContent = score.toFixed(1);

        // Save progress
        await this.saveProgress(selected, correct, incorrect, score);

        // Show result modal
        this.showResultModal(score, correct, incorrect, missed, targets);
    }

    getTargetNumbers() {
        const data = this.problem.problem_data;
        const type = this.problem.problem_type;
        const start = this.problem.number_range_start;
        const end = this.problem.number_range_end;

        // If targets are explicitly provided in problem_data
        if (data && data.targets) {
            return data.targets;
        }

        // Generate targets based on problem type
        switch (type) {
            case 'prime':
                return MathUtils.getPrimesInRange(start, end);
            case 'multiple':
                const base = (data && data.multiple_of) || 3;
                return MathUtils.getMultiplesInRange(base, start, end);
            case 'composite':
                const composites = [];
                for (let i = start; i <= end; i++) {
                    if (MathUtils.isComposite(i)) {
                        composites.push(i);
                    }
                }
                return composites;
            default:
                return [];
        }
    }

    calculateScore(correct, incorrect, total) {
        if (total === 0) return 0;

        // Score: (correct - incorrect) / total * 100
        // Prevent negative scores
        const rawScore = ((correct - incorrect) / total) * 100;
        return Math.max(0, Math.min(100, rawScore));
    }

    async saveProgress(selected, correct, incorrect, score) {
        try {
            const progressData = {
                problem_id: this.problem.moodle_problem_id,
                user_id: this.userId,
                session_id: this.sessionId,
                numbers_selected: selected,
                numbers_correct: correct,
                numbers_incorrect: incorrect,
                score: score,
                completed: true
            };

            await API.saveProgress(progressData);
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    showResultModal(score, correct, incorrect, missed, targets) {
        this.resultTitle.textContent = score >= 80 ? '🎉 훌륭해요!' : score >= 60 ? '👍 좋아요!' : '💪 다시 도전!';

        this.resultMessage.textContent = `점수: ${score.toFixed(1)}%`;

        const details = `
            <div style="text-align: left;">
                <p>✅ 정답: ${correct.length}개</p>
                <p>❌ 오답: ${incorrect.length}개</p>
                <p>⏭️ 놓친 답: ${missed.length}개</p>
                <p>📊 전체: ${targets.length}개</p>
                ${missed.length > 0 ? `<p style="margin-top: 10px;">놓친 수: ${missed.join(', ')}</p>` : ''}
            </div>
        `;

        this.resultDetails.innerHTML = details;
        this.resultModal.classList.remove('hidden');
    }

    closeModal() {
        this.resultModal.classList.add('hidden');
    }

    showError(message) {
        this.instructionText.textContent = '⚠️ ' + message;
        this.instructionText.style.color = '#FF4444';
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
