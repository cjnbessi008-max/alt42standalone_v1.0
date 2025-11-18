import React, { useState, useEffect } from 'react';
import VirtualSmartphone from './components/VirtualSmartphone';
import MoodleConnector from './services/MoodleConnector';
import './styles/App.css';

function App() {
  const [problemData, setProblemData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize Moodle connection
    const connector = new MoodleConnector();
    connector.connect()
      .then(() => {
        setIsConnected(true);
        console.log('Moodle LMS connected successfully');
      })
      .catch(error => {
        console.error('Failed to connect to Moodle:', error);
      });

    // Listen for problem updates from Moodle
    connector.onProblemUpdate((data) => {
      setProblemData(data);
    });

    return () => connector.disconnect();
  }, []);

  return (
    <div className="app-container">
      <div className="connection-status">
        {isConnected ? (
          <span className="status-connected">● LMS 연결됨</span>
        ) : (
          <span className="status-disconnected">○ LMS 연결 중...</span>
        )}
      </div>

      <VirtualSmartphone problemData={problemData} />

      <div className="info-panel">
        <h3>Logical Collapse System</h3>
        <p>잘못된 추론이 감지되면 해당 부분이 부드럽게 무너집니다.</p>
        {problemData && (
          <div className="problem-info">
            <h4>현재 문제:</h4>
            <p>{problemData.title}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
