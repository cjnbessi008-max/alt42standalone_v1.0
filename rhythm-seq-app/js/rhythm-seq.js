/**
 * Rhythm Seq - Main JavaScript
 * 리듬감 있는 수열 애니메이션 로직
 */

class RhythmSeq {
    constructor() {
        this.currentQuestion = null;
        this.sequence = [];
        this.isAnimating = false;
        this.isPaused = false;
        this.animationSpeed = 5;
        this.currentIndex = 0;
        this.animationInterval = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateClock();
        this.loadQuestions();

        // Update clock every minute
        setInterval(() => this.updateClock(), 60000);
    }

    setupEventListeners() {
        // Load question button
        document.getElementById('btn-load-question').addEventListener('click', () => {
            this.loadSelectedQuestion();
        });

        // Start animation button
        document.getElementById('btn-start-animation').addEventListener('click', () => {
            this.startAnimation();
        });

        // Pause animation button
        document.getElementById('btn-pause-animation').addEventListener('click', () => {
            this.pauseAnimation();
        });

        // Reset button
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.resetAnimation();
        });

        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = this.animationSpeed;

            // Restart animation if running
            if (this.isAnimating && !this.isPaused) {
                this.stopAnimation();
                this.startAnimation();
            }
        });

        // Question select dropdown
        document.getElementById('question-select').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadQuestionById(e.target.value);
            }
        });
    }

    updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('current-time').textContent = `${hours}:${minutes}`;
    }

    async loadQuestions() {
        try {
            const response = await fetch('api/get_questions.php?limit=20');
            const data = await response.json();

            if (data.success) {
                this.populateQuestionDropdown(data.questions);
                this.showToast('문제 목록을 불러왔습니다', 'success');
            } else {
                throw new Error(data.error || '문제를 불러오는데 실패했습니다');
            }
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showToast('문제 목록 불러오기 실패: ' + error.message, 'error');

            // Load demo data as fallback
            this.loadDemoData();
        }
    }

    populateQuestionDropdown(questions) {
        const select = document.getElementById('question-select');
        select.innerHTML = '<option value="">문제를 선택하세요</option>';

        questions.forEach(question => {
            const option = document.createElement('option');
            option.value = question.id;
            option.textContent = `${question.id}: ${question.title}`;
            select.appendChild(option);
        });
    }

    async loadQuestionById(questionId) {
        try {
            const response = await fetch(`api/get_questions.php?id=${questionId}`);
            const data = await response.json();

            if (data.success) {
                this.currentQuestion = data.question;
                this.displayQuestion(data.question);
                this.showToast('문제를 불러왔습니다', 'success');
            } else {
                throw new Error(data.error || '문제를 불러오는데 실패했습니다');
            }
        } catch (error) {
            console.error('Error loading question:', error);
            this.showToast('문제 불러오기 실패: ' + error.message, 'error');
        }
    }

    loadSelectedQuestion() {
        const selectedId = document.getElementById('question-select').value;
        if (selectedId) {
            this.loadQuestionById(selectedId);
        } else {
            this.loadDemoData();
        }
    }

    loadDemoData() {
        this.currentQuestion = {
            id: 'demo',
            title: '데모 문제: 홀수 수열',
            text: '다음 수열의 규칙을 찾아보세요: 1, 3, 5, 7, 9, 11, 13, 15',
            sequence: [1, 3, 5, 7, 9, 11, 13, 15]
        };
        this.displayQuestion(this.currentQuestion);
        this.showToast('데모 데이터를 불러왔습니다', 'info');
    }

    displayQuestion(question) {
        this.sequence = question.sequence || [];

        const questionDisplay = document.getElementById('question-display');
        questionDisplay.innerHTML = `
            <h3>${question.title}</h3>
            <p>${question.text}</p>
            <div class="sequence-preview">
                <strong>수열:</strong> ${this.sequence.join(', ')}
            </div>
        `;

        // Display sequence in smartphone screen
        const sequenceDisplay = document.getElementById('sequence-display');
        sequenceDisplay.innerHTML = `
            <div class="sequence-numbers">
                ${this.sequence.map(num =>
                    `<span class="sequence-number">${num}</span>`
                ).join('')}
            </div>
        `;

        // Enable animation buttons
        document.getElementById('btn-start-animation').disabled = false;
        document.getElementById('btn-reset').disabled = false;
    }

    startAnimation() {
        if (this.sequence.length === 0) {
            this.showToast('먼저 문제를 불러와주세요', 'error');
            return;
        }

        if (this.isPaused) {
            // Resume animation
            this.isPaused = false;
            this.continueAnimation();
        } else {
            // Start fresh animation
            this.isAnimating = true;
            this.currentIndex = 0;
            this.setupAnimationStage();
            this.continueAnimation();
        }

        // Update button states
        document.getElementById('btn-start-animation').disabled = true;
        document.getElementById('btn-pause-animation').disabled = false;
        document.getElementById('btn-load-question').disabled = true;
    }

    setupAnimationStage() {
        const stage = document.getElementById('animation-stage');
        stage.innerHTML = '';

        // Create animated elements for each sequence number
        this.sequence.forEach((num, index) => {
            const element = document.createElement('div');
            element.className = 'sequence-item';
            element.textContent = num;
            element.id = `seq-item-${index}`;

            // Size based on value (larger numbers = larger circles)
            const maxNum = Math.max(...this.sequence);
            const minSize = 40;
            const maxSize = 80;
            const size = minSize + (num / maxNum) * (maxSize - minSize);

            element.style.width = `${size}px`;
            element.style.height = `${size}px`;
            element.style.fontSize = `${size / 3}px`;
            element.style.opacity = '0';
            element.style.left = '50%';
            element.style.top = '50%';
            element.style.transform = 'translate(-50%, -50%)';

            stage.appendChild(element);
        });
    }

    continueAnimation() {
        const delay = 1200 - (this.animationSpeed * 100); // Speed: 1=slow, 10=fast

        this.animationInterval = setInterval(() => {
            if (this.currentIndex >= this.sequence.length) {
                // Animation complete
                this.currentIndex = 0;
                this.updateProgress(0);
            }

            this.animateSequenceItem(this.currentIndex);
            this.updateProgress((this.currentIndex + 1) / this.sequence.length * 100);

            this.currentIndex++;
        }, delay);
    }

    animateSequenceItem(index) {
        const element = document.getElementById(`seq-item-${index}`);
        if (!element) return;

        // Hide previous items
        this.sequence.forEach((_, i) => {
            const prevElement = document.getElementById(`seq-item-${i}`);
            if (prevElement && i !== index) {
                prevElement.style.opacity = '0.3';
                prevElement.classList.remove('animate-pulse', 'animate-bounce', 'animate-glow');
            }
        });

        // Animate current item
        element.style.opacity = '1';

        // Determine position based on index
        const stageWidth = 260; // Animation stage width
        const stageHeight = 160; // Animation stage height

        // Create rhythm pattern - wave motion
        const angle = (index / this.sequence.length) * Math.PI * 2;
        const x = Math.cos(angle) * 80 + stageWidth / 2;
        const y = Math.sin(angle) * 50 + stageHeight / 2;

        element.style.left = `${x}px`;
        element.style.top = `${y}px`;

        // Add rhythm animations
        const animations = ['animate-pulse', 'animate-bounce', 'animate-glow'];
        const randomAnimation = animations[index % animations.length];
        element.classList.add(randomAnimation);

        // Play sound (optional - can be added later)
        // this.playTone(this.sequence[index]);
    }

    pauseAnimation() {
        this.isPaused = true;
        this.stopAnimation();

        // Update button states
        document.getElementById('btn-start-animation').disabled = false;
        document.getElementById('btn-pause-animation').disabled = true;
    }

    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        this.isAnimating = false;
    }

    resetAnimation() {
        this.stopAnimation();
        this.isPaused = false;
        this.currentIndex = 0;
        this.updateProgress(0);

        // Clear animation stage
        const stage = document.getElementById('animation-stage');
        stage.innerHTML = '<p class="placeholder-text" style="color: #666;">애니메이션을 시작하세요</p>';

        // Update button states
        document.getElementById('btn-start-animation').disabled = false;
        document.getElementById('btn-pause-animation').disabled = true;
        document.getElementById('btn-load-question').disabled = false;
    }

    updateProgress(percentage) {
        const progressFill = document.getElementById('progress-fill');
        progressFill.style.width = `${percentage}%`;
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <strong>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</strong>
            ${message}
        `;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Optional: Play tone based on number value
    playTone(value) {
        // Web Audio API implementation can be added here
        // This would create musical tones based on the sequence values
        console.log(`Playing tone for value: ${value}`);
    }
}

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.rhythmSeq = new RhythmSeq();
});
