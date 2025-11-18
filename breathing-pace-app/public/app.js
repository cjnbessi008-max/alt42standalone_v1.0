// Breathing Pace Learning Assistant - Main Application
// 호흡 템포 학습 도우미

class BreathingPaceApp {
    constructor() {
        this.moodleConfig = {
            url: '',
            token: '',
            quizId: null
        };

        this.currentQuestion = null;
        this.breathingState = {
            isActive: false,
            isPaused: false,
            currentCycle: 0,
            maxCycles: 3,
            currentPhase: 'idle' // idle, inhale, exhale, complete
        };

        this.breathingTemplates = {
            easy: { inhale: 4, exhale: 4, description: '빠른 템포 (4-4)' },
            medium: { inhale: 4, exhale: 7, description: '중간 템포 (4-7)' },
            hard: { inhale: 4, exhale: 8, description: '느린 템포 (4-8)' },
            'very-hard': { inhale: 5, exhale: 10, description: '매우 느린 템포 (5-10)' }
        };

        this.stats = {
            totalSessions: 0,
            totalCycles: 0,
            difficulties: []
        };

        this.initializeApp();
    }

    initializeApp() {
        this.loadStats();
        this.attachEventListeners();
        this.updateStatsDisplay();
    }

    attachEventListeners() {
        // Moodle 설정 폼
        document.getElementById('moodle-config-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.connectToMoodle();
        });

        // 호흡 가이드 시작
        document.getElementById('start-breathing-btn').addEventListener('click', () => {
            this.startBreathingSession();
        });

        // 호흡 제어 버튼들
        document.getElementById('pause-breathing-btn').addEventListener('click', () => {
            this.togglePauseBreathing();
        });

        document.getElementById('stop-breathing-btn').addEventListener('click', () => {
            this.stopBreathing();
        });

