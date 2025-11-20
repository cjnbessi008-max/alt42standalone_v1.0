import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Scene } from '../../types';
import './Scene2UnitFractions.css';

interface Props {
  scene: Scene;
  onComplete: () => void;
}

interface Fraction {
  numerator: number;
  denominator: number;
}

const problems: Fraction[] = [
  { numerator: 2, denominator: 3 },
  { numerator: 3, denominator: 4 },
  { numerator: 5, denominator: 6 },
];

const solutions: Record<string, number[]> = {
  '2/3': [2, 6], // 1/2 + 1/6
  '3/4': [2, 4], // 1/2 + 1/4
  '5/6': [2, 3], // 1/2 + 1/3
};

export default function Scene2UnitFractions({ scene, onComplete }: Props) {
  const [showNarrative, setShowNarrative] = useState(true);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [selectedFractions, setSelectedFractions] = useState<number[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [usedMinimalPieces, setUsedMinimalPieces] = useState(true);

  const problem = problems[currentProblem];

  const unitFractionOptions = [2, 3, 4, 5, 6, 8, 10, 12];

  const calculateSum = () => {
    return selectedFractions.reduce((sum, denom) => sum + 1 / denom, 0);
  };

  const targetValue = problem.numerator / problem.denominator;

  const handleSelectFraction = (denominator: number) => {
    if (selectedFractions.includes(denominator)) {
      setSelectedFractions(selectedFractions.filter((d) => d !== denominator));
    } else {
      setSelectedFractions([...selectedFractions, denominator]);
    }
  };

  const handleCheck = () => {
    const sum = calculateSum();
    const isCorrect = Math.abs(sum - targetValue) < 0.001;

    if (isCorrect) {
      const key = `${problem.numerator}/${problem.denominator}`;
      const minimalSolution = solutions[key];
      const isMinimal = selectedFractions.length === minimalSolution.length;

      if (!isMinimal) {
        setUsedMinimalPieces(false);
      }

      if (currentProblem < problems.length - 1) {
        alert('정답입니다! 다음 문제로 넘어갑니다.');
        setCurrentProblem(currentProblem + 1);
        setSelectedFractions([]);
      } else {
        setShowSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 3000);
      }
    } else {
      alert(`현재 합: ${sum.toFixed(4)}\n목표: ${targetValue.toFixed(4)}`);
    }
  };

  if (showNarrative) {
    return (
      <motion.div
        className="narrative-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="narrative-container">
          <div className="era-badge">{scene.era}</div>
          <h2 className="scene-title">{scene.title}</h2>
          <div className="narrative-text">
            {scene.narrative.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <button
            className="continue-button"
            onClick={() => setShowNarrative(false)}
          >
            여정 시작하기
          </button>
        </div>
      </motion.div>
    );
  }

  if (showSuccess) {
    return (
      <motion.div
        className="success-screen"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <h1 className="success-title">성공!</h1>
        <p className="success-message">
          {usedMinimalPieces
            ? '최소 조각 수로 해결했습니다! 뛰어난 창의성입니다.'
            : '단위분수의 비밀을 익혔습니다.'}
        </p>
        <div className="glow success-number">완성</div>
      </motion.div>
    );
  }

  const currentSum = calculateSum();
  const fillPercentage = Math.min((currentSum / targetValue) * 100, 100);

  return (
    <div className="scene-container unit-fractions-scene">
      <div className="scene-header">
        <h2>{scene.title}</h2>
        <p className="objective">
          문제 {currentProblem + 1}/3: {problem.numerator}/{problem.denominator}를 단위분수의 합으로
          표현하기
        </p>
      </div>

      <div className="puzzle-area">
        <div className="pie-chart-container">
          <svg className="pie-chart" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="#d4a373" opacity="0.3" />
            {selectedFractions.map((denom, index) => {
              const previousSum = selectedFractions
                .slice(0, index)
                .reduce((sum, d) => sum + 1 / d, 0);
              const startAngle = previousSum * 360;
              const sliceAngle = (1 / denom) * 360;
              const endAngle = startAngle + sliceAngle;

              const startRad = (startAngle - 90) * (Math.PI / 180);
              const endRad = (endAngle - 90) * (Math.PI / 180);

              const x1 = 100 + 80 * Math.cos(startRad);
              const y1 = 100 + 80 * Math.sin(startRad);
              const x2 = 100 + 80 * Math.cos(endRad);
              const y2 = 100 + 80 * Math.sin(endRad);

              const largeArc = sliceAngle > 180 ? 1 : 0;

              return (
                <path
                  key={denom}
                  d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={`hsl(${index * 60}, 70%, 60%)`}
                  stroke="#fff"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          <div className="pie-info">
            <p>
              현재 합: {currentSum.toFixed(4)} ({fillPercentage.toFixed(1)}%)
            </p>
            <p>
              목표: {targetValue.toFixed(4)}
            </p>
            <p className="selected-fractions">
              {selectedFractions.length > 0
                ? selectedFractions.map((d) => `1/${d}`).join(' + ')
                : '단위분수를 선택하세요'}
            </p>
          </div>
        </div>

        <div className="fraction-selector">
          <h3>단위분수 선택</h3>
          <div className="fraction-grid">
            {unitFractionOptions.map((denom) => (
              <button
                key={denom}
                className={`fraction-button ${
                  selectedFractions.includes(denom) ? 'selected' : ''
                }`}
                onClick={() => handleSelectFraction(denom)}
              >
                1/{denom}
              </button>
            ))}
          </div>

          <div className="action-buttons">
            <button
              className="reset-button"
              onClick={() => setSelectedFractions([])}
            >
              초기화
            </button>
            <button className="check-button" onClick={handleCheck}>
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
