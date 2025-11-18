import React, { useState } from 'react';
import '../styles/SmartphoneScreen.css';

const SmartphoneScreen = ({ size, isActive, question, onAnswerSubmit, progress }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer.trim()) {
      onAnswerSubmit(answer);
      setAnswer('');
    }
  };

  const expansionPercentage = ((size - 180) / (400 - 180)) * 100;

  return (
    <div
      className={`smartphone-screen ${isActive ? 'active' : ''}`}
      style={{
        width: `${size}px`,
        height: `${size * 1.8}px`, // Maintain smartphone aspect ratio
        transform: `scale(${1 + expansionPercentage * 0.001})` // Subtle zoom effect
      }}
    >
      {/* Phone Frame */}
      <div className="phone-frame">
        {/* Status Bar */}
        <div className="phone-status-bar">
          <span className="time">{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="phone-icons">
            <span>📶</span>
            <span>📱</span>
            <span>🔋</span>
          </div>
        </div>

        {/* Screen Content */}
        <div className="phone-content">
          {!isActive ? (
            <div className="welcome-screen">
              <h2>🎓 ALT42</h2>
              <p>학습 모드</p>
              <div className="sun-icon">☀️</div>
              <p className="hint">시작 버튼을 눌러<br />Expansion Mode를 활성화하세요</p>
            </div>
          ) : question ? (
            <div className="question-screen">
              <div className="question-header">
                <h3>문제 {question.id}</h3>
                <span className="difficulty">{question.difficulty}</span>
              </div>

              <div className="question-body">
                <p className="question-title">{question.name}</p>
                <div className="question-text">{question.questiontext}</div>

                <form onSubmit={handleSubmit} className="answer-form">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="답을 입력하세요..."
                    className="answer-input"
                    autoFocus
                  />
                  <button type="submit" className="submit-btn">
                    제출
                  </button>
                </form>
              </div>

              <div className="progress-indicator">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="progress-text">{Math.round(progress)}% 완료</p>
              </div>
            </div>
          ) : (
            <div className="loading-screen">
              <div className="spinner"></div>
              <p>문제를 불러오는 중...</p>
            </div>
          )}
        </div>

        {/* Home Button */}
        <div className="phone-home-button"></div>
      </div>

      {/* Expansion Glow Effect */}
      {isActive && (
        <div
          className="expansion-glow"
          style={{ opacity: expansionPercentage / 100 }}
        />
      )}

      {/* Sun Effect - grows as screen expands */}
      {isActive && (
        <div
          className="sun-effect"
          style={{
            width: `${50 + expansionPercentage * 2}px`,
            height: `${50 + expansionPercentage * 2}px`,
            opacity: 0.3 + (expansionPercentage / 100) * 0.7
          }}
        />
      )}
    </div>
  );
};

export default SmartphoneScreen;
