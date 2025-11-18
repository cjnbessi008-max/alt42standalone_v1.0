import { useEffect, useRef, useState } from 'react';
import { useReflectionPair } from '../hooks/useReflectionPair';
import {
  generateExponentialPoints,
  generateLogarithmicPoints,
  toScreenCoords,
  toMathCoords,
  isPointInBounds,
} from '../utils/math';
import { Point } from '../types';

interface ReflectionCanvasProps {
  width?: number;
  height?: number;
}

export const ReflectionCanvas: React.FC<ReflectionCanvasProps> = ({
  width = 800,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { config, viewport, updateViewport, addInteraction } = useReflectionPair();

  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState<Point>({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width, height });

  // Handle canvas resize
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate actual viewport center based on canvas size
  const actualCenterX = canvasSize.width / 2 + viewport.centerX;
  const actualCenterY = canvasSize.height / 2 + viewport.centerY;

  // Draw functions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw grid
    if (config.showGrid) {
      drawGrid(ctx);
    }

    // Draw axes
    if (config.showAxes) {
      drawAxes(ctx);
    }

    // Draw reflection line
    if (config.showReflectionLine) {
      drawReflectionLine(ctx);
    }

    // Draw exponential curve
    drawExponential(ctx);

    // Draw logarithmic curve
    drawLogarithmic(ctx);
  }, [config, viewport, canvasSize]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    // Vertical lines
    const startX = Math.floor(-actualCenterX / viewport.scale);
    const endX = Math.ceil((canvasSize.width - actualCenterX) / viewport.scale);

    for (let x = startX; x <= endX; x++) {
      const screenPos = toScreenCoords(x, 0, actualCenterX, actualCenterY, viewport.scale);
      ctx.moveTo(screenPos.x, 0);
      ctx.lineTo(screenPos.x, canvasSize.height);
    }

    // Horizontal lines
    const startY = Math.floor(-actualCenterY / viewport.scale);
    const endY = Math.ceil((canvasSize.height - actualCenterY) / viewport.scale);

    for (let y = startY; y <= endY; y++) {
      const screenPos = toScreenCoords(0, y, actualCenterX, actualCenterY, viewport.scale);
      ctx.moveTo(0, screenPos.y);
      ctx.lineTo(canvasSize.width, screenPos.y);
    }

    ctx.stroke();
  };

  const drawAxes = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, actualCenterY);
    ctx.lineTo(canvasSize.width, actualCenterY);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(actualCenterX, 0);
    ctx.lineTo(actualCenterX, canvasSize.height);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('x', canvasSize.width - 20, actualCenterY - 10);
    ctx.fillText('y', actualCenterX + 20, 20);
  };

  const drawReflectionLine = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#ffd93d';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();

    const xMin = toMathCoords(0, 0, actualCenterX, actualCenterY, viewport.scale).x;
    const xMax = toMathCoords(canvasSize.width, canvasSize.height, actualCenterX, actualCenterY, viewport.scale).x;

    const start = toScreenCoords(xMin, xMin, actualCenterX, actualCenterY, viewport.scale);
    const end = toScreenCoords(xMax, xMax, actualCenterX, actualCenterY, viewport.scale);

    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawExponential = (ctx: CanvasRenderingContext2D) => {
    const points = generateExponentialPoints(config.xMin, config.xMax, config.baseNumber);

    if (points.length === 0) return;

    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;

    for (const point of points) {
      const screenPos = toScreenCoords(point.x, point.y, actualCenterX, actualCenterY, viewport.scale);

      if (isPointInBounds(screenPos, canvasSize.width, canvasSize.height, 100)) {
        if (!started) {
          ctx.moveTo(screenPos.x, screenPos.y);
          started = true;
        } else {
          ctx.lineTo(screenPos.x, screenPos.y);
        }
      } else if (started) {
        // Break path if point goes out of bounds
        started = false;
      }
    }

    ctx.stroke();
  };

  const drawLogarithmic = (ctx: CanvasRenderingContext2D) => {
    const points = generateLogarithmicPoints(config.xMax, config.baseNumber);

    if (points.length === 0) return;

    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;

    for (const point of points) {
      const screenPos = toScreenCoords(point.x, point.y, actualCenterX, actualCenterY, viewport.scale);

      if (isPointInBounds(screenPos, canvasSize.width, canvasSize.height, 100)) {
        if (!started) {
          ctx.moveTo(screenPos.x, screenPos.y);
          started = true;
        } else {
          ctx.lineTo(screenPos.x, screenPos.y);
        }
      } else if (started) {
        started = false;
      }
    }

    ctx.stroke();
  };

  // Mouse/Touch handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setLastPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    addInteraction({ type: 'pan', data: { action: 'start' } });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const dx = currentX - lastPos.x;
    const dy = currentY - lastPos.y;

    updateViewport({
      centerX: viewport.centerX + dx,
      centerY: viewport.centerY + dy,
    });

    setLastPos({ x: currentX, y: currentY });
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      addInteraction({ type: 'pan', data: { action: 'end' } });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(10, Math.min(200, viewport.scale * delta));

    updateViewport({ scale: newScale });
    addInteraction({ type: 'zoom', data: { action: e.deltaY > 0 ? 'out' : 'in' } });
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-move touch-none"
      style={{ width: '100%', height: '100%' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    />
  );
};
