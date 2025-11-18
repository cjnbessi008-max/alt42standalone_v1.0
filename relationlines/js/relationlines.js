/**
 * Relation Lines - 숫자 관계 연결 게임
 * Moodle LMS 연동 웹앱
 */

class RelationLines {
    constructor() {
        // Canvas 초기화
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 상태 관리
        this.lines = []; // 그려진 선들
        this.currentColor = '#6C5CE7'; // 현재 선택된 색상
        this.selectedLeft = null; // 선택된 좌측 숫자
        this.questionData = null; // 현재 문제 데이터
        this.questionId = null; // 문제 ID

        // DOM 요소
        this.leftNumbersContainer = document.getElementById('leftNumbers');
        this.rightNumbersContainer = document.getElementById('rightNumbers');
        this.resultArea = document.getElementById('resultArea');
        this.resultMessage = document.getElementById('resultMessage');

        // 초기화
        this.init();
    }

    /**
     * 초기화 함수
     */
    async init() {
        this.setupCanvas();
        this.setupEventListeners();
        await this.loadQuestion();
        this.render();
    }

    /**
     * Canvas 설정
     */
    setupCanvas() {
        const gameArea = document.querySelector('.game-area');
        this.canvas.width = gameArea.offsetWidth;
        this.canvas.height = gameArea.offsetHeight;

        // 반응형 대응
        window.addEventListener('resize', () => {
            const oldLines = [...this.lines];
            this.canvas.width = gameArea.offsetWidth;
            this.canvas.height = gameArea.offsetHeight;
            this.lines = oldLines;
            this.render();
        });
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 색상 선택
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.color-option').forEach(opt =>
                    opt.classList.remove('active')
                );
                e.target.classList.add('active');
                this.currentColor = e.target.dataset.color;
            });
        });

        // 버튼 이벤트
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('submitBtn').addEventListener('click', () => this.submitAnswer());
    }

    /**
     * Moodle에서 문제 불러오기
     */
    async loadQuestion() {
        try {
            // URL 파라미터에서 문제 ID 가져오기
            const urlParams = new URLSearchParams(window.location.search);
            const questionId = urlParams.get('qid') || '1';

            this.questionId = questionId;
            document.getElementById('questionId').textContent = questionId;

            // API 호출
            const response = await fetch(`api/get_question.php?qid=${questionId}`);

            if (!response.ok) {
                throw new Error('문제를 불러올 수 없습니다.');
            }

            const data = await response.json();

            if (data.success) {
                this.questionData = data.question;
                this.displayQuestion();
            } else {
                throw new Error(data.message || '문제 로드 실패');
            }
        } catch (error) {
            console.error('Error loading question:', error);
            this.showError('문제를 불러오는데 실패했습니다. 샘플 문제를 표시합니다.');
            this.loadSampleQuestion();
        }
    }

    /**
     * 샘플 문제 로드 (API 실패시)
     */
    loadSampleQuestion() {
        this.questionData = {
            title: '분수와 소수 매칭하기',
            description: '같은 값을 가진 분수와 소수를 연결하세요.',
            leftNumbers: ['1/2', '1/4', '3/4', '1/5', '2/5'],
            rightNumbers: ['0.5', '0.25', '0.75', '0.2', '0.4'],
            correctAnswers: {
                '1/2': '0.5',
                '1/4': '0.25',
                '3/4': '0.75',
                '1/5': '0.2',
                '2/5': '0.4'
            }
        };
        this.displayQuestion();
    }

    /**
     * 문제 화면에 표시
     */
    displayQuestion() {
        if (!this.questionData) return;

        // 제목과 설명
        document.getElementById('questionTitle').textContent = this.questionData.title;
        document.getElementById('questionDescription').textContent = this.questionData.description;

        // 좌측 숫자들
        this.leftNumbersContainer.innerHTML = '';
        this.questionData.leftNumbers.forEach((num, index) => {
            const div = document.createElement('div');
            div.className = 'number-item';
            div.dataset.value = num;
            div.dataset.side = 'left';
            div.dataset.index = index;
            div.textContent = num;
            div.addEventListener('click', () => this.handleNumberClick(div));
            this.leftNumbersContainer.appendChild(div);
        });

        // 우측 숫자들
        this.rightNumbersContainer.innerHTML = '';
        this.questionData.rightNumbers.forEach((num, index) => {
            const div = document.createElement('div');
            div.className = 'number-item';
            div.dataset.value = num;
            div.dataset.side = 'right';
            div.dataset.index = index;
            div.textContent = num;
            div.addEventListener('click', () => this.handleNumberClick(div));
            this.rightNumbersContainer.appendChild(div);
        });
    }

    /**
     * 숫자 클릭 처리
     */
    handleNumberClick(element) {
        const side = element.dataset.side;

        if (side === 'left') {
            // 좌측 숫자 선택
            if (this.selectedLeft === element) {
                // 이미 선택된 것을 다시 클릭하면 취소
                element.classList.remove('selected');
                this.selectedLeft = null;
            } else {
                // 이전 선택 취소
                document.querySelectorAll('.number-item.selected').forEach(item =>
                    item.classList.remove('selected')
                );
                // 새로운 선택
                element.classList.add('selected');
                this.selectedLeft = element;
            }
        } else if (side === 'right') {
            // 우측 숫자 클릭 - 선이 그려짐
            if (this.selectedLeft) {
                this.drawLine(this.selectedLeft, element);
                this.selectedLeft.classList.remove('selected');
                this.selectedLeft = null;
            }
        }
    }

    /**
     * 선 그리기
     */
    drawLine(leftElement, rightElement) {
        // 이미 연결된 선이 있는지 확인
        const existingLineIndex = this.lines.findIndex(line =>
            line.left === leftElement.dataset.value || line.right === rightElement.dataset.value
        );

        if (existingLineIndex !== -1) {
            // 기존 선 제거
            this.lines.splice(existingLineIndex, 1);
        }

        // 새로운 선 추가
        const line = {
            left: leftElement.dataset.value,
            right: rightElement.dataset.value,
            color: this.currentColor,
            leftElement: leftElement,
            rightElement: rightElement
        };

        this.lines.push(line);

        // 연결 표시
        leftElement.classList.add('connected');
        rightElement.classList.add('connected');

        // 재렌더링
        this.render();

        // 통계 업데이트
        document.getElementById('lineCount').textContent = this.lines.length;
    }

    /**
     * Canvas에 선 렌더링
     */
    render() {
        // Canvas 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 모든 선 그리기
        this.lines.forEach(line => {
            const leftRect = line.leftElement.getBoundingClientRect();
            const rightRect = line.rightElement.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();

            // 상대 좌표 계산
            const startX = leftRect.right - canvasRect.left;
            const startY = leftRect.top + leftRect.height / 2 - canvasRect.top;
            const endX = rightRect.left - canvasRect.left;
            const endY = rightRect.top + rightRect.height / 2 - canvasRect.top;

            // 베지어 곡선으로 선 그리기
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);

            const controlX1 = startX + (endX - startX) / 3;
            const controlY1 = startY;
            const controlX2 = startX + 2 * (endX - startX) / 3;
            const controlY2 = endY;

            this.ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);

            this.ctx.strokeStyle = line.color;
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();

            // 끝점에 동그라미
            this.ctx.beginPath();
            this.ctx.arc(endX, endY, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = line.color;
            this.ctx.fill();
        });
    }

    /**
     * 모든 선 지우기
     */
    clearAll() {
        this.lines = [];
        this.selectedLeft = null;

        document.querySelectorAll('.number-item').forEach(item => {
            item.classList.remove('selected', 'connected');
        });

        this.render();
        document.getElementById('lineCount').textContent = '0';
        this.resultArea.classList.add('hidden');
    }

    /**
     * 마지막 선 삭제 (실행취소)
     */
    undo() {
        if (this.lines.length > 0) {
            const lastLine = this.lines.pop();

            // 연결 표시 제거 (다른 선에 연결되지 않은 경우만)
            const leftStillConnected = this.lines.some(line => line.left === lastLine.left);
            const rightStillConnected = this.lines.some(line => line.right === lastLine.right);

            if (!leftStillConnected) {
                lastLine.leftElement.classList.remove('connected');
            }
            if (!rightStillConnected) {
                lastLine.rightElement.classList.remove('connected');
            }

            this.render();
            document.getElementById('lineCount').textContent = this.lines.length;
        }
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        if (this.lines.length === 0) {
            this.showError('먼저 숫자를 연결해주세요!');
            return;
        }

        // 답안 데이터 구성
        const answers = {};
        this.lines.forEach(line => {
            answers[line.left] = line.right;
        });

        try {
            const response = await fetch('api/submit_answer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    questionId: this.questionId,
                    answers: answers
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess(`정답입니다! 점수: ${data.score}/${data.total}`);
            } else {
                this.showError(`틀렸습니다. 점수: ${data.score}/${data.total}. 다시 시도해보세요!`);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            // 로컬 검증 (API 실패시)
            this.validateLocally(answers);
        }
    }

    /**
     * 로컬 답안 검증 (API 실패시)
     */
    validateLocally(answers) {
        if (!this.questionData.correctAnswers) {
            this.showError('답안을 제출할 수 없습니다.');
            return;
        }

        let correct = 0;
        let total = Object.keys(this.questionData.correctAnswers).length;

        Object.keys(answers).forEach(left => {
            if (this.questionData.correctAnswers[left] === answers[left]) {
                correct++;
            }
        });

        if (correct === total) {
            this.showSuccess(`정답입니다! 점수: ${correct}/${total}`);
        } else {
            this.showError(`틀렸습니다. 점수: ${correct}/${total}. 다시 시도해보세요!`);
        }
    }

    /**
     * 성공 메시지 표시
     */
    showSuccess(message) {
        this.resultArea.classList.remove('hidden', 'error');
        this.resultArea.classList.add('success');
        this.resultMessage.textContent = message;
    }

    /**
     * 에러 메시지 표시
     */
    showError(message) {
        this.resultArea.classList.remove('hidden', 'success');
        this.resultArea.classList.add('error');
        this.resultMessage.textContent = message;
    }
}

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    new RelationLines();
});
