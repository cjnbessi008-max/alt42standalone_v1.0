/**
 * Function Live Sync - Graph Rendering Engine
 * Canvas 기반 실시간 그래프 렌더링
 */

class GraphRenderer {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // 설정
    this.options = {
      xMin: options.xMin || -10,
      xMax: options.xMax || 10,
      yMin: options.yMin || -10,
      yMax: options.yMax || 10,
      gridSize: options.gridSize || 1,
      showGrid: options.showGrid !== false,
      showAxes: options.showAxes !== false,
      showLabels: options.showLabels !== false,
      backgroundColor: options.backgroundColor || '#ffffff',
      gridColor: options.gridColor || '#e0e0e0',
      axesColor: options.axesColor || '#000000',
      functionColor: options.functionColor || '#2196F3',
      lineWidth: options.lineWidth || 2,
      animate: options.animate !== false,
      animationDuration: options.animationDuration || 300
    };

    this.currentPoints = [];
    this.targetPoints = [];
    this.animationFrame = null;
    this.animationStartTime = 0;

    this.init();
  }

  /**
   * 초기화
   */
  init() {
    this.setupCanvas();
    this.drawBackground();
    this.drawGrid();
    this.drawAxes();
  }

  /**
   * Canvas 설정 (고해상도 디스플레이 대응)
   */
  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.ctx.scale(dpr, dpr);

    // 실제 표시 크기
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
  }

  /**
   * 좌표 변환: 수학 좌표 -> Canvas 픽셀 좌표
   */
  toCanvasX(x) {
    const { xMin, xMax } = this.options;
    return ((x - xMin) / (xMax - xMin)) * this.displayWidth;
  }

  toCanvasY(y) {
    const { yMin, yMax } = this.options;
    return this.displayHeight - ((y - yMin) / (yMax - yMin)) * this.displayHeight;
  }

  /**
   * 좌표 변환: Canvas 픽셀 -> 수학 좌표
   */
  toMathX(canvasX) {
    const { xMin, xMax } = this.options;
    return xMin + (canvasX / this.displayWidth) * (xMax - xMin);
  }

  toMathY(canvasY) {
    const { yMin, yMax } = this.options;
    return yMax - (canvasY / this.displayHeight) * (yMax - yMin);
  }

  /**
   * 배경 그리기
   */
  drawBackground() {
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
  }

  /**
   * 격자 그리기
   */
  drawGrid() {
    if (!this.options.showGrid) return;

    const { xMin, xMax, yMin, yMax, gridSize, gridColor } = this.options;

    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();

    // 수직선
    for (let x = Math.ceil(xMin / gridSize) * gridSize; x <= xMax; x += gridSize) {
      const canvasX = this.toCanvasX(x);
      this.ctx.moveTo(canvasX, 0);
      this.ctx.lineTo(canvasX, this.displayHeight);
    }

    // 수평선
    for (let y = Math.ceil(yMin / gridSize) * gridSize; y <= yMax; y += gridSize) {
      const canvasY = this.toCanvasY(y);
      this.ctx.moveTo(0, canvasY);
      this.ctx.lineTo(this.displayWidth, canvasY);
    }

    this.ctx.stroke();
  }

  /**
   * 좌표축 그리기
   */
  drawAxes() {
    if (!this.options.showAxes) return;

    const { axesColor, showLabels } = this.options;

    this.ctx.strokeStyle = axesColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();

    // X축
    const y0 = this.toCanvasY(0);
    this.ctx.moveTo(0, y0);
    this.ctx.lineTo(this.displayWidth, y0);

    // Y축
    const x0 = this.toCanvasX(0);
    this.ctx.moveTo(x0, 0);
    this.ctx.lineTo(x0, this.displayHeight);

    this.ctx.stroke();

    // 축 레이블
    if (showLabels) {
      this.drawAxisLabels();
    }
  }

  /**
   * 축 눈금 및 레이블 그리기
   */
  drawAxisLabels() {
    const { xMin, xMax, yMin, yMax, gridSize, axesColor } = this.options;

    this.ctx.fillStyle = axesColor;
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    // X축 레이블
    for (let x = Math.ceil(xMin / gridSize) * gridSize; x <= xMax; x += gridSize) {
      if (x === 0) continue;
      const canvasX = this.toCanvasX(x);
      const y0 = this.toCanvasY(0);
      this.ctx.fillText(x.toFixed(0), canvasX, Math.min(y0 + 5, this.displayHeight - 15));
    }

    // Y축 레이블
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    for (let y = Math.ceil(yMin / gridSize) * gridSize; y <= yMax; y += gridSize) {
      if (y === 0) continue;
      const x0 = this.toCanvasX(0);
      const canvasY = this.toCanvasY(y);
      this.ctx.fillText(y.toFixed(0), Math.max(x0 - 5, 25), canvasY);
    }

    // 원점 표시
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    const x0 = this.toCanvasX(0);
    const y0 = this.toCanvasY(0);
    this.ctx.fillText('0', x0 - 5, y0 + 5);
  }

  /**
   * 함수 그래프 그리기 (포인트 배열)
   */
  drawFunction(points, color = null, lineWidth = null) {
    if (!points || points.length === 0) return;

    this.ctx.strokeStyle = color || this.options.functionColor;
    this.ctx.lineWidth = lineWidth || this.options.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();

    let moveToFirst = true;
    let lastCanvasY = null;

    for (const point of points) {
      const canvasX = this.toCanvasX(point.x);
      const canvasY = this.toCanvasY(point.y);

      // 불연속점 감지 (y 값이 급격히 변하는 경우)
      if (lastCanvasY !== null && Math.abs(canvasY - lastCanvasY) > this.displayHeight * 0.5) {
        moveToFirst = true;
      }

      if (moveToFirst) {
        this.ctx.moveTo(canvasX, canvasY);
        moveToFirst = false;
      } else {
        this.ctx.lineTo(canvasX, canvasY);
      }

      lastCanvasY = canvasY;
    }

    this.ctx.stroke();
  }

  /**
   * 애니메이션과 함께 그래프 업데이트
   */
  updateGraph(points) {
    if (!this.options.animate || !this.currentPoints.length) {
      // 애니메이션 없이 즉시 그리기
      this.currentPoints = points;
      this.redraw();
      return;
    }

    // 애니메이션 시작
    this.targetPoints = points;
    this.animationStartTime = Date.now();

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.animateGraph();
  }

  /**
   * 그래프 애니메이션
   */
  animateGraph() {
    const elapsed = Date.now() - this.animationStartTime;
    const progress = Math.min(elapsed / this.options.animationDuration, 1);

    // Easing function (easeOutCubic)
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    // 포인트 보간
    const interpolatedPoints = this.currentPoints.map((currentPoint, i) => {
      const targetPoint = this.targetPoints[i];
      if (!targetPoint) return currentPoint;

      return {
        x: currentPoint.x + (targetPoint.x - currentPoint.x) * easeProgress,
        y: currentPoint.y + (targetPoint.y - currentPoint.y) * easeProgress
      };
    });

    this.redraw(interpolatedPoints);

    if (progress < 1) {
      this.animationFrame = requestAnimationFrame(() => this.animateGraph());
    } else {
      this.currentPoints = this.targetPoints;
      this.redraw();
    }
  }

  /**
   * 전체 다시 그리기
   */
  redraw(points = null) {
    this.drawBackground();
    this.drawGrid();
    this.drawAxes();
    this.drawFunction(points || this.currentPoints);
  }

  /**
   * 범위 변경
   */
  setRange(xMin, xMax, yMin, yMax) {
    this.options.xMin = xMin;
    this.options.xMax = xMax;
    this.options.yMin = yMin;
    this.options.yMax = yMax;
    this.redraw();
  }

  /**
   * 줌 인/아웃
   */
  zoom(factor, centerX = 0, centerY = 0) {
    const { xMin, xMax, yMin, yMax } = this.options;

    const xRange = (xMax - xMin) * factor;
    const yRange = (yMax - yMin) * factor;

    this.options.xMin = centerX - xRange / 2;
    this.options.xMax = centerX + xRange / 2;
    this.options.yMin = centerY - yRange / 2;
    this.options.yMax = centerY + yRange / 2;

    this.redraw();
  }

  /**
   * Canvas 크기 조정 (반응형)
   */
  resize() {
    this.setupCanvas();
    this.redraw();
  }

  /**
   * 초기화
   */
  clear() {
    this.currentPoints = [];
    this.targetPoints = [];
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.redraw();
  }

  /**
   * 스크린샷 저장
   */
  saveImage(filename = 'graph.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.canvas.toDataURL();
    link.click();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GraphRenderer;
}
