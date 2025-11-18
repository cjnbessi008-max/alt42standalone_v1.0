/**
 * Main Application
 * Integration Arms - 부분적분 학습 앱
 */

class IntegrationArmsApp {
    constructor() {
        this.config = window.APP_CONFIG;
        this.currentProblem = null;
        this.selectedU = null;
        this.selectedDv = null;
        this.startTime = null;
        this.hintCount = 0;
        this.animationEngine = null;

        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        this.setupAnimationEngine();
        this.attachEventListeners();
        this.updateTime();
        this.loadRandomProblem();
        this.loadProgress();
    }

    /**
     * Setup animation engine
     */
    setupAnimationEngine() {
        this.animationEngine = new AnimationEngine('robot-canvas');

        // Handle canvas resize
        window.addEventListener('resize', () => {
            this.animationEngine.resize();
        });
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Animation controls
        document.getElementById('play-btn')?.addEventListener('click', () => this.playAnimation());
        document.getElementById('pause-btn')?.addEventListener('click', () => this.pauseAnimation());
        document.getElementById('replay-btn')?.addEventListener('click', () => this.replayAnimation());
        document.getElementById('speed-slider')?.addEventListener('input', (e) => this.setSpeed(e.target.value));

        // Answer buttons
        document.getElementById('submit-btn')?.addEventListener('click', () => this.submitAnswer());
        document.getElementById('hint-btn')?.addEventListener('click', () => this.showHint());
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextProblem());

        // Modal
        document.querySelector('#hint-modal .close')?.addEventListener('click', () => this.closeHintModal());
        document.getElementById('hint-ok-btn')?.addEventListener('click', () => this.closeHintModal());

