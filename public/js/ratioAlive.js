/**
 * Ratio Alive - 비율 시각화 애니메이션 엔진
 * 도형의 크기가 변해도 비율이 일정함을 보여주는 애니메이션
 */

class RatioAlive {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 애니메이션 상태
        this.isPlaying = false;
        this.animationFrame = null;
        this.time = 0;
        this.speed = 1;

        // 현재 설정
        this.currentShape = 'triangle';
        this.ratio = { a: 3, b: 4 };

        // 애니메이션 파라미터
        this.baseSize = 100;
        this.pulseSpeed = 0.02;
        this.scaleMin = 0.6;
        this.scaleMax = 1.4;

        // 색상
        this.colors = {
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#4CAF50',
            highlight: '#FF9800'
        };

        this.init();
    }

    init() {
        this.draw();
    }

    /**
     * 메인 그리기 함수
     */
    draw() {
        // 캔버스 초기화
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 배경 그라디언트
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f5f5f5');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 애니메이션 중일 때 크기 변화 계산
        let scale = 1;
        if (this.isPlaying) {
            scale = this.scaleMin +
                   (this.scaleMax - this.scaleMin) *
                   (Math.sin(this.time * this.pulseSpeed) + 1) / 2;
            this.time += this.speed;
        }

        // 중앙 위치
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // 현재 도형 그리기
        switch (this.currentShape) {
            case 'triangle':
                this.drawTriangle(centerX, centerY, scale);
                break;
            case 'rectangle':
                this.drawRectangle(centerX, centerY, scale);
                break;
            case 'pentagon':
                this.drawPentagon(centerX, centerY, scale);
                break;
        }

        // 비율 표시
        this.drawRatioLines(centerX, centerY, scale);

        // 애니메이션 계속
        if (this.isPlaying) {
            this.animationFrame = requestAnimationFrame(() => this.draw());
        }
    }

    /**
     * 삼각형 그리기 (비율에 따라)
     */
    drawTriangle(x, y, scale) {
        const size = this.baseSize * scale;
        const { a, b } = this.ratio;
        const total = a + b;

        // 밑변과 높이를 비율에 따라 계산
        const base = size * (a / total) * 2;
        const height = size * (b / total) * 2;

        this.ctx.save();

        // 그림자
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;

        // 삼각형 그리기
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - height / 2);
        this.ctx.lineTo(x - base / 2, y + height / 2);
        this.ctx.lineTo(x + base / 2, y + height / 2);
        this.ctx.closePath();

        // 그라디언트 채우기
        const gradient = this.ctx.createLinearGradient(x - base / 2, y - height / 2, x + base / 2, y + height / 2);
        gradient.addColorStop(0, this.colors.primary);
        gradient.addColorStop(1, this.colors.secondary);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // 테두리
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.restore();

        // 레이블
        this.drawLabel(`밑변: ${base.toFixed(1)}`, x, y + height / 2 + 30);
        this.drawLabel(`높이: ${height.toFixed(1)}`, x - base / 2 - 60, y);
    }

    /**
     * 직사각형 그리기 (비율에 따라)
     */
    drawRectangle(x, y, scale) {
        const size = this.baseSize * scale;
        const { a, b } = this.ratio;

        // 가로와 세로를 비율에 따라 계산
        const width = size * (a / 5) * 2;
        const height = size * (b / 5) * 2;

        this.ctx.save();

        // 그림자
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;

        // 직사각형 그리기
        const gradient = this.ctx.createLinearGradient(x - width / 2, y - height / 2, x + width / 2, y + height / 2);
        gradient.addColorStop(0, this.colors.primary);
        gradient.addColorStop(1, this.colors.secondary);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - width / 2, y - height / 2, width, height);

        // 테두리
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x - width / 2, y - height / 2, width, height);

        this.ctx.restore();

        // 레이블
        this.drawLabel(`가로: ${width.toFixed(1)}`, x, y + height / 2 + 30);
        this.drawLabel(`세로: ${height.toFixed(1)}`, x - width / 2 - 60, y);
    }

    /**
     * 오각형 그리기 (비율에 따라)
     */
    drawPentagon(x, y, scale) {
        const size = this.baseSize * scale;
        const { a, b } = this.ratio;
        const total = a + b;

        // 반지름을 비율에 따라 계산
        const radius = size * (total / 7);

        this.ctx.save();

        // 그림자
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;

        // 오각형 그리기
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);

            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();

        // 그라디언트 채우기
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, this.colors.primary);
        gradient.addColorStop(1, this.colors.secondary);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // 테두리
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.restore();

        // 레이블
        this.drawLabel(`반지름: ${radius.toFixed(1)}`, x, y + radius + 30);
    }

    /**
     * 비율 선 그리기
     */
    drawRatioLines(x, y, scale) {
        const { a, b } = this.ratio;
        const lineLength = 150 * scale;

        // 비율 A 선 (가로)
        this.ctx.save();
        this.ctx.strokeStyle = this.colors.accent;
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([5, 5]);

        const aLength = lineLength * (a / (a + b));
        this.ctx.beginPath();
        this.ctx.moveTo(x - lineLength / 2, y - 150);
        this.ctx.lineTo(x - lineLength / 2 + aLength, y - 150);
        this.ctx.stroke();

        // 비율 B 선 (가로)
        this.ctx.strokeStyle = this.colors.highlight;
        this.ctx.beginPath();
        this.ctx.moveTo(x - lineLength / 2 + aLength, y - 150);
        this.ctx.lineTo(x - lineLength / 2 + lineLength, y - 150);
        this.ctx.stroke();

        this.ctx.restore();

        // 텍스트 레이블
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillStyle = this.colors.accent;
        this.ctx.fillText(`A (${a})`, x - lineLength / 2 + aLength / 2 - 20, y - 160);

        this.ctx.fillStyle = this.colors.highlight;
        this.ctx.fillText(`B (${b})`, x - lineLength / 2 + aLength + (lineLength - aLength) / 2 - 20, y - 160);
    }

    /**
     * 레이블 그리기
     */
    drawLabel(text, x, y) {
        this.ctx.save();
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    /**
     * 도형 변경
     */
    setShape(shape) {
        this.currentShape = shape;
        this.draw();
    }

    /**
     * 비율 변경
     */
    setRatio(a, b) {
        this.ratio = { a, b };
        this.draw();
    }

    /**
     * 애니메이션 재생
     */
    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.draw();
        }
    }

    /**
     * 애니메이션 일시정지
     */
    pause() {
        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    /**
     * 애니메이션 리셋
     */
    reset() {
        this.pause();
        this.time = 0;
        this.draw();
    }

    /**
     * 속도 변경
     */
    setSpeed(speed) {
        this.speed = speed;
    }
}
