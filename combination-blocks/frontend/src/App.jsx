import React, { useState, useEffect } from 'react';
import VirtualPhone from './components/VirtualPhone/VirtualPhone';
import CombinationBlocks from './components/CombinationBlocks/CombinationBlocks';
import './App.css';

/**
 * Main App Component
 * Integrates VirtualPhone UI with CombinationBlocks
 */
function App() {
  const [blockId, setBlockId] = useState(1); // Default block ID
  const [userId, setUserId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Get parameters from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlBlockId = urlParams.get('blockId');
    const urlUserId = urlParams.get('userId');
    const urlToken = urlParams.get('token');

    // Set block ID
    if (urlBlockId) {
      setBlockId(parseInt(urlBlockId, 10));
    }

    // Set user ID (from URL or localStorage)
    if (urlUserId) {
      setUserId(parseInt(urlUserId, 10));
      localStorage.setItem('moodle_user_id', urlUserId);
    } else {
      const storedUserId = localStorage.getItem('moodle_user_id');
      if (storedUserId) {
        setUserId(parseInt(storedUserId, 10));
      } else {
        // Demo user for testing
        setUserId(1);
      }
    }

    // Store Moodle token if provided
    if (urlToken) {
      localStorage.setItem('moodle_token', urlToken);
    }

    setIsReady(true);
  }, []);

  const handleBlockChange = (newBlockId) => {
    setBlockId(newBlockId);
  };

  if (!isReady || !userId) {
    return (
      <div className="app-loading">
        <div className="spinner-large"></div>
        <p>Initializing Combination Blocks...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Background decoration */}
      <div className="app-background">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
        <div className="bg-circle bg-circle-3"></div>
      </div>

      {/* Main content area - can show instructions or branding */}
      <div className="app-content">
        <div className="welcome-section">
          <h1>Combination Blocks</h1>
          <p className="subtitle">블록을 조합하여 목표를 달성하세요!</p>

          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">🧩</div>
              <h3>드래그 & 드롭</h3>
              <p>블록을 끌어다 놓거나 클릭하여 조합을 만드세요</p>
            </div>

            <div className="info-card">
              <div className="info-icon">🎯</div>
              <h3>목표 달성</h3>
              <p>주어진 목표 값을 만들어보세요</p>
            </div>

            <div className="info-card">
              <div className="info-icon">💡</div>
              <h3>힌트 활용</h3>
              <p>어려우면 힌트를 확인하세요</p>
            </div>
          </div>

          <div className="instruction-text">
            <p>👉 우측 하단의 가상 스마트폰에서 문제를 풀어보세요!</p>
          </div>
        </div>
      </div>

      {/* Virtual Phone with Combination Blocks */}
      <VirtualPhone position="bottom-right">
        <CombinationBlocks
          blockId={blockId}
          userId={userId}
          onBlockChange={handleBlockChange}
        />
      </VirtualPhone>
    </div>
  );
}

export default App;
