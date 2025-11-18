/**
 * UIManager - Handles all UI updates and user interactions
 */

export class UIManager {
    constructor() {
        this.statsContainer = document.getElementById('statsContainer');
        this.problemContainer = document.getElementById('problemContainer');
        this.controlsContainer = document.getElementById('controlsContainer');
        this.loadingState = document.getElementById('loadingState');
        this.progressText = document.getElementById('progressText');
        this.progressBarFill = document.getElementById('progressBarFill');

        this.currentProblem = null;
        this.currentHintShown = false;
    }

    hideLoading() {
        this.loadingState.classList.add('hidden');
        this.statsContainer.classList.remove('hidden');
        this.problemContainer.classList.remove('hidden');
        this.controlsContainer.classList.remove('hidden');
    }

    updateStats(stats) {
        this.statsContainer.innerHTML = `
            <div class="stats-bar">
                <div class="stat-card">
                    <div class="stat-value">${stats.correctAttempts}</div>
                    <div class="stat-label">정답</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalAttempts}</div>
                    <div class="stat-label">시도</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.accuracy}%</div>
                    <div class="stat-label">정답률</div>
                </div>
            </div>
        `;
    }

    renderProblem(problem, problemIndex, totalProblems) {
        this.currentProblem = problem;
        this.currentHintShown = false;

        this.problemContainer.innerHTML = `
            <div class="problem-card">
                <div class="problem-header">
                    <span class="problem-number">문제 ${problemIndex + 1} / ${totalProblems}</span>
                    <span class="level-badge level-${problem.level}">Level ${problem.level}</span>
                </div>

                <h3 class="problem-title">${problem.title}</h3>
                <p class="problem-description">${problem.description}</p>

                <div class="canvas-container">
                    <canvas id="slopeCanvas"></canvas>
                </div>

                <div class="input-section">
                    <label class="input-label" for="answerInput">
                        두 점 (${problem.point1.x}, ${problem.point1.y})와 (${problem.point2.x}, ${problem.point2.y}) 사이의 기울기:
                    </label>
                    <div class="input-wrapper">
                        <input
                            type="number"
                            id="answerInput"
                            class="answer-input"
                            placeholder="답을 입력하세요 (예: 0.5)"
                            step="0.01"
                            autocomplete="off"
                        >
                    </div>
                </div>

                <div class="btn-group">
                    <button class="btn btn-primary" id="submitBtn">
                        ✓ 제출
                    </button>
                    <button class="btn btn-secondary" id="resetBtn">
                        ↻ 다시보기
                    </button>
                </div>

                <button class="btn btn-hint" id="hintBtn">
                    💡 힌트 보기
                </button>

                <div class="hint-box" id="hintBox">
                    ${problem.hint}
                </div>

                <div class="feedback" id="feedback"></div>
            </div>
        `;

        // Setup event listeners for answer input
        const answerInput = document.getElementById('answerInput');
        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('submitBtn').click();
            }
        });
    }

    renderControls(currentSpeed, currentAnimation) {
        this.controlsContainer.innerHTML = `
            <div class="controls-card">
                <h4 class="controls-title">🎮 애니메이션 컨트롤</h4>

                <div class="control-row">
                    <span class="control-label">속도</span>
                    <input
                        type="range"
                        id="speedSlider"
                        class="control-slider"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value="${currentSpeed}"
                    >
                    <span class="control-value" id="speedValue">${currentSpeed.toFixed(1)}x</span>
                </div>

                <div class="btn-group">
                    <button class="btn btn-secondary" id="playBtn">
                        ▶ 재생
                    </button>
                    <button class="btn btn-secondary" id="pauseBtn">
                        ⏸ 일시정지
                    </button>
                </div>

                <div class="control-row" style="flex-direction: column; align-items: stretch;">
                    <span class="control-label" style="margin-bottom: 8px;">애니메이션 타입</span>
                    <select id="animationSelect" class="animation-select">
                        <option value="ball_roll" ${currentAnimation === 'ball_roll' ? 'selected' : ''}>
                            🎱 공 굴리기
                        </option>
                        <option value="skier" ${currentAnimation === 'skier' ? 'selected' : ''}>
                            ⛷️ 스키어
                        </option>
                        <option value="car_drive" ${currentAnimation === 'car_drive' ? 'selected' : ''}>
                            🚗 자동차
                        </option>
                        <option value="water_flow" ${currentAnimation === 'water_flow' ? 'selected' : ''}>
                            💧 물 흐름
                        </option>
                    </select>
                </div>
            </div>
        `;
    }

    showHint() {
        const hintBox = document.getElementById('hintBox');
        if (hintBox) {
            hintBox.classList.toggle('show');
            this.currentHintShown = hintBox.classList.contains('show');
        }
    }

    showFeedback(isCorrect, message, explanation = '') {
        const feedback = document.getElementById('feedback');
        if (!feedback) return;

        feedback.className = `feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.innerHTML = `
            <div>${message}</div>
            ${explanation ? `<div class="feedback-explanation">${explanation}</div>` : ''}
        `;

        feedback.classList.add('pulse');
        setTimeout(() => feedback.classList.remove('pulse'), 500);

        // Auto-scroll to feedback
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    hideFeedback() {
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.classList.remove('show');
        }
    }

    showNextButton(onNext) {
        const feedback = document.getElementById('feedback');
        if (!feedback) return;

        const existingBtn = document.getElementById('nextProblemBtn');
        if (!existingBtn) {
            const nextBtn = document.createElement('button');
            nextBtn.id = 'nextProblemBtn';
            nextBtn.className = 'btn btn-next';
            nextBtn.innerHTML = '➜ 다음 문제';
            nextBtn.onclick = onNext;

            feedback.parentElement.appendChild(nextBtn);

            // Scroll to button
            setTimeout(() => {
                nextBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        }
    }

    hideNextButton() {
        const nextBtn = document.getElementById('nextProblemBtn');
        if (nextBtn) {
            nextBtn.remove();
        }
    }

    updateProgress(current, total) {
        const percentage = (current / total) * 100;
        this.progressText.textContent = `${current} / ${total}`;
        this.progressBarFill.style.width = `${percentage}%`;
    }

    disableInput() {
        const answerInput = document.getElementById('answerInput');
        const submitBtn = document.getElementById('submitBtn');

        if (answerInput) answerInput.disabled = true;
        if (submitBtn) submitBtn.disabled = true;
    }

    enableInput() {
        const answerInput = document.getElementById('answerInput');
        const submitBtn = document.getElementById('submitBtn');

        if (answerInput) {
            answerInput.disabled = false;
            answerInput.focus();
        }
        if (submitBtn) submitBtn.disabled = false;
    }

    clearInput() {
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.value = '';
        }
    }

    getInputValue() {
        const answerInput = document.getElementById('answerInput');
        return answerInput ? parseFloat(answerInput.value) : null;
    }

    showCompletionScreen(stats) {
        this.problemContainer.innerHTML = `
            <div class="problem-card" style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                <h2 style="font-size: 28px; margin-bottom: 12px; color: var(--text-color);">
                    축하합니다!
                </h2>
                <p style="font-size: 16px; color: var(--text-light); margin-bottom: 30px;">
                    모든 문제를 완료했습니다!
                </p>

                <div class="stats-bar" style="margin-bottom: 30px;">
                    <div class="stat-card">
                        <div class="stat-value">${stats.correctAttempts}</div>
                        <div class="stat-label">정답</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalAttempts}</div>
                        <div class="stat-label">시도</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.accuracy}%</div>
                        <div class="stat-label">정답률</div>
                    </div>
                </div>

                <div style="background: var(--bg-color); padding: 20px; border-radius: var(--radius-md); margin-bottom: 20px;">
                    <div style="font-size: 14px; color: var(--text-light); margin-bottom: 8px;">총 학습 시간</div>
                    <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);">
                        ${this.formatTime(stats.totalTime)}
                    </div>
                </div>

                <button class="btn btn-primary" id="restartBtn" style="width: 100%; padding: 16px; font-size: 16px;">
                    🔄 처음부터 다시 시작
                </button>

                <button class="btn btn-secondary" id="exportBtn" style="width: 100%; padding: 16px; font-size: 16px; margin-top: 12px;">
                    💾 학습 데이터 내보내기
                </button>
            </div>
        `;

        this.controlsContainer.classList.add('hidden');
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}분 ${secs}초`;
    }

    showError(message) {
        this.loadingState.innerHTML = `
            <div style="text-align: center; color: var(--error-color);">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">오류 발생</div>
                <div style="font-size: 14px; color: var(--text-light);">${message}</div>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">
                    새로고침
                </button>
            </div>
        `;
    }
}

export default UIManager;
