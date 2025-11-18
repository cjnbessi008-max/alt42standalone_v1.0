/**
 * BlendDifferenceAnimator Component
 * Main component for visualizing function differences using color blending animations
 */

import React, { useRef, useEffect, useState } from 'react';
import { MathEvaluator } from '../utils/mathEvaluator';
import { ColorBlender } from '../utils/colorBlending';
import { CanvasUtils } from '../utils/canvasUtils';
import type { MathFunction, AnimationConfig, CanvasConfig } from '../types';

interface Props {
  function1: MathFunction;
  function2: MathFunction;
  config: AnimationConfig;
  width?: number;
  height?: number;
  onAnimationComplete?: () => void;
}

export const BlendDifferenceAnimator: React.FC<Props> = ({
  function1,
  function2,
  config,
  width = 600,
  height = 400,
  onAnimationComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const canvasConfig: CanvasConfig = {
    width,
    height,
    pixelRatio: window.devicePixelRatio || 1,
    padding: 50
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / (config.duration * 1000), 1);

      setAnimationProgress(progress);
      drawFrame(progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, config, function1, function2]);

  // Draw a single frame
  const drawFrame = (progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    CanvasUtils.clear(ctx, canvasConfig);

    // Set high DPI
    canvas.width = width * canvasConfig.pixelRatio;
    canvas.height = height * canvasConfig.pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(canvasConfig.pixelRatio, canvasConfig.pixelRatio);

    // Draw grid and axes if enabled
    if (config.showGrid) {
      CanvasUtils.drawGrid(
        ctx,
        canvasConfig,
        config.xMin,
        config.xMax,
        config.yMin,
        config.yMax
      );
    }

    if (config.showAxes) {
      CanvasUtils.drawAxes(
        ctx,
        canvasConfig,
        config.xMin,
        config.xMax,
        config.yMin,
        config.yMax
      );
    }

    // Generate function points
    const points1 = MathEvaluator.generatePoints(
      function1.expression,
      config.xMin,
      config.xMax,
      500
    );

    const points2 = MathEvaluator.generatePoints(
      function2.expression,
      config.xMin,
      config.xMax,
      500
    );

    // Draw first function (fade in during first 30% of animation)
    const alpha1 = Math.min(progress / 0.3, 1);
    if (alpha1 > 0) {
      ctx.globalAlpha = alpha1;
      CanvasUtils.fillUnderCurve(
        ctx,
        points1,
        canvasConfig,
        config.xMin,
        config.xMax,
        config.yMin,
        config.yMax,
        function1.color,
        0.3
      );
      CanvasUtils.drawCurve(
        ctx,
        points1,
        canvasConfig,
        config.xMin,
        config.xMax,
        config.yMin,
        config.yMax,
        function1.color,
        3
      );
      ctx.globalAlpha = 1;

      // Draw label
      CanvasUtils.drawLabel(
        ctx,
        function1.label,
        canvasConfig.padding + 80,
        canvasConfig.padding - 20,
        function1.color,
        14
      );
    }

    // Draw second function (fade in during 30-60% of animation)
    const alpha2 = Math.max(0, Math.min((progress - 0.3) / 0.3, 1));
    if (alpha2 > 0) {
      ctx.globalAlpha = alpha2;
      CanvasUtils.fillUnderCurve(
        ctx,
        points2,
        canvasConfig,
        config.xMin,
        config.xMax,
        config.yMin,
        config.yMax,
        function2.color,
        0.3
      );
      CanvasUtils.drawCurve(
        ctx,
        points2,
        canvasConfig,
        config.xMin,
        config.xMax,
        config.yMin,
        config.yMax,
        function2.color,
        3
      );
      ctx.globalAlpha = 1;

      // Draw label
      CanvasUtils.drawLabel(
        ctx,
        function2.label,
        canvasConfig.padding + 240,
        canvasConfig.padding - 20,
        function2.color,
        14
      );
    }

    // Draw blend effect (during 60-100% of animation)
    const blendProgress = Math.max(0, (progress - 0.6) / 0.4);
    if (blendProgress > 0 && points1.length > 0 && points2.length > 0) {
      drawBlendEffect(ctx, points1, points2, blendProgress);
    }

    // Draw progress indicator
    drawProgressBar(ctx, progress);
  };

  // Draw blend effect between two functions
  const drawBlendEffect = (
    ctx: CanvasRenderingContext2D,
    points1: any[],
    points2: any[],
    progress: number
  ) => {
    const color1 = ColorBlender.hexToRgb(function1.color);
    const color2 = ColorBlender.hexToRgb(function2.color);

    // Calculate difference curve
    const diffPoints = MathEvaluator.calculateDifference(
      function1.expression,
      function2.expression,
      config.xMin,
      config.xMax,
      500
    );

    // Draw blend visualization
    const numSamples = 100;
    const step = (config.xMax - config.xMin) / numSamples;

    for (let i = 0; i < numSamples; i++) {
      const x = config.xMin + i * step;
      const y1 = MathEvaluator.evaluateAt(function1.expression, x);
      const y2 = MathEvaluator.evaluateAt(function2.expression, x);

      if (!isFinite(y1) || !isFinite(y2)) continue;

      // Calculate blend color based on difference
      const diff = Math.abs(y1 - y2);
      const maxDiff = Math.max(...diffPoints.map(p => p.y), 1);
      const intensity = Math.min(diff / maxDiff, 1);

      const blendedColor = ColorBlender.blend(
        color1,
        color2,
        config.blendMode,
        progress * intensity
      );

      // Draw vertical line representing the blend
      const p1 = CanvasUtils.mathToCanvas(
        { x, y: y1 },
        canvasConfig,
        config.xMin,
        config.xMax,
        config.yMin,
        config.yMax
      );

      const p2 = CanvasUtils.mathToCanvas(
        { x, y: y2 },
        canvasConfig,
        config.xMin,
        config.xMax,
        config.yMin,
        config.yMax
      );

      ctx.strokeStyle = ColorBlender.rgbToHex(blendedColor);
      ctx.lineWidth = 4;
      ctx.globalAlpha = progress * 0.8;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Draw difference curve
    if (progress > 0.5) {
      const diffAlpha = (progress - 0.5) * 2;
      ctx.globalAlpha = diffAlpha;
      CanvasUtils.drawCurve(
        ctx,
        diffPoints,
        canvasConfig,
        config.xMin,
        config.xMax,
        config.yMin,
        config.yMax,
        '#ff6b6b',
        2
      );

      // Draw difference label
      CanvasUtils.drawLabel(
        ctx,
        'Difference',
        width - canvasConfig.padding - 60,
        canvasConfig.padding - 20,
        '#ff6b6b',
        14
      );

      ctx.globalAlpha = 1;
    }
  };

  // Draw progress bar
  const drawProgressBar = (ctx: CanvasRenderingContext2D, progress: number) => {
    const barWidth = width - 2 * canvasConfig.padding;
    const barHeight = 6;
    const barX = canvasConfig.padding;
    const barY = height - canvasConfig.padding / 2;

    // Background
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Border
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  };

  // Control functions
  const restart = () => {
    startTimeRef.current = undefined;
    setAnimationProgress(0);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (animationProgress >= 1) {
      restart();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fff'
        }}
      />
      <div
        style={{
          marginTop: '10px',
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <button
          onClick={togglePlay}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {isPlaying ? 'Pause' : animationProgress >= 1 ? 'Restart' : 'Play'}
        </button>
        <button
          onClick={restart}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Restart
        </button>
        <span style={{ fontSize: '14px', color: '#666' }}>
          {Math.round(animationProgress * 100)}%
        </span>
      </div>
    </div>
  );
};
