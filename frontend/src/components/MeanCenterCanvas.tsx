import React, { useRef, useEffect, useState } from 'react';
import type { Coordinate, MeanCenterStats } from '../types';
import '../styles/MeanCenterCanvas.css';

interface MeanCenterCanvasProps {
  coordinates: Coordinate[];
  stats: MeanCenterStats | null;
  onCoordinateAdd: (x: number, y: number) => void;
  width?: number;
  height?: number;
  showTrajectory?: boolean;
  showStats?: boolean;
}

export const MeanCenterCanvas: React.FC<MeanCenterCanvasProps> = ({
  coordinates,
  stats,
  onCoordinateAdd,
  width = 296,
  height = 550,
  showTrajectory = true,
  showStats = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Handle touch/click events
  const handleInteraction = (event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in event) {
      // Touch event
      const touch = event.touches[0] || event.changedTouches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      // Mouse event
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    // Ensure coordinates are within bounds
    x = Math.max(0, Math.min(width, x));
    y = Math.max(0, Math.min(height, y));

    onCoordinateAdd(x, y);
  };

  const handleStart = (event: React.TouchEvent | React.MouseEvent) => {
    setIsDrawing(true);
    handleInteraction(event);
  };

  const handleMove = (event: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    handleInteraction(event);
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#f0f9ff');
    gradient.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Draw trajectory path
    if (showTrajectory && coordinates.length > 1) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      coordinates.forEach((coord, index) => {
        const x = parseFloat(coord.x.toString());
        const y = parseFloat(coord.y.toString());

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw coordinate points
    coordinates.forEach((coord, index) => {
      const x = parseFloat(coord.x.toString());
      const y = parseFloat(coord.y.toString());

      // Point color fades with age
      const alpha = 0.3 + (index / coordinates.length) * 0.7;

      // Draw point shadow
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.2})`;
      ctx.fill();

      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
      ctx.fill();

      // Draw point border
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw mean center
    if (stats && stats.point_count > 0) {
      const meanX = parseFloat(stats.mean_x.toString());
      const meanY = parseFloat(stats.mean_y.toString());

      // Draw pulsing circle animation
      const pulseRadius = 20;
      const gradient = ctx.createRadialGradient(
        meanX,
        meanY,
        0,
        meanX,
        meanY,
        pulseRadius
      );
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
      gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.1)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.beginPath();
      ctx.arc(meanX, meanY, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw crosshair
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(meanX - 15, meanY);
      ctx.lineTo(meanX + 15, meanY);
      ctx.stroke();

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(meanX, meanY - 15);
      ctx.lineTo(meanX, meanY + 15);
      ctx.stroke();

      // Draw center point
      ctx.beginPath();
      ctx.arc(meanX, meanY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      // Border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(meanX, meanY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();

      // Draw label
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Mean Center', meanX, meanY - 30);

      // Draw coordinates
      ctx.font = '10px system-ui, -apple-system, sans-serif';
      ctx.fillText(`(${meanX.toFixed(1)}, ${meanY.toFixed(1)})`, meanX, meanY - 18);
    }
  }, [coordinates, stats, width, height, showTrajectory]);

  return (
    <div className="mean-center-canvas-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="mean-center-canvas"
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      />

      {showStats && stats && (
        <div className="stats-overlay">
          <div className="stat-item">
            <span className="stat-label">Points:</span>
            <span className="stat-value">{stats.point_count}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Center:</span>
            <span className="stat-value">
              ({stats.mean_x.toFixed(1)}, {stats.mean_y.toFixed(1)})
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Std Dev:</span>
            <span className="stat-value">
              ({stats.std_dev_x.toFixed(1)}, {stats.std_dev_y.toFixed(1)})
            </span>
          </div>
        </div>
      )}

      {coordinates.length === 0 && (
        <div className="instructions-overlay">
          <p>👆 Tap or click to add points</p>
          <p>The red center shows the mean</p>
        </div>
      )}
    </div>
  );
};
