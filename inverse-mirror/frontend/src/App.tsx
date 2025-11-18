import React, { useState, useEffect } from 'react';
import GraphVisualization from './components/GraphVisualization';
import MobileSimulator from './components/MobileSimulator';
import ControlPanel from './components/ControlPanel';
import { api } from './services/api';
import './styles/App.css';

const App: React.FC = () => {
  // State
  const [functionExpression, setFunctionExpression] = useState('x^2');
  const [selectedPoint, setSelectedPoint] = useState(1);
  const [domainMin, setDomainMin] = useState(-3);
  const [domainMax, setDomainMax] = useState(3);
  const [showInverse, setShowInverse] = useState(true);
  const [showDerivative, setShowDerivative] = useState(true);
  const [showMirrorLine, setShowMirrorLine] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load problem from Moodle
  const handleLoadProblem = async () => {
    setLoading(true);
    setError(null);

    try {
      const problem = await api.getProblem();

      setFunctionExpression(problem.functionExpression);
      setDomainMin(problem.domain[0]);
      setDomainMax(problem.domain[1]);
      setSelectedPoint(problem.point);

      // Set display options based on question type
      setShowInverse(problem.questionType === 'both' || problem.questionType === 'inverse_derivative');
      setShowDerivative(true);
      setShowMirrorLine(true);
    } catch (err) {
      console.error('Failed to load problem:', err);
      setError('Moodle에서 문제를 가져올 수 없습니다. 백엔드 서버를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Health check on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.healthCheck();
        console.log('API connection successful');
      } catch (err) {
        console.warn('API connection failed - using demo mode');
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="header">
          <h1>🪞 Inverse Mirror</h1>
          <p>역함수 미분의 관계를 거울 효과로 학습하기</p>
        </div>

        {error && (
          <div className="error">
            <strong>오류:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="loading">
            문제를 불러오는 중...
          </div>
        )}

        <ControlPanel
          functionExpression={functionExpression}
          setFunctionExpression={setFunctionExpression}
          selectedPoint={selectedPoint}
          setSelectedPoint={setSelectedPoint}
          domainMin={domainMin}
          setDomainMin={setDomainMin}
          domainMax={domainMax}
          setDomainMax={setDomainMax}
          showInverse={showInverse}
          setShowInverse={setShowInverse}
          showDerivative={showDerivative}
          setShowDerivative={setShowDerivative}
          showMirrorLine={showMirrorLine}
          setShowMirrorLine={setShowMirrorLine}
          onLoadProblem={handleLoadProblem}
        />

        <GraphVisualization
          functionExpression={functionExpression}
          domain={[domainMin, domainMax]}
          selectedPoint={selectedPoint}
          showInverse={showInverse}
          showDerivative={showDerivative}
          showMirrorLine={showMirrorLine}
        />

        <div className="info-panel">
          <h3>📖 수학 개념</h3>
          <p>
            <strong>역함수 미분법:</strong> 함수 f(x)와 그 역함수 f⁻¹(x)에서,
            점 (a, b)에서 f'(a) ≠ 0이면:
          </p>
          <p className="math-formula">
            (f⁻¹)'(b) = 1 / f'(a)
          </p>
          <p>
            이는 함수와 역함수가 y = x에 대해 대칭이며,
            접선의 기울기는 역수 관계에 있음을 의미합니다.
          </p>
        </div>
      </div>

      <MobileSimulator
        functionExpression={functionExpression}
        selectedPoint={selectedPoint}
        showDerivative={showDerivative}
        showInverse={showInverse}
      />
    </div>
  );
};

export default App;
