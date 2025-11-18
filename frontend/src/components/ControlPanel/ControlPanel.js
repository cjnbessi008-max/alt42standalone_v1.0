import React from 'react';
import './ControlPanel.css';

function ControlPanel({ problems, currentProblem, onProblemChange }) {
  return (
    <div className="control-panel">
      <h2>문제 선택</h2>

      <div className="problem-list">
        {problems.map(problem => (
          <div
            key={problem.id}
            className={`problem-item ${currentProblem?.id === problem.id ? 'active' : ''}`}
            onClick={() => onProblemChange(problem.id)}
          >
            <h3>{problem.title}</h3>
            <p className="equation">f(x) = {problem.equation}</p>
            <p className="description">{problem.description}</p>
          </div>
        ))}
      </div>

      <div className="info-section">
        <h3>사용 방법</h3>
        <ul>
          <li>문제를 선택하면 우측 화면에 그래프가 표시됩니다</li>
          <li>그래프를 터치하여 x값을 이동시키세요</li>
          <li>그래프의 성질이 바뀌면 진동으로 알려줍니다</li>
          <li>증가→감소, 극값, 변곡점 등을 감지합니다</li>
        </ul>
      </div>

      <div className="property-legend">
        <h3>감지되는 성질</h3>
        <div className="legend-item">
          <span className="legend-color increasing"></span>
          <span>증가 구간</span>
        </div>
        <div className="legend-item">
          <span className="legend-color decreasing"></span>
          <span>감소 구간</span>
        </div>
        <div className="legend-item">
          <span className="legend-color extremum"></span>
          <span>극값 (극대/극소)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color inflection"></span>
          <span>변곡점</span>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;
