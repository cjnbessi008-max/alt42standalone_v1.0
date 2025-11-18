import { useState } from 'react';
import SmartphoneSimulator from './components/SmartphoneSimulator';
import BaseSwitchAnimation from './components/BaseSwitchAnimation';
import ProblemSelector from './components/ProblemSelector';
import type { ProblemData } from './types';
import './App.css';

function App() {
  const [selectedProblem, setSelectedProblem] = useState<ProblemData | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleProblemSelect = (problem: ProblemData) => {
    setSelectedProblem(problem);
    setShowAnimation(false);
  };

  const handleStartAnimation = () => {
    setShowAnimation(true);
  };

  const handleAnimationComplete = () => {
    console.log('Animation completed!');
  };

  return (
    <div className="app-container">
      {/* 좌측: 컨트롤 패널 */}
      <div className="control-panel">
        <div className="app-header">
          <h1>🔢 Base Switch</h1>
          <p className="app-subtitle">진법 변환 학습 시스템</p>
          <div className="system-info">
            <span className="info-badge">📚 Moodle 3.7</span>
            <span className="info-badge">🗄️ MySQL 5.7</span>
            <span className="info-badge">🐘 PHP 7.1.9</span>
          </div>
        </div>

        <div className="panel-section">
          <ProblemSelector onSelectProblem={handleProblemSelect} />
        </div>

        {selectedProblem && (
          <div className="panel-section">
            <div className="problem-details">
              <h3>선택된 문제</h3>
              <div className="detail-item">
                <span className="detail-label">문제:</span>
                <span className="detail-value">{selectedProblem.question}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">원본 값:</span>
                <span className="detail-value">{selectedProblem.sourceValue}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">변환:</span>
                <span className="detail-value">
                  {selectedProblem.sourceBase}진수 → {selectedProblem.targetBase}진수
                </span>
              </div>

              <button className="start-btn" onClick={handleStartAnimation}>
                {showAnimation ? '🔄 다시 시작' : '▶️ 애니메이션 시작'}
              </button>
            </div>
          </div>
        )}

        <div className="panel-section info-section">
          <h4>ℹ️ 정보</h4>
          <p className="info-text">
            우측 하단의 가상 스마트폰 화면에서 진법 변환 과정이 단계별로 표시됩니다.
          </p>
        </div>
      </div>

      {/* 우측 하단: 스마트폰 시뮬레이터 */}
      <SmartphoneSimulator position="bottom-right">
        {!selectedProblem ? (
          <div className="placeholder">
            <div className="placeholder-icon">📱</div>
            <h3>Base Switch</h3>
            <p>좌측 패널에서 문제를 선택해주세요</p>
          </div>
        ) : !showAnimation ? (
          <div className="placeholder">
            <div className="placeholder-icon">🎬</div>
            <h3>준비 완료</h3>
            <p>애니메이션 시작 버튼을 눌러주세요</p>
            <div className="ready-info">
              <p>
                <strong>변환:</strong> {selectedProblem.sourceBase}진수 →{' '}
                {selectedProblem.targetBase}진수
              </p>
              <p>
                <strong>값:</strong> {selectedProblem.sourceValue}
              </p>
            </div>
          </div>
        ) : (
          <BaseSwitchAnimation
            sourceValue={selectedProblem.sourceValue}
            sourceBase={selectedProblem.sourceBase}
            targetBase={selectedProblem.targetBase}
            autoPlay={true}
            speed={2000}
            onComplete={handleAnimationComplete}
          />
        )}
      </SmartphoneSimulator>
    </div>
  );
}

export default App;
