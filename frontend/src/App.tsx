import { useState, useEffect } from 'react';
import './App.css';
import { api, Student, Problem } from './api/client';
import ProblemSolver from './components/ProblemSolver';
import StudentSelector from './components/StudentSelector';
import ProgressDashboard from './components/ProgressDashboard';

function App() {
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [view, setView] = useState<'solve' | 'progress'>('solve');
  const [loading, setLoading] = useState(false);

  // Load next problem
  const loadNextProblem = async () => {
    try {
      setLoading(true);
      const response = await api.getRandomProblem();
      setCurrentProblem(response.data);
    } catch (error) {
      console.error('Failed to load problem:', error);
      alert('문제를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Load initial problem when student is selected
  useEffect(() => {
    if (currentStudent) {
      loadNextProblem();
    }
  }, [currentStudent]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧠 추론 분석 학습 시스템</h1>
        <p className="subtitle">AI가 당신의 추론 과정을 분석하고 피드백을 제공합니다</p>
      </header>

      <main className="container">
        {!currentStudent ? (
          <StudentSelector onStudentSelected={setCurrentStudent} />
        ) : (
          <>
            <div className="student-info card">
              <div className="student-header">
                <div>
                  <h3>👤 {currentStudent.name}</h3>
                  {currentStudent.grade_level && (
                    <p className="grade">{currentStudent.grade_level}</p>
                  )}
                </div>
                <div className="student-actions">
                  <button
                    className={view === 'solve' ? 'active' : ''}
                    onClick={() => setView('solve')}
                  >
                    문제 풀기
                  </button>
                  <button
                    className={view === 'progress' ? 'active' : ''}
                    onClick={() => setView('progress')}
                  >
                    진행 상황
                  </button>
                  <button
                    onClick={() => {
                      setCurrentStudent(null);
                      setCurrentProblem(null);
                    }}
                    className="secondary"
                  >
                    학생 변경
                  </button>
                </div>
              </div>
            </div>

            {view === 'solve' ? (
              <>
                {loading ? (
                  <div className="loading">
                    <div className="spinner" />
                  </div>
                ) : currentProblem ? (
                  <ProblemSolver
                    student={currentStudent}
                    problem={currentProblem}
                    onNextProblem={loadNextProblem}
                  />
                ) : (
                  <div className="card">
                    <p>문제를 불러오는 중...</p>
                  </div>
                )}
              </>
            ) : (
              <ProgressDashboard student={currentStudent} />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by Claude AI | KAIST Touch Math Academy</p>
      </footer>
    </div>
  );
}

export default App;
