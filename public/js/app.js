/**
 * Sequence Puzzle - Frontend Application
 */

class SequencePuzzleApp {
    constructor() {
        this.sessionToken = SESSION_TOKEN;
        this.apiUrl = API_URL;
        this.currentPuzzle = null;
        this.currentAttempt = null;
        this.selectedPieces = [];
        this.startTime = null;
        this.timerInterval = null;
        this.selectedDifficulty = '';
        this.selectedCategory = null;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadCategories();
        await this.loadProgress();
    }

    setupEventListeners() {
        // Category selector
        document.getElementById('category-select').addEventListener('change', (e) => {
            this.selectedCategory = e.target.value || null;
        });

        // Difficulty buttons
        document.querySelectorAll('.btn-difficulty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-difficulty').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedDifficulty = e.target.dataset.difficulty || '';
            });
        });

        // New puzzle button
        document.getElementById('btn-new-puzzle').addEventListener('click', () => {
            this.loadNewPuzzle();
        });

        // Puzzle action buttons
        document.getElementById('btn-hint').addEventListener('click', () => {
            this.showHint();
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            this.resetSelection();
        });

        document.getElementById('btn-submit').addEventListener('click', () => {
            this.submitAnswer();
        });
    }

    async loadCategories() {
        try {
            const response = await this.apiCall('categories');
            const categories = response.categories;

            const select = document.getElementById('category-select');
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async loadProgress() {
        try {
            const response = await this.apiCall('progress');
            const progress = response.progress;

            if (progress) {
                document.getElementById('stat-solved').textContent = progress.total_puzzles_solved;
                document.getElementById('stat-total').textContent = progress.total_puzzles_attempted;
                document.getElementById('stat-rate').textContent = progress.success_rate + '%';
                document.getElementById('stat-score').textContent = progress.total_score;
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    }

    async loadNewPuzzle() {
        try {
            this.showScreen('welcome-screen');
            document.getElementById('btn-new-puzzle').disabled = true;
            document.getElementById('btn-new-puzzle').innerHTML = '<span class="loading"></span> 로딩중...';

            let url = 'puzzle';
            const params = new URLSearchParams({ session_token: this.sessionToken });

            if (this.selectedDifficulty) {
                params.append('difficulty', this.selectedDifficulty);
            }

            if (this.selectedCategory) {
                params.append('category', this.selectedCategory);
            }

            const response = await this.apiCall(url + '?' + params.toString());
            this.currentPuzzle = response.puzzle;

            // Start attempt
            const attemptResponse = await this.apiCall('start_attempt', {
                method: 'POST',
                body: JSON.stringify({ puzzle_id: this.currentPuzzle.id })
            });

            this.currentAttempt = attemptResponse.attempt;
            this.renderPuzzle();
            this.showScreen('puzzle-screen');
            this.startTimer();
        } catch (error) {
            console.error('Failed to load puzzle:', error);
            alert('문제를 불러오는데 실패했습니다.');
        } finally {
            document.getElementById('btn-new-puzzle').disabled = false;
            document.getElementById('btn-new-puzzle').textContent = '새 문제 시작';
        }
    }

    renderPuzzle() {
        const puzzle = this.currentPuzzle;

        // Header
        document.getElementById('puzzle-title').textContent = puzzle.title;
        document.getElementById('puzzle-desc').textContent = puzzle.description;

        const difficultyBadge = document.getElementById('puzzle-difficulty');
        difficultyBadge.textContent = this.getDifficultyText(puzzle.difficulty);
        difficultyBadge.className = 'badge ' + puzzle.difficulty;

        // Sequence numbers
        const sequenceContainer = document.getElementById('sequence-numbers');
        sequenceContainer.innerHTML = '';

        const sequence = puzzle.sequence_data.sequence;
        sequence.forEach((num, index) => {
            const numberDiv = document.createElement('div');
            numberDiv.className = 'sequence-number';
            numberDiv.textContent = num;
            sequenceContainer.appendChild(numberDiv);
        });

        // Add missing position indicator
        const missingDiv = document.createElement('div');
        missingDiv.className = 'sequence-number missing';
        missingDiv.textContent = '?';
        sequenceContainer.appendChild(missingDiv);

        // Puzzle pieces
        const piecesContainer = document.getElementById('puzzle-pieces');
        piecesContainer.innerHTML = '';

        // Shuffle pieces for variety
        const pieces = [...puzzle.puzzle_pieces.pieces].sort(() => Math.random() - 0.5);

        pieces.forEach(piece => {
            const pieceDiv = document.createElement('div');
            pieceDiv.className = 'puzzle-piece';
            pieceDiv.textContent = piece.text;
            pieceDiv.dataset.pieceId = piece.id;

            pieceDiv.addEventListener('click', () => {
                this.selectPiece(piece);
            });

            piecesContainer.appendChild(pieceDiv);
        });

        // Reset selection
        this.selectedPieces = [];
        this.updateSelectedArea();
        this.updateSubmitButton();

        // Hide hint
        document.getElementById('hint-display').style.display = 'none';
    }

    selectPiece(piece) {
        // Check if already selected
        const index = this.selectedPieces.findIndex(p => p.id === piece.id);

        if (index !== -1) {
            // Deselect
            this.selectedPieces.splice(index, 1);
        } else {
            // Select
            this.selectedPieces.push(piece);
        }

        this.updateSelectedArea();
        this.updateSubmitButton();
        this.updatePieceStates();
    }

    updateSelectedArea() {
        const container = document.getElementById('selected-area');

        if (this.selectedPieces.length === 0) {
            container.innerHTML = '<p class="placeholder">위에서 조각을 선택해주세요</p>';
            return;
        }

        container.innerHTML = '';

        this.selectedPieces.forEach((piece, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'selected-piece-item';

            const orderSpan = document.createElement('span');
            orderSpan.className = 'order-number';
            orderSpan.textContent = index + 1;

            const textSpan = document.createElement('span');
            textSpan.textContent = piece.text;

            itemDiv.appendChild(orderSpan);
            itemDiv.appendChild(textSpan);
            container.appendChild(itemDiv);
        });
    }

    updateSubmitButton() {
        const submitBtn = document.getElementById('btn-submit');
        submitBtn.disabled = this.selectedPieces.length === 0;
    }

    updatePieceStates() {
        document.querySelectorAll('.puzzle-piece').forEach(pieceDiv => {
            const pieceId = parseInt(pieceDiv.dataset.pieceId);
            const isSelected = this.selectedPieces.some(p => p.id === pieceId);

            if (isSelected) {
                pieceDiv.classList.add('selected');
            } else {
                pieceDiv.classList.remove('selected');
            }
        });
    }

    resetSelection() {
        this.selectedPieces = [];
        this.updateSelectedArea();
        this.updateSubmitButton();
        this.updatePieceStates();
    }

    showHint() {
        const hintBox = document.getElementById('hint-display');
        const hintText = document.getElementById('hint-text');

        if (this.currentPuzzle.hint) {
            hintText.textContent = this.currentPuzzle.hint;
            hintBox.style.display = 'block';

            // Mark hint as used
            this.apiCall('use_hint', {
                method: 'POST',
                body: JSON.stringify({ attempt_id: this.currentAttempt.id })
            });
        }
    }

    async submitAnswer() {
        if (this.selectedPieces.length === 0) {
            return;
        }

        try {
            document.getElementById('btn-submit').disabled = true;
            document.getElementById('btn-submit').innerHTML = '<span class="loading"></span> 확인중...';

            // Get selected piece IDs in order
            const answer = this.selectedPieces.map(p => p.id);

            const response = await this.apiCall('submit_answer', {
                method: 'POST',
                body: JSON.stringify({
                    attempt_id: this.currentAttempt.id,
                    puzzle_id: this.currentPuzzle.id,
                    answer: answer
                })
            });

            const result = response.result;

            this.stopTimer();
            this.showResult(result);
            await this.loadProgress();
        } catch (error) {
            console.error('Failed to submit answer:', error);
            alert('답안 제출에 실패했습니다.');
        } finally {
            document.getElementById('btn-submit').disabled = false;
            document.getElementById('btn-submit').textContent = '✓ 정답 확인';
        }
    }

    showResult(result) {
        const resultContent = document.getElementById('result-content');

        const isCorrect = result.is_correct;
        const icon = isCorrect ? '🎉' : '😢';
        const message = isCorrect ? '정답입니다!' : '틀렸습니다';
        const messageClass = isCorrect ? 'correct' : 'incorrect';

        let html = `
            <div class="result-icon">${icon}</div>
            <div class="result-message ${messageClass}">${message}</div>
            <div class="result-details">
                <div class="result-item">
                    <span>점수:</span>
                    <strong>${result.score}점</strong>
                </div>
                <div class="result-item">
                    <span>소요 시간:</span>
                    <strong>${this.formatTime(result.time_spent)}</strong>
                </div>
            </div>
        `;

        if (result.feedback && result.feedback.length > 0) {
            html += '<div class="feedback-list"><strong>피드백:</strong><ul>';
            result.feedback.forEach(fb => {
                html += `<li>${fb}</li>`;
            });
            html += '</ul></div>';
        }

        html += '<button class="btn-primary" onclick="app.loadNewPuzzle()">다음 문제</button>';

        resultContent.innerHTML = html;
        this.showScreen('result-screen');
    }

    startTimer() {
        this.startTime = Date.now();
        this.updateTimer();

        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        if (!this.startTime) return;

        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        document.getElementById('puzzle-timer').textContent = '⏱️ ' + this.formatTime(elapsed);

        // Check time limit
        if (this.currentPuzzle && elapsed >= this.currentPuzzle.time_limit) {
            this.stopTimer();
            alert('시간이 초과되었습니다!');
            this.submitAnswer();
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    getDifficultyText(difficulty) {
        const map = {
            'easy': '쉬움',
            'medium': '보통',
            'hard': '어려움'
        };
        return map[difficulty] || difficulty;
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        document.getElementById(screenId).classList.add('active');
    }

    async apiCall(endpoint, options = {}) {
        const url = this.apiUrl + '?action=' + endpoint;

        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (options.body) {
            config.body = options.body;
        }

        const response = await fetch(url, config);

        if (!response.ok) {
            throw new Error('API request failed: ' + response.status);
        }

        return await response.json();
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SequencePuzzleApp();
});
