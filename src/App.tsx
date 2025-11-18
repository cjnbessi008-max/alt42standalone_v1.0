import { useState, useEffect } from 'react';
import { MobileSimulator } from './components/MobileSimulator';
import { SetDance } from './components/SetDance';
import { ProblemSelector } from './components/ProblemSelector';
import { Problem } from './types';
import { getDemoProblems } from './services/moodleApi';
import './App.css';

function App() {
  const [problems] = useState<Problem[]>(getDemoProblems());
  const [currentProblem, setCurrentProblem] = useState<Problem>(problems[0]);
  const [currentConditionIndex, setCurrentConditionIndex] = useState(0);

  const handleSelectProblem = (problem: Problem) => {
    setCurrentProblem(problem);
    setCurrentConditionIndex(0);
  };

  const handleNextCondition = () => {
    if (currentConditionIndex < currentProblem.conditions.length - 1) {
      setCurrentConditionIndex(currentConditionIndex + 1);
    }
  };

  const handlePrevCondition = () => {
    if (currentConditionIndex > 0) {
      setCurrentConditionIndex(currentConditionIndex - 1);
    }
  };

  useEffect(() => {
    setCurrentConditionIndex(0);
  }, [currentProblem]);

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="app-header">
          <h1 className="app-title">
            <span className="title-icon">🎭</span>
            Set Dance
          </h1>
          <p className="app-subtitle">조건에 따라 춤추는 수학 집합</p>
        </header>

        <div className="content-wrapper">
          <ProblemSelector
            problems={problems}
            currentProblemId={currentProblem.id}
            onSelectProblem={handleSelectProblem}
          />

          <div className="info-panel">
            <div className="problem-header">
              <h2 className="current-problem-title">{currentProblem.title}</h2>
              <p className="current-problem-desc">{currentProblem.description}</p>
            </div>

            {currentProblem.conditions.length > 1 && (
              <div className="condition-controls">
                <button
                  onClick={handlePrevCondition}
                  disabled={currentConditionIndex === 0}
                  className="control-button"
                >
                  ← 이전 조건
                </button>
                <span className="condition-counter">
                  조건 {currentConditionIndex + 1} / {currentProblem.conditions.length}
                </span>
                <button
                  onClick={handleNextCondition}
                  disabled={currentConditionIndex === currentProblem.conditions.length - 1}
                  className="control-button"
                >
                  다음 조건 →
                </button>
              </div>
            )}

            <div className="stats-panel">
              <div className="stat-item">
                <div className="stat-label">전체 원소</div>
                <div className="stat-value">{currentProblem.elements.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">조건 개수</div>
                <div className="stat-value">{currentProblem.conditions.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileSimulator>
        <SetDance
          elements={currentProblem.elements}
          condition={currentProblem.conditions[currentConditionIndex]}
        />
      </MobileSimulator>
    </div>
  );
}

export default App;
