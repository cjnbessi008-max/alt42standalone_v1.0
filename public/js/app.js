/**
 * Main Application Logic
 */

class App {
    constructor() {
        this.currentProblem = null;
        this.currentComparison = null;
        this.studentId = CONFIG.getStudentId();
        this.startTime = null;
        this.timerInterval = null;

        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        this.setupEventListeners();
        this.loadUserInfo();
        console.log('App initialized for student ID:', this.studentId);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Start random problem
        document.getElementById('btnStartRandom').addEventListener('click', () => {
            this.startRandomProblem();
        });

        // Close problem
        document.getElementById('btnCloseProblem').addEventListener('click', () => {
            this.closeProblem();
        });

        // Solution selection buttons
        document.querySelectorAll('.btn-select').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const solution = e.target.closest('[data-solution]').dataset.solution;
                this.selectSolution(solution);
            });
        });

        // Next problem button
        document.getElementById('btnNext').addEventListener('click', () => {
            this.startRandomProblem();
        });

        // Stats button
        document.getElementById('btnStats').addEventListener('click', () => {
            this.showStats();
        });

        // Close stats modal
        document.getElementById('btnCloseStats').addEventListener('click', () => {
            this.closeStats();
        });

        // Close modal on background click
        document.getElementById('statsModal').addEventListener('click', (e) => {
            if (e.target.id === 'statsModal') {
                this.closeStats();
            }
        });
    }

    /**
     * Load user info
     */
    async loadUserInfo() {
        try {
            const userName = `학생 #${this.studentId}`;
            document.getElementById('userName').textContent = userName;
        } catch (error) {
            console.error('Failed to load user info:', error);
        }
    }

    /**
     * Start random problem
     */
    async startRandomProblem() {
        try {
            const subject = document.getElementById('subjectFilter').value;
            const difficulty = document.getElementById('difficultyFilter').value;

            // Show loading
            this.showLoading('문제를 불러오는 중...');

            // Get random problem
            const filters = {};
            if (subject) filters.subject = subject;
            if (difficulty) filters.difficulty = difficulty;

            const problemResponse = await API.getRandomProblem(filters);

            if (!problemResponse.success) {
                throw new Error(problemResponse.error);
            }

            this.currentProblem = problemResponse.data;

            // Get comparison pair
            const comparisonResponse = await API.getComparison(this.currentProblem.id);

            if (!comparisonResponse.success) {
                throw new Error(comparisonResponse.error);
            }

            this.currentComparison = comparisonResponse.data;

            // Display problem
            this.displayProblem();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load problem:', error);
            this.showError('문제를 불러오는데 실패했습니다. 다시 시도해주세요.');
            this.hideLoading();
        }
    }

    /**
     * Display problem and solutions
     */
    displayProblem() {
        const problem = this.currentComparison.problem;
        const solutions = this.currentComparison.solutions;

        // Hide selection, show problem
        document.getElementById('problemSelection').classList.add('hidden');
        document.getElementById('problemDisplay').classList.remove('hidden');
        document.getElementById('feedbackSection').classList.add('hidden');

        // Set problem details
        document.getElementById('problemTitle').textContent = problem.title;
        document.getElementById('problemDescription').textContent = problem.description;
        document.getElementById('problemSubject').textContent = problem.subject;
        document.getElementById('problemDifficulty').textContent = problem.difficulty_level;
        document.getElementById('problemGrade').textContent = problem.grade_level || '전체';

        // Display problem data if available
        const problemDataDiv = document.getElementById('problemData');
        if (problem.problem_data) {
            problemDataDiv.innerHTML = this.formatProblemData(problem.problem_data);
        } else {
            problemDataDiv.innerHTML = '';
        }

        // Display solutions
        this.displaySolution('A', solutions.solution_a);
        this.displaySolution('B', solutions.solution_b);

        // Reset solution cards
        document.getElementById('solutionA').classList.remove('selected', 'correct', 'incorrect');
        document.getElementById('solutionB').classList.remove('selected', 'correct', 'incorrect');

        // Store solution IDs
        document.getElementById('solutionA').dataset.solutionId = solutions.solution_a.id;
        document.getElementById('solutionB').dataset.solutionId = solutions.solution_b.id;

        // Enable selection buttons
        document.querySelectorAll('.btn-select').forEach(btn => {
            btn.disabled = false;
        });

        // Start timer
        this.startTimer();
    }

    /**
     * Display individual solution
     */
    displaySolution(label, solution) {
        const stepsContainer = document.getElementById(`steps${label}`);
        const answerContainer = document.getElementById(`answer${label}`);

        // Display steps
        stepsContainer.innerHTML = '';
        solution.steps.forEach(step => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step';
            stepDiv.innerHTML = `
                <div class="step-number">Step ${step.step_number}</div>
                <div class="step-description">${step.description}</div>
                ${step.calculation ? `<div class="step-calculation">${step.calculation}</div>` : ''}
                ${step.result ? `<div class="step-result">→ ${step.result}</div>` : ''}
            `;
            stepsContainer.appendChild(stepDiv);
        });

        // Display answer
        answerContainer.textContent = solution.final_answer;
    }

    /**
     * Format problem data for display
     */
    formatProblemData(data) {
        if (typeof data === 'object') {
            return Object.entries(data)
                .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                .join('<br>');
        }
        return data;
    }

    /**
     * Start timer
     */
    startTimer() {
        this.startTime = Date.now();
        const timerDisplay = document.getElementById('timer');

        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        return elapsed;
    }

    /**
     * Select solution
     */
    async selectSolution(solution) {
        const timeSpent = this.stopTimer();

        // Disable buttons
        document.querySelectorAll('.btn-select').forEach(btn => {
            btn.disabled = true;
        });

        const solutionCard = document.getElementById(`solution${solution.toUpperCase()}`);
        solutionCard.classList.add('selected');

        const selectedSolutionId = parseInt(solutionCard.dataset.solutionId);

        // Get correct and incorrect IDs
        const correctSolution = this.currentComparison.solutions.solution_a.solution_type === 'correct'
            ? this.currentComparison.solutions.solution_a
            : this.currentComparison.solutions.solution_b;

        const incorrectSolution = this.currentComparison.solutions.solution_a.solution_type === 'incorrect'
            ? this.currentComparison.solutions.solution_a
            : this.currentComparison.solutions.solution_b;

        // Submit attempt
        try {
            const attemptData = {
                student_id: this.studentId,
                problem_id: this.currentProblem.id,
                selected_solution_id: selectedSolutionId,
                correct_solution_id: correctSolution.id,
                incorrect_solution_id: incorrectSolution.id,
                time_spent_seconds: timeSpent,
                hints_used: 0
            };

            // Add Moodle info if available
            const activityId = CONFIG.getMoodleActivityId();
            if (activityId) {
                attemptData.moodle_activity_id = activityId;
            }

            const response = await API.submitAttempt(attemptData);

            if (!response.success) {
                throw new Error(response.error);
            }

            // Show feedback
            this.showFeedback(response.data);
        } catch (error) {
            console.error('Failed to submit attempt:', error);
            this.showError('결과를 제출하는데 실패했습니다.');
        }
    }

    /**
     * Show feedback
     */
    showFeedback(data) {
        const feedbackSection = document.getElementById('feedbackSection');
        const feedbackCard = feedbackSection.querySelector('.feedback-card');
        const feedbackTitle = document.getElementById('feedbackTitle');
        const feedbackMessage = document.getElementById('feedbackMessage');
        const feedbackDetails = document.getElementById('feedbackDetails');

        // Mark solutions
        if (data.is_correct) {
            feedbackCard.className = 'card feedback-card success';
            feedbackTitle.textContent = '정답입니다! 🎉';
            feedbackMessage.textContent = '훌륭합니다! 올바른 풀이를 선택하셨습니다.';
            feedbackDetails.innerHTML = '';

            // Highlight correct solution
            const correctId = this.currentComparison.correct_id;
            const solutionA = document.getElementById('solutionA');
            const solutionB = document.getElementById('solutionB');

            if (parseInt(solutionA.dataset.solutionId) === correctId) {
                solutionA.classList.add('correct');
            } else {
                solutionB.classList.add('correct');
            }
        } else {
            feedbackCard.className = 'card feedback-card error';
            feedbackTitle.textContent = '아쉽습니다 😔';
            feedbackMessage.textContent = data.feedback.message;

            // Show detailed explanation
            let detailsHTML = '';

            if (data.feedback.mistake_type) {
                detailsHTML += `<div class="mistake-type">${data.feedback.mistake_type}</div>`;
            }

            if (data.feedback.mistake_description) {
                detailsHTML += `<h4>어떤 실수였나요?</h4>`;
                detailsHTML += `<p>${data.feedback.mistake_description}</p>`;
            }

            if (data.feedback.explanation) {
                detailsHTML += `<h4>자세한 설명</h4>`;
                detailsHTML += `<p>${data.feedback.explanation}</p>`;
            }

            feedbackDetails.innerHTML = detailsHTML;

            // Highlight correct and incorrect solutions
            const correctId = this.currentComparison.correct_id;
            const solutionA = document.getElementById('solutionA');
            const solutionB = document.getElementById('solutionB');

            if (parseInt(solutionA.dataset.solutionId) === correctId) {
                solutionA.classList.add('correct');
                solutionB.classList.add('incorrect');
            } else {
                solutionB.classList.add('correct');
                solutionA.classList.add('incorrect');
            }
        }

        feedbackSection.classList.remove('hidden');
        feedbackSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Close problem and return to selection
     */
    closeProblem() {
        document.getElementById('problemDisplay').classList.add('hidden');
        document.getElementById('problemSelection').classList.remove('hidden');
        this.stopTimer();
    }

    /**
     * Show statistics modal
     */
    async showStats() {
        try {
            const modal = document.getElementById('statsModal');
            const statsGrid = document.getElementById('statsGrid');
            const attemptsTable = document.getElementById('attemptsTable');

            // Show loading
            statsGrid.innerHTML = '<p>통계를 불러오는 중...</p>';
            modal.classList.remove('hidden');

            // Get stats
            const response = await API.getStudentStats(this.studentId);

            if (!response.success) {
                throw new Error(response.error);
            }

            const stats = response.data;

            // Display overall stats
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${stats.overall.total_attempts || 0}</div>
                    <div class="stat-label">총 시도 횟수</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.overall.correct_identifications || 0}</div>
                    <div class="stat-label">정답 횟수</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.overall.accuracy_rate || 0}%</div>
                    <div class="stat-label">정확도</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.overall.avg_time_seconds || 0}초</div>
                    <div class="stat-label">평균 풀이 시간</div>
                </div>
            `;

            // Get recent attempts
            const historyResponse = await API.getAttemptHistory(this.studentId, { limit: 10 });

            if (historyResponse.success && historyResponse.data.length > 0) {
                let tableHTML = '<table style="width: 100%; border-collapse: collapse;">';
                tableHTML += '<thead><tr><th>문제</th><th>결과</th><th>실수 유형</th><th>시간</th></tr></thead><tbody>';

                historyResponse.data.forEach(attempt => {
                    const result = attempt.is_correct ? '✅ 정답' : '❌ 오답';
                    const mistakeType = attempt.mistake_type || '-';
                    const time = attempt.time_spent_seconds ? `${attempt.time_spent_seconds}초` : '-';

                    tableHTML += `
                        <tr>
                            <td>${attempt.problem_title}</td>
                            <td>${result}</td>
                            <td>${mistakeType}</td>
                            <td>${time}</td>
                        </tr>
                    `;
                });

                tableHTML += '</tbody></table>';
                attemptsTable.innerHTML = tableHTML;
            } else {
                attemptsTable.innerHTML = '<p>아직 시도한 문제가 없습니다.</p>';
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
            this.showError('통계를 불러오는데 실패했습니다.');
        }
    }

    /**
     * Close statistics modal
     */
    closeStats() {
        document.getElementById('statsModal').classList.add('hidden');
    }

    /**
     * Show loading message
     */
    showLoading(message = '로딩 중...') {
        // Simple implementation - could be enhanced with a proper loading overlay
        console.log('Loading:', message);
    }

    /**
     * Hide loading message
     */
    hideLoading() {
        console.log('Loading complete');
    }

    /**
     * Show error message
     */
    showError(message) {
        alert(message); // Simple implementation - could be enhanced with better UI
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
