/**
 * Unit Compass Component
 * Interactive unit vector compass visualization
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { UnitVector } from '../types';
import { unitVectorFromAngle, createUnitVector, radToDeg } from '../utils/vectorMath';

interface UnitCompassProps {
  targetAngle?: number; // Target angle to reach (in radians)
  onVectorChange?: (vector: UnitVector) => void;
  interactive?: boolean;
  size?: number;
  showGrid?: boolean;
  showAngles?: boolean;
}

const UnitCompass: React.FC<UnitCompassProps> = ({
  targetAngle,
  onVectorChange,
  interactive = true,
  size = 300,
  showGrid = true,
  showAngles = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentVector, setCurrentVector] = useState<UnitVector>(unitVectorFromAngle(0));
  const [isDragging, setIsDragging] = useState(false);

  // Draw the compass
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, centerX, centerY, size);
    }

    // Draw compass circle
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw axes
    drawAxes(ctx, centerX, centerY, radius);

    // Draw angle markers if enabled
    if (showAngles) {
      drawAngleMarkers(ctx, centerX, centerY, radius);
    }

    // Draw target angle if provided
    if (targetAngle !== undefined) {
      drawTargetAngle(ctx, centerX, centerY, radius, targetAngle);
    }

    // Draw current unit vector
    drawUnitVector(ctx, centerX, centerY, radius, currentVector);

    // Draw angle arc and label
    drawAngleArc(ctx, centerX, centerY, radius * 0.3, currentVector.angle);
  }, [size, showGrid, showAngles, targetAngle, currentVector]);

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) => {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    const gridSize = 20;
    for (let i = 0; i <= size; i += gridSize) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }
  };

  // Draw coordinate axes
  const drawAxes = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#666';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText('X', centerX + radius + 15, centerY);
    ctx.fillText('Y', centerX, centerY - radius - 15);
  };

  // Draw angle markers (0°, 90°, 180°, 270°)
  const drawAngleMarkers = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
    ctx.fillStyle = '#999';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const markers = [
      { angle: 0, label: '0°', x: radius + 25, y: 0 },
      { angle: Math.PI / 2, label: '90°', x: 0, y: -radius - 25 },
      { angle: Math.PI, label: '180°', x: -radius - 25, y: 0 },
      { angle: (3 * Math.PI) / 2, label: '270°', x: 0, y: radius + 25 },
    ];

    markers.forEach(({ angle, label, x, y }) => {
      const markerRadius = radius + 5;
      const mx = centerX + Math.cos(angle) * markerRadius;
      const my = centerY - Math.sin(angle) * markerRadius;

      // Draw small tick
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * radius, centerY - Math.sin(angle) * radius);
      ctx.lineTo(mx, my);
      ctx.stroke();

      // Draw label
      ctx.fillText(label, centerX + x, centerY + y);
    });
  };

  // Draw target angle
  const drawTargetAngle = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    angle: number
  ) => {
    const targetX = centerX + Math.cos(angle) * radius;
    const targetY = centerY - Math.sin(angle) * radius;

    // Draw target line (dashed)
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw target point
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw target label
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('목표', targetX, targetY - 15);
  };

  // Draw current unit vector
  const drawUnitVector = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    vector: UnitVector
  ) => {
    const endX = centerX + vector.x * radius;
    const endY = centerY - vector.y * radius; // Flip Y for canvas coordinates

    // Draw vector line
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw arrowhead
    const arrowSize = 12;
    const arrowAngle = Math.PI / 6;
    const angle = Math.atan2(-(endY - centerY), endX - centerX);

    ctx.fillStyle = '#2196F3';
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle - arrowAngle),
      endY - arrowSize * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle + arrowAngle),
      endY - arrowSize * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();

    // Draw vector point
    ctx.fillStyle = '#2196F3';
    ctx.beginPath();
    ctx.arc(endX, endY, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw angle arc and label
  const drawAngleArc = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    arcRadius: number,
    angle: number
  ) => {
    // Draw arc
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, arcRadius, 0, -angle, angle < 0);
    ctx.stroke();

    // Draw angle label
    const labelRadius = arcRadius + 15;
    const labelAngle = angle / 2;
    const labelX = centerX + Math.cos(labelAngle) * labelRadius;
    const labelY = centerY - Math.sin(labelAngle) * labelRadius;

    ctx.fillStyle = '#FF9800';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${radToDeg(angle).toFixed(1)}°`, labelX, labelY);
  };

  // Handle mouse/touch events
  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const updateVectorFromMouse = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    const pos = getMousePosition(e);
    const centerX = size / 2;
    const centerY = size / 2;

    const dx = pos.x - centerX;
    const dy = centerY - pos.y; // Flip Y for math coordinates

    const newVector = createUnitVector(dx, dy);
    setCurrentVector(newVector);

    if (onVectorChange) {
      onVectorChange(newVector);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    setIsDragging(true);
    updateVectorFromMouse(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !isDragging) return;
    updateVectorFromMouse(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    e.preventDefault();
    setIsDragging(true);
    updateVectorFromMouse(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!interactive || !isDragging) return;
    e.preventDefault();
    updateVectorFromMouse(e);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="unit-compass">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          border: '2px solid #ddd',
          borderRadius: '8px',
          cursor: interactive ? 'crosshair' : 'default',
          touchAction: 'none',
        }}
      />
      <div className="vector-info" style={{ marginTop: '10px', textAlign: 'center' }}>
        <p>
          <strong>현재 벡터:</strong> ({currentVector.x.toFixed(3)}, {currentVector.y.toFixed(3)})
        </p>
        <p>
          <strong>각도:</strong> {radToDeg(currentVector.angle).toFixed(1)}°
        </p>
      </div>
    </div>
  );
};

export default UnitCompass;
