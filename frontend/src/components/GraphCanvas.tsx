/**
 * Canvas 기반 그래프 시각화 컴포넌트
 * 점근선 애니메이션 포함
 */

import React, { useRef, useEffect, useState } from 'react';
import { ProblemData } from '../types/problem';
import { CanvasRenderer, RenderOptions } from '../utils/canvas-renderer';
import { useAsymptoteAnimation } from '../hooks/useAsymptoteAnimation';

interface GraphCanvasProps {
  problemData: ProblemData;
  width?: number;
  height?: number;
  showAsymptotes?: boolean;
  animateAsymptotes?: boolean;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  problemData,
  width = 600,
  height = 600,
  showAsymptotes = true,
  animateAsymptotes = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [animationState, startAnimation, resetAnimation] = useAsymptoteAnimation(
    problemData.animation_duration,
    false
  );

  /**
   * 초기 렌더러 설정
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    const options: RenderOptions = {
      width,
      height,
      domain: problemData.domain,
      range: problemData.range,
      gridColor: '#e0e0e0',
      axisColor: '#333333',
      functionColor: '#2196F3',
      asymptoteColor: '#FF5722'
    };

    rendererRef.current = new CanvasRenderer(canvasRef.current, options);

    // 점근선 애니메이션 시작 (1초 후)
    if (animateAsymptotes) {
      setTimeout(() => {
        startAnimation();
      }, 1000);
    }
  }, [problemData, width, height]);

  /**
   * 그래프 그리기 (애니메이션 프레임마다)
   */
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    // 캔버스 지우기
    renderer.clear();

    // 격자 그리기
    renderer.drawGrid();

    // 좌표축 그리기
    renderer.drawAxes();

    // 함수 그리기
    renderer.drawFunction(problemData.function);

    // 점근선 그리기
    if (showAsymptotes) {
      const progress = animateAsymptotes ? animationState.progress : 1;

      // 수직 점근선
      problemData.asymptotes.vertical.forEach((x) => {
        if (animateAsymptotes) {
          renderer.drawAsymptoteAnimated('vertical', x, progress);
        } else {
          renderer.drawAsymptote('vertical', x);
        }
      });

      // 수평 점근선
      problemData.asymptotes.horizontal.forEach((y) => {
        if (animateAsymptotes) {
          renderer.drawAsymptoteAnimated('horizontal', y, progress);
        } else {
          renderer.drawAsymptote('horizontal', y);
        }
      });
    }
  }, [problemData, showAsymptotes, animateAsymptotes, animationState.progress]);

  return (
    <div className="graph-canvas-container">
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      />
      <div className="graph-info">
        <p className="function-label">
          <strong>f(x) = {problemData.function}</strong>
        </p>
        {showAsymptotes && (
          <div className="asymptote-info">
            {problemData.asymptotes.vertical.length > 0 && (
              <p>수직 점근선: x = {problemData.asymptotes.vertical.join(', ')}</p>
            )}
            {problemData.asymptotes.horizontal.length > 0 && (
              <p>수평 점근선: y = {problemData.asymptotes.horizontal.join(', ')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphCanvas;
