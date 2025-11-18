import React from 'react';
import './ProblemList.css';

const difficultyColors = {
  1: '#51cf66',
  2: '#4dabf7',
  3: '#ff6b6b'
};

const difficultyLabels = {
  1: '초급',
  2: '중급',
  3: '고급'
};

const ProblemList = ({ problems, onSelect }) => {
  return (
    <div className="problem-list">
      <div className="problem-list-header">
        <h2>📚 학습 주제</h2>
        <p>배우고 싶은 주제를 선택하세요</p>
      </div>

      <div className="problem-cards">
        {problems.map((problem) => (
          <div
            key={problem.id}
            className="problem-card"
            onClick={() => onSelect(problem)}
          >
            <div className="problem-card-header">
              <h3>{problem.title}</h3>
              <span
                className="difficulty-badge"
                style={{ backgroundColor: difficultyColors[problem.difficulty] }}
              >
                {difficultyLabels[problem.difficulty]}
              </span>
            </div>

            <p className="problem-description">{problem.description}</p>

            <div className="problem-card-footer">
              <span className="grade-level">🎓 {problem.gradeLevel}</span>
              <span className="scene-count">
                🎬 {problem.storyMode?.scenes?.length || 0}개 장면
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProblemList;
