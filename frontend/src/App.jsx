import React, { useState } from 'react';
import { ProblemTimeTracker } from './components/ProblemTimeTracker';
import { ProblemStatistics } from './components/ProblemStatistics';
import './App.css';

/**
 * Demo App for LMS Time Tracking
 * LMS 시간 추적 데모 앱
 */
function App() {
  const [currentView, setCurrentView] = useState('problem');
  const [studentId] = useState('student_001'); // Demo student ID
  const [problemId] = useState('problem_math_001'); // Demo problem ID

  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);

  const handleProblemComplete = (completedResult) => {
    setResult(completedResult);
    console.log('문제 완료:', completedResult);
  };

  const handleSubmit = (handleSubmitCallback) => {
    // Simple math problem: 2 + 3 = ?
    const correctAnswer = '5';
    const isCorrect = answer === correctAnswer;

    handleSubmitCallback(isCorrect, {
      question: '2 + 3 = ?',
      answer: answer,
      correct_answer: correctAnswer,
    });

    setResult({
      isCorrect,
      answer,
      correctAnswer,
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>LMS 문제 시간 추적 시스템</h1>
        <p>학생 ID: {studentId}</p>

        <div className="view-toggle">
          <button
            className={currentView === 'problem' ? 'active' : ''}
            onClick={() => setCurrentView('problem')}
          >
            문제 풀이
          </button>
          <button
            className={currentView === 'statistics' ? 'active' : ''}
            onClick={() => setCurrentView('statistics')}
          >
            통계 보기
          </button>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'problem' ? (
          <ProblemTimeTracker
            studentId={studentId}
            problemId={problemId}
            showTimer={true}
            onComplete={handleProblemComplete}
            autoStart={true}
          >
            {({ handleSubmit: submitCallback, handleHintClick, recordInteraction }) => (
              <div className="problem-wrapper">
                <h2>수학 문제</h2>

                <div className="problem-question">
                  <p className="question-text">2 + 3 = ?</p>
                </div>

                <div className="problem-answer">
                  <label htmlFor="answer">답변:</label>
                  <input
                    id="answer"
                    type="text"
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      recordInteraction({ action: 'input_change' });
                    }}
                    placeholder="답을 입력하세요"
                    disabled={result !== null}
                  />
                </div>

                <div className="problem-actions">
                  <button
                    className="btn-hint"
                    onClick={handleHintClick}
                    disabled={result !== null}
                  >
                    힌트 요청
                  </button>

                  <button
                    className="btn-submit"
                    onClick={() => handleSubmit(submitCallback)}
                    disabled={!answer || result !== null}
                  >
                    제출하기
                  </button>
                </div>

                {result && (
                  <div className={`result-message ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                    {result.isCorrect ? (
                      <>
                        <h3>정답입니다!</h3>
                        <p>소요 시간: {result.time_spent_seconds}초</p>
                        <p>활동 시간: {result.active_time_seconds}초</p>
                      </>
                    ) : (
                      <>
                        <h3>틀렸습니다</h3>
                        <p>정답: {result.correctAnswer}</p>
                        <p>입력한 답: {result.answer}</p>
                      </>
                    )}
                    <button
                      className="btn-retry"
                      onClick={() => {
                        setAnswer('');
                        setResult(null);
                        window.location.reload();
                      }}
                    >
                      다시 풀기
                    </button>
                  </div>
                )}
              </div>
            )}
          </ProblemTimeTracker>
        ) : (
          <ProblemStatistics problemId={problemId} />
        )}
      </main>

      <footer className="app-footer">
        <p>LMS Time Tracking System - Problem ID: {problemId}</p>
      </footer>
    </div>
  );
}

export default App;
