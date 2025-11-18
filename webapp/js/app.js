// Main Application Logic for Dot Collector

class DotCollectorApp {
    constructor() {
        this.dotCollector = null;
        this.currentQuestion = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.attemptId = null;
        this.startTime = null;
        this.score = 0;

        this.init();
    }

    async init() {
        try {
            // Initialize Dot Collector
            this.dotCollector = new DotCollector('dot-canvas');

            // Setup event listeners
            this.setupEventListeners();

            // Test API connection
            await this.testConnection();

            // Load questions
            await this.loadQuestions();

            // Load first question
            if (this.questions.length > 0) {
                this.loadQuestion(0);
            } else {
                this.showMessage('문제를 찾을 수 없습니다. 관리자에게 문의하세요.', 'error');
            }

        } catch (error) {
            console.error('Initialization error:', error);
            this.showMessage('앱을 초기화하는 중 오류가 발생했습니다: ' + error.message, 'error');
        }
    }

    async testConnection() {
        try {
            const result = await api.ping();
            console.log('API connection successful:', result);
        } catch (error) {
            console.error('API connection failed:', error);
            this.showMessage('서버와 연결할 수 없습니다.', 'error');
        }
    }

    async loadQuestions() {
        try {
            this.questions = await api.getQuestions();
            console.log('Loaded questions:', this.questions);
            this.updateProgress();
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showMessage('문제를 불러오는 중 오류가 발생했습니다.', 'error');
        }
    }

    loadQuestion(index) {
        if (index < 0 || index >= this.questions.length) {
            this.showMessage('모든 문제를 완료했습니다!', 'success');
            return;
        }

        this.currentQuestionIndex = index;
        this.currentQuestion = this.questions[index];
        this.attemptId = null;
        this.startTime = Date.now();

        // Reset dot collector
        this.dotCollector.clearAllDots();

        // Display question
        this.displayQuestion(this.currentQuestion);

        // Hide feedback, show question sections
        document.getElementById('feedback-section').classList.add('hidden');
        document.getElementById('question-section').classList.remove('hidden');
        document.getElementById('dot-collector-section').classList.remove('hidden');
        document.getElementById('answer-section').classList.remove('hidden');

        // Update progress
        this.updateProgress();
    }

    displayQuestion(question) {
        // Set question title and text
        document.getElementById('question-title').textContent = `문제 ${this.currentQuestionIndex + 1}`;
        document.getElementById('question-text').textContent = question.question_text;

        // Set unit
        const unitElements = document.querySelectorAll('#unit, #unit-label, #answer-unit');
        unitElements.forEach(el => el.textContent = question.unit || 'cm²');

        // Display shape visualization
        this.displayShape(question);

        // Optional: Show target area hint
        // this.dotCollector.showTargetArea(question.correct_answer);
    }

    displayShape(question) {
        const shapeDisplay = document.getElementById('shape-display');
        shapeDisplay.innerHTML = '';

        // Parse metadata
        let metadata = {};
        try {
            metadata = typeof question.metadata === 'string'
                ? JSON.parse(question.metadata)
                : question.metadata || {};
        } catch (e) {
            console.error('Error parsing metadata:', e);
        }

        // Create shape visualization based on type
        const shapeType = question.shape_type || 'rectangle';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '200');
        svg.setAttribute('height', '200');
        svg.style.margin = '0 auto';
        svg.style.display = 'block';

        switch (shapeType) {
            case 'rectangle':
                this.drawRectangle(svg, metadata);
                break;
            case 'triangle':
                this.drawTriangle(svg, metadata);
                break;
            case 'circle':
                this.drawCircle(svg, metadata);
                break;
            default:
                this.drawGenericShape(svg);
        }

