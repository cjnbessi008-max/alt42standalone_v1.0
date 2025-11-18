/**
 * Main Application Component
 */
import React, { useState } from 'react';
import ProblemSolver from './components/ProblemSolver';
import TeacherDashboard from './pages/TeacherDashboard';

type View = 'student' | 'teacher';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('student');
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  const handleProblemComplete = (sessionId: string, isCorrect: boolean) => {
    setCompletedSessionId(sessionId);
    alert(
      isCorrect
        ? `정답입니다! 세션 ID: ${sessionId}`
        : `제출되었습니다. 세션 ID: ${sessionId}`
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Navigation */}
      <nav
        style={{
          backgroundColor: '#2c3e50',
          padding: '15px 30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '20px' }}>
          <button
            onClick={() => setCurrentView('student')}
            style={{
              padding: '10px 20px',
              backgroundColor: currentView === 'student' ? '#3498db' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: currentView === 'student' ? 'bold' : 'normal',
            }}
          >
            학생 화면
          </button>
          <button
            onClick={() => setCurrentView('teacher')}
            style={{
              padding: '10px 20px',
              backgroundColor: currentView === 'teacher' ? '#3498db' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: currentView === 'teacher' ? 'bold' : 'normal',
            }}
          >
            교사 대시보드
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '20px' }}>
        {currentView === 'student' ? (
          <div>
            <ProblemSolver
              studentId="student-001"
              moduleId="module-001"
              problemId="problem-001"
              onComplete={handleProblemComplete}
            />
            {completedSessionId && (
              <div
                style={{
                  maxWidth: '800px',
                  margin: '20px auto',
                  padding: '15px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '8px',
                  border: '1px solid #2196f3',
                }}
              >
                <p style={{ margin: 0 }}>
                  ✅ 문제를 제출했습니다! 교사 대시보드에서 세션 ID{' '}
                  <strong>{completedSessionId}</strong>를 입력하여 사고 흐름 분석을 확인할 수
                  있습니다.
                </p>
              </div>
            )}
          </div>
        ) : (
          <TeacherDashboard />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: '50px',
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
        }}
      >
        <p>AI Education System - Learning Analytics & Thinking Flow Analysis</p>
        <p style={{ fontSize: '12px', marginTop: '5px' }}>
          실시간 학습 분석으로 학생의 사고 과정을 이해합니다
        </p>
      </footer>
    </div>
  );
};

export default App;
