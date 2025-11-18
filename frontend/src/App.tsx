import { useState } from 'react';
import Dashboard from './components/Dashboard';
import './styles/global.css';

function App() {
  // 데모용 - 실제로는 로그인 시스템 구현 필요
  const [studentId, setStudentId] = useState('');
  const [moodleUserId, setMoodleUserId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId && moodleUserId) {
      setIsLoggedIn(true);
    } else {
      alert('학생 ID와 Moodle 사용자 ID를 모두 입력해주세요');
    }
  };

  if (!isLoggedIn) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '400px',
            width: '100%',
            margin: '1rem',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
            LMS 문제 추적기
          </h1>
          <p style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
            AI 추론 구조와 함께하는 학습 분석 시스템
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="studentId"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
              >
                학생 ID (UUID)
              </label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="예: 123e4567-e89b-12d3-a456-426614174000"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
              <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                DB에 저장된 학생 ID를 입력하세요
              </small>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="moodleUserId"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}
              >
                Moodle 사용자 ID
              </label>
              <input
                id="moodleUserId"
                type="number"
                value={moodleUserId}
                onChange={(e) => setMoodleUserId(e.target.value)}
                placeholder="예: 123"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
              <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                Moodle에서 문제를 동기화하기 위한 ID
              </small>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              로그인
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              💡 테스트 방법
            </div>
            <ol style={{ fontSize: '0.875rem', color: '#6b7280', paddingLeft: '1.5rem' }}>
              <li>먼저 Moodle 동기화를 실행하여 학생 정보를 DB에 저장</li>
              <li>DB에서 생성된 학생 UUID를 확인</li>
              <li>해당 UUID와 Moodle ID로 로그인</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <header
        style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            LMS 문제 추적기
          </h1>
          <button
            className="btn btn-outline"
            onClick={() => setIsLoggedIn(false)}
            style={{ fontSize: '0.875rem' }}
          >
            로그아웃
          </button>
        </div>
      </header>

      <main>
        <Dashboard
          studentId={studentId}
          moodleUserId={parseInt(moodleUserId)}
        />
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280',
          fontSize: '0.875rem',
        }}
      >
        LMS Problem Tracker © 2024 - AI-powered learning analytics
      </footer>
    </div>
  );
}

export default App;