        shapeDisplay.appendChild(svg);
    }

    drawRectangle(svg, metadata) {
        const width = metadata.width || 5;
        const height = metadata.height || 3;
        const scale = 20;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', 50);
        rect.setAttribute('y', 50);
        rect.setAttribute('width', width * scale);
        rect.setAttribute('height', height * scale);
        rect.setAttribute('fill', '#667eea');
        rect.setAttribute('fill-opacity', '0.3');
        rect.setAttribute('stroke', '#667eea');
        rect.setAttribute('stroke-width', '2');
        svg.appendChild(rect);

        // Add dimensions
        this.addText(svg, 50 + (width * scale / 2), 45, `${width}cm`);
        this.addText(svg, 45, 50 + (height * scale / 2), `${height}cm`, true);
    }

    drawTriangle(svg, metadata) {
        const base = metadata.base || 8;
        const height = metadata.height || 6;
        const scale = 15;

        const points = `100,150 ${100 - base * scale / 2},150 100,${150 - height * scale}`;
        const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        triangle.setAttribute('points', points);
        triangle.setAttribute('fill', '#2ecc71');
        triangle.setAttribute('fill-opacity', '0.3');
        triangle.setAttribute('stroke', '#2ecc71');
        triangle.setAttribute('stroke-width', '2');
        svg.appendChild(triangle);

        // Add dimensions
        this.addText(svg, 100, 160, `${base}cm`);
        this.addText(svg, 110, 100, `${height}cm`);
    }

    drawCircle(svg, metadata) {
        const radius = metadata.radius || 4;
        const scale = 15;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 100);
        circle.setAttribute('cy', 100);
        circle.setAttribute('r', radius * scale);
        circle.setAttribute('fill', '#e74c3c');
        circle.setAttribute('fill-opacity', '0.3');
        circle.setAttribute('stroke', '#e74c3c');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);

        // Add radius line and label
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 100);
        line.setAttribute('y1', 100);
        line.setAttribute('x2', 100 + radius * scale);
        line.setAttribute('y2', 100);
        line.setAttribute('stroke', '#e74c3c');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', '3,3');
        svg.appendChild(line);

        this.addText(svg, 100 + (radius * scale / 2), 95, `r=${radius}cm`);
    }

    drawGenericShape(svg) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '100');
        text.setAttribute('y', '100');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '14');
        text.setAttribute('fill', '#666');
        text.textContent = '도형';
        svg.appendChild(text);
    }

    addText(svg, x, y, content, rotate = false) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#333');
        if (rotate) {
            text.setAttribute('transform', `rotate(-90, ${x}, ${y})`);
        }
        text.textContent = content;
        svg.appendChild(text);
    }

    setupEventListeners() {
        // Add dot button
        document.getElementById('add-dot-btn').addEventListener('click', () => {
            this.showMessage('캔버스를 클릭하여 도트를 추가하세요.', 'info');
        });

        // Remove dot button
        document.getElementById('remove-dot-btn').addEventListener('click', () => {
            this.dotCollector.removeLastDot();
        });

        // Clear dots button
        document.getElementById('clear-dots-btn').addEventListener('click', () => {
            if (confirm('모든 도트를 지우시겠습니까?')) {
                this.dotCollector.clearAllDots();
            }
        });

        // Dot value input
        document.getElementById('dot-value').addEventListener('input', (e) => {
            this.dotCollector.setDotValue(e.target.value);
        });

        // Submit answer button
        document.getElementById('submit-answer-btn').addEventListener('click', () => {
            this.submitAnswer();
        });

        // Next question button
        document.getElementById('next-question-btn').addEventListener('click', () => {
            this.loadQuestion(this.currentQuestionIndex + 1);
        });
    }

    async submitAnswer() {
        const answer = parseFloat(document.getElementById('final-answer').value);

        if (isNaN(answer)) {
            this.showMessage('답안을 입력해주세요.', 'error');
            return;
        }

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        try {
            // Submit answer to API
            const result = await api.submitAnswer(
                this.currentQuestion.id,
                answer,
                timeSpent
            );

            this.attemptId = result.attempt_id;

            // Save dot visualization
            const dotState = this.dotCollector.getState();
            await api.saveDots(
                this.currentQuestion.id,
                this.attemptId,
                dotState.accumulatedArea,
                dotState.dotCount,
                dotState.dots,
                { timestamp: new Date().toISOString() }
            );

            // Show feedback
            this.showFeedback(result.is_correct, result.correct_answer, answer);

            // Update score
            if (result.is_correct) {
                this.score++;
                this.updateScore();
            }

        } catch (error) {
            console.error('Error submitting answer:', error);
            this.showMessage('답안 제출 중 오류가 발생했습니다.', 'error');
        }
    }

    showFeedback(isCorrect, correctAnswer, userAnswer) {
        const feedbackSection = document.getElementById('feedback-section');
        const feedbackContent = document.getElementById('feedback-content');

        let html = '';
        if (isCorrect) {
            html = `
                <div class="feedback-correct">✓ 정답입니다!</div>
                <div class="feedback-message">
                    훌륭합니다! 부분 넓이를 정확하게 계산했습니다.<br>
                    답: ${userAnswer} ${this.currentQuestion.unit}
                </div>
            `;
        } else {
            html = `
                <div class="feedback-incorrect">✗ 틀렸습니다</div>
                <div class="feedback-message">
                    정답: ${correctAnswer} ${this.currentQuestion.unit}<br>
                    입력한 답: ${userAnswer} ${this.currentQuestion.unit}<br>
                    다시 한 번 도전해보세요!
                </div>
            `;
        }

        feedbackContent.innerHTML = html;
        feedbackSection.classList.remove('hidden');

        // Hide other sections
        document.getElementById('question-section').classList.add('hidden');
        document.getElementById('dot-collector-section').classList.add('hidden');
        document.getElementById('answer-section').classList.add('hidden');
    }

    updateScore() {
        document.getElementById('score').textContent = `점수: ${this.score}`;
    }

    updateProgress() {
        const total = this.questions.length;
        const current = this.currentQuestionIndex + 1;
        document.getElementById('progress').textContent = `진행: ${current}/${total}`;
    }

    showMessage(message, type = 'info') {
        // Simple alert for now - can be enhanced with toast notifications
        console.log(`[${type.toUpperCase()}] ${message}`);
        if (type === 'error') {
            alert(message);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new DotCollectorApp();
    window.dotCollectorApp = app; // Make accessible for debugging
});
