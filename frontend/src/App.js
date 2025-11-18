import React, { useState, useEffect } from 'react';
import './App.css';
import SmartphoneFrame from './components/SmartphoneFrame';
import ProblemView from './components/ProblemView';
import ResultView from './components/ResultView';
import { fetchProblem, submitAnswer } from './services/api';

function App() {
  const [studentId] = useState(1); // In production, get from auth/session
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadProblem();
  }, []);

  const loadProblem = async () => {
    setLoading(true);
    setShowResult(false);
    setResult(null);

    try {
      const data = await fetchProblem(studentId);
      setProblem(data);
    } catch (error) {
      console.error('Failed to load problem:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (answer, timeSpent, hintUsed) => {
    if (!problem) return;

    try {
      const submitData = {
        student_id: studentId,
        problem_id: problem.id,
        answer: answer,
        time_spent: timeSpent,
        hint_used: hintUsed,
      };

      const response = await submitAnswer(submitData);
      setResult(response);
      setShowResult(true);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to submit answer. Please try again.');
    }
  };

  const handleNext = () => {
    loadProblem();
  };

  return (
    <div className="App">
      <div className="app-header">
        <h1>🕯️ Power Candle</h1>
        <p>로그를 촛불로 배워요!</p>
      </div>

      <SmartphoneFrame>
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>문제를 불러오는 중...</p>
          </div>
        ) : showResult ? (
          <ResultView
            result={result}
            problem={problem}
            onNext={handleNext}
          />
        ) : (
          <ProblemView
            problem={problem}
            onSubmit={handleSubmit}
          />
        )}
      </SmartphoneFrame>

      <div className="app-footer">
        <p>KAIST Touch Math Academy</p>
      </div>
    </div>
  );
}

export default App;
