/**
 * Graph Renderer
 * Canvas를 사용한 함수 그래프 및 적분 영역 렌더링
 */

class GraphRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id '${canvasId}' not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // 좌표계 설정
        this.padding = 40;
        this.graphWidth = this.width - 2 * this.padding;
        this.graphHeight = this.height - 2 * this.padding;

        // 색상 설정
        this.colors = {
            axis: '#2c3e50',
            grid: '#ecf0f1',
            graph: '#3498db',
            area: 'rgba(52, 152, 219, 0.3)',
            character: '#e74c3c'
        };

        // 상태
        this.currentFunction = null;
        this.bounds = { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };
        this.integralBounds = { lower: 0, upper: 2 };
    }

    /**
     * Canvas 초기화
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * 좌표 변환: 실제 좌표 -> Canvas 좌표
     */
    transformX(x) {
        const { xMin, xMax } = this.bounds;
        return this.padding + ((x - xMin) / (xMax - xMin)) * this.graphWidth;
    }

    transformY(y) {
        const { yMin, yMax } = this.bounds;
        return this.height - this.padding - ((y - yMin) / (yMax - yMin)) * this.graphHeight;
    }

    /**
     * 역변환: Canvas 좌표 -> 실제 좌표
     */
    inverseTransformX(canvasX) {
        const { xMin, xMax } = this.bounds;
        return xMin + ((canvasX - this.padding) / this.graphWidth) * (xMax - xMin);
    }

    inverseTransformY(canvasY) {
        const { yMin, yMax } = this.bounds;
        return yMin + ((this.height - this.padding - canvasY) / this.graphHeight) * (yMax - yMin);
    }

    /**
     * 그리드 그리기
     */
    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;

        const { xMin, xMax, yMin, yMax } = this.bounds;

        // 세로 그리드
        const xStep = (xMax - xMin) / 10;
        for (let x = xMin; x <= xMax; x += xStep) {
            const canvasX = this.transformX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, this.padding);
            this.ctx.lineTo(canvasX, this.height - this.padding);
            this.ctx.stroke();
        }

        // 가로 그리드
        const yStep = (yMax - yMin) / 10;
        for (let y = yMin; y <= yMax; y += yStep) {
            const canvasY = this.transformY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, canvasY);
            this.ctx.lineTo(this.width - this.padding, canvasY);
            this.ctx.stroke();
        }
    }

    /**
     * 좌표축 그리기
     */
    drawAxes() {
        this.ctx.strokeStyle = this.colors.axis;
        this.ctx.lineWidth = 2;

        // X축
        const yAxisPos = this.transformY(0);
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, yAxisPos);
        this.ctx.lineTo(this.width - this.padding, yAxisPos);
        this.ctx.stroke();

        // Y축
        const xAxisPos = this.transformX(0);
        this.ctx.beginPath();
        this.ctx.moveTo(xAxisPos, this.padding);
        this.ctx.lineTo(xAxisPos, this.height - this.padding);
        this.ctx.stroke();

        // 축 레이블
        this.drawAxisLabels();

        // 화살표
        this.drawArrow(this.width - this.padding, yAxisPos, 'right');
        this.drawArrow(xAxisPos, this.padding, 'up');
    }

    /**
     * 축 레이블 그리기
     */
    drawAxisLabels() {
        this.ctx.fillStyle = this.colors.axis;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';

        const { xMin, xMax, yMin, yMax } = this.bounds;
        const yAxisPos = this.transformY(0);
        const xAxisPos = this.transformX(0);

        // X축 레이블
        const xStep = Math.ceil((xMax - xMin) / 5);
        for (let x = Math.ceil(xMin); x <= xMax; x += xStep) {
            if (x === 0) continue;
            const canvasX = this.transformX(x);
            this.ctx.fillText(x.toString(), canvasX, yAxisPos + 20);
        }

        // Y축 레이블
        this.ctx.textAlign = 'right';
        const yStep = Math.ceil((yMax - yMin) / 5);
        for (let y = Math.ceil(yMin); y <= yMax; y += yStep) {
            if (y === 0) continue;
            const canvasY = this.transformY(y);
            this.ctx.fillText(y.toString(), xAxisPos - 10, canvasY + 5);
        }

        // 축 이름
        this.ctx.textAlign = 'center';
        this.ctx.fillText('x', this.width - this.padding + 15, yAxisPos + 5);
        this.ctx.fillText('y', xAxisPos + 5, this.padding - 10);
    }

    /**
     * 화살표 그리기
     */
    drawArrow(x, y, direction) {
        this.ctx.fillStyle = this.colors.axis;
        this.ctx.beginPath();

        const size = 8;
        switch (direction) {
            case 'right':
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x - size, y - size / 2);
                this.ctx.lineTo(x - size, y + size / 2);
                break;
            case 'up':
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x - size / 2, y + size);
                this.ctx.lineTo(x + size / 2, y + size);
                break;
        }

        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 함수 그래프 그리기
     */
    drawFunction(functionExpr, color = null) {
        this.currentFunction = functionExpr;
        const graphColor = color || this.colors.graph;

        this.ctx.strokeStyle = graphColor;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        const { xMin, xMax } = this.bounds;
        const step = (xMax - xMin) / 200;

        let firstPoint = true;

        for (let x = xMin; x <= xMax; x += step) {
            try {
                const y = this.evaluateFunction(functionExpr, x);

                // NaN이나 Infinity 체크
                if (!isFinite(y)) continue;

                const canvasX = this.transformX(x);
                const canvasY = this.transformY(y);

                if (firstPoint) {
                    this.ctx.moveTo(canvasX, canvasY);
                    firstPoint = false;
                } else {
                    this.ctx.lineTo(canvasX, canvasY);
                }
            } catch (e) {
                console.error('Function evaluation error:', e);
            }
        }

        this.ctx.stroke();
    }

    /**
     * 적분 영역 채우기
     */
    fillIntegralArea(functionExpr, lowerBound, upperBound, color = null, opacity = 0.3) {
        const areaColor = color || this.colors.area;

        this.ctx.fillStyle = areaColor;
        this.ctx.beginPath();

        // 시작점 (하한, y=0)
        this.ctx.moveTo(this.transformX(lowerBound), this.transformY(0));

        // 함수 곡선 따라가기
        const step = (upperBound - lowerBound) / 100;
        for (let x = lowerBound; x <= upperBound; x += step) {
            const y = this.evaluateFunction(functionExpr, x);
            if (isFinite(y)) {
                this.ctx.lineTo(this.transformX(x), this.transformY(y));
            }
        }

        // 끝점 (상한, y=0)
        this.ctx.lineTo(this.transformX(upperBound), this.transformY(0));

        this.ctx.closePath();
        this.ctx.fill();

        // 적분 값 표시
        const integralValue = this.calculateIntegralValue(functionExpr, lowerBound, upperBound);
        this.drawIntegralValue(integralValue, lowerBound, upperBound, functionExpr);
    }

    /**
     * 적분 값 텍스트 표시
     */
    drawIntegralValue(value, lowerBound, upperBound, functionExpr) {
        const midX = (lowerBound + upperBound) / 2;
        const midY = this.evaluateFunction(functionExpr, midX) / 2;

        const canvasX = this.transformX(midX);
        const canvasY = this.transformY(midY);

        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Area ≈ ${value.toFixed(2)}`, canvasX, canvasY);
    }

    /**
     * 함수 평가 (문자열 -> 숫자)
     */
    evaluateFunction(expression, x) {
        // 간단한 수학 함수 평가
        // 주의: 실제 프로덕션에서는 더 안전한 파서 사용 권장

        let expr = expression
            .replace(/\^/g, '**')
            .replace(/\bx\b/g, `(${x})`)
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/exp/g, 'Math.exp')
            .replace(/log/g, 'Math.log')
            .replace(/ln/g, 'Math.log')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/abs/g, 'Math.abs')
            .replace(/pi/gi, 'Math.PI')
            .replace(/e(?![a-z])/gi, 'Math.E');

        try {
            // eslint-disable-next-line no-eval
            return eval(expr);
        } catch (e) {
            console.error('Expression evaluation error:', expr, e);
            return NaN;
        }
    }

    /**
     * Simpson's Rule로 적분 계산
     */
    calculateIntegralValue(functionExpr, a, b, n = 100) {
        if (n % 2 !== 0) n++;

        const h = (b - a) / n;
        let sum = this.evaluateFunction(functionExpr, a)
                + this.evaluateFunction(functionExpr, b);

        for (let i = 1; i < n; i++) {
            const x = a + i * h;
            const multiplier = (i % 2 === 0) ? 2 : 4;
            sum += multiplier * this.evaluateFunction(functionExpr, x);
        }

        return (h / 3) * sum;
    }

    /**
     * 캐릭터 그리기
     */
    drawCharacter(x, size = 20, color = null) {
        const charColor = color || this.colors.character;
        const canvasX = this.transformX(x);
        const canvasY = this.transformY(0);

        // 간단한 캐릭터 (원형)
        this.ctx.fillStyle = charColor;
        this.ctx.beginPath();
        this.ctx.arc(canvasX, canvasY - size, size, 0, Math.PI * 2);
        this.ctx.fill();

        // 눈
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(canvasX - size / 3, canvasY - size - size / 4, size / 5, 0, Math.PI * 2);
        this.ctx.arc(canvasX + size / 3, canvasY - size - size / 4, size / 5, 0, Math.PI * 2);
        this.ctx.fill();

        // 동공
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(canvasX - size / 3, canvasY - size - size / 4, size / 10, 0, Math.PI * 2);
        this.ctx.arc(canvasX + size / 3, canvasY - size - size / 4, size / 10, 0, Math.PI * 2);
        this.ctx.fill();

        // 발
        this.ctx.fillStyle = charColor;
        this.ctx.fillRect(canvasX - size / 4, canvasY, size / 6, size / 3);
        this.ctx.fillRect(canvasX + size / 12, canvasY, size / 6, size / 3);
    }

    /**
     * 전체 렌더링
     */
    render(problemData) {
        this.clear();

        // 좌표 범위 자동 설정
        this.setBounds(problemData);

        // 그리드 및 좌표축
        this.drawGrid();
        this.drawAxes();

        // 함수 그래프
        const graphColor = problemData.colors?.graph || this.colors.graph;
        this.drawFunction(problemData.function.expression, graphColor);

        // 적분 영역 (초기에는 하한에서 시작)
        const areaColor = problemData.colors?.area || this.colors.area;
        this.fillIntegralArea(
            problemData.function.expression,
            problemData.function.lower_bound,
            problemData.function.lower_bound,
            areaColor
        );

        // 캐릭터 (시작 위치)
        this.drawCharacter(problemData.function.lower_bound);
    }

    /**
     * 좌표 범위 자동 설정
     */
    setBounds(problemData) {
        const { lower_bound, upper_bound, expression } = problemData.function;

        // X 범위
        const xMargin = (upper_bound - lower_bound) * 0.2;
        this.bounds.xMin = Math.floor(lower_bound - xMargin);
        this.bounds.xMax = Math.ceil(upper_bound + xMargin);

        // Y 범위 (함수 값 샘플링)
        let yMin = 0, yMax = 0;
        const samples = 50;
        const step = (upper_bound - lower_bound) / samples;

        for (let x = lower_bound; x <= upper_bound; x += step) {
            const y = this.evaluateFunction(expression, x);
            if (isFinite(y)) {
                yMin = Math.min(yMin, y);
                yMax = Math.max(yMax, y);
            }
        }

        const yMargin = Math.max(1, (yMax - yMin) * 0.2);
        this.bounds.yMin = Math.floor(yMin - yMargin);
        this.bounds.yMax = Math.ceil(yMax + yMargin);
    }

    /**
     * 애니메이션 업데이트 (외부에서 호출)
     */
    updateAnimation(problemData, currentX) {
        this.clear();
        this.drawGrid();
        this.drawAxes();

        const graphColor = problemData.colors?.graph || this.colors.graph;
        this.drawFunction(problemData.function.expression, graphColor);

        // 현재 위치까지 적분 영역 채우기
        const areaColor = problemData.colors?.area || this.colors.area;
        this.fillIntegralArea(
            problemData.function.expression,
            problemData.function.lower_bound,
            currentX,
            areaColor
        );

        // 캐릭터 현재 위치
        this.drawCharacter(currentX);
    }
}
