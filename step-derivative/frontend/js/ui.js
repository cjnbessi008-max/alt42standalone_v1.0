/**
 * UI Module
 * Handles all UI updates and rendering
 */

const UI = {
    elements: {},

    /**
     * Initialize UI elements
     */
    init() {
        // Cache DOM elements
        this.elements = {
            loadingScreen: document.getElementById('loading-screen'),
            problemSection: document.getElementById('problem-section'),
            stepsSection: document.getElementById('steps-section'),
            completionScreen: document.getElementById('completion-screen'),
            errorScreen: document.getElementById('error-screen'),

            problemExpression: document.getElementById('problem-expression'),
            difficultyBadge: document.getElementById('difficulty-badge'),
            stepsCount: document.getElementById('steps-count'),

            stepsContainer: document.getElementById('steps-container'),
            stepIndicator: document.getElementById('step-indicator'),
            prevStepBtn: document.getElementById('prev-step-btn'),
            nextStepBtn: document.getElementById('next-step-btn'),

            progressBar: document.getElementById('progress-bar'),

            timeSpent: document.getElementById('time-spent'),
            totalSteps: document.getElementById('total-steps'),

            errorMessage: document.getElementById('error-message'),
            retryBtn: document.getElementById('retry-btn'),
            restartBtn: document.getElementById('restart-btn'),

            currentTime: document.getElementById('current-time')
        };

        // Update clock
        this.updateClock();
        setInterval(() => this.updateClock(), 60000); // Update every minute
    },

    /**
     * Update clock display
     */
    updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        this.elements.currentTime.textContent = `${hours}:${minutes}`;
    },

    /**
     * Show loading screen
     */
    showLoading() {
        this.hideAll();
        this.elements.loadingScreen.classList.remove('hidden');
    },

    /**
     * Show problem
     */
    showProblem(problem) {
        this.hideAll();
        this.elements.problemSection.classList.remove('hidden');

        // Update problem display
        this.elements.problemExpression.textContent = `d/dx(${problem.expression})`;

        // Update difficulty badge
        const difficulty = problem.difficulty_level || 'basic';
        this.elements.difficultyBadge.textContent = this.getDifficultyText(difficulty);
        this.elements.difficultyBadge.className = `difficulty-badge ${difficulty}`;
    },

    /**
     * Show steps
     */
    showSteps(steps, currentStepIndex = 0) {
        this.hideAll();
        this.elements.stepsSection.classList.remove('hidden');
        this.elements.problemSection.classList.remove('hidden');

        // Update steps count
        this.elements.stepsCount.textContent = `총 ${steps.length}단계`;

        // Render steps
        this.renderSteps(steps, currentStepIndex);

        // Update navigation
        this.updateNavigation(currentStepIndex, steps.length);

        // Update progress
        this.updateProgress(currentStepIndex, steps.length);
    },

    /**
     * Render step cards
     */
    renderSteps(steps, currentStepIndex) {
        this.elements.stepsContainer.innerHTML = '';

        steps.forEach((step, index) => {
            const stepCard = this.createStepCard(step, index + 1, index === currentStepIndex);
            this.elements.stepsContainer.appendChild(stepCard);

            // Scroll to current step
            if (index === currentStepIndex) {
                setTimeout(() => {
                    stepCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        });
    },

    /**
     * Create step card element
     */
    createStepCard(step, stepNumber, isActive) {
        const card = document.createElement('div');
        card.className = `step-card ${isActive ? 'active' : ''}`;
        card.style.animationDelay = `${stepNumber * 0.1}s`;

        card.innerHTML = `
            <div class="step-header">
                <span class="step-number">${stepNumber}</span>
                <span class="step-type">${this.getStepTypeText(step.step_type)}</span>
            </div>
            ${step.expression_before ? `
                <div class="step-expression">${step.expression_before}</div>
                <div class="step-arrow">↓</div>
            ` : ''}
            <div class="step-expression">${step.expression_after}</div>
            <div class="step-explanation">${step.explanation}</div>
            ${step.rule_applied ? `<span class="step-rule">${step.rule_applied}</span>` : ''}
        `;

        return card;
    },

    /**
     * Update navigation buttons
     */
    updateNavigation(currentStep, totalSteps) {
        this.elements.prevStepBtn.disabled = currentStep === 0;
        this.elements.nextStepBtn.disabled = currentStep >= totalSteps - 1;
        this.elements.stepIndicator.textContent = `${currentStep + 1} / ${totalSteps}`;
    },

    /**
     * Update progress bar
     */
    updateProgress(currentStep, totalSteps) {
        const progress = ((currentStep + 1) / totalSteps) * 100;
        this.elements.progressBar.style.width = `${progress}%`;
    },

    /**
     * Show completion screen
     */
    showCompletion(timeSpent, totalSteps) {
        this.hideAll();
        this.elements.completionScreen.classList.remove('hidden');

        // Format time
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
        this.elements.timeSpent.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
        this.elements.totalSteps.textContent = totalSteps;
    },

    /**
     * Show error screen
     */
    showError(message) {
        this.hideAll();
        this.elements.errorScreen.classList.remove('hidden');
        this.elements.errorMessage.textContent = message;
    },

    /**
     * Hide all screens
     */
    hideAll() {
        this.elements.loadingScreen.classList.add('hidden');
        this.elements.problemSection.classList.add('hidden');
        this.elements.stepsSection.classList.add('hidden');
        this.elements.completionScreen.classList.add('hidden');
        this.elements.errorScreen.classList.add('hidden');
    },

    /**
     * Get difficulty text in Korean
     */
    getDifficultyText(difficulty) {
        const map = {
            'basic': '기본',
            'intermediate': '중급',
            'advanced': '고급'
        };
        return map[difficulty] || '기본';
    },

    /**
     * Get step type text in Korean
     */
    getStepTypeText(type) {
        const map = {
            'initial': '초기',
            'final': '최종',
            'constant_rule': '상수 규칙',
            'power_rule': '거듭제곱 규칙',
            'constant_multiple': '상수배 규칙',
            'sum_rule': '합/차 규칙',
            'product_rule': '곱셈 규칙',
            'quotient_rule': '나눗셈 규칙',
            'chain_rule': '연쇄 법칙',
            'sin_rule': '사인 미분',
            'cos_rule': '코사인 미분',
            'exponential_rule': '지수 함수',
            'logarithm_rule': '로그 함수',
            'simplification': '식 정리',
            'complex': '복잡한 식'
        };
        return map[type] || type;
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Simple notification implementation
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#ef4444' : '#667eea'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideDown 0.3s;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Export for use in other modules
window.UI = UI;
