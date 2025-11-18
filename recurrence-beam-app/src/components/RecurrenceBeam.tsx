import React, { useEffect, useRef, useState } from 'react';
import type { RecurrenceStep } from '../types';
import './RecurrenceBeam.css';

interface RecurrenceBeamProps {
  steps: RecurrenceStep[];
  currentStep: number;
  isAnimating: boolean;
  speed: number;
}

/**
 * Recurrence Beam Visualization Component
 * Displays the flow of recurrence relations as an animated light beam
 */
const RecurrenceBeam: React.FC<RecurrenceBeamProps> = ({
  steps,
  currentStep,
  isAnimating,
  speed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [beamProgress, setBeamProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    // Draw the visualization
    drawVisualization(ctx, canvas.offsetWidth, canvas.offsetHeight);
  }, [steps, currentStep, beamProgress]);

  useEffect(() => {
    if (isAnimating && currentStep < steps.length - 1) {
      let progress = 0;
      const animate = () => {
        progress += speed / 100;
        if (progress >= 1) {
          progress = 1;
        }
        setBeamProgress(progress);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animate();
    } else {
      setBeamProgress(1);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, currentStep, speed]);

  const drawVisualization = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (steps.length === 0) return;

    const nodeRadius = 25;
    const horizontalSpacing = Math.min(width / (steps.length + 1), 60);
    const verticalCenter = height / 2;

    // Draw nodes for each step
    steps.forEach((step, index) => {
      const x = (index + 1) * horizontalSpacing;
      const y = verticalCenter;

      const isActive = index === currentStep;
      const isPast = index < currentStep;
      const isFuture = index > currentStep;

      // Draw connections to dependencies
      if (step.dependencies.length > 0 && isPast) {
        step.dependencies.forEach((depIndex) => {
          const depX = (depIndex + 1) * horizontalSpacing;
          const depY = verticalCenter;

          drawBeamLine(ctx, depX, depY, x, y, 0.3);
        });
      }

      // Draw active connection with animation
      if (isActive && step.dependencies.length > 0) {
        step.dependencies.forEach((depIndex) => {
          const depX = (depIndex + 1) * horizontalSpacing;
          const depY = verticalCenter;

          drawBeamLine(ctx, depX, depY, x, y, beamProgress);
        });
      }

      // Draw node
      drawNode(ctx, x, y, nodeRadius, step, isActive, isPast, isFuture);
    });
  };

  const drawNode = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    step: RecurrenceStep,
    isActive: boolean,
    isPast: boolean,
    _isFuture: boolean
  ) => {
    // Outer glow for active node
    if (isActive) {
      const gradient = ctx.createRadialGradient(x, y, radius, x, y, radius * 2);
      gradient.addColorStop(0, 'rgba(52, 152, 219, 0.4)');
      gradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (isActive) {
      ctx.fillStyle = '#3498db';
      ctx.strokeStyle = '#2980b9';
      ctx.lineWidth = 3;
    } else if (isPast) {
      ctx.fillStyle = '#2ecc71';
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 2;
    } else {
      ctx.fillStyle = '#95a5a6';
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 2;
    }

    ctx.fill();
    ctx.stroke();

    // Node label (index)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`n=${step.index}`, x, y - 2);

    // Value below node
    ctx.fillStyle = isActive ? '#3498db' : isPast ? '#2ecc71' : '#95a5a6';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(String(step.value), x, y + radius + 15);
  };

  const drawBeamLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    progress: number
  ) => {
    const currentX = x1 + (x2 - x1) * progress;
    const currentY = y1 + (y2 - y1) * progress;

    // Glowing beam effect
    const gradient = ctx.createLinearGradient(x1, y1, currentX, currentY);
    gradient.addColorStop(0, 'rgba(52, 152, 219, 0.2)');
    gradient.addColorStop(1, 'rgba(52, 152, 219, 1)');

    // Draw glow
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Draw core beam
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Draw particle at the end
    if (progress < 1) {
      const particleGradient = ctx.createRadialGradient(
        currentX,
        currentY,
        0,
        currentX,
        currentY,
        15
      );
      particleGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      particleGradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.8)');
      particleGradient.addColorStop(1, 'rgba(52, 152, 219, 0)');

      ctx.fillStyle = particleGradient;
      ctx.beginPath();
      ctx.arc(currentX, currentY, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  return (
    <div className="recurrence-beam-container">
      <canvas ref={canvasRef} className="recurrence-beam-canvas" />
      {steps[currentStep] && (
        <div className="current-formula">
          {steps[currentStep].formula}
        </div>
      )}
    </div>
  );
};

export default RecurrenceBeam;
