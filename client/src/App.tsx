import React, { useState } from 'react';
import VoicePraisePlayer from './components/VoicePraisePlayer';
import { useVoicePraise } from './hooks/useVoicePraise';
import './App.css';

/**
 * Example LMS App with Voice Praise Integration
 */
function App() {
  const studentId = 'student-001'; // In real app, get from auth
  const moduleId = 'fraction-basics'; // Current module

  const {
    currentPraise,
    isConnected,
    submitProgress,
    clearPraise
  } = useVoicePraise({
    studentId,
    moduleId,
    serverUrl: process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'
  });

  // Example problem state
  const [problemNumber, setProblemNumber] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [stats, setStats] = useState({
    totalAttempts: 0,
    correctAnswers: 0,
    accuracy: 0
  });

  // Example problems
  const problems = [
    { question: '1/2 + 1/4 = ?', answer: '3/4', difficulty: 2 },
    { question: '2/3 + 1/6 = ?', answer: '5/6', difficulty: 3 },
    { question: '3/4 - 1/2 = ?', answer: '1/4', difficulty: 2 },
    { question: '1/3 + 1/3 = ?', answer: '2/3', difficulty: 1 },
    { question: '5/6 - 1/3 = ?', answer: '1/2', difficulty: 3 }
  ];

  const currentProblem = problems[(problemNumber - 1) % problems.length];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isCorrect = userAnswer.trim() === currentProblem.answer;

    // Submit progress to server (triggers praise evaluation)
    await submitProgress({
      isCorrect,
      difficulty: currentProblem.difficulty,
      problemId: `problem-${problemNumber}`,
      answer: userAnswer,
      timestamp: new Date().toISOString()
    });

    // Update UI
    setFeedback(isCorrect ? '정답입니다! 🎉' : '다시 시도해보세요 😊');
    setStats(prev => ({
      totalAttempts: prev.totalAttempts + 1,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      accuracy: ((isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers) / (prev.totalAttempts + 1) * 100)
    }));

    if (isCorrect) {
      setTimeout(() => {
        setProblemNumber(prev => prev + 1);
        setUserAnswer('');
        setFeedback('');
      }, 2000);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎓 분수 학습 LMS</h1>
        <div className="connection-status">
          {isConnected ? (
            <span className="connected">✅ 연결됨</span>
          ) : (
            <span className="disconnected">❌ 연결 끊김</span>
          )}
        </div>
      </header>

      <main className="App-main">
        <div className="stats-panel">
          <div className="stat">
            <span className="stat-label">문제 풀이:</span>
            <span className="stat-value">{stats.totalAttempts}회</span>
          </div>
          <div className="stat">
            <span className="stat-label">정답:</span>
            <span className="stat-value">{stats.correctAnswers}개</span>
          </div>
          <div className="stat">
            <span className="stat-label">정확도:</span>
            <span className="stat-value">{stats.accuracy.toFixed(1)}%</span>
          </div>
        </div>

        <div className="problem-container">
          <div className="problem-header">
            <h2>문제 #{problemNumber}</h2>
            <span className="difficulty">난이도: {'⭐'.repeat(currentProblem.difficulty)}</span>
          </div>

          <div className="problem-question">
            <p>{currentProblem.question}</p>
          </div>

          <form onSubmit={handleSubmit} className="answer-form">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="답을 입력하세요 (예: 3/4)"
              className="answer-input"
              autoFocus
            />
            <button type="submit" className="submit-button">
              제출
            </button>
          </form>

          {feedback && (
            <div className={`feedback ${feedback.includes('정답') ? 'correct' : 'incorrect'}`}>
              {feedback}
            </div>
          )}
        </div>

        <div className="info-box">
          <h3>💡 음성 칭찬 시스템</h3>
          <p>
            문제를 풀 때마다 시스템이 자동으로 여러분의 노력을 인식하고,
            적절한 순간에 따뜻한 칭찬을 음성으로 들려줍니다!
          </p>
          <ul>
            <li>연속 정답 달성</li>
            <li>어려운 문제 해결</li>
            <li>꾸준한 노력</li>
            <li>실력 향상</li>
          </ul>
        </div>
      </main>

      {/* Voice Praise Player - appears when praise is triggered */}
      <VoicePraisePlayer
        praiseEvent={currentPraise}
        onComplete={clearPraise}
      />
    </div>
  );
}

export default App;
