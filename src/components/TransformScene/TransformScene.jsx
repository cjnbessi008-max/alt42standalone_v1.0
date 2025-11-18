import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { evaluate } from 'mathjs';
import './TransformScene.css';

/**
 * TransformScene Component
 * 수학 함수의 변환(이동, 대칭, 확대/축소)을 시각적으로 보여주는 컴포넌트
 * Moodle LMS와 연동하여 문제 데이터를 받아 처리합니다.
 */
const TransformScene = ({ problemId, moodleApiUrl }) => {
  const svgRef = useRef(null);
  const [currentFunction, setCurrentFunction] = useState('x^2');
  const [transformedFunction, setTransformedFunction] = useState('x^2');
  const [transformType, setTransformType] = useState('translation');
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [problemData, setProblemData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Moodle에서 문제 데이터 가져오기
  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${moodleApiUrl}/get_problem.php?id=${problemId}`);
        const data = await response.json();
        setProblemData(data);

        if (data.originalFunction) {
          setCurrentFunction(data.originalFunction);
        }
        if (data.targetFunction) {
          setTransformedFunction(data.targetFunction);
        }
        if (data.transformType) {
          setTransformType(data.transformType);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching problem data:', error);
        setLoading(false);
      }
    };

    if (problemId && moodleApiUrl) {
      fetchProblemData();
    } else {
      setLoading(false);
    }
  }, [problemId, moodleApiUrl]);

  // 그래프 그리기
  useEffect(() => {
    if (!svgRef.current || loading) return;

    const svg = d3.select(svgRef.current);
    const width = 400;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    // 기존 내용 제거
    svg.selectAll('*').remove();

    // SVG 설정
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // 스케일 설정
    const xScale = d3.scaleLinear()
      .domain([-10, 10])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([-10, 10])
      .range([chartHeight, 0]);

    // 축 그리기
    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).ticks(10);

    // X축
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${yScale(0)})`)
      .call(xAxis)
      .append('text')
      .attr('x', chartWidth)
      .attr('y', -6)
      .attr('fill', '#000')
      .attr('text-anchor', 'end')
      .text('x');

    // Y축
    g.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${xScale(0)},0)`)
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('fill', '#000')
      .attr('text-anchor', 'end')
      .text('y');

    // 그리드 그리기
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale)
        .ticks(10)
        .tickSize(-chartWidth)
        .tickFormat(''));

    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .ticks(10)
        .tickSize(-chartHeight)
        .tickFormat(''));

    // 함수 데이터 생성
    const generateFunctionData = (funcStr) => {
      const points = [];
      const step = 0.1;

      for (let x = -10; x <= 10; x += step) {
        try {
          const y = evaluate(funcStr.replace(/\^/g, '^'), { x });
          if (!isNaN(y) && isFinite(y) && y >= -10 && y <= 10) {
            points.push({ x, y });
          }
        } catch (e) {
          // 계산 오류 무시
        }
      }
      return points;
    };

    // 라인 생성기
    const line = d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // 원본 함수 그리기
    const originalData = generateFunctionData(currentFunction);
    g.append('path')
      .datum(originalData)
      .attr('class', 'function-line original')
      .attr('fill', 'none')
      .attr('stroke', '#2196F3')
      .attr('stroke-width', 2)
      .attr('d', line);

    // 변환된 함수 그리기 (애니메이션 진행률에 따라)
    if (animationProgress > 0) {
      const transformedData = generateFunctionData(transformedFunction);

      // 보간된 데이터 생성
      const interpolatedData = originalData.map((d, i) => {
        const target = transformedData[i] || d;
        return {
          x: d.x + (target.x - d.x) * animationProgress,
          y: d.y + (target.y - d.y) * animationProgress
        };
      });

      g.append('path')
        .datum(interpolatedData)
        .attr('class', 'function-line transformed')
        .attr('fill', 'none')
        .attr('stroke', '#FF5722')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', line);
    }

  }, [currentFunction, transformedFunction, animationProgress, loading]);

  // 애니메이션 실행
  const startAnimation = () => {
    setIsAnimating(true);
    setAnimationProgress(0);

    const duration = 2000; // 2초
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setAnimationProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  };

  // 애니메이션 리셋
  const resetAnimation = () => {
    setAnimationProgress(0);
    setIsAnimating(false);
  };

  // 변환 타입 정보
  const getTransformInfo = () => {
    switch (transformType) {
      case 'translation':
        return {
          title: '평행이동 (Translation)',
          description: 'f(x) → f(x - h) + k',
          details: '함수 그래프를 좌우(h) 또는 상하(k)로 이동합니다.'
        };
      case 'reflection':
        return {
          title: '대칭이동 (Reflection)',
          description: 'f(x) → -f(x) 또는 f(-x)',
          details: 'x축 또는 y축에 대해 대칭이동합니다.'
        };
      case 'scaling':
        return {
          title: '확대/축소 (Scaling)',
          description: 'f(x) → af(x) 또는 f(bx)',
          details: '함수 그래프를 수직 또는 수평 방향으로 확대/축소합니다.'
        };
      default:
        return {
          title: '함수 변환',
          description: 'f(x) → g(x)',
          details: '함수를 변환합니다.'
        };
    }
  };

  const transformInfo = getTransformInfo();

  if (loading) {
    return (
      <div className="transform-scene loading">
        <div className="spinner"></div>
        <p>문제를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="transform-scene"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 헤더 */}
      <div className="scene-header">
        <h2>{transformInfo.title}</h2>
        <p className="formula">{transformInfo.description}</p>
      </div>

      {/* 그래프 영역 */}
      <div className="graph-container">
        <svg ref={svgRef}></svg>
      </div>

      {/* 함수 정보 */}
      <div className="function-info">
        <div className="function-item original">
          <span className="label">원본 함수:</span>
          <span className="value">f(x) = {currentFunction}</span>
        </div>
        <AnimatePresence>
          {animationProgress > 0 && (
            <motion.div
              className="function-item transformed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <span className="label">변환된 함수:</span>
              <span className="value">g(x) = {transformedFunction}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 설명 */}
      <div className="transform-description">
        <p>{transformInfo.details}</p>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="controls">
        <motion.button
          className="btn-primary"
          onClick={startAnimation}
          disabled={isAnimating}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isAnimating ? '애니메이션 진행 중...' : '변환 시작'}
        </motion.button>
        <motion.button
          className="btn-secondary"
          onClick={resetAnimation}
          disabled={isAnimating || animationProgress === 0}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          다시 보기
        </motion.button>
      </div>

      {/* 진행률 표시 */}
      {isAnimating && (
        <motion.div
          className="progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${animationProgress * 100}%` }}
        >
          <div className="progress-fill"></div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TransformScene;
