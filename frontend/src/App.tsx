import React, { useState } from 'react';
import { VirtualSmartphone } from './components/VirtualSmartphone';
import './styles/App.css';

/**
 * Main Application Component
 * Integrates with Moodle LMS and displays virtual smartphone with Flip Moment effects
 */
function App() {
  const [questionId, setQuestionId] = useState<number | undefined>(1);
  const [moodleApiUrl] = useState('/api/moodle/questions');

  return (
    <div className="app-container">
      {/* Main content area - Moodle integration interface */}
      <div className="main-content">
        <header className="app-header">
          <h1>🎓 ALT42 Education System</h1>
          <p className="subtitle">Moodle Integration with Flip Moment Visual Effects</p>
        </header>

        <div className="content-panel">
          <div className="info-card">
            <h2>Welcome to Flip Moment Demo</h2>
            <p>
              This application demonstrates the <strong>Flip Moment</strong> visual effect feature
              integrated with Moodle LMS.
            </p>

            <div className="features-list">
              <h3>Features:</h3>
              <ul>
                <li>🔄 <strong>Flip Detection</strong>: Automatically detects device orientation changes</li>
                <li>✨ <strong>Visual Effects</strong>: Color inversion, rotation, and filter effects during flips</li>
                <li>📱 <strong>Virtual Smartphone</strong>: Simulated mobile display in bottom-right corner</li>
                <li>🔗 <strong>Moodle Integration</strong>: Fetches questions from Moodle LMS (PHP 7.1.9, MySQL 5.7)</li>
              </ul>
            </div>

            <div className="instructions">
              <h3>Try It Out:</h3>
              <ol>
                <li>Look at the virtual smartphone in the bottom-right corner</li>
                <li>Rotate your device or browser window</li>
                <li>Watch the <strong>Flip Moment</strong> visual effects activate!</li>
                <li>Use the controls below to load different questions</li>
              </ol>
            </div>
          </div>

          <div className="controls-card">
            <h3>Question Controls</h3>
            <div className="control-group">
              <label htmlFor="question-id">Question ID:</label>
              <div className="input-with-button">
                <input
                  id="question-id"
                  type="number"
                  min="1"
                  value={questionId || ''}
                  onChange={(e) => setQuestionId(parseInt(e.target.value) || undefined)}
                  className="question-input"
                />
                <button
                  onClick={() => setQuestionId(Math.floor(Math.random() * 100) + 1)}
                  className="random-button"
                >
                  🎲 Random
                </button>
              </div>
            </div>

            <div className="api-info">
              <p><strong>API Endpoint:</strong> <code>{moodleApiUrl}</code></p>
              <p><strong>Current Question:</strong> {questionId || 'None'}</p>
            </div>
          </div>

          <div className="tech-stack-card">
            <h3>Technology Stack</h3>
            <div className="tech-grid">
              <div className="tech-item">
                <span className="tech-icon">⚛️</span>
                <span className="tech-name">React 18</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">🎨</span>
                <span className="tech-name">Framer Motion</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">🐘</span>
                <span className="tech-name">PHP 7.1.9</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">🗄️</span>
                <span className="tech-name">MySQL 5.7</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">📚</span>
                <span className="tech-name">Moodle 3.7</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">📱</span>
                <span className="tech-name">TypeScript</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Smartphone with Flip Moment effects */}
      <VirtualSmartphone
        moodleApiUrl={moodleApiUrl}
        questionId={questionId}
        position="bottom-right"
        size="medium"
      />
    </div>
  );
}

export default App;
