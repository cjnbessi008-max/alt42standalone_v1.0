import React, { useEffect, useRef, useState } from 'react';
import { evaluate } from 'mathjs';
import './SmoothIntervalVisualization.css';

/**
 * SmoothIntervalVisualization Component
 * Visualizes mathematical functions and animates smooth (differentiable) intervals
 */
const SmoothIntervalVisualization = ({ problem }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Canvas dimensions
  const WIDTH = 351;  // 375px phone width - 24px padding
  const HEIGHT = 400;
  const PADDING = 40;

  useEffect(() => {
    if (!problem || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw grid and axes
    drawGrid(ctx);
    drawAxes(ctx, problem);

    // Draw function
    drawFunction(ctx, problem);

    // Draw intervals
    drawIntervals(ctx, problem, animationProgress);

  }, [problem, animationProgress]);

  /**
   * Draw background grid
   */
  const drawGrid = (ctx) => {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = PADDING; x < WIDTH - PADDING; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, PADDING);
      ctx.lineTo(x, HEIGHT - PADDING);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = PADDING; y < HEIGHT - PADDING; y += 30) {
      ctx.beginPath();
      ctx.moveTo(PADDING, y);
      ctx.lineTo(WIDTH - PADDING, y);
      ctx.stroke();
    }
  };

  /**
   * Draw coordinate axes
   */
  const drawAxes = (ctx, problem) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(PADDING, centerY);
    ctx.lineTo(WIDTH - PADDING, centerY);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, PADDING);
    ctx.lineTo(centerX, HEIGHT - PADDING);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    // X-axis labels
    if (problem.domain_start !== undefined && problem.domain_end !== undefined) {
      ctx.fillText(problem.domain_start.toString(), PADDING + 10, centerY + 20);
      ctx.fillText(problem.domain_end.toString(), WIDTH - PADDING - 10, centerY + 20);
      ctx.fillText('0', centerX, centerY + 20);
    }
  };

  /**
   * Evaluate function safely
   */
  const evaluateFunction = (expression, x) => {
    try {
      // Replace common patterns
      let expr = expression
        .replace(/abs\(/g, 'abs(')
        .replace(/\|(.+?)\|/g, 'abs($1)')
        .replace(/sin\(/g, 'sin(')
        .replace(/cos\(/g, 'cos(')
        .replace(/tan\(/g, 'tan(');

      // Handle piecewise functions (simplified)
      if (expr.includes('?')) {
        const parts = expr.split('?');
        const condition = parts[0].trim();
        const values = parts[1].split(':');

        // Evaluate condition
        if (condition.includes('<')) {
          const threshold = parseFloat(condition.split('<')[1]);
          return x < threshold ? evaluate(values[0].trim(), { x }) : evaluate(values[1].trim(), { x });
        }
      }

      return evaluate(expr, { x });
    } catch (error) {
      console.error('Function evaluation error:', error);
      return 0;
    }
  };

  /**
   * Transform coordinates
   */
  const transformX = (x, problem) => {
    const domainWidth = problem.domain_end - problem.domain_start;
    const graphWidth = WIDTH - 2 * PADDING;
    return PADDING + ((x - problem.domain_start) / domainWidth) * graphWidth;
  };

  const transformY = (y) => {
    const centerY = HEIGHT / 2;
    const scale = 30; // pixels per unit
    return centerY - y * scale;
  };

  /**
   * Draw function graph
   */
  const drawFunction = (ctx, problem) => {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const step = (problem.domain_end - problem.domain_start) / 300;
    let started = false;

    for (let x = problem.domain_start; x <= problem.domain_end; x += step) {
      const y = evaluateFunction(problem.function_expression, x);

      if (isNaN(y) || !isFinite(y)) continue;

      const canvasX = transformX(x, problem);
      const canvasY = transformY(y);

      if (!started) {
        ctx.moveTo(canvasX, canvasY);
        started = true;
      } else {
        ctx.lineTo(canvasX, canvasY);
      }
    }

    ctx.stroke();
  };

  /**
   * Draw intervals with animation
   */
  const drawIntervals = (ctx, problem, progress) => {
    if (!problem.intervals || problem.intervals.length === 0) return;

    problem.intervals.forEach(interval => {
      if (interval.is_differentiable) {
        // Draw smooth interval with flowing animation
        drawSmoothInterval(ctx, problem, interval, progress);
      } else {
        // Mark non-differentiable points
        drawNonDifferentiablePoint(ctx, problem, interval);
      }
    });
  };

  /**
   * Draw smooth (differentiable) interval with animation
   */
  const drawSmoothInterval = (ctx, problem, interval, progress) => {
    const gradient = ctx.createLinearGradient(
      transformX(interval.interval_start, problem),
      0,
      transformX(interval.interval_end, problem),
      0
    );

    // Animated gradient colors
    const hue = (progress * 360) % 360;
    gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.3)`);
    gradient.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 70%, 60%, 0.5)`);
    gradient.addColorStop(1, `hsla(${(hue + 120) % 360}, 70%, 60%, 0.3)`);

    ctx.fillStyle = gradient;

    // Draw filled region under the curve
    ctx.beginPath();
    const step = (interval.interval_end - interval.interval_start) / 100;

    let x = interval.interval_start;
    const y = evaluateFunction(problem.function_expression, x);
    ctx.moveTo(transformX(x, problem), transformY(0));
    ctx.lineTo(transformX(x, problem), transformY(y));

    for (x = interval.interval_start; x <= interval.interval_end; x += step) {
      const y = evaluateFunction(problem.function_expression, x);
      if (!isNaN(y) && isFinite(y)) {
        ctx.lineTo(transformX(x, problem), transformY(y));
      }
    }

    x = interval.interval_end;
    const endY = evaluateFunction(problem.function_expression, x);
    ctx.lineTo(transformX(x, problem), transformY(endY));
    ctx.lineTo(transformX(x, problem), transformY(0));
    ctx.closePath();
    ctx.fill();
  };

  /**
   * Draw non-differentiable point
   */
  const drawNonDifferentiablePoint = (ctx, problem, interval) => {
    const x = interval.interval_start;
    const y = evaluateFunction(problem.function_expression, x);

    const canvasX = transformX(x, problem);
    const canvasY = transformY(y);

    // Draw red circle for non-differentiable point
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw white border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  /**
   * Start animation
   */
  const startAnimation = () => {
    setIsAnimating(true);
    let progress = 0;

    const animate = () => {
      progress += 0.005;
      if (progress > 1) progress = 0;

      setAnimationProgress(progress);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  /**
   * Stop animation
   */
  const stopAnimation = () => {
    setIsAnimating(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  /**
   * Toggle animation
   */
  const toggleAnimation = () => {
    if (isAnimating) {
      stopAnimation();
    } else {
      startAnimation();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!problem) {
    return (
      <div className="visualization-container">
        <div className="loading">문제를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="visualization-container">
      <div className="problem-header">
        <h2>{problem.title}</h2>
        <p className="problem-description">{problem.description}</p>
        <div className="function-display">
          <strong>함수:</strong> <code>{problem.function_expression}</code>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="visualization-canvas"
      />

      <div className="controls">
        <button
          onClick={toggleAnimation}
          className={`animate-button ${isAnimating ? 'active' : ''}`}
        >
          {isAnimating ? '⏸ 일시정지' : '▶ 애니메이션'}
        </button>
      </div>

      <div className="intervals-info">
        <h3>구간 정보</h3>
        {problem.intervals && problem.intervals.map((interval, index) => (
          <div key={index} className={`interval-item ${interval.is_differentiable ? 'smooth' : 'non-smooth'}`}>
            <span className="interval-range">
              [{interval.interval_start}, {interval.interval_end}]
            </span>
            <span className="interval-type">
              {interval.is_differentiable ? '✓ 미분가능' : '✗ 미분불가'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmoothIntervalVisualization;
