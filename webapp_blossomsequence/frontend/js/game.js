/**
 * Game Logic Controller
 * Manages the quiz/game flow
 */

class GameController {
    constructor() {
        this.currentProblem = null;
        this.sequence = [];
        this.correctAnswer = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.attempts = [];
        this.currentAttemptNumber = 0;
        this.maxAttempts = 10;

        this.blossomVisualizer = new BlossomVisualizer('blossomCanvas');
    }

    async startGame(config) {
        this.currentProblem = config;
        this.attempts = [];
        this.currentAttemptNumber = 0;
        this.startTime = Date.now();

        // Generate sequence
        this.sequence = SequenceGenerator.generate(
            config.sequenceType,
            config.petalCount || 8,
            config.params || {}
        );

        this.correctAnswer = SequenceGenerator.calculateNext(
            this.sequence,
            config.sequenceType
        );

        // Update UI
        this.updateProblemInfo();
        this.displaySequenceNumbers();

        // Start visualization
        this.blossomVisualizer.setSequence(this.sequence, config.petalCount || 8);
        this.blossomVisualizer.startAnimation();

        // Start timer
        this.startTimer();

        // Show game screen
        app.showScreen('gameScreen');

        // Clear input
        document.getElementById('answerInput').value = '';
        document.getElementById('feedbackArea').textContent = '';
        document.getElementById('feedbackArea').className = 'feedback-area';
    }

    updateProblemInfo() {
        const typeNames = {
            'fibonacci': '피보나치',
            'arithmetic': '등차수열',
            'geometric': '등비수열',
            'square': '제곱수',
            'prime': '소수'
        };

        document.getElementById('currentSequenceType').textContent =
            typeNames[this.currentProblem.sequenceType] || this.currentProblem.sequenceType;
        document.getElementById('currentDifficulty').textContent =
            `레벨 ${this.currentProblem.difficulty}`;
        document.getElementById('currentProgress').textContent =
            `${this.currentAttemptNumber}/${this.maxAttempts}`;
    }

    displaySequenceNumbers() {
        const container = document.getElementById('sequenceNumbers');
        container.innerHTML = '';

        this.sequence.forEach((num, index) => {
            const numberDiv = document.createElement('div');
            numberDiv.className = 'sequence-number';
            numberDiv.textContent = num;
            numberDiv.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(numberDiv);
        });

        // Add mystery number
        const mystery = document.createElement('div');
        mystery.className = 'sequence-number mystery';
        mystery.textContent = '?';
        mystery.style.animationDelay = `${this.sequence.length * 0.1}s`;
        container.appendChild(mystery);
    }

