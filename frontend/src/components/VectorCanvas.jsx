import React, { useRef, useEffect } from 'react';
import './VectorCanvas.css';

const VectorCanvas = ({ scene, isPlaying, progress }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw coordinate system
    drawCoordinateSystem(ctx, width, height);

    if (!scene) return;

    // Calculate animation progress (0 to 1)
    const animProgress = isPlaying ? Math.min(progress / 100, 1) : 1;

    // Draw vectors based on scene data
    if (scene.vectors) {
      scene.vectors.forEach((vector) => {
        drawVector(ctx, vector, width, height, animProgress, scene.highlight);
      });
    } else if (scene.vector) {
      // Single vector (old format)
      const vector = {
        id: 'main',
        ...scene.vector,
        color: '#667eea',
        label: 'v'
      };
      drawVector(ctx, vector, width, height, animProgress, scene.highlight);
    }

    // Draw angle arc if needed
    if (scene.showAngle && scene.vectors && scene.vectors.length >= 2) {
      drawAngleArc(ctx, scene.vectors[0], scene.vectors[1], width, height);
    }
  }, [scene, isPlaying, progress]);

  const drawCoordinateSystem = (ctx, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const gridSize = 40;

    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;

    // Draw grid
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Draw origin label
    ctx.fillStyle = '#495057';
    ctx.font = '12px sans-serif';
    ctx.fillText('O', centerX + 5, centerY - 5);
  };

  const drawVector = (ctx, vector, width, height, animProgress, highlight) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 40;

    // Calculate positions
    const startX = centerX + vector.x * scale;
    const startY = centerY - vector.y * scale;
    const endX = centerX + vector.toX * scale;
    const endY = centerY - vector.toY * scale;

    // Animate vector drawing
    const currentEndX = startX + (endX - startX) * animProgress;
    const currentEndY = startY + (endY - startY) * animProgress;

    const color = vector.color || '#667eea';
    const opacity = vector.opacity !== undefined ? vector.opacity : 1;
    const thickness = vector.thickness || 2;
    const isHighlighted = highlight === vector.id || highlight === 'both';

    // Set styles
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = isHighlighted ? thickness + 2 : thickness;

    // Draw vector line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentEndX, currentEndY);
    ctx.stroke();

    // Draw arrowhead
    if (animProgress > 0.7) {
      const angle = Math.atan2(endY - startY, endX - startX);
      const arrowSize = 12;

      ctx.beginPath();
      ctx.moveTo(currentEndX, currentEndY);
      ctx.lineTo(
        currentEndX - arrowSize * Math.cos(angle - Math.PI / 6),
        currentEndY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        currentEndX - arrowSize * Math.cos(angle + Math.PI / 6),
        currentEndY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    // Draw label
    if (vector.label && animProgress > 0.5) {
      const labelX = (startX + currentEndX) / 2;
      const labelY = (startY + currentEndY) / 2 - 10;

      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.font = isHighlighted ? 'bold 16px sans-serif' : 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(vector.label, labelX, labelY);
    }

    // Draw magnitude indicator if highlighted
    if (isHighlighted && highlight === 'magnitude' && animProgress === 1) {
      const dx = endX - startX;
      const dy = endY - startY;
      const magnitude = Math.sqrt(dx * dx + dy * dy) / scale;

      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `|${vector.label || 'v'}| = ${magnitude.toFixed(2)}`,
        (startX + endX) / 2,
        (startY + endY) / 2 + 25
      );
    }

    ctx.globalAlpha = 1;
  };

  const drawAngleArc = (ctx, vector1, vector2, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 40;

    const angle1 = Math.atan2(-(vector1.toY - vector1.y), vector1.toX - vector1.x);
    const angle2 = Math.atan2(-(vector2.toY - vector2.y), vector2.toX - vector2.x);

    const arcRadius = 30;

    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.arc(centerX, centerY, arcRadius, -angle1, -angle2, angle2 < angle1);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw angle value
    const angleDegrees = Math.abs(((angle2 - angle1) * 180) / Math.PI);
    const midAngle = (angle1 + angle2) / 2;
    const labelX = centerX + Math.cos(-midAngle) * (arcRadius + 20);
    const labelY = centerY + Math.sin(-midAngle) * (arcRadius + 20);

    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${angleDegrees.toFixed(1)}°`, labelX, labelY);
  };

  return (
    <div className="vector-canvas-container">
      <canvas ref={canvasRef} className="vector-canvas" />
    </div>
  );
};

export default VectorCanvas;
