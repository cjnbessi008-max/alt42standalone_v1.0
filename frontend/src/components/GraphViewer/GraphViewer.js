import React, { useRef, useEffect, useState } from 'react';
import './GraphViewer.css';
import PropertyShake from '../PropertyShake/PropertyShake';
import {
  evaluateFunction,
  getFunctionRange,
  detectPropertyChange,
  getIncreasingDecreasing
} from '../../utils/graphAnalyzer';

function GraphViewer({ problem }) {
  const canvasRef = useRef(null);
  const [currentX, setCurrentX] = useState(null);
  const [previousX, setPreviousX] = useState(null);
  const [propertyChange, setPropertyChange] = useState(null);
  const [currentProperty, setCurrentProperty] = useState(null);

  useEffect(() => {
    if (!problem) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 캔버스 크기 설정
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 그래프 그리기
    drawGraph(ctx, problem, currentX);
  }, [problem, currentX]);

  useEffect(() => {
    if (!problem || currentX === null) return;

    // 성질 변화 감지
    const change = detectPropertyChange(problem.equation, currentX, previousX);
    if (change.hasChange) {
      setPropertyChange(change);
    }

    // 현재 성질 업데이트
    const property = getIncreasingDecreasing(problem.equation, currentX);
    setCurrentProperty(property);
  }, [currentX, previousX, problem]);

  const drawGraph = (ctx, problem, highlightX = null) => {
    const { width, height } = ctx.canvas;
    const actualWidth = width / window.devicePixelRatio;
    const actualHeight = height / window.devicePixelRatio;

    // 배경
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, actualWidth, actualHeight);

    const { equation, domain } = problem;
    const xMin = domain.min;
    const xMax = domain.max;

    // y 범위 계산
    const yRange = getFunctionRange(equation, xMin, xMax);
    const yMin = yRange.min - (yRange.max - yRange.min) * 0.1;
    const yMax = yRange.max + (yRange.max - yRange.min) * 0.1;

    // 좌표 변환 함수
    const toCanvasX = (x) => {
      return ((x - xMin) / (xMax - xMin)) * actualWidth;
    };

    const toCanvasY = (y) => {
      return actualHeight - ((y - yMin) / (yMax - yMin)) * actualHeight;
    };

    const toMathX = (canvasX) => {
      return (canvasX / actualWidth) * (xMax - xMin) + xMin;
    };

    // 격자 그리기
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // 세로 격자
    for (let i = 0; i <= 10; i++) {
      const x = (actualWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, actualHeight);
      ctx.stroke();
    }

    // 가로 격자
    for (let i = 0; i <= 10; i++) {
      const y = (actualHeight / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(actualWidth, y);
      ctx.stroke();
    }

    // 축 그리기
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    // x축
    if (yMin <= 0 && yMax >= 0) {
      const y0 = toCanvasY(0);
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(actualWidth, y0);
      ctx.stroke();
    }

    // y축
    if (xMin <= 0 && xMax >= 0) {
      const x0 = toCanvasX(0);
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0, actualHeight);
      ctx.stroke();
    }

    // 함수 그래프 그리기
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const steps = 500;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (xMax - xMin) * (i / steps);
      const y = evaluateFunction(equation, x);

      if (isFinite(y)) {
        const canvasX = toCanvasX(x);
        const canvasY = toCanvasY(y);

        if (i === 0) {
          ctx.moveTo(canvasX, canvasY);
        } else {
          ctx.lineTo(canvasX, canvasY);
        }
      }
    }
    ctx.stroke();

    // 현재 위치 표시
    if (highlightX !== null) {
      const y = evaluateFunction(equation, highlightX);
      const canvasX = toCanvasX(highlightX);
      const canvasY = toCanvasY(y);

      // 현재 점 강조
      ctx.fillStyle = '#ff4081';
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
      ctx.fill();

      // 세로선
      ctx.strokeStyle = 'rgba(255, 64, 129, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(canvasX, 0);
      ctx.lineTo(canvasX, actualHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // 좌표 표시
      ctx.fillStyle = '#333';
      ctx.font = '14px Arial';
      ctx.fillText(`x = ${highlightX.toFixed(2)}`, canvasX + 10, 20);
      ctx.fillText(`y = ${y.toFixed(2)}`, canvasX + 10, 40);
    }
  };

  const handleCanvasInteraction = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;

    const { domain } = problem;
    const xMin = domain.min;
    const xMax = domain.max;

    const mathX = (canvasX / rect.width) * (xMax - xMin) + xMin;

    setPreviousX(currentX);
    setCurrentX(mathX);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasInteraction(touch);
  };

  return (
    <div className="graph-viewer">
      <div className="graph-header">
        <h2>{problem?.title}</h2>
        <p className="equation">f(x) = {problem?.equation}</p>
      </div>

      <canvas
        ref={canvasRef}
        className="graph-canvas"
        onMouseMove={handleCanvasInteraction}
        onTouchMove={handleTouchMove}
        onClick={handleCanvasInteraction}
      />

      <div className="graph-info">
        {currentX !== null && (
          <div className="current-info">
            <p>현재 위치: x = {currentX.toFixed(2)}</p>
            <p className={`property ${currentProperty}`}>
              {currentProperty === 'increasing' && '증가 중 ↗'}
              {currentProperty === 'decreasing' && '감소 중 ↘'}
              {currentProperty === 'stationary' && '정류점 ●'}
            </p>
          </div>
        )}
      </div>

      <PropertyShake propertyChange={propertyChange} />
    </div>
  );
}

export default GraphViewer;
