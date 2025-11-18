/**
 * Main Application Logic
 * Rhythm Seq - Standalone Edition
 */

class RhythmSeqApp {
    constructor() {
        this.sequencesData = null;
        this.currentQuestion = null;
        this.currentCategory = 'all';
        this.animationEngine = null;
        this.startTime = null;
        this.usedHint = false;

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Load sequence data
            await this.loadSequenceData();

            // Initialize components
            AudioManager.init();
            this.animationEngine = new AnimationEngine('animation-canvas');

            // Setup UI
            this.setupEventListeners();
            this.loadSettings();
            this.updateStats();
            this.renderQuestions();

            // Update clock
            this.updateClock();
            setInterval(() => this.updateClock(), 60000);

            // Hide loading screen
            setTimeout(() => {
                document.getElementById('loading-screen').classList.add('fade-out');
                document.getElementById('app').classList.remove('hidden');
            }, 1000);

        } catch (error) {
            console.error('Initialization error:', error);
            Utils.showToast('앱 초기화 실패', 'error');
        }
    }

    /**
     * Load sequence data from JSON
     */
    async loadSequenceData() {
        try {
            const response = await fetch('data/sequences.json');
            this.sequencesData = await response.json();
        } catch (error) {
            console.error('Failed to load sequence data:', error);
            throw error;
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Category tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.filterByCategory(e.currentTarget.dataset.category);
            });
        });

        // Control buttons
        document.getElementById('btn-play').addEventListener('click', () => this.playAnimation());
        document.getElementById('btn-pause').addEventListener('click', () => this.pauseAnimation());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetAnimation());

        // Speed control
        const speedControl = document.getElementById('speed-control');
        speedControl.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            this.updateSpeed(speed);
        });

        // Sound toggle
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            AudioManager.toggle();
        });

        // Auto play toggle
        document.getElementById('auto-play-toggle').addEventListener('change', (e) => {
            Storage.updateSetting('autoPlay', e.target.checked);
        });

        // Answer submission
        document.getElementById('btn-submit-answer').addEventListener('click', () => this.submitAnswer());
        document.getElementById('answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitAnswer();
        });

        // Hint button
        document.getElementById('btn-hint').addEventListener('click', () => this.showHint());

        // Header buttons
        document.getElementById('btn-achievements').addEventListener('click', () => this.showAchievements());
        document.getElementById('btn-settings').addEventListener('click', () => this.showSettings());
        document.getElementById('btn-info').addEventListener('click', () => this.showInfo());

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById(e.target.dataset.modal).classList.add('hidden');
            });
        });

        // Close modal on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });

        // Settings
        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        document.getElementById('animation-style').addEventListener('change', (e) => {
            this.changeAnimationStyle(e.target.value);
        });

        document.getElementById('btn-reset-progress').addEventListener('click', () => {
            Storage.resetAll();
        });
    }

    /**
     * Load user settings
     */
    loadSettings() {
        const settings = Storage.getSettings();

        document.getElementById('speed-control').value = settings.animationSpeed;
        document.getElementById('sound-toggle').checked = settings.soundEnabled;
        document.getElementById('auto-play-toggle').checked = settings.autoPlay;
        document.getElementById('theme-select').value = settings.theme;
        document.getElementById('animation-style').value = settings.animationStyle;

        this.updateSpeed(settings.animationSpeed);
        AudioManager.enabled = settings.soundEnabled;

        if (settings.theme !== 'default') {
            document.body.dataset.theme = settings.theme;
        }
    }

    /**
     * Update clock display
     */
    updateClock() {
        document.getElementById('current-time').textContent = Utils.formatTime();
    }

    /**
     * Render questions list
     */
    renderQuestions() {
        const container = document.getElementById('questions-list');
        const progress = Storage.getProgress();
        const sequences = this.getFilteredSequences();

        container.innerHTML = sequences.map(seq => `
            <div class="question-item ${progress.solvedQuestions.includes(seq.id) ? 'solved' : ''}"
                 data-id="${seq.id}">
                <div class="question-header">
                    <span class="question-title">${seq.title}</span>
                    <span class="question-level">Lv.${seq.level}</span>
                </div>
                <div class="question-meta">
                    <span>${Utils.getDifficultyLabel(seq.difficulty).text}</span>
                    <span>${seq.points}점</span>
                    ${progress.solvedQuestions.includes(seq.id) ? '<span>✓ 완료</span>' : ''}
                </div>
            </div>
        `).join('');

        // Add click listeners
        container.querySelectorAll('.question-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                this.loadQuestion(id);
                AudioManager.playClick();
            });
        });
    }

    /**
     * Get filtered sequences by category
     */
    getFilteredSequences() {
        if (this.currentCategory === 'all') {
            return this.sequencesData.sequences;
        }
        return this.sequencesData.sequences.filter(seq => seq.category === this.currentCategory);
    }

    /**
     * Filter questions by category
     */
    filterByCategory(category) {
        this.currentCategory = category;

        // Update UI
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        this.renderQuestions();
        AudioManager.playClick();
    }

    /**
     * Load a question
     */
    loadQuestion(questionId) {
        this.currentQuestion = this.sequencesData.sequences.find(seq => seq.id === questionId);

        if (!this.currentQuestion) {
            Utils.showToast('문제를 찾을 수 없습니다', 'error');
            return;
        }

        this.startTime = Date.now();
        this.usedHint = false;

        // Update active state
        document.querySelectorAll('.question-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.id) === questionId);
        });

        // Display question
        this.displayQuestion();

        // Enable controls
        document.getElementById('btn-play').disabled = false;
        document.getElementById('btn-reset').disabled = false;

        // Auto play if enabled
        const settings = Storage.getSettings();
        if (settings.autoPlay) {
            setTimeout(() => this.playAnimation(), 500);
        }
    }

    /**
     * Display current question
     */
    displayQuestion() {
        const q = this.currentQuestion;

        // Display in phone screen
        const questionDisplay = document.getElementById('question-display');
        questionDisplay.innerHTML = `
            <h3>${q.title}</h3>
            <p style="margin: 8px 0; color: #718096;">${q.description}</p>
            <div class="sequence-display">
                ${q.sequence.map((num, i) =>
                    `<span class="sequence-number" style="--index: ${i}">${num}</span>`
                ).join('')}
            </div>
        `;

        // Display info in right panel
        const questionInfo = document.getElementById('question-info');
        const difficulty = Utils.getDifficultyLabel(q.difficulty);

        questionInfo.innerHTML = `
            <div style="margin-bottom: 15px;">
                <strong>난이도:</strong>
                <span style="color: ${difficulty.color}">${difficulty.text}</span>
            </div>
            <div style="margin-bottom: 15px;">
                <strong>레벨:</strong> ${q.level}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>점수:</strong> ${q.points}점
            </div>
            <div style="margin-bottom: 15px;">
                <strong>카테고리:</strong> ${this.getCategoryName(q.category)}
            </div>
        `;

        // Show answer section
        document.getElementById('answer-section').classList.remove('hidden');
        document.getElementById('question-prompt').textContent = q.question;
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-feedback').classList.add('hidden');
    }

    /**
     * Get category name
     */
    getCategoryName(categoryId) {
        const category = this.sequencesData.categories.find(c => c.id === categoryId);
        return category ? category.name : categoryId;
    }

    /**
     * Play animation
     */
    playAnimation() {
        if (!this.currentQuestion) {
            Utils.showToast('먼저 문제를 선택하세요', 'warning');
            return;
        }

        const settings = Storage.getSettings();
        this.animationEngine.start(
            this.currentQuestion.sequence,
            settings.animationStyle,
            settings.animationSpeed
        );

        // Update buttons
        document.getElementById('btn-play').disabled = true;
        document.getElementById('btn-pause').disabled = false;

        // Update progress
        this.updateProgress();

        AudioManager.playWhoosh();
    }

    /**
     * Pause animation
     */
    pauseAnimation() {
        this.animationEngine.pause();
        document.getElementById('btn-play').disabled = false;
        document.getElementById('btn-pause').disabled = true;
    }

    /**
     * Reset animation
     */
    resetAnimation() {
        this.animationEngine.stop();
        document.getElementById('btn-play').disabled = false;
        document.getElementById('btn-pause').disabled = true;

        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        progressFill.style.width = '0%';
        progressText.textContent = '0 / 0';

        AudioManager.playClick();
    }

    /**
     * Update progress bar
     */
    async updateProgress() {
        while (this.animationEngine.isPlaying && !this.animationEngine.isPaused) {
            const progress = this.animationEngine.getProgress();
            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-text');

            progressFill.style.width = `${progress.percentage}%`;
            progressText.textContent = `${progress.current} / ${progress.total}`;

            await Utils.sleep(100);
        }
    }

    /**
     * Update animation speed
     */
    updateSpeed(speed) {
        const speedLabels = {
            1: '매우 느림', 2: '느림', 3: '조금 느림', 4: '보통-', 5: '보통',
            6: '보통+', 7: '조금 빠름', 8: '빠름', 9: '매우 빠름', 10: '초고속'
        };

        document.getElementById('speed-label').textContent = speedLabels[speed] || '보통';

        if (this.animationEngine) {
            this.animationEngine.setSpeed(speed);
        }

        Storage.updateSetting('animationSpeed', speed);
    }

    /**
     * Submit answer
     */
    submitAnswer() {
        if (!this.currentQuestion) return;

        const answerInput = document.getElementById('answer-input');
        const userAnswer = parseInt(answerInput.value);

        if (isNaN(userAnswer)) {
            Utils.showToast('숫자를 입력해주세요', 'warning');
            return;
        }

        const isCorrect = userAnswer === this.currentQuestion.answer;
        const solveTime = Date.now() - this.startTime;

        this.showAnswerFeedback(isCorrect, solveTime);

        if (isCorrect) {
            this.handleCorrectAnswer(solveTime);
        } else {
            this.handleIncorrectAnswer();
        }
    }

    /**
     * Show answer feedback
     */
    showAnswerFeedback(isCorrect, solveTime) {
        const feedback = document.getElementById('answer-feedback');
        const q = this.currentQuestion;

        if (isCorrect) {
            feedback.className = 'answer-feedback correct';
            feedback.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 10px;">🎉</div>
                <strong>정답입니다!</strong>
                <p>${q.explanation}</p>
                <p style="margin-top: 10px; font-size: 0.9rem;">
                    ⏱️ ${(solveTime / 1000).toFixed(1)}초
                </p>
            `;
            AudioManager.playSuccess();
        } else {
            feedback.className = 'answer-feedback incorrect';
            feedback.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 10px;">😅</div>
                <strong>틀렸습니다</strong>
                <p>다시 한번 생각해보세요!</p>
                <p style="margin-top: 10px;">
                    정답: ${q.answer}
                </p>
            `;
            AudioManager.playError();
        }

        feedback.classList.remove('hidden');
    }

    /**
     * Handle correct answer
     */
    handleCorrectAnswer(solveTime) {
        const q = this.currentQuestion;
        const progress = Storage.getProgress();
        const firstTry = !progress.attempts[q.id];

        // Calculate score
        let score = q.points;
        if (firstTry && !this.usedHint) score = Math.floor(score * 1.5); // Bonus
        if (this.usedHint) score = Math.floor(score * 0.7); // Penalty

        // Save progress
        Storage.markSolved(q.id, score, solveTime, this.usedHint);

        // Update streak
        const stats = Storage.incrementStreak();

        // Check achievements
        const newAchievements = Storage.checkAchievements(stats, {
            firstTry,
            usedHint: this.usedHint,
            solveTime
        });

        // Show achievements
        if (newAchievements.length > 0) {
            newAchievements.forEach(achId => {
                this.showAchievementUnlock(achId);
            });
        }

        // Update UI
        this.updateStats();
        this.renderQuestions();

        // Confetti!
        if (firstTry && !this.usedHint) {
            Utils.createConfetti();
        }

        // Show score toast
        Utils.showToast(`+${score}점 획득!`, 'success');
    }

    /**
     * Handle incorrect answer
     */
    handleIncorrectAnswer() {
        Storage.resetStreak();
        this.updateStats();
    }

    /**
     * Show hint
     */
    showHint() {
        if (!this.currentQuestion) return;

        this.usedHint = true;
        const hint = this.currentQuestion.hint;

        Utils.showToast(`💡 힌트: ${hint}`, 'info', 5000);
        AudioManager.playClick();

        // Analyze sequence
        const analysis = Utils.analyzeSequence(this.currentQuestion.sequence);
        if (analysis.type === 'arithmetic') {
            Utils.showToast(`등차수열 (공차: ${analysis.commonDifference})`, 'info', 5000);
        } else if (analysis.type === 'geometric') {
            Utils.showToast(`등비수열 (공비: ${analysis.commonRatio})`, 'info', 5000);
        }
    }

    /**
     * Update statistics display
     */
    updateStats() {
        const stats = Storage.getStats();

        document.getElementById('total-score').textContent = Utils.formatNumber(stats.totalScore);
        document.getElementById('streak-count').textContent = stats.currentStreak;
        document.getElementById('solved-count').textContent = stats.totalSolved;
    }

    /**
     * Change theme
     */
    changeTheme(theme) {
        if (theme === 'default') {
            delete document.body.dataset.theme;
        } else {
            document.body.dataset.theme = theme;
        }
        Storage.updateSetting('theme', theme);
        AudioManager.playClick();
    }

    /**
     * Change animation style
     */
    changeAnimationStyle(style) {
        if (this.animationEngine) {
            this.animationEngine.setStyle(style);
        }
        Storage.updateSetting('animationStyle', style);
        AudioManager.playClick();
    }

    /**
     * Show achievements modal
     */
    showAchievements() {
        const modal = document.getElementById('achievements-modal');
        const list = document.getElementById('achievements-list');
        const unlocked = Storage.getAchievements().unlocked;

        list.innerHTML = this.sequencesData.achievements.map(ach => {
            const isUnlocked = unlocked.includes(ach.id);
            return `
                <div class="tip-item" style="opacity: ${isUnlocked ? 1 : 0.5}">
                    <div style="font-size: 2rem; margin-bottom: 8px;">${ach.icon}</div>
                    <strong>${ach.name}</strong>
                    <p>${ach.description}</p>
                    ${isUnlocked ? '<span style="color: #48bb78;">✓ 달성</span>' : '<span style="color: #a0aec0;">🔒 미달성</span>'}
                </div>
            `;
        }).join('');

        modal.classList.remove('hidden');
        AudioManager.playClick();
    }

    /**
     * Show achievement unlock notification
     */
    showAchievementUnlock(achievementId) {
        const achievement = this.sequencesData.achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 8px;">${achievement.icon}</div>
            <strong>업적 달성!</strong>
            <p>${achievement.name}</p>
        `;

        document.getElementById('toast-container').appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        AudioManager.playAchievement();
    }

    /**
     * Show settings modal
     */
    showSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
        AudioManager.playClick();
    }

    /**
     * Show info modal
     */
    showInfo() {
        document.getElementById('info-modal').classList.remove('hidden');
        AudioManager.playClick();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RhythmSeqApp();
});
