import React, { useEffect, useRef, useState } from 'react';
import { useQuadraticStore } from '../store/quadraticStore';

interface ParabolaCanvasProps {
  width?: number;
  height?: number;
}

export const ParabolaCanvas: React.FC<ParabolaCanvasProps> = ({
  width = 400,
  height = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { coefficients, roots } = useQuadraticStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Canvas coordinate system
  const xMin = -10;
  const xMax = 10;
  const yMin = -10;
  const yMax = 10;

  // Convert canvas coordinates to mathematical coordinates
  const canvasToMath = (canvasX: number, canvasY: number) => {
    const x = xMin + (canvasX / width) * (xMax - xMin);
    const y = yMax - (canvasY / height) * (yMax - yMin);
    return { x, y };
  };

  // Convert mathematical coordinates to canvas coordinates
  const mathToCanvas = (mathX: number, mathY: number) => {
    const x = ((mathX - xMin) / (xMax - xMin)) * width;
    const y = ((yMax - mathY) / (yMax - yMin)) * height;
    return { x, y };
  };

  // Calculate y value for given x using current coefficients
  const calculateY = (x: number): number => {
    const { a, b, c } = coefficients;
    return a * x * x + b * x + c;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      const canvasPos = mathToCanvas(x, 0);
      ctx.beginPath();
      ctx.moveTo(canvasPos.x, 0);
      ctx.lineTo(canvasPos.x, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      const canvasPos = mathToCanvas(0, y);
      ctx.beginPath();
      ctx.moveTo(0, canvasPos.y);
      ctx.lineTo(width, canvasPos.y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;

    // X-axis
    const xAxisY = mathToCanvas(0, 0).y;
    ctx.beginPath();
    ctx.moveTo(0, xAxisY);
    ctx.lineTo(width, xAxisY);
    ctx.stroke();

    // Y-axis
    const yAxisX = mathToCanvas(0, 0).x;
    ctx.beginPath();
    ctx.moveTo(yAxisX, 0);
    ctx.lineTo(yAxisX, height);
    ctx.stroke();

    // Draw parabola
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.beginPath();

    let firstPoint = true;
    for (let canvasX = 0; canvasX <= width; canvasX += 1) {
      const mathCoords = canvasToMath(canvasX, 0);
      const y = calculateY(mathCoords.x);
      const canvasY = mathToCanvas(mathCoords.x, y).y;

      if (canvasY >= 0 && canvasY <= height) {
        if (firstPoint) {
          ctx.moveTo(canvasX, canvasY);
          firstPoint = false;
        } else {
          ctx.lineTo(canvasX, canvasY);
        }
      }
    }
    ctx.stroke();

    // Draw roots
    roots.forEach((root) => {
      if (root.type === 'real') {
        const canvasPos = mathToCanvas(root.x, 0);

        // Draw root point
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(canvasPos.x, canvasPos.y, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Draw vertical line to parabola
        const y = calculateY(root.x);
        const parabolaPos = mathToCanvas(root.x, y);

        ctx.strokeStyle = '#ff444444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(canvasPos.x, canvasPos.y);
        ctx.lineTo(parabolaPos.x, parabolaPos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw label
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText(`x = ${root.x.toFixed(2)}`, canvasPos.x + 10, canvasPos.y - 10);
      }
    });

    // Draw vertex
    const { a, b } = coefficients;
    if (a !== 0) {
      const vertexX = -b / (2 * a);
      const vertexY = calculateY(vertexX);
      const vertexCanvas = mathToCanvas(vertexX, vertexY);

      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(vertexCanvas.x, vertexCanvas.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(
        `Vertex (${vertexX.toFixed(2)}, ${vertexY.toFixed(2)})`,
        vertexCanvas.x + 10,
        vertexCanvas.y - 10
      );
    }

    // Draw equation
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    const equation = `y = ${coefficients.a}x² + ${coefficients.b}x + ${coefficients.c}`;
    ctx.fillText(equation, 10, 20);

    // Draw discriminant info
    const discriminant = coefficients.b ** 2 - 4 * coefficients.a * coefficients.c;
    const discText = `판별식 (b²-4ac) = ${discriminant.toFixed(2)}`;
    ctx.font = '14px monospace';
    ctx.fillText(discText, 10, 40);

    let rootInfo = '';
    if (discriminant > 0) {
      rootInfo = '실근 2개 (서로 다른 두 점에서 x축과 만남)';
    } else if (discriminant === 0) {
      rootInfo = '중근 (x축에 접함)';
    } else {
      rootInfo = '허근 (x축과 만나지 않음)';
    }
    ctx.fillText(rootInfo, 10, 60);

  }, [coefficients, roots, width, height]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    // Update coefficients based on drag
    // Vertical drag affects 'c' (vertical translation)
    const cChange = -dy * 0.05;
    useQuadraticStore.getState().setC(coefficients.c + cChange);

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        border: '2px solid #444',
        borderRadius: '8px',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    />
  );
};
