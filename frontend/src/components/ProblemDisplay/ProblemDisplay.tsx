/**
 * 문제 표시 컴포넌트
 * 닮음 문제와 도형을 시각적으로 표시
 */

import React, { useState } from 'react';
import { ProblemData, SimilarityCondition, Shape } from '@types/index';
import { checkSimilarity } from '@utils/similarityChecker';
import { SimilarityWarm } from '@components/SimilarityWarm';
import './ProblemDisplay.css';

interface ProblemDisplayProps {
  problem: ProblemData;
  onSubmit?: (condition: SimilarityCondition | null, ratio?: number) => void;
}

export const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  onSubmit,
}) => {
  const [selectedCondition, setSelectedCondition] = useState<SimilarityCondition | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCheck = () => {
    const similarityResult = checkSimilarity(problem.shape1, problem.shape2);
    setResult(similarityResult);
    setShowResult(true);

    if (onSubmit) {
      onSubmit(selectedCondition, similarityResult.ratio);
    }
  };

  const renderShape = (shape: Shape, label: string) => {
    const svgWidth = 280;
    const svgHeight = 200;

    // 좌표 정규화
    const allX = shape.vertices.map(v => v.x);
    const allY = shape.vertices.map(v => v.y);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const scaleX = (svgWidth - 40) / (maxX - minX);
    const scaleY = (svgHeight - 40) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    const normalizedVertices = shape.vertices.map(v => ({
      x: (v.x - minX) * scale + 20,
      y: (v.y - minY) * scale + 20,
    }));

    const pathData = normalizedVertices
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x} ${v.y}`)
      .join(' ') + ' Z';

    return (
      <div className="shape-container">
        <h3 className="shape-label">{label}</h3>
        <svg width={svgWidth} height={svgHeight} className="shape-svg">
          <path
            d={pathData}
            fill="rgba(100, 149, 237, 0.2)"
            stroke="#6495ED"
            strokeWidth="2"
          />
          {normalizedVertices.map((v, i) => (
            <circle
              key={i}
              cx={v.x}
              cy={v.y}
              r="4"
              fill="#6495ED"
            />
          ))}
          {normalizedVertices.map((v, i) => (
            <text
              key={`label-${i}`}
              x={v.x + 10}
              y={v.y - 10}
              fill="#fff"
              fontSize="14"
              fontWeight="bold"
            >
              {String.fromCharCode(65 + i)}
            </text>
          ))}
        </svg>
        <div className="shape-info">
          <div className="info-item">
            <span className="info-label">변:</span>
            <span className="info-value">
              {shape.sides.map(s => s.toFixed(1)).join(', ')}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">각:</span>
            <span className="info-value">
              {shape.angles.map(a => `${a.toFixed(1)}°`).join(', ')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="problem-display">
      <div className="problem-header">
        <h2 className="problem-title">{problem.title}</h2>
        <p className="problem-description">{problem.description}</p>
      </div>

      <div className="shapes-container">
        {renderShape(problem.shape1, '도형 1')}
        {renderShape(problem.shape2, '도형 2')}
      </div>

      <div className="answer-section">
        <h3 className="section-title">닮음 조건을 선택하세요</h3>
        <div className="condition-buttons">
          <button
            className={`condition-btn ${selectedCondition === SimilarityCondition.SSS ? 'active' : ''}`}
            onClick={() => setSelectedCondition(SimilarityCondition.SSS)}
          >
            SSS
            <span className="condition-desc">변-변-변</span>
          </button>
          <button
            className={`condition-btn ${selectedCondition === SimilarityCondition.SAS ? 'active' : ''}`}
            onClick={() => setSelectedCondition(SimilarityCondition.SAS)}
          >
            SAS
            <span className="condition-desc">변-각-변</span>
          </button>
          <button
            className={`condition-btn ${selectedCondition === SimilarityCondition.AA ? 'active' : ''}`}
            onClick={() => setSelectedCondition(SimilarityCondition.AA)}
          >
            AA
            <span className="condition-desc">각-각</span>
          </button>
          <button
            className={`condition-btn ${selectedCondition === null ? 'active' : ''}`}
            onClick={() => setSelectedCondition(null)}
          >
            닮음 아님
          </button>
        </div>

        <button
          className="check-btn"
          onClick={handleCheck}
          disabled={!selectedCondition && selectedCondition !== null}
        >
          확인하기
        </button>
      </div>

      {showResult && <SimilarityWarm result={result} />}
    </div>
  );
};
