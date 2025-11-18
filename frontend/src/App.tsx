/**
 * Main App Component
 */
import React from 'react';
import { ProblemSolver } from './components/ProblemSolver';
import type { Problem } from './types';

// Demo problem data
const DEMO_PROBLEM: Problem = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: '분수의 덧셈',
  description: '서로 다른 분모를 가진 분수를 더하는 방법을 배워봅시다.',
  problem_type: 'fraction_addition',
  difficulty_level: 3,
  content: {
    fraction1: { numerator: 1, denominator: 2 },
    fraction2: { numerator: 1, denominator: 3 },
  },
};

const DEMO_STUDENT_ID = '550e8400-e29b-41d4-a716-446655440001';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🎓 AI 교육 시스템</h1>
          <p>스스로 질문하며 배우는 학습 플랫폼</p>
        </div>
      </header>

      <main className="app-main">
        <ProblemSolver problem={DEMO_PROBLEM} studentId={DEMO_STUDENT_ID} />
      </main>

      <footer className="app-footer">
        <p>
          Powered by Claude AI | KAIST Touch Math Academy
        </p>
      </footer>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
            'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
            'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem 0;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          text-align: center;
        }

        .app-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .app-header p {
          margin: 0;
          font-size: 1.1rem;
          color: #6c757d;
        }

        .app-main {
          flex: 1;
          padding: 2rem 0;
        }

        .app-footer {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 1.5rem 0;
          text-align: center;
          box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
        }

        .app-footer p {
          margin: 0;
          color: #6c757d;
          font-size: 0.9rem;
        }

        @media (max-width: 968px) {
          .app-header h1 {
            font-size: 2rem;
          }

          .app-header p {
            font-size: 1rem;
          }

          .app-main {
            padding: 1rem 0;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
