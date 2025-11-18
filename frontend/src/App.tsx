/**
 * Main Application Component
 *
 * Standalone Moodle LMS Reverse Problem Integration Web App
 */

import React, { useState } from 'react';
import { MoodleConnection } from './components/MoodleIntegration/MoodleConnection';
import { ProblemReconstructor } from './components/MoodleIntegration/ProblemReconstructor';
import './App.css';

type AppView = 'connection' | 'reconstructor';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('connection');
  const [isConnected, setIsConnected] = useState(false);

  const handleConnectionSuccess = () => {
    setIsConnected(true);
    setCurrentView('reconstructor');
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>🎓 AI Education System</h1>
          <p className="app-subtitle">
            Moodle LMS 역문제 재구성 플랫폼
          </p>
        </div>

        {/* Navigation */}
        <nav className="app-nav">
          <button
            className={`nav-btn ${currentView === 'connection' ? 'active' : ''}`}
            onClick={() => setCurrentView('connection')}
          >
            🔗 연결 설정
          </button>
          <button
            className={`nav-btn ${currentView === 'reconstructor' ? 'active' : ''}`}
            onClick={() => setCurrentView('reconstructor')}
            disabled={!isConnected}
          >
            🔄 문제 재구성
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {currentView === 'connection' && (
          <MoodleConnection onConnectionSuccess={handleConnectionSuccess} />
        )}

        {currentView === 'reconstructor' && (
          <ProblemReconstructor />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>
            &copy; 2025 AI Education System |
            <a
              href="/docs/MOODLE_INTEGRATION.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              📚 문서
            </a> |
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              🔧 API Docs
            </a>
          </p>
          <p className="footer-tech">
            Powered by React + FastAPI + Moodle 3.7
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
