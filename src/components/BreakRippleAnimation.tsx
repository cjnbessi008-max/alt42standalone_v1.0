import React, { useRef, useEffect, useState } from 'react';
import { MathFunction, RippleConfig, AnimationState, DiscontinuityType, RippleBehavior } from '@/types';

interface BreakRippleAnimationProps {
  mathFunction: MathFunction;
  config?: Partial<RippleConfig>;
  onDiscontinuityReached?: (x: number) => void;
  width?: number;
  height?: number;
}

/**
 * BreakRippleAnimation Component
 * Visualizes wave propagation along a function with discontinuities
 * The ripple "breaks" at discontinuity points to illustrate the mathematical concept
 */
const BreakRippleAnimation: React.FC<BreakRippleAnimationProps> = ({
  mathFunction,
  config = {},
  onDiscontinuityReached,
  width = 800,
  height = 500
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: config.autoPlay ?? true,
    currentTime: 0,
    ripplePosition: mathFunction.domain[0],
    hasReachedDiscontinuity: false,
    completedCycles: 0
  });

  const defaultConfig: RippleConfig = {
    speed: 1.0,
    amplitude: 20,
    frequency: 2,
    color: '#2196F3',
    showDiscontinuity: true,
    autoPlay: true,
    ...config
  };

  // Canvas coordinate transformation
  const toCanvasX = (x: number): number => {
    const [xMin, xMax] = mathFunction.domain;
    return ((x - xMin) / (xMax - xMin)) * (width - 100) + 50;
  };

  const toCanvasY = (y: number): number => {
    const [yMin, yMax] = mathFunction.range;
    return height - 50 - ((y - yMin) / (yMax - yMin)) * (height - 100);
  };

  // Evaluate function at point x
  const evaluateFunction = (x: number): number | null => {
    try {
      // Simple piecewise function parser
      // In production, use a proper math expression evaluator
      const expr = mathFunction.expression;

      // Example: "x < 2 ? x^2 : x + 3"
      // This is simplified - use math.js or similar in production

      // For demo purposes, create a simple discontinuous function
      if (x < 2) {
        return x * x;
      } else if (x === 2) {
        return null; // Discontinuity at x = 2
      } else {
        return x + 3;
      }
    } catch (e) {
      return null;
    }
  };

  // Draw coordinate axes
  const drawAxes = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(40, height - 50);
    ctx.lineTo(width - 40, height - 50);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(50, 40);
    ctx.lineTo(50, height - 40);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';

    const [xMin, xMax] = mathFunction.domain;
    const [yMin, yMax] = mathFunction.range;

    // X-axis labels
    for (let i = 0; i <= 5; i++) {
      const x = xMin + (xMax - xMin) * (i / 5);
      const canvasX = toCanvasX(x);
      ctx.fillText(x.toFixed(1), canvasX - 10, height - 30);
    }

    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const y = yMin + (yMax - yMin) * (i / 5);
      const canvasY = toCanvasY(y);
      ctx.fillText(y.toFixed(1), 15, canvasY + 5);
    }
  };

  // Draw the mathematical function
  const drawFunction = (ctx: CanvasRenderingContext2D) => {
    const [xMin, xMax] = mathFunction.domain;
    const step = (xMax - xMin) / 500;

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    let isDrawing = false;

    for (let x = xMin; x <= xMax; x += step) {
      const y = evaluateFunction(x);

      if (y === null) {
        isDrawing = false;
        continue;
      }

      const canvasX = toCanvasX(x);
      const canvasY = toCanvasY(y);

      if (!isDrawing) {
        ctx.beginPath();
        ctx.moveTo(canvasX, canvasY);
        isDrawing = true;
      } else {
        ctx.lineTo(canvasX, canvasY);
      }
    }

    ctx.stroke();
  };

  // Draw discontinuity points
  const drawDiscontinuities = (ctx: CanvasRenderingContext2D) => {
    if (!defaultConfig.showDiscontinuity) return;

    mathFunction.discontinuityPoints.forEach(point => {
      const canvasX = toCanvasX(point.x);

      // Draw vertical dashed line at discontinuity
      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(canvasX, 40);
      ctx.lineTo(canvasX, height - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw left limit point
      if (point.leftLimit !== null) {
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(canvasX - 2, toCanvasY(point.leftLimit), 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw right limit point
      if (point.rightLimit !== null) {
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(canvasX + 2, toCanvasY(point.rightLimit), 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw hollow circle if function value doesn't exist
      if (point.functionValue === null) {
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const avgY = point.leftLimit !== null && point.rightLimit !== null
          ? (point.leftLimit + point.rightLimit) / 2
          : point.leftLimit ?? point.rightLimit ?? 0;
        ctx.arc(canvasX, toCanvasY(avgY), 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Label the discontinuity type
      ctx.fillStyle = '#FF5722';
      ctx.font = '14px Arial';
      ctx.fillText(`x = ${point.x}`, canvasX - 20, 30);
    });
  };

  // Draw the ripple wave
  const drawRipple = (ctx: CanvasRenderingContext2D, position: number, time: number) => {
    const y = evaluateFunction(position);
    if (y === null) return;

    const canvasX = toCanvasX(position);
    const canvasY = toCanvasY(y);

    // Check if we're at a discontinuity
    const nearDiscontinuity = mathFunction.discontinuityPoints.find(
      point => Math.abs(point.x - position) < 0.1
    );

    if (nearDiscontinuity) {
      // Handle ripple behavior at discontinuity
      handleDiscontinuityEffect(ctx, canvasX, canvasY, nearDiscontinuity.rippleBehavior, time);

      if (!animationState.hasReachedDiscontinuity) {
        setAnimationState(prev => ({ ...prev, hasReachedDiscontinuity: true }));
        onDiscontinuityReached?.(nearDiscontinuity.x);
      }
    } else {
      // Normal ripple effect
      drawNormalRipple(ctx, canvasX, canvasY, time);
    }
  };

  // Draw normal ripple wave
  const drawNormalRipple = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    const { amplitude, frequency, color } = defaultConfig;

    // Draw multiple concentric circles
    for (let i = 0; i < 3; i++) {
      const radius = (time % 1) * 50 + i * 15;
      const opacity = 1 - (time % 1);

      ctx.strokeStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 3 - i;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw center point
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  // Handle ripple effect at discontinuity
  const handleDiscontinuityEffect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    behavior: RippleBehavior,
    time: number
  ) => {
    const { color } = defaultConfig;

    switch (behavior) {
      case RippleBehavior.BREAK:
        // Ripple breaks apart
        drawBreakingRipple(ctx, x, y, time);
        break;
      case RippleBehavior.REFLECT:
        // Ripple reflects back
        drawReflectingRipple(ctx, x, y, time);
        break;
      case RippleBehavior.JUMP:
        // Ripple jumps to other side
        drawJumpingRipple(ctx, x, y, time);
        break;
      case RippleBehavior.DAMPEN:
        // Ripple amplitude decreases
        drawDampenedRipple(ctx, x, y, time);
        break;
    }
  };

  // Draw breaking ripple effect
  const drawBreakingRipple = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    const { color } = defaultConfig;
    const breakTime = time % 1;

    // Create fragments that scatter
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const distance = breakTime * 60;
      const fragmentX = x + Math.cos(angle) * distance;
      const fragmentY = y + Math.sin(angle) * distance;
      const opacity = 1 - breakTime;

      ctx.fillStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.arc(fragmentX, fragmentY, 4 * (1 - breakTime), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Draw reflecting ripple effect
  const drawReflectingRipple = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    const { color } = defaultConfig;
    const reflectTime = time % 1;

    // Outgoing wave
    ctx.strokeStyle = `${color}${Math.floor((1 - reflectTime) * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, reflectTime * 40, 0, Math.PI * 2);
    ctx.stroke();

    // Reflected wave (going back)
    ctx.strokeStyle = `#FF9800${Math.floor(reflectTime * 255).toString(16).padStart(2, '0')}`;
    ctx.beginPath();
    ctx.arc(x, y, (1 - reflectTime) * 40, 0, Math.PI * 2);
    ctx.stroke();
  };

  // Draw jumping ripple effect
  const drawJumpingRipple = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    const { color } = defaultConfig;
    const jumpTime = time % 1;

    // Fading out on one side
    ctx.fillStyle = `${color}${Math.floor((1 - jumpTime) * 255).toString(16).padStart(2, '0')}`;
    ctx.beginPath();
    ctx.arc(x - 10, y, 8 * (1 - jumpTime), 0, Math.PI * 2);
    ctx.fill();

    // Appearing on the other side
    ctx.fillStyle = `${color}${Math.floor(jumpTime * 255).toString(16).padStart(2, '0')}`;
    ctx.beginPath();
    ctx.arc(x + 10, y, 8 * jumpTime, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw dampened ripple effect
  const drawDampenedRipple = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    const { color } = defaultConfig;
    const dampenTime = time % 1;

    for (let i = 0; i < 3; i++) {
      const radius = dampenTime * 30 + i * 10;
      const opacity = (1 - dampenTime) * 0.5; // Reduced opacity for dampening effect

      ctx.strokeStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw all components
    drawAxes(ctx);
    drawFunction(ctx);
    drawDiscontinuities(ctx);

    if (animationState.isPlaying) {
      drawRipple(ctx, animationState.ripplePosition, animationState.currentTime);

      // Update animation state
      const [xMin, xMax] = mathFunction.domain;
      const step = (xMax - xMin) * defaultConfig.speed * 0.01;

      setAnimationState(prev => {
        let newPosition = prev.ripplePosition + step;
        let newCycles = prev.completedCycles;
        let reachedDiscontinuity = prev.hasReachedDiscontinuity;

        // Reset when reaching the end
        if (newPosition > xMax) {
          newPosition = xMin;
          newCycles++;
          reachedDiscontinuity = false;
        }

        return {
          ...prev,
          currentTime: prev.currentTime + 0.05,
          ripplePosition: newPosition,
          completedCycles: newCycles,
          hasReachedDiscontinuity: reachedDiscontinuity
        };
      });
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Start animation
  useEffect(() => {
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationState.isPlaying, animationState.ripplePosition]);

  const togglePlayPause = () => {
    setAnimationState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const reset = () => {
    setAnimationState({
      isPlaying: false,
      currentTime: 0,
      ripplePosition: mathFunction.domain[0],
      hasReachedDiscontinuity: false,
      completedCycles: 0
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          display: 'block',
          margin: '0 auto'
        }}
      />

      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        display: 'flex',
        gap: '10px',
        justifyContent: 'center'
      }}>
        <button
          onClick={togglePlayPause}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: animationState.isPlaying ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {animationState.isPlaying ? '일시정지 (Pause)' : '재생 (Play)'}
        </button>

        <button
          onClick={reset}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          초기화 (Reset)
        </button>
      </div>

      <div style={{
        marginTop: '10px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#666'
      }}>
        <p>물결 위치 (Ripple Position): x = {animationState.ripplePosition.toFixed(2)}</p>
        <p>완료된 주기 (Completed Cycles): {animationState.completedCycles}</p>
      </div>
    </div>
  );
};

export default BreakRippleAnimation;
