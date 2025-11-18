import React, { useRef, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import type { Point, InverseProblem } from '../types/problem';
import {
  generateFunctionPoints,
  reflectPointAcrossYX,
  projectOntoYXLine,
  findClosestPoint,
  formatNumber,
} from '../utils/mathUtils';

interface Props {
  problem: InverseProblem;
  onPointReflected?: (original: Point, reflected: Point) => void;
}

const InverseReflectionCanvas: React.FC<Props> = ({ problem, onPointReflected }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalPoints, setOriginalPoints] = useState<Point[]>([]);
  const [inversePoints, setInversePoints] = useState<Point[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [reflectedPoint, setReflectedPoint] = useState<Point | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const config = problem.visualization_config || {
    show_grid: true,
    show_reflection_line: true,
    animation_speed: 'medium' as const,
    color_original: '#2196F3',
    color_inverse: '#F44336',
    color_reflection_line: '#4CAF50',
  };

  const padding = 40;
  const { domain_min, domain_max } = problem;

  // Generate function points
  useEffect(() => {
    const origPoints = generateFunctionPoints(
      problem.original_function,
      domain_min,
      domain_max,
      100
    );
    const invPoints = generateFunctionPoints(
      problem.inverse_function,
      domain_min,
      domain_max,
      100
    );

    setOriginalPoints(origPoints);
    setInversePoints(invPoints);
  }, [problem]);

  // Drawing functions
  const mathToCanvas = (point: Point, canvas: HTMLCanvasElement): Point => {
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;

    const canvasX = padding + ((point.x - domain_min) / (domain_max - domain_min)) * width;
    const canvasY = padding + ((domain_max - point.y) / (domain_max - domain_min)) * height;

    return { x: canvasX, y: canvasY };
  };

  const canvasToMath = (point: Point, canvas: HTMLCanvasElement): Point => {
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;

    const mathX = domain_min + ((point.x - padding) / width) * (domain_max - domain_min);
    const mathY = domain_max - ((point.y - padding) / height) * (domain_max - domain_min);

    return { x: mathX, y: mathY };
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let i = Math.ceil(domain_min); i <= Math.floor(domain_max); i++) {
      const pos = mathToCanvas({ x: i, y: 0 }, canvas);
      ctx.beginPath();
      ctx.moveTo(pos.x, padding);
      ctx.lineTo(pos.x, canvas.height - padding);
      ctx.stroke();

      const yPos = mathToCanvas({ x: 0, y: i }, canvas);
      ctx.beginPath();
      ctx.moveTo(padding, yPos.y);
      ctx.lineTo(canvas.width - padding, yPos.y);
      ctx.stroke();
    }
  };

  const drawAxes = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    const xAxis = mathToCanvas({ x: 0, y: 0 }, canvas);
    ctx.beginPath();
    ctx.moveTo(padding, xAxis.y);
    ctx.lineTo(canvas.width - padding, xAxis.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xAxis.x, padding);
    ctx.lineTo(xAxis.x, canvas.height - padding);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.fillText('x', canvas.width - padding + 10, xAxis.y);
    ctx.fillText('y', xAxis.x, padding - 10);
  };

  const drawReflectionLine = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.strokeStyle = config.color_reflection_line;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    const start = mathToCanvas({ x: domain_min, y: domain_min }, canvas);
    const end = mathToCanvas({ x: domain_max, y: domain_max }, canvas);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.fillStyle = config.color_reflection_line;
    ctx.font = 'bold 16px Arial';
    const midPoint = mathToCanvas(
      { x: (domain_min + domain_max) / 2, y: (domain_min + domain_max) / 2 },
      canvas
    );
    ctx.fillText('y = x', midPoint.x + 10, midPoint.y - 10);
  };

  const drawFunction = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    points: Point[],
    color: string,
    lineWidth: number = 3
  ) => {
    if (points.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    points.forEach((point, index) => {
      const canvasPoint = mathToCanvas(point, canvas);
      if (index === 0) {
        ctx.moveTo(canvasPoint.x, canvasPoint.y);
      } else {
        ctx.lineTo(canvasPoint.x, canvasPoint.y);
      }
    });

    ctx.stroke();
  };

  const drawPoint = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    point: Point,
    color: string,
    radius: number = 6
  ) => {
    const canvasPoint = mathToCanvas(point, canvas);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(canvasPoint.x, canvasPoint.y, radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawLabel = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    point: Point,
    text: string,
    color: string
  ) => {
    const canvasPoint = mathToCanvas(point, canvas);

    ctx.fillStyle = color;
    ctx.font = '12px Arial';
    ctx.fillText(text, canvasPoint.x + 10, canvasPoint.y - 10);
  };

  // Main draw function
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    if (config.show_grid) {
      drawGrid(ctx, canvas);
    }

    // Draw axes
    drawAxes(ctx, canvas);

    // Draw reflection line
    if (config.show_reflection_line) {
      drawReflectionLine(ctx, canvas);
    }

    // Draw functions
    drawFunction(ctx, canvas, originalPoints, config.color_original);
    drawFunction(ctx, canvas, inversePoints, config.color_inverse);

    // Draw selected points
    if (selectedPoint) {
      drawPoint(ctx, canvas, selectedPoint, config.color_original);
      drawLabel(
        ctx,
        canvas,
        selectedPoint,
        `(${formatNumber(selectedPoint.x)}, ${formatNumber(selectedPoint.y)})`,
        config.color_original
      );
    }

    if (reflectedPoint) {
      drawPoint(ctx, canvas, reflectedPoint, config.color_inverse);
      drawLabel(
        ctx,
        canvas,
        reflectedPoint,
        `(${formatNumber(reflectedPoint.x)}, ${formatNumber(reflectedPoint.y)})`,
        config.color_inverse
      );

      // Draw connection line
      if (selectedPoint) {
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);

        const start = mathToCanvas(selectedPoint, canvas);
        const end = mathToCanvas(reflectedPoint, canvas);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        ctx.setLineDash([]);
      }
    }
  };

  // Animate reflection
  const animateReflection = async (point: Point) => {
    if (isAnimating) return;

    setIsAnimating(true);
    const reflected = reflectPointAcrossYX(point);
    const projection = projectOntoYXLine(point);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const steps = config.animation_speed === 'fast' ? 15 : config.animation_speed === 'slow' ? 30 : 20;
    const delay = config.animation_speed === 'fast' ? 10 : config.animation_speed === 'slow' ? 30 : 20;

    // Phase 1: Move to projection
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const current = {
        x: point.x + (projection.x - point.x) * t,
        y: point.y + (projection.y - point.y) * t,
      };

      setSelectedPoint(point);
      setReflectedPoint(current);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Phase 2: Move to reflected point
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const current = {
        x: projection.x + (reflected.x - projection.x) * t,
        y: projection.y + (reflected.y - projection.y) * t,
      };

      setReflectedPoint(current);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    setReflectedPoint(reflected);
    setIsAnimating(false);

    if (onPointReflected) {
      onPointReflected(point, reflected);
    }
  };

  // Handle canvas click
  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || originalPoints.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const canvasPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    const mathPoint = canvasToMath(canvasPoint, canvas);
    const closestPoint = findClosestPoint(originalPoints, mathPoint);

    animateReflection(closestPoint);
  };

  // Draw on every state change
  useEffect(() => {
    draw();
  }, [originalPoints, inversePoints, selectedPoint, reflectedPoint, config]);

  return (
    <Box
      sx={{
        border: '1px solid #ddd',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 2,
      }}
    >
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        onClick={handleClick}
        style={{
          cursor: 'crosshair',
          display: 'block',
          width: '100%',
          height: 'auto',
        }}
      />
    </Box>
  );
};

export default InverseReflectionCanvas;
