import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FunctionData, Point, sampleFunction, getTangentLine } from '../utils/mathUtils';

interface GraphCanvasProps {
  functionData: FunctionData;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  onDragPoint?: (x: number, y: number, slope: number) => void;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  functionData,
  xMin,
  xMax,
  yMin,
  yMax,
  onDragPoint
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragPoint, setDragPoint] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Canvas 크기 설정
  const width = window.innerWidth;
  const height = window.innerHeight;

  // 좌표 변환 함수
  const worldToScreen = useCallback((worldX: number, worldY: number): Point => {
    const scaleX = width / (xMax - xMin);
    const scaleY = height / (yMax - yMin);

    return {
      x: (worldX - xMin) * scaleX,
      y: height - (worldY - yMin) * scaleY
    };
  }, [width, height, xMin, xMax, yMin, yMax]);

  const screenToWorld = useCallback((screenX: number, screenY: number): Point => {
    const scaleX = (xMax - xMin) / width;
    const scaleY = (yMax - yMin) / height;

    return {
      x: screenX * scaleX + xMin,
      y: (height - screenY) * scaleY + yMin
    };
  }, [width, height, xMin, xMax, yMin, yMax]);

  // 그리드 그리기
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // 세로선
    const xStep = Math.pow(10, Math.floor(Math.log10((xMax - xMin) / 10)));
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const screenPos = worldToScreen(x, 0);
      ctx.beginPath();
      ctx.moveTo(screenPos.x, 0);
      ctx.lineTo(screenPos.x, height);
      ctx.stroke();
    }

    // 가로선
    const yStep = Math.pow(10, Math.floor(Math.log10((yMax - yMin) / 10)));
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const screenPos = worldToScreen(0, y);
      ctx.beginPath();
      ctx.moveTo(0, screenPos.y);
      ctx.lineTo(width, screenPos.y);
      ctx.stroke();
    }
  }, [worldToScreen, xMin, xMax, yMin, yMax, width, height]);

  // 축 그리기
  const drawAxes = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    // X축
    if (yMin <= 0 && yMax >= 0) {
      const y0 = worldToScreen(0, 0).y;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(width, y0);
      ctx.stroke();
    }

    // Y축
    if (xMin <= 0 && xMax >= 0) {
      const x0 = worldToScreen(0, 0).x;
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0, height);
      ctx.stroke();
    }
  }, [worldToScreen, xMin, xMax, yMin, yMax, width, height]);

  // 함수 그래프 그리기
  const drawFunction = useCallback((ctx: CanvasRenderingContext2D) => {
    const points = sampleFunction(functionData.compiledFn, xMin, xMax, 500);

    if (points.length === 0) return;

    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 3;
    ctx.beginPath();

    let isFirstPoint = true;
    for (const point of points) {
      const screenPos = worldToScreen(point.x, point.y);

      // 화면 범위 밖이면 스킵
      if (screenPos.y < -100 || screenPos.y > height + 100) continue;

      if (isFirstPoint) {
        ctx.moveTo(screenPos.x, screenPos.y);
        isFirstPoint = false;
      } else {
        ctx.lineTo(screenPos.x, screenPos.y);
      }
    }

    ctx.stroke();
  }, [functionData, xMin, xMax, worldToScreen, height]);

  // 접선 그리기
  const drawTangentLine = useCallback((ctx: CanvasRenderingContext2D, point: Point) => {
    const tangent = getTangentLine(functionData, point.x);

    // 접점 표시
    const screenPoint = worldToScreen(point.x, point.y);
    ctx.fillStyle = '#FF5722';
    ctx.beginPath();
    ctx.arc(screenPoint.x, screenPoint.y, 8, 0, 2 * Math.PI);
    ctx.fill();

    // 접선 그리기
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    const leftX = xMin;
    const rightX = xMax;
    const leftY = tangent.slope * leftX + tangent.intercept;
    const rightY = tangent.slope * rightX + tangent.intercept;

    const leftScreen = worldToScreen(leftX, leftY);
    const rightScreen = worldToScreen(rightX, rightY);

    ctx.beginPath();
    ctx.moveTo(leftScreen.x, leftScreen.y);
    ctx.lineTo(rightScreen.x, rightScreen.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 접선 방정식 표시
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(tangent.equation, 10, 30);
    ctx.fillText(`기울기: ${tangent.slope.toFixed(3)}`, 10, 55);
  }, [functionData, worldToScreen, xMin, xMax]);

  // Canvas 렌더링
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 화면 클리어
    ctx.clearRect(0, 0, width, height);

    // 그리기 순서
    drawGrid(ctx);
    drawAxes(ctx);
    drawFunction(ctx);

    if (dragPoint) {
      drawTangentLine(ctx, dragPoint);
    }
  }, [width, height, dragPoint, drawGrid, drawAxes, drawFunction, drawTangentLine]);

  // 드래그 핸들러
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = screenToWorld(screenX, screenY);

    // 함수 위의 점으로 스냅
    const y = functionData.compiledFn(worldPos.x);
    if (!isNaN(y) && isFinite(y)) {
      const point = { x: worldPos.x, y };
      setDragPoint(point);
      setIsDragging(true);

      const slope = functionData.derivativeFn(worldPos.x);
      onDragPoint?.(worldPos.x, y, slope);
    }
  }, [screenToWorld, functionData, onDragPoint]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = screenToWorld(screenX, screenY);

    const y = functionData.compiledFn(worldPos.x);
    if (!isNaN(y) && isFinite(y)) {
      const point = { x: worldPos.x, y };
      setDragPoint(point);

      const slope = functionData.derivativeFn(worldPos.x);
      onDragPoint?.(worldPos.x, y, slope);
    }
  }, [isDragging, screenToWorld, functionData, onDragPoint]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 렌더링 효과
  useEffect(() => {
    render();
  }, [render]);

  // 리사이즈 핸들러
  useEffect(() => {
    const handleResize = () => {
      render();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        display: 'block',
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    />
  );
};

export default GraphCanvas;
