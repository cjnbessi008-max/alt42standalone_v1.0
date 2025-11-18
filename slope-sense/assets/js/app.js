/**
 * Slope Sense Main Application
 * Handles user interaction and Moodle API integration
 */

class SlopeSenseApp {
    constructor() {
        this.animation = null;
        this.currentProblem = null;
        this.problems = [];
        this.currentProblemIndex = 0;
        this.sessionData = null;
        this.startTime = null;
        this.hintsUsed = 0;

        // Stats
        this.correctCount = 0;
        this.totalCount = 0;

        // API configuration
        this.apiBaseUrl = 'api/endpoints.php';
        this.courseId = this.getUrlParam('course_id') || 1;
        this.activityId = this.getUrlParam('activity_id') || 1;
        this.userId = this.getUrlParam('user_id') || 1;

        // Initialize
        this.init();
    }

    async init() {
        // Initialize animation
        this.animation = new SlopeAnimation('slopeCanvas');

        // Setup event listeners
        this.setupEventListeners();

        // Load problems from API
        await this.loadProblems();

        // Start with first problem
        if (this.problems.length > 0) {
            this.loadProblem(0);
            this.animation.play();
        }
    }

    setupEventListeners() {
        // Submit button
        document.getElementById('submitBtn').addEventListener('click', () => {
            this.submitAnswer();
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.animation.reset();
            this.animation.play();
        });

        // Hint button
        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showHint();
        });

        // Play button
        document.getElementById('playBtn').addEventListener('click', () => {
            this.animation.play();
        });

        // Pause button
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.animation.pause();
        });

        // Speed control
        const speedControl = document.getElementById('speedControl');
        speedControl.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.animation.setSpeed(speed);
            document.getElementById('speedValue').textContent = `${speed.toFixed(1)}x`;
        });

        // Animation type
        document.getElementById('animationType').addEventListener('change', (e) => {
            this.animation.setAnimationType(e.target.value);
        });

        // Answer input - submit on Enter
        document.getElementById('answerInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });
    }

    getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    async loadProblems() {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}?action=init&course_id=${this.courseId}&activity_id=${this.activityId}&user_id=${this.userId}`
            );

            const data = await response.json();

            if (data.success) {
                this.sessionData = data.data.session;
                this.problems = data.data.problems;
                console.log('Loaded problems:', this.problems);
            } else {
                console.error('Failed to load problems:', data.error);
                // Use sample problems as fallback
                this.useSampleProblems();
            }
        } catch (error) {
            console.error('Error loading problems:', error);
            // Use sample problems as fallback
            this.useSampleProblems();
        }
    }

    useSampleProblems() {
        this.problems = [
            {
                id: 1,
                problem_text: '두 점 (0,0)과 (4,2) 사이의 기울기를 구하세요.',
                point1_x: 0,
                point1_y: 0,
                point2_x: 4,
                point2_y: 2,
                correct_slope: 0.5,
                difficulty_level: 1,
                hint_text: '기울기 = (y₂ - y₁) / (x₂ - x₁)',
                animation_type: 'ball_roll'
            },
            {
                id: 2,
                problem_text: '두 점 (2,3)과 (6,7) 사이의 기울기를 구하세요.',
                point1_x: 2,
                point1_y: 3,
                point2_x: 6,
                point2_y: 7,
                correct_slope: 1.0,
                difficulty_level: 1,
                hint_text: '상승(rise)은 4이고 진행(run)은 4입니다.',
                animation_type: 'skier'
            },
            {
                id: 3,
                problem_text: '두 점 (1,5)과 (5,1) 사이의 기울기를 구하세요.',
                point1_x: 1,
                point1_y: 5,
                point2_x: 5,
                point2_y: 1,
                correct_slope: -1.0,
                difficulty_level: 2,
                hint_text: '음수 기울기는 선이 내려간다는 의미입니다.',
                animation_type: 'ball_roll'
            },
            {
                id: 4,
                problem_text: '두 점 (0,0)과 (3,9) 사이의 기울기를 구하세요.',
                point1_x: 0,
                point1_y: 0,
                point2_x: 3,
                point2_y: 9,
                correct_slope: 3.0,
                difficulty_level: 2,
                hint_text: '기울기 3은 꽤 가파릅니다!',
                animation_type: 'car_drive'
            },
            {
                id: 5,
                problem_text: '두 점 (-2,-3)과 (4,3) 사이의 기울기를 구하세요.',
                point1_x: -2,
                point1_y: -3,
                point2_x: 4,
                point2_y: 3,
                correct_slope: 1.0,
                difficulty_level: 3,
                hint_text: '음수 좌표를 주의깊게 다루세요.',
                animation_type: 'water_flow'
            }
        ];
    }

    loadProblem(index) {
        if (index >= this.problems.length) {
            this.showCompletion();
            return;
        }

        this.currentProblemIndex = index;
        this.currentProblem = this.problems[index];
        this.startTime = Date.now();
        this.hintsUsed = 0;

        // Update UI
        document.getElementById('problemNumber').textContent = `문제 #${index + 1}`;
        document.getElementById('problemText').textContent = this.currentProblem.problem_text;

        const difficultyBadge = document.getElementById('difficultyBadge');
        difficultyBadge.textContent = `난이도 ${this.currentProblem.difficulty_level}`;
        difficultyBadge.className = `difficulty-badge difficulty-${this.currentProblem.difficulty_level}`;

        // Update hint
        document.getElementById('hintBox').textContent = `💡 ${this.currentProblem.hint_text}`;
        document.getElementById('hintBox').classList.remove('show');

        // Clear input and feedback
        document.getElementById('answerInput').value = '';
        document.getElementById('feedback').classList.remove('show');

        // Update animation
        const point1 = {
            x: parseFloat(this.currentProblem.point1_x),
            y: parseFloat(this.currentProblem.point1_y)
        };
        const point2 = {
            x: parseFloat(this.currentProblem.point2_x),
            y: parseFloat(this.currentProblem.point2_y)
        };

        this.animation.setProblem(point1, point2);
        this.animation.setAnimationType(this.currentProblem.animation_type || 'ball_roll');
        document.getElementById('animationType').value = this.currentProblem.animation_type || 'ball_roll';

        // Update progress
        this.updateProgress();
    }

    showHint() {
        const hintBox = document.getElementById('hintBox');
        hintBox.classList.toggle('show');

        if (hintBox.classList.contains('show')) {
            this.hintsUsed++;
        }
    }

    async submitAnswer() {
        const answerInput = document.getElementById('answerInput');
        const userAnswer = parseFloat(answerInput.value);

        if (isNaN(userAnswer)) {
            this.showFeedback('답을 입력해주세요!', false);
            return;
        }

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        const correctSlope = parseFloat(this.currentProblem.correct_slope);
        const tolerance = 0.01;
        const isCorrect = Math.abs(userAnswer - correctSlope) < tolerance;

        // Update stats
        this.totalCount++;
        if (isCorrect) {
            this.correctCount++;
        }
        this.updateStats();

        // Show feedback
        if (isCorrect) {
            this.showFeedback(`🎉 정답입니다! 기울기는 ${correctSlope}입니다.`, true);

            // Submit to API
            if (this.sessionData) {
                await this.submitToAPI(userAnswer, timeSpent, isCorrect);
            }

            // Move to next problem after delay
            setTimeout(() => {
                this.loadProblem(this.currentProblemIndex + 1);
                this.animation.play();
            }, 2000);
        } else {
            this.showFeedback(
                `❌ 틀렸습니다. 다시 시도해보세요! (힌트: 기울기 = rise/run)`,
                false
            );

            // Submit wrong attempt to API
            if (this.sessionData) {
                await this.submitToAPI(userAnswer, timeSpent, isCorrect);
            }
        }
    }

    async submitToAPI(userAnswer, timeSpent, isCorrect) {
        try {
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'submit_answer',
                    session_id: this.sessionData.session_id,
                    problem_id: this.currentProblem.id,
                    user_id: this.userId,
                    answer: userAnswer,
                    time_spent: timeSpent,
                    hints_used: this.hintsUsed
                })
            });

            const data = await response.json();
            console.log('Submission result:', data);
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
    }

    showFeedback(message, isCorrect) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');

        // Add pulse animation
        feedback.classList.add('pulse');
        setTimeout(() => {
            feedback.classList.remove('pulse');
        }, 500);
    }

    updateStats() {
        document.getElementById('correctCount').textContent = this.correctCount;
        document.getElementById('totalCount').textContent = this.totalCount;

        const accuracy = this.totalCount > 0
            ? Math.round((this.correctCount / this.totalCount) * 100)
            : 0;
        document.getElementById('accuracyRate').textContent = `${accuracy}%`;
    }

    updateProgress() {
        const progress = this.currentProblemIndex + 1;
        const total = this.problems.length;
        const percentage = (progress / total) * 100;

        document.getElementById('progressText').textContent = `${progress} / ${total}`;
        document.getElementById('progressFill').style.width = `${percentage}%`;
    }

    showCompletion() {
        const contentWrapper = document.querySelector('.content-wrapper');
        contentWrapper.innerHTML = `
            <div class="problem-card" style="text-align: center; padding: 40px;">
                <h2 style="font-size: 32px; margin-bottom: 20px;">🎊 축하합니다!</h2>
                <p style="font-size: 18px; margin-bottom: 30px;">
                    모든 문제를 완료했습니다!
                </p>
                <div class="stats">
                    <div class="stat-item">
                        <div class="stat-value">${this.correctCount}</div>
                        <div class="stat-label">정답</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.totalCount}</div>
                        <div class="stat-label">시도</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${Math.round((this.correctCount / this.totalCount) * 100)}%</div>
                        <div class="stat-label">정답률</div>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 30px; padding: 15px 40px;">
                    다시 시작
                </button>
            </div>
        `;

        this.animation.pause();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.slopeSenseApp = new SlopeSenseApp();
});