    startTimer() {
        this.stopTimer();
        let seconds = 0;

        this.timerInterval = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            document.getElementById('timer').textContent =
                `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    getElapsedTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    submitAnswer(userAnswer) {
        const isCorrect = Math.abs(parseFloat(userAnswer) - this.correctAnswer) < 0.01;
        const timeSpent = this.getElapsedTime();

        this.currentAttemptNumber++;

        const attempt = {
            attemptNumber: this.currentAttemptNumber,
            userAnswer: parseFloat(userAnswer),
            correctAnswer: this.correctAnswer,
            isCorrect,
            timeSpent,
            timestamp: Date.now()
        };

        this.attempts.push(attempt);

        // Show feedback
        this.showFeedback(isCorrect, this.correctAnswer);

        // Check if game should end
        if (this.currentAttemptNumber >= this.maxAttempts || isCorrect) {
            setTimeout(() => {
                this.endGame();
            }, 2000);
        } else {
            // Next problem
            setTimeout(() => {
                this.nextProblem();
            }, 2000);
        }

        return isCorrect;
    }

    showFeedback(isCorrect, correctAnswer) {
        const feedbackArea = document.getElementById('feedbackArea');

        if (isCorrect) {
            feedbackArea.className = 'feedback-area correct';
            feedbackArea.textContent = '🎉 정답입니다!';
            this.blossomVisualizer.celebrate();
        } else {
            feedbackArea.className = 'feedback-area incorrect';
            feedbackArea.textContent = `❌ 틀렸습니다. 정답은 ${correctAnswer}입니다.`;
        }
    }

    showHint() {
        const hints = {
            'fibonacci': '이전 두 수를 더하면...?',
            'arithmetic': '수들 사이의 차이를 확인해보세요.',
            'geometric': '수들 사이의 배수 관계를 찾아보세요.',
            'square': '각 수는 완전제곱수입니다. 다음 제곱수는?',
            'prime': '다음 소수를 찾아보세요. 2, 3, 5로 나눠지지 않나요?'
        };

        const hint = hints[this.currentProblem.sequenceType] || '패턴을 주의깊게 관찰하세요!';

        const feedbackArea = document.getElementById('feedbackArea');
        feedbackArea.className = 'feedback-area hint';
        feedbackArea.textContent = `💡 힌트: ${hint}`;

        setTimeout(() => {
            feedbackArea.textContent = '';
            feedbackArea.className = 'feedback-area';
        }, 4000);
    }

    skipProblem() {
        const attempt = {
            attemptNumber: ++this.currentAttemptNumber,
            userAnswer: null,
            correctAnswer: this.correctAnswer,
            isCorrect: false,
            timeSpent: this.getElapsedTime(),
            timestamp: Date.now(),
            skipped: true
        };

        this.attempts.push(attempt);

        if (this.currentAttemptNumber >= this.maxAttempts) {
            this.endGame();
        } else {
            this.nextProblem();
        }
    }

    nextProblem() {
        // Generate new sequence
        this.sequence = SequenceGenerator.generate(
            this.currentProblem.sequenceType,
            this.currentProblem.petalCount || 8
        );

        this.correctAnswer = SequenceGenerator.calculateNext(
            this.sequence,
            this.currentProblem.sequenceType
        );

        // Update UI
        this.updateProblemInfo();
        this.displaySequenceNumbers();

        // Restart visualization
        this.blossomVisualizer.setSequence(this.sequence, this.currentProblem.petalCount || 8);
        this.blossomVisualizer.startAnimation();

        // Clear input
        document.getElementById('answerInput').value = '';
        document.getElementById('feedbackArea').textContent = '';
        document.getElementById('feedbackArea').className = 'feedback-area';
    }

    async endGame() {
        this.stopTimer();

        // Calculate results
        const correctCount = this.attempts.filter(a => a.isCorrect).length;
        const totalTime = this.getElapsedTime();
        const accuracy = (correctCount / this.attempts.length) * 100;

        const results = {
            sequenceType: this.currentProblem.sequenceType,
            difficulty: this.currentProblem.difficulty,
            correctCount,
            totalAttempts: this.attempts.length,
            accuracy,
            totalTime,
            attempts: this.attempts
        };

        // Save attempt to backend
        try {
            await api.submitAttempt({
                userId: authManager.getCurrentUserId(),
                ...results
            });
        } catch (error) {
            console.error('Failed to save attempt:', error);
        }

        // Update recommendation profile
        await recommendationEngine.updateProfile({
            sequenceType: this.currentProblem.sequenceType,
            difficulty: this.currentProblem.difficulty,
            correct: correctCount,
            timeSpent: totalTime,
            accuracy: accuracy / 100
        });

        // Show results
        this.showResults(results);
    }

    showResults(results) {
        // Update results display
        document.getElementById('resultAccuracy').textContent =
            `${Math.round(results.accuracy)}%`;

        const minutes = Math.floor(results.totalTime / 60);
        const seconds = results.totalTime % 60;
        document.getElementById('resultTime').textContent =
            `${minutes}:${String(seconds).padStart(2, '0')}`;

        document.getElementById('resultCorrect').textContent =
            `${results.correctCount}/${results.totalAttempts}`;

        // Performance analysis
        const analysis = recommendationEngine.getPerformanceAnalysis();
        document.getElementById('analysisText').innerHTML = `
            <p>${analysis.text}</p>
            <ul>
                ${analysis.suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
        `;

        // Next recommendation
        const nextText = recommendationEngine.getNextRecommendationText(results);
        document.getElementById('nextRecommendation').textContent = nextText;

        // Show results screen
        app.showScreen('resultsScreen');
    }

    exitGame() {
        this.stopTimer();
        if (confirm('게임을 종료하시겠습니까? 진행 상황이 저장되지 않습니다.')) {
            app.showScreen('dashboardScreen');
        }
    }
}

const gameController = new GameController();
