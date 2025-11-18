import React, { useState, useEffect } from 'react';
import './App.css';
import MobileScreen from './components/MobileScreen/MobileScreen';
import ControlPanel from './components/ControlPanel/ControlPanel';
import { getMoodleProblems } from './services/moodleApi';

function App() {
  const [currentProblem, setCurrentProblem] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const data = await getMoodleProblems();
      setProblems(data);
      if (data.length > 0) {
        setCurrentProblem(data[0]);
      }
      setError(null);
    } catch (err) {
      console.error('문제 로딩 실패:', err);
      setError('Moodle에서 문제를 불러올 수 없습니다. 데모 모드로 전환합니다.');
      // 데모 데이터 사용
      const demoData = [
        {
          id: 1,
          title: '2차 함수의 성질',
          equation: 'x^2 - 4*x + 3',
          domain: { min: -2, max: 6 },
          description: '이차함수의 증가/감소와 극값을 관찰하세요'
        },
        {
          id: 2,
          title: '3차 함수의 변곡점',
          equation: 'x^3 - 3*x^2 + 2',
          domain: { min: -2, max: 4 },
          description: '삼차함수의 변곡점과 극값을 확인하세요'
        },
        {
          id: 3,
          title: '삼각함수',
          equation: 'sin(x)',
          domain: { min: -Math.PI * 2, max: Math.PI * 2 },
          description: '사인함수의 주기적 성질 변화를 느껴보세요'
        }
      ];
      setProblems(demoData);
      setCurrentProblem(demoData[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleProblemChange = (problemId) => {
    const problem = problems.find(p => p.id === problemId);
    if (problem) {
      setCurrentProblem(problem);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">문제를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Property Shake</h1>
        <p>그래프 성질 변화 감지 시스템</p>
      </header>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="app-content">
        <ControlPanel
          problems={problems}
          currentProblem={currentProblem}
          onProblemChange={handleProblemChange}
        />

        <MobileScreen problem={currentProblem} />
      </div>

      <footer className="app-footer">
        <p>Moodle 3.7 연동 | MySQL 5.7 | PHP 7.1.9</p>
      </footer>
    </div>
  );
}

export default App;
