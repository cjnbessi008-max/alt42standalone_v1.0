import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  formatNumber,
  generateTicks,
  compressToViewport,
  decompressFromViewport,
  mapRange,
  clamp,
} from '@/utils/mathUtils';
import type { RealLineConfig, Viewport } from '@/types';
import './RealLinePanorama.css';

interface RealLinePanoramaProps {
  config: RealLineConfig;
  onValueSelect?: (value: number) => void;
  className?: string;
}

const RealLinePanorama: React.FC<RealLinePanoramaProps> = ({
  config,
  onValueSelect,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<Viewport>({
    left: config.minValue,
    right: config.maxValue,
    width: config.maxValue - config.minValue,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, viewportLeft: 0 });
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  // Convert pixel position to real line value
  const pixelToValue = useCallback(
    (pixelX: number, canvasWidth: number): number => {
      const compressed = mapRange(pixelX, 0, canvasWidth, -Math.PI / 2, Math.PI / 2);
      const value = decompressFromViewport(compressed);
      return clamp(value, viewport.left, viewport.right);
    },
    [viewport]
  );

  // Convert real line value to pixel position
  const valueToPixel = useCallback(
    (value: number, canvasWidth: number): number => {
      const compressed = compressToViewport(value);
      return mapRange(compressed, -Math.PI / 2, Math.PI / 2, 0, canvasWidth);
    },
    []
  );

  // Draw the panorama
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size accounting for device pixel ratio
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // Draw main line
    const lineY = height / 2;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(width, lineY);
    ctx.stroke();

    // Draw ticks and labels
    if (config.showTicks) {
      const ticks = generateTicks(viewport.left, viewport.right, 15);
      ctx.strokeStyle = '#666';
      ctx.fillStyle = '#333';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';

      ticks.forEach((tick) => {
        const x = valueToPixel(tick, width);

        // Draw tick mark
        ctx.beginPath();
        ctx.moveTo(x, lineY - 8);
        ctx.lineTo(x, lineY + 8);
        ctx.stroke();

        // Draw label
        if (config.showLabels) {
          ctx.fillText(formatNumber(tick, 1), x, lineY + 25);
        }
      });
    }

    // Draw highlighted points
    if (config.highlightPoints && config.highlightPoints.length > 0) {
      config.highlightPoints.forEach((point) => {
        const x = valueToPixel(point, width);

        // Draw point circle
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(x, lineY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw point label
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.fillText(formatNumber(point, 2), x, lineY - 15);
      });
    }

    // Draw marked regions
    if (config.markedRegions && config.markedRegions.length > 0) {
      config.markedRegions.forEach((region) => {
        const x1 = valueToPixel(region.start, width);
        const x2 = valueToPixel(region.end, width);

        // Draw region
        ctx.fillStyle = region.color + '40'; // Add alpha for transparency
        ctx.fillRect(x1, lineY - 20, x2 - x1, 40);

        // Draw region border
        ctx.strokeStyle = region.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x1, lineY - 20, x2 - x1, 40);

        // Draw region label
        if (region.label) {
          ctx.fillStyle = region.color;
          ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
          ctx.fillText(region.label, (x1 + x2) / 2, lineY - 25);
        }
      });
    }

    // Draw selected value
    if (selectedValue !== null) {
      const x = valueToPixel(selectedValue, width);

      // Draw selection indicator
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, lineY - 15);
      ctx.lineTo(x, lineY + 15);
      ctx.stroke();

      // Draw selection circle
      ctx.fillStyle = '#0066ff';
      ctx.beginPath();
      ctx.arc(x, lineY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw value label
      ctx.fillStyle = '#0066ff';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(formatNumber(selectedValue, 3), x, lineY - 25);
    }

    // Draw infinity indicators
    ctx.fillStyle = '#999';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillText('-∞', 15, lineY + 5);
    ctx.fillText('+∞', width - 15, lineY + 5);

  }, [config, viewport, selectedValue, valueToPixel]);

  // Handle mouse/touch down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    setIsDragging(true);
    setDragStart({ x, viewportLeft: viewport.left });
  };

  // Handle mouse/touch move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (isDragging) {
      // Pan the viewport
      const deltaX = x - dragStart.x;
      const deltaValue = (deltaX / rect.width) * viewport.width;

      const newLeft = dragStart.viewportLeft - deltaValue;
      const newRight = newLeft + viewport.width;

      setViewport({
        left: newLeft,
        right: newRight,
        width: viewport.width,
      });
    } else {
      // Show hover value
      const value = pixelToValue(x, rect.width);
      setSelectedValue(value);
    }
  };

  // Handle mouse/touch up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
    } else {
      // Click to select value
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const value = pixelToValue(x, rect.width);

      setSelectedValue(value);
      if (onValueSelect) {
        onValueSelect(value);
      }
    }
  };

  // Handle zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const newWidth = viewport.width * zoomFactor;
    const center = (viewport.left + viewport.right) / 2;

    setViewport({
      left: center - newWidth / 2,
      right: center + newWidth / 2,
      width: newWidth,
    });
  };

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      draw();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div className={`real-line-panorama ${className}`}>
      <div className="panorama-header">
        <h3 className="panorama-title">Real Line Panorama</h3>
        <div className="panorama-info">
          <span>Range: [{formatNumber(viewport.left)} ... {formatNumber(viewport.right)}]</span>
          {selectedValue !== null && (
            <span className="selected-value">
              Selected: <strong>{formatNumber(selectedValue, 4)}</strong>
            </span>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="panorama-canvas"
        width={800}
        height={200}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setIsDragging(false)}
        onWheel={handleWheel}
      />

      <div className="panorama-controls">
        <button
          className="control-btn"
          onClick={() => {
            const center = config.centerValue;
            const width = config.maxValue - config.minValue;
            setViewport({
              left: center - width / 2,
              right: center + width / 2,
              width,
            });
          }}
        >
          Reset View
        </button>
        <button
          className="control-btn"
          onClick={() => {
            const newWidth = viewport.width * 0.5;
            const center = (viewport.left + viewport.right) / 2;
            setViewport({
              left: center - newWidth / 2,
              right: center + newWidth / 2,
              width: newWidth,
            });
          }}
        >
          Zoom In
        </button>
        <button
          className="control-btn"
          onClick={() => {
            const newWidth = viewport.width * 2;
            const center = (viewport.left + viewport.right) / 2;
            setViewport({
              left: center - newWidth / 2,
              right: center + newWidth / 2,
              width: newWidth,
            });
          }}
        >
          Zoom Out
        </button>
      </div>
    </div>
  );
};

export default RealLinePanorama;
