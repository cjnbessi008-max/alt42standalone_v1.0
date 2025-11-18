/**
 * Main Application Component
 */
import React from 'react';
import { FocusDashboard } from './components/FocusDashboard';
import { useFocusSession } from './hooks/useFocusSession';

function App() {
  const {
    session,
    isTracking,
    currentFocusScore,
    startSession,
    endSession,
  } = useFocusSession('Main Learning Module');

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1>Focus Analysis & Time Recommendation System</h1>
        <div style={styles.sessionControls}>
          {!isTracking ? (
            <button style={styles.startButton} onClick={startSession}>
              Start Learning Session
            </button>
          ) : (
            <div style={styles.trackingInfo}>
              <span style={styles.trackingIndicator}>
                🔴 Session Active - Focus Score: {Math.round(currentFocusScore)}
              </span>
              <button style={styles.endButton} onClick={endSession}>
                End Session
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={styles.main}>
        <FocusDashboard />
      </main>

      <footer style={styles.footer}>
        <p>Focus Analysis System - Optimizing Your Learning Experience</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196f3',
    color: '#fff',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sessionControls: {
    marginTop: '15px',
  },
  startButton: {
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  trackingInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  trackingIndicator: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  endButton: {
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    fontSize: '14px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  main: {
    padding: '20px',
  },
  footer: {
    backgroundColor: '#333',
    color: '#fff',
    textAlign: 'center',
    padding: '20px',
    marginTop: '40px',
  },
};

export default App;
