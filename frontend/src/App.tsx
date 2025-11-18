import { HintPanel } from './components/HintPanel';
import './App.css';

function App() {
  // In a real application, these would come from authentication/routing
  const DEMO_STUDENT_ID = '00000000-0000-0000-0000-000000000001';
  const DEMO_PROBLEM_ID = '00000000-0000-0000-0000-000000000002';

  return (
    <div className="app">
      <header className="app-header">
        <h1>ALT42 LMS 힌트 시스템</h1>
        <p>AI 기반 3단계 힌트 제공 시스템</p>
      </header>

      <main className="app-main">
        {/* Demo Problem Display */}
        <div className="problem-section">
          <h2>문제</h2>
          <div className="problem-content">
            <p>
              <strong>분수 덧셈 문제:</strong>
            </p>
            <p className="math-problem">
              1/4 + 2/4 = ?
            </p>
            <p>
              분수를 더하여 정답을 구하세요. 막히면 아래 힌트를 활용해보세요!
            </p>
          </div>
        </div>

        {/* Hint Panel */}
        <HintPanel
          studentId={DEMO_STUDENT_ID}
          problemId={DEMO_PROBLEM_ID}
          onHintReceived={(hint) => {
            console.log('Hint received:', hint);
          }}
        />
      </main>

      <footer className="app-footer">
        <p>© 2025 KAIST Touch Math Academy - ALT42 Standalone v1.0</p>
      </footer>
    </div>
  );
}

export default App;
