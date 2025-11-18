import React, { useEffect, useRef, useState } from 'react';
import type { HistogramData, HistogramConfig, AnimationState } from '../types/histogram.types';

interface HistogramBeatProps {
  data: HistogramData[];
  config?: Partial<HistogramConfig>;
  onBarClick?: (index: number, data: HistogramData) => void;
}

const defaultConfig: HistogramConfig = {
  width: 600,
  height: 400,
  barSpacing: 20,
  animationDuration: 1000,
  beatIntensity: 0.3,
  beatFrequency: 1.5, // 1.5 Hz (90 BPM)
};

/**
 * 음악 리듬처럼 반응하는 히스토그램 컴포넌트
 */
export const HistogramBeat: React.FC<HistogramBeatProps> = ({
  data,
  config: userConfig,
  onBarClick,
}) => {
  const config = { ...defaultConfig, ...userConfig };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: true,
    currentBeat: 0,
    phase: 0,
  });

  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // 최대값 계산
  const maxValue = Math.max(...data.map((d) => d.value));

  /**
   * 비트 사이클 계산 (0-1 사이의 값)
   * 사인파 기반으로 부드러운 펄스 효과
   */
  const calculateBeatPhase = (timestamp: number): number => {
    const elapsed = (timestamp - startTimeRef.current) / 1000; // seconds
    const phase = (elapsed * config.beatFrequency) % 1;
    return phase;
  };

  /**
   * 비트에 따른 스케일 계산
   * 사인파를 사용하여 자연스러운 펄스 효과
   */
  const calculateBeatScale = (phase: number, baseScale: number = 1): number => {
    // 사인파: 0 -> 1 -> 0 (한 주기)
    const sineWave = Math.sin(phase * Math.PI * 2);
    // 0-1 범위로 정규화하고 intensity 적용
    const normalizedWave = (sineWave + 1) / 2;
    return baseScale + normalizedWave * config.beatIntensity;
  };

  /**
   * 히스토그램 그리기
   */
  const drawHistogram = (ctx: CanvasRenderingContext2D, phase: number) => {
    const { width, height, barSpacing } = config;

    // 캔버스 초기화
    ctx.clearRect(0, 0, width, height);

    // 배경 그라데이션
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#f8f9fa');
    bgGradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 그리드 라인
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = (height * i) / 5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 막대 그래프 그리기
    const barWidth = (width - barSpacing * (data.length + 1)) / data.length;
    const padding = 50; // 하단 여백

    data.forEach((item, index) => {
      const x = barSpacing + index * (barWidth + barSpacing);
      const normalizedHeight = (item.value / maxValue) * (height - padding);

      // 비트에 따른 스케일 적용
      // 각 막대에 약간의 위상차를 주어 물결 효과
      const phaseOffset = index * 0.1;
      const barPhase = (phase + phaseOffset) % 1;
      const beatScale = calculateBeatScale(barPhase);
      const animatedHeight = normalizedHeight * beatScale;

      // 막대 색상
      const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`;

      // 호버 효과
      const isHovered = hoveredBar === index;
      const hoverScale = isHovered ? 1.1 : 1;

      // 그라데이션 효과
      const gradient = ctx.createLinearGradient(x, height - animatedHeight, x, height);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, adjustColorBrightness(color, -20));

      // 막대 그리기
      ctx.fillStyle = gradient;
      const finalHeight = animatedHeight * hoverScale;
      const finalWidth = barWidth * hoverScale;
      const centerOffset = isHovered ? (barWidth * (hoverScale - 1)) / 2 : 0;

      ctx.beginPath();
      ctx.roundRect(
        x - centerOffset,
        height - finalHeight,
        finalWidth,
        finalHeight,
        [8, 8, 0, 0]
      );
      ctx.fill();

      // 그림자 효과
      if (isHovered) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
      } else {
        ctx.shadowColor = 'transparent';
      }

      // 값 표시
      ctx.fillStyle = '#212529';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        item.value.toString(),
        x + barWidth / 2,
        height - finalHeight - 10
      );

      // 라벨 표시
      ctx.fillStyle = '#495057';
      ctx.font = '12px sans-serif';
      ctx.fillText(item.label, x + barWidth / 2, height - 10);
    });
  };

  /**
   * 색상 밝기 조정
   */
  const adjustColorBrightness = (color: string, percent: number): string => {
    // 간단한 구현: HSL 색상의 경우
    if (color.startsWith('hsl')) {
      return color.replace(/(\d+)%\)/, (_, p1) => {
        const newBrightness = Math.max(0, Math.min(100, parseInt(p1) + percent));
        return `${newBrightness}%)`;
      });
    }
    return color;
  };

  /**
   * 애니메이션 루프
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // CanvasRenderingContext2D에 roundRect 메서드가 없을 경우 polyfill
    if (!ctx.roundRect) {
      ctx.roundRect = function (
        x: number,
        y: number,
        width: number,
        height: number,
        radii: number | number[]
      ) {
        const radius = Array.isArray(radii) ? radii[0] : radii;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
        return this;
      };
    }

    const animate = () => {
      if (!animationState.isPlaying) return;

      const now = Date.now();
      const phase = calculateBeatPhase(now);

      setAnimationState((prev) => ({
        ...prev,
        phase,
        currentBeat: Math.floor((now - startTimeRef.current) / 1000 * config.beatFrequency),
      }));

      drawHistogram(ctx, phase);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [data, config, animationState.isPlaying, hoveredBar]);

  /**
   * 마우스 이벤트 처리
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const barWidth = (config.width - config.barSpacing * (data.length + 1)) / data.length;
    const barIndex = Math.floor((x - config.barSpacing) / (barWidth + config.barSpacing));

    if (barIndex >= 0 && barIndex < data.length) {
      setHoveredBar(barIndex);
    } else {
      setHoveredBar(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  const handleClick = () => {
    if (hoveredBar !== null && onBarClick) {
      onBarClick(hoveredBar, data[hoveredBar]);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={config.width}
        height={config.height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          cursor: hoveredBar !== null ? 'pointer' : 'default',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          fontSize: '12px',
          color: '#6c757d',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '4px 8px',
          borderRadius: '4px',
        }}
      >
        Beat: {animationState.currentBeat} | Phase: {animationState.phase.toFixed(2)}
      </div>
    </div>
  );
};
