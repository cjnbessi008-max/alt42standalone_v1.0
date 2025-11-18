import React, { useState, useEffect } from 'react';
import './App.css';
import PhoneFrame from './components/PhoneFrame';
import FilterShrinkUI from './components/FilterShrinkUI';
import apiService from './services/apiService';

function App() {
  const [studentId] = useState(1); // Mock student ID
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startNewSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.startFilterSession(studentId);
      if (response.success) {
        setSession(response.session);
      } else {
        setError(response.error || '세션 시작 실패');
      }
    } catch (err) {
      setError('서버 연결 오류: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-start session on load
    startNewSession();
  }, []);

  return (
    <div className="App">
      <PhoneFrame>
        {loading && !session && (
          <div className="loading">
            <div className="spinner"></div>
            <p>로딩 중...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <h3>오류</h3>
            <p>{error}</p>
            <button onClick={startNewSession}>다시 시도</button>
          </div>
        )}

        {session && !error && (
          <FilterShrinkUI
            session={session}
            onSessionUpdate={setSession}
            onReset={startNewSession}
          />
        )}
      </PhoneFrame>
    </div>
  );
}

export default App;
