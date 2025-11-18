import React, { useState, useEffect } from 'react';
import './App.css';
import VirtualPhone from './components/VirtualPhone/VirtualPhone';
import { Problem, StudentInteraction } from './types';
import { io, Socket } from 'socket.io-client';

const App: React.FC = () => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    // Initialize Socket.io connection
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to backend');
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from backend');
      setConnectionStatus('disconnected');
    });

    newSocket.on('problem:loaded', (data: Problem) => {
      console.log('Problem received:', data);
      setProblem(data);
    });

    newSocket.on('problem:validation', (data: { isCorrect: boolean; feedback: string }) => {
      console.log('Validation result:', data);
    });

    setSocket(newSocket);

    // Load initial demo problem
    loadDemoProblem();

    return () => {
      newSocket.close();
    };
  }, []);

  const loadDemoProblem = () => {
    // Demo problem for testing
    const demoProblem: Problem = {
      id: 'demo_001',
      title: '분수의 덧셈',
      description: '다음 분수의 덧셈을 계산하세요: 1/2 + 1/4 = ?',
      type: 'step_by_step',
      correctAnswer: '3/4',
      steps: [
        {
          id: 'step_1',
          order: 1,
          description: '먼저 공통 분모를 찾으세요. (힌트: 2와 4의 최소공배수)',
          expectedAction: '4',
          validationRule: 'equals:4',
        },
        {
          id: 'step_2',
          order: 2,
          description: '1/2를 분모가 4인 분수로 변환하세요.',
          expectedAction: '2/4',
          validationRule: 'equals:2/4',
        },
        {
          id: 'step_3',
          order: 3,
          description: '이제 2/4 + 1/4를 계산하세요.',
          expectedAction: '3/4',
          validationRule: 'equals:3/4',
        },
      ],
      difficulty: 'easy',
      subject: '수학',
      gradeLevel: '초등 3학년',
    };

    setProblem(demoProblem);
  };

  const handleInteraction = (interaction: StudentInteraction) => {
    console.log('Student interaction:', interaction);

    // Send to backend via Socket.io
    if (socket && socket.connected) {
      socket.emit('interaction:submit', interaction);
    }

    // Log to console for demo
    if (!interaction.isCorrect) {
      console.warn('❌ Wrong answer detected!');
    } else {
      console.log('✅ Correct answer!');
    }
  };

  const loadNewProblem = () => {
    if (socket && socket.connected) {
      socket.emit('problem:request', { gradeLevel: '초등 3학년', subject: '수학' });
    } else {
      loadDemoProblem();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>🎓 Wrong Move Alert - LMS Integration</h1>
          <div className="connection-status">
            <span className={`status-indicator ${connectionStatus}`}></span>
            <span className="status-text">
              {connectionStatus === 'connected' ? '연결됨' :
               connectionStatus === 'disconnected' ? '연결 끊김' : '연결 중...'}
            </span>
          </div>
        </div>
      </header>

      <main className="App-main">
        <div className="content-area">
          <div className="info-panel">
            <h2>시스템 정보</h2>
            <div className="info-card">
              <h3>📱 가상 스마트폰</h3>
              <p>우측 하단에 표시되는 모바일 화면에서 문제를 풀어보세요.</p>
            </div>

            <div className="info-card">
              <h3>⚠️ Wrong Move Alert</h3>
              <p>잘못된 답을 입력하면 화면에 붉은 크랙 효과가 나타납니다.</p>
              <ul>
                <li>🔴 높은 강도: 8개의 크랙 + 파편 효과</li>
                <li>🟠 중간 강도: 5개의 크랙</li>
                <li>🟡 낮은 강도: 3개의 크랙</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>🔗 LMS 연동</h3>
              <p>Moodle 3.7과 연동하여 문제 정보를 받아옵니다.</p>
              <ul>
                <li>MySQL 5.7 데이터베이스</li>
                <li>PHP 7.1.9 백엔드</li>
                <li>실시간 Socket.io 통신</li>
              </ul>
            </div>

            <div className="control-panel">
              <h3>컨트롤</h3>
              <button onClick={loadNewProblem} className="control-button">
                새 문제 불러오기
              </button>
              <button onClick={loadDemoProblem} className="control-button secondary">
                데모 문제 로드
              </button>
            </div>

            {problem && (
              <div className="current-problem-info">
                <h3>현재 문제</h3>
                <dl>
                  <dt>ID:</dt>
                  <dd>{problem.id}</dd>
                  <dt>제목:</dt>
                  <dd>{problem.title}</dd>
                  <dt>난이도:</dt>
                  <dd>{problem.difficulty}</dd>
                  <dt>과목:</dt>
                  <dd>{problem.subject}</dd>
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Virtual Phone - Fixed bottom-right */}
        <VirtualPhone problem={problem} onInteraction={handleInteraction} />
      </main>

      <footer className="App-footer">
        <p>© 2024 Wrong Move Alert System | KAIST Touch Math Academy</p>
      </footer>
    </div>
  );
};

export default App;
