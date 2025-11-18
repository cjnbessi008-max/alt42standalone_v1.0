import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import VirtualPhone from './components/VirtualPhone';
import MoodleService from './services/moodleAPI';
import './App.css';

const AppContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
`;

const Header = styled.header`
  text-align: center;
  color: white;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
`;

const ControlPanel = styled.div`
  background: white;
  border-radius: 15px;
  padding: 20px;
  max-width: 600px;
  margin: 0 auto 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`;

const Button = styled.button`
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  margin: 5px;
  transition: all 0.3s ease;

  &:hover {
    background: #5568d3;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const StatusDisplay = styled.div`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
  font-family: monospace;
  font-size: 0.9rem;
`;

function App() {
  const [currentProblem, setCurrentProblem] = useState(null);
  const [warmthLevel, setWarmthLevel] = useState(0); // 0-100: 0=cold(blue), 100=warm(red)
  const [moodleConnected, setMoodleConnected] = useState(false);

  useEffect(() => {
    // Initialize Moodle connection
    initializeMoodle();
  }, []);

  const initializeMoodle = async () => {
    try {
      const isConnected = await MoodleService.checkConnection();
      setMoodleConnected(isConnected);
      if (isConnected) {
        console.log('Moodle LMS connected successfully');
      }
    } catch (error) {
      console.error('Failed to connect to Moodle:', error);
      setMoodleConnected(false);
    }
  };

  const loadProblem = async () => {
    try {
      const problem = await MoodleService.getProblem();
      setCurrentProblem(problem);
      setWarmthLevel(0); // Reset warmth for new problem
    } catch (error) {
      console.error('Failed to load problem:', error);
      // Load demo problem if Moodle is not available
      setCurrentProblem({
        id: 'demo-1',
        title: '분수 덧셈',
        question: '1/2 + 1/4 = ?',
        correctAnswer: '3/4',
        type: 'fraction'
      });
    }
  };

  const handleAnswerSubmit = (answer) => {
    if (!currentProblem) return;

    // Calculate correctness and update warmth level
    const correctness = MoodleService.checkAnswer(currentProblem, answer);
    setWarmthLevel(correctness);
  };

  const resetWarmth = () => {
    setWarmthLevel(0);
  };

  return (
    <AppContainer>
      <Header>
        <Title>🌡️ Correct Warm Feedback System</Title>
        <Subtitle>Moodle LMS 연동 학습 피드백 앱</Subtitle>
      </Header>

      <ControlPanel>
        <h2 style={{ marginBottom: '15px', color: '#333' }}>제어 패널</h2>
        <div>
          <Button onClick={loadProblem}>📚 새 문제 불러오기</Button>
          <Button onClick={resetWarmth}>🔄 피드백 초기화</Button>
          <Button onClick={initializeMoodle}>
            🔌 Moodle 재연결
          </Button>
        </div>

        <StatusDisplay>
          <div><strong>Moodle 연결:</strong> {moodleConnected ? '✅ 연결됨' : '❌ 연결 안됨'}</div>
          <div><strong>현재 문제:</strong> {currentProblem ? currentProblem.title : '없음'}</div>
          <div><strong>Warmth Level:</strong> {warmthLevel}% 🌡️</div>
        </StatusDisplay>
      </ControlPanel>

      <VirtualPhone
        problem={currentProblem}
        warmthLevel={warmthLevel}
        onAnswerSubmit={handleAnswerSubmit}
      />
    </AppContainer>
  );
}

export default App;