        document.getElementById('complete-breathing-btn').addEventListener('click', () => {
            this.completeSession();
        });
    }

    async connectToMoodle() {
        const url = document.getElementById('moodle-url').value.trim();
        const token = document.getElementById('moodle-token').value.trim();
        const quizId = document.getElementById('quiz-id').value.trim();

        this.moodleConfig = { url, token, quizId };

        this.showStatus('연결 중...', 'info');

        try {
            const response = await fetch('src/api/moodle.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'getQuizInfo',
                    config: this.moodleConfig
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentQuestion = data.question;
                this.showQuestionInfo();
                this.showStatus('✓ Moodle에 성공적으로 연결되었습니다!', 'success');
            } else {
                throw new Error(data.error || '연결 실패');
            }
        } catch (error) {
            this.showStatus('✗ 연결 실패: ' + error.message, 'error');
        }
    }

    showQuestionInfo() {
        const question = this.currentQuestion;
        document.getElementById('question-title').textContent = question.title || '문제 ' + question.id;

        const difficultyBadge = document.getElementById('question-difficulty');
        difficultyBadge.textContent = this.getDifficultyLabel(question.difficulty);
        difficultyBadge.className = 'badge ' + question.difficulty;

        const tempo = this.breathingTemplates[question.difficulty];
        document.getElementById('breathing-tempo').textContent = tempo.description;

        document.getElementById('question-section').classList.remove('hidden');
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            'easy': '쉬움',
            'medium': '보통',
            'hard': '어려움',
            'very-hard': '매우 어려움'
        };
        return labels[difficulty] || difficulty;
    }

    startBreathingSession() {
        this.breathingState = {
            isActive: true,
            isPaused: false,
            currentCycle: 0,
            maxCycles: 3,
            currentPhase: 'prepare'
        };

        document.getElementById('breathing-section').classList.remove('hidden');
        document.getElementById('complete-breathing-btn').classList.add('hidden');

        // 2초 준비 시간
        this.updateBreathingUI('준비', '심호흡 준비하세요');

        setTimeout(() => {
            this.runBreathingCycle();
        }, 2000);
    }

    async runBreathingCycle() {
        if (!this.breathingState.isActive || this.breathingState.isPaused) {
            return;
        }

        if (this.breathingState.currentCycle >= this.breathingState.maxCycles) {
            this.finishBreathing();
            return;
        }

        this.breathingState.currentCycle++;
        this.updateCycleCount();

        const tempo = this.breathingTemplates[this.currentQuestion.difficulty];

        // 들숨
        this.breathingState.currentPhase = 'inhale';
        await this.animateBreathing('inhale', tempo.inhale, '들이쉬기', '코로 천천히 들이쉬세요');

        if (!this.breathingState.isActive || this.breathingState.isPaused) {
            return;
        }

        // 날숨
        this.breathingState.currentPhase = 'exhale';
        await this.animateBreathing('exhale', tempo.exhale, '내쉬기', '입으로 천천히 내쉬세요');

        // 다음 사이클
        if (this.breathingState.isActive && !this.breathingState.isPaused) {
            setTimeout(() => this.runBreathingCycle(), 1000);
        }
    }

    animateBreathing(phase, duration, text, instruction) {
        return new Promise((resolve) => {
            const circle = document.getElementById('breathing-circle');
            circle.className = 'breathing-circle ' + phase;
            circle.style.setProperty('--' + phase + '-duration', duration + 's');

            this.updateBreathingUI(text, instruction);

            this.breathingTimer = setTimeout(() => {
                resolve();
            }, duration * 1000);
        });
    }

    updateBreathingUI(text, instruction) {
        document.getElementById('breathing-text').textContent = text;
        document.getElementById('breathing-instruction').textContent = instruction;
    }

    updateCycleCount() {
        document.getElementById('cycle-count').textContent = this.breathingState.currentCycle;
    }

    togglePauseBreathing() {
        const btn = document.getElementById('pause-breathing-btn');

        if (this.breathingState.isPaused) {
            this.breathingState.isPaused = false;
            btn.textContent = '일시정지';
            this.runBreathingCycle();
        } else {
            this.breathingState.isPaused = true;
            btn.textContent = '계속하기';
            clearTimeout(this.breathingTimer);
        }
    }

    stopBreathing() {
        this.breathingState.isActive = false;
        clearTimeout(this.breathingTimer);
        document.getElementById('breathing-section').classList.add('hidden');
        this.resetBreathingUI();
    }

    finishBreathing() {
        this.updateBreathingUI('완료!', '호흡 운동이 완료되었습니다');
        document.getElementById('pause-breathing-btn').classList.add('hidden');
        document.getElementById('stop-breathing-btn').classList.add('hidden');
        document.getElementById('complete-breathing-btn').classList.remove('hidden');

        const circle = document.getElementById('breathing-circle');
        circle.className = 'breathing-circle';
    }

    completeSession() {
        // 세션 통계 업데이트
        this.stats.totalSessions++;
        this.stats.totalCycles += this.breathingState.currentCycle;
        this.stats.difficulties.push(this.currentQuestion.difficulty);

        this.saveStats();
        this.updateStatsDisplay();

        // UI 초기화
        document.getElementById('breathing-section').classList.add('hidden');
        this.resetBreathingUI();

        alert('호흡 운동 완료! 이제 문제를 시작하세요.');

        // Moodle 퀴즈로 리다이렉트 (옵션)
        if (this.currentQuestion.url) {
            window.open(this.currentQuestion.url, '_blank');
        }
    }

    resetBreathingUI() {
        document.getElementById('breathing-circle').className = 'breathing-circle';
        document.getElementById('breathing-text').textContent = '준비';
        document.getElementById('breathing-instruction').textContent = '심호흡 준비';
        document.getElementById('cycle-count').textContent = '0';
        document.getElementById('pause-breathing-btn').classList.remove('hidden');
        document.getElementById('stop-breathing-btn').classList.remove('hidden');
        document.getElementById('pause-breathing-btn').textContent = '일시정지';
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('connection-status');
        statusEl.textContent = message;
        statusEl.className = 'status-message ' + type;
    }

    loadStats() {
        const saved = localStorage.getItem('breathingStats');
        if (saved) {
            this.stats = JSON.parse(saved);
        }
    }

    saveStats() {
        localStorage.setItem('breathingStats', JSON.stringify(this.stats));
    }

    updateStatsDisplay() {
        document.getElementById('total-sessions').textContent = this.stats.totalSessions;
        document.getElementById('total-cycles').textContent = this.stats.totalCycles;

        if (this.stats.difficulties.length > 0) {
            const avgDifficulty = this.getAverageDifficulty();
            document.getElementById('avg-difficulty').textContent = this.getDifficultyLabel(avgDifficulty);
        }
    }

    getAverageDifficulty() {
        const difficultyValues = {
            'easy': 1,
            'medium': 2,
            'hard': 3,
            'very-hard': 4
        };

        const sum = this.stats.difficulties.reduce((acc, d) => acc + difficultyValues[d], 0);
        const avg = sum / this.stats.difficulties.length;

        if (avg <= 1.5) return 'easy';
        if (avg <= 2.5) return 'medium';
        if (avg <= 3.5) return 'hard';
        return 'very-hard';
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BreathingPaceApp();
});