        // Smartphone controls
        document.getElementById('minimize-btn')?.addEventListener('click', () => this.minimizeSmartphone());
        document.getElementById('maximize-btn')?.addEventListener('click', () => this.maximizeSmartphone());
        document.getElementById('close-btn')?.addEventListener('click', () => this.closeSmartphone());

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
    }

    /**
     * Load random problem
     */
    async loadRandomProblem() {
        try {
            const response = await fetch(`${this.config.apiUrl}/problem.php?random=true`);
            const data = await response.json();

            if (data.success && data.problem) {
                this.currentProblem = data.problem;
                this.displayProblem();
                this.startTime = Date.now();
                this.hintCount = 0;
            } else {
                this.showError('문제를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('Failed to load problem:', error);
            this.showError('네트워크 오류가 발생했습니다.');
        }
    }

    /**
     * Display problem
     */
    displayProblem() {
        const problemLatex = document.getElementById('problem-latex');
        const difficultyBadge = document.getElementById('difficulty-badge');

        if (problemLatex) {
            problemLatex.textContent = this.currentProblem.latex;
            if (window.katex) {
                katex.render(this.currentProblem.latex, problemLatex, {
                    throwOnError: false
                });
            }
        }

        if (difficultyBadge) {
            difficultyBadge.textContent = this.currentProblem.difficulty;
            difficultyBadge.className = `difficulty-badge ${this.currentProblem.difficulty}`;
        }

        // Create selection options
        this.createSelectionOptions();

        // Reset selections
        this.selectedU = null;
        this.selectedDv = null;
        document.getElementById('selected-u').textContent = '-';
        document.getElementById('selected-dv').textContent = '-';

        // Hide feedback
        document.getElementById('feedback-section').style.display = 'none';
        document.getElementById('next-btn').style.display = 'none';
    }

    /**
     * Create selection options from problem
     */
    createSelectionOptions() {
        // Parse problem to extract terms
        // Simplified: In production, use proper LaTeX parser
        const terms = this.extractTerms(this.currentProblem.latex);

        this.createOptionButtons('u-options', terms, 'u');
        this.createOptionButtons('dv-options', terms.map(t => t + ' dx'), 'dv');
    }

    /**
     * Extract terms from LaTeX
     */
    extractTerms(latex) {
        // Simplified term extraction
        // In production, use proper LaTeX parser
        const cleaned = latex.replace(/\\int|\\,|dx/g, '').trim();

        // Split by common operators
        const terms = [];
        const patterns = [
            /x\^\d+/g,
            /x/g,
            /\\sin\(x\)/g,
            /\\cos\(x\)/g,
            /\\ln\(x\)/g,
            /e\^x/g
        ];

        patterns.forEach(pattern => {
            const matches = cleaned.match(pattern);
            if (matches) {
                terms.push(...matches);
            }
        });

        return [...new Set(terms)]; // Remove duplicates
    }

    /**
     * Create option buttons
     */
    createOptionButtons(containerId, options, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.dataset.value = option;

            // Render with KaTeX if available
            if (window.katex) {
                try {
                    katex.render(option, button, { throwOnError: false });
                } catch (e) {
                    button.textContent = option;
                }
            }

            button.addEventListener('click', () => {
                this.selectOption(type, option, button);
            });

            container.appendChild(button);
        });
    }

    /**
     * Select option
     */
    selectOption(type, value, button) {
        const container = button.parentElement;
        const buttons = container.querySelectorAll('.option-btn');

        buttons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');

        if (type === 'u') {
            this.selectedU = value;
            document.getElementById('selected-u').textContent = value;
        } else {
            this.selectedDv = value;
            document.getElementById('selected-dv').textContent = value;
        }
    }

    /**
     * Submit answer
     */
    async submitAnswer() {
        if (!this.selectedU || !this.selectedDv) {
            alert('u와 dv를 모두 선택해주세요.');
            return;
        }

        const attemptTime = (Date.now() - this.startTime) / 1000;

        try {
            const response = await fetch(`${this.config.apiUrl}/submit.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    csrf_token: this.config.csrfToken,
                    problem_id: this.currentProblem.id,
                    selected_u: this.selectedU,
                    selected_dv: this.selectedDv,
                    attempt_time: attemptTime,
                    hint_used: this.hintCount,
                    session_token: this.config.moodleToken
                })
            });

            const result = await response.json();

            if (result.success) {
                this.displayFeedback(result);

                if (result.is_correct) {
                    this.showSuccessOverlay();
                    document.getElementById('next-btn').style.display = 'block';
                }

                this.loadProgress();
            } else {
                this.showError(result.error || '제출 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Submit error:', error);
            this.showError('네트워크 오류가 발생했습니다.');
        }
    }

    /**
     * Display feedback
     */
    displayFeedback(result) {
        const feedbackSection = document.getElementById('feedback-section');
        const feedbackContent = document.getElementById('feedback-content');

        if (feedbackSection && feedbackContent) {
            feedbackContent.textContent = result.feedback;
            feedbackContent.className = `feedback-box ${result.is_correct ? 'correct' : 'incorrect'}`;
            feedbackSection.style.display = 'block';

            // Scroll to feedback
            feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Show hint
     */
    async showHint() {
        if (!this.currentProblem) return;

        try {
            const hintIndex = this.hintCount;
            const hints = this.currentProblem.hints || [];

            if (hintIndex < hints.length) {
                this.showHintModal(hints[hintIndex]);
                this.hintCount++;
            } else {
                this.showHintModal('더 이상 힌트가 없습니다.');
            }
        } catch (error) {
            console.error('Hint error:', error);
        }
    }

    /**
     * Show hint modal
     */
    showHintModal(hintText) {
        const modal = document.getElementById('hint-modal');
        const hintTextElement = document.getElementById('hint-text');

        if (modal && hintTextElement) {
            hintTextElement.textContent = hintText;
            modal.style.display = 'flex';
        }
    }

    /**
     * Close hint modal
     */
    closeHintModal() {
        const modal = document.getElementById('hint-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Next problem
     */
    nextProblem() {
        this.loadRandomProblem();
        this.animationEngine.reset();
    }

    /**
     * Load progress
     */
    async loadProgress() {
        try {
            const response = await fetch(`${this.config.apiUrl}/progress.php`);
            const data = await response.json();

            if (data.success && data.progress) {
                this.displayProgress(data.progress);
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    }

    /**
     * Display progress
     */
    displayProgress(progress) {
        document.getElementById('progress-percentage').textContent = `${progress.progress_percentage}%`;
        document.getElementById('progress-fill').style.width = `${progress.progress_percentage}%`;
        document.getElementById('success-rate').textContent = `${progress.success_rate}%`;
        document.getElementById('avg-time').textContent = `${progress.average_time}s`;
    }

    /**
     * Play animation
     */
    playAnimation() {
        this.animationEngine.playAnimation(this.currentProblem);
        document.getElementById('play-btn').style.display = 'none';
        document.getElementById('pause-btn').style.display = 'inline-block';
    }

    /**
     * Pause animation
     */
    pauseAnimation() {
        this.animationEngine.pause();
        document.getElementById('play-btn').style.display = 'inline-block';
        document.getElementById('pause-btn').style.display = 'none';
    }

    /**
     * Replay animation
     */
    replayAnimation() {
        this.animationEngine.reset();
        this.playAnimation();
    }

    /**
     * Set animation speed
     */
    setSpeed(speed) {
        this.animationEngine.setSpeed(parseFloat(speed));
        document.getElementById('speed-display').textContent = `${speed}x`;
    }

    /**
     * Update time display
     */
    updateTime() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            timeElement.textContent = `${hours}:${minutes}`;
        }

        setTimeout(() => this.updateTime(), 60000); // Update every minute
    }

    /**
     * Smartphone controls
     */
    minimizeSmartphone() {
        document.getElementById('smartphone-container')?.classList.add('minimized');
    }

    maximizeSmartphone() {
        const container = document.getElementById('smartphone-container');
        if (container) {
            container.classList.toggle('maximized');
            this.animationEngine.resize();
        }
    }

    closeSmartphone() {
        document.getElementById('smartphone-container')?.classList.add('hidden');
    }

    /**
     * Logout
     */
    logout() {
        if (confirm('로그아웃하시겠습니까?')) {
            window.location.href = '/logout.php';
        }
    }

    /**
     * Show success overlay
     */
    showSuccessOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'success-overlay';
        overlay.textContent = '✓ 정답!';
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.remove();
        }, 2000);
    }

    /**
     * Show error
     */
    showError(message) {
        alert(message);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.APP_CONFIG && window.APP_CONFIG.userId) {
        new IntegrationArmsApp();
    }
});
