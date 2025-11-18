import React, { useEffect, useRef } from 'react';
import { Counterexample, VisualizationConfig } from '../../types';
import './CounterexampleShadow.css';

interface CounterexampleShadowProps {
  counterexamples: Counterexample[];
  config: VisualizationConfig;
  width?: number;
  height?: number;
}

const CounterexampleShadow: React.FC<CounterexampleShadowProps> = ({
  counterexamples,
  config,
  width = 600,
  height = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationProgress = 0;
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      animationProgress = Math.min(elapsed / config.animation.duration, 1);

      // Clear canvas
      ctx.fillStyle = config.colors.neutral;
      ctx.fillRect(0, 0, width, height);

      // Draw based on visualization mode
      switch (config.mode) {
        case 'venn':
          drawVennDiagram(ctx, counterexamples, config, width, height, animationProgress);
          break;
        case 'number-line':
          drawNumberLine(ctx, counterexamples, config, width, height, animationProgress);
          break;
        case 'graph':
          drawGraph(ctx, counterexamples, config, width, height, animationProgress);
          break;
        default:
          drawVennDiagram(ctx, counterexamples, config, width, height, animationProgress);
      }

      if (animationProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [counterexamples, config, width, height]);

  return (
    <div className="counterexample-shadow">
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
};

// Venn Diagram visualization
function drawVennDiagram(
  ctx: CanvasRenderingContext2D,
  counterexamples: Counterexample[],
  config: VisualizationConfig,
  width: number,
  height: number,
  progress: number
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.3;

  // Draw positive area (satisfies proposition)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = config.colors.positive;
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw counterexamples as dark shadows
  counterexamples.forEach((ce) => {
    const x = ce.visualPosition.x || centerX + Math.random() * 100 - 50;
    const y = ce.visualPosition.y || centerY + Math.random() * 100 - 50;
    const shadowRadius = 30 * progress;

    // Create radial gradient for shadow effect
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, shadowRadius);
    const intensity = ce.shadowIntensity * progress;
    gradient.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
    gradient.addColorStop(0.7, `rgba(0, 0, 0, ${intensity * 0.5})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x - shadowRadius, y - shadowRadius, shadowRadius * 2, shadowRadius * 2);

    // Draw counterexample value
    if (progress > 0.5) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(ce.value), x, y);
    }
  });
}

// Number line visualization
function drawNumberLine(
  ctx: CanvasRenderingContext2D,
  counterexamples: Counterexample[],
  config: VisualizationConfig,
  width: number,
  height: number,
  progress: number
) {
  const padding = 50;
  const lineY = height / 2;
  const lineWidth = width - padding * 2;

  // Draw number line
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, lineY);
  ctx.lineTo(width - padding, lineY);
  ctx.stroke();

  // Draw tick marks
  for (let i = 0; i <= 10; i++) {
    const x = padding + (lineWidth / 10) * i;
    ctx.beginPath();
    ctx.moveTo(x, lineY - 10);
    ctx.lineTo(x, lineY + 10);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i), x, lineY + 25);
  }

  // Draw counterexamples as shadows
  counterexamples.forEach((ce) => {
    const value = Number(ce.value);
    if (isNaN(value)) return;

    const x = padding + (lineWidth / 10) * value;
    const shadowHeight = 40 * progress;

    const gradient = ctx.createLinearGradient(x, lineY - shadowHeight, x, lineY + shadowHeight);
    const intensity = ce.shadowIntensity * progress;
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, `rgba(0, 0, 0, ${intensity})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x - 20, lineY - shadowHeight, 40, shadowHeight * 2);

    // Label
    if (progress > 0.5) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(ce.value), x, lineY);
    }
  });
}

// Graph visualization
function drawGraph(
  ctx: CanvasRenderingContext2D,
  counterexamples: Counterexample[],
  config: VisualizationConfig,
  width: number,
  height: number,
  progress: number
) {
  // Simple scatter plot
  const padding = 50;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Draw axes
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Draw counterexamples
  counterexamples.forEach((ce) => {
    const x = padding + (ce.visualPosition.x / 100) * graphWidth * progress;
    const y = height - padding - (ce.visualPosition.y / 100) * graphHeight * progress;
    const shadowRadius = 25 * progress;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, shadowRadius);
    const intensity = ce.shadowIntensity * progress;
    gradient.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x - shadowRadius, y - shadowRadius, shadowRadius * 2, shadowRadius * 2);

    // Point
    ctx.fillStyle = config.colors.negative;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

export default CounterexampleShadow;
