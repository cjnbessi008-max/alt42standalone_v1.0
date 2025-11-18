import React, { useEffect, useRef, useState } from 'react';
import './SpiralVisualization.css';
import { drawSpiral, calculateSpiralPoints } from '../utils/spiralEngine';

const SpiralVisualization = ({ sequence, onComplete }) => {
  const canvasRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTerm, setCurrentTerm] = useState(0);
  const [points, setPoints] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (sequence) {
      const spiralPoints = calculateSpiralPoints(sequence);
      setPoints(spiralPoints);
      setCurrentTerm(0);
    }
  }, [sequence]);

  useEffect(() => {
    if (canvasRef.current && points.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply transformations
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.rotate((rotation * Math.PI) / 180);

      // Draw spiral
      drawSpiral(ctx, points.slice(0, currentTerm + 1), sequence);

      ctx.restore();
    }
  }, [points, currentTerm, zoom, rotation, sequence]);

  const handleAnimate = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setCurrentTerm(0);

    let term = 0;
    const interval = setInterval(() => {
      term++;
      setCurrentTerm(term);

      if (term >= points.length - 1) {
        clearInterval(interval);
        setIsAnimating(false);
        if (onComplete) {
          onComplete();
        }
      }
    }, 500);
  };

  const handleReset = () => {
    setCurrentTerm(0);
    setZoom(1);
    setRotation(0);
    setIsAnimating(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleRotateLeft = () => setRotation(prev => (prev - 15) % 360);
  const handleRotateRight = () => setRotation(prev => (prev + 15) % 360);

  return (
    <div className="spiral-visualization">
      <div className="spiral-header">
        <h2>{sequence.name}</h2>
        <p className="spiral-info">
          {sequence.sequence_type === 'geometric' && sequence.common_ratio && (
            <>첫 항: {sequence.first_term}, 공비: {sequence.common_ratio}</>
          )}
          {sequence.sequence_type === 'fibonacci' && (
            <>피보나치 수열</>
          )}
        </p>
        <p className="spiral-term">
          현재 항: {currentTerm + 1} / {points.length}
        </p>
      </div>

      <div className="spiral-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={335}
          height={400}
          className="spiral-canvas"
        />
      </div>

      <div className="spiral-controls">
        <div className="control-row">
          <button
            className="control-btn primary"
            onClick={handleAnimate}
            disabled={isAnimating}
          >
            {isAnimating ? '애니메이션 중...' : '애니메이션 시작'}
          </button>
          <button className="control-btn" onClick={handleReset}>
            초기화
          </button>
        </div>

        <div className="control-row">
          <button className="control-btn" onClick={handleZoomOut}>
            축소 -
          </button>
          <span className="zoom-indicator">{(zoom * 100).toFixed(0)}%</span>
          <button className="control-btn" onClick={handleZoomIn}>
            확대 +
          </button>
        </div>

        <div className="control-row">
          <button className="control-btn" onClick={handleRotateLeft}>
            ↶ 좌회전
          </button>
          <span className="rotation-indicator">{rotation}°</span>
          <button className="control-btn" onClick={handleRotateRight}>
            우회전 ↷
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpiralVisualization;
