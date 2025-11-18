import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ProblemDisplay from './ProblemDisplay';
import CorrectWarmFeedback from './CorrectWarmFeedback';

const PhoneContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 380px;
  height: 780px;
  background: #1a1a1a;
  border-radius: 40px;
  padding: 15px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6);
  }

  @media (max-width: 768px) {
    width: 320px;
    height: 650px;
    bottom: 20px;
    right: 20px;
  }
`;

const PhoneNotch = styled.div`
  width: 150px;
  height: 25px;
  background: #1a1a1a;
  border-radius: 0 0 20px 20px;
  margin: 0 auto 10px;
  position: relative;
`;

const PhoneScreen = styled.div`
  width: 100%;
  height: calc(100% - 35px);
  background: ${props => props.warmthColor || 'linear-gradient(180deg, #e3f2fd 0%, #bbdefb 100%)'};
  border-radius: 30px;
  overflow: hidden;
  position: relative;
  transition: background 1.5s ease;
  display: flex;
  flex-direction: column;
`;

const ScreenHeader = styled.div`
  background: rgba(255, 255, 255, 0.95);
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const AppTitle = styled.h2`
  font-size: 1.2rem;
  color: #333;
  margin: 0;
`;

const WarmthIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #666;
`;

const TemperatureIcon = styled.span`
  font-size: 1.5rem;
`;

const ScreenContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  position: relative;
`;

const VirtualPhone = ({ problem, warmthLevel, onAnswerSubmit }) => {
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [warmthColor, setWarmthColor] = useState('');

  useEffect(() => {
    // Calculate warmth color based on warmthLevel (0-100)
    const color = calculateWarmthColor(warmthLevel);
    setWarmthColor(color);
  }, [warmthLevel]);

  const calculateWarmthColor = (level) => {
    // 0% = Cold Blue
    // 50% = Neutral
    // 100% = Warm Red/Orange

    if (level === 0) {
      return 'linear-gradient(180deg, #e3f2fd 0%, #bbdefb 100%)'; // Cold blue
    } else if (level < 30) {
      return 'linear-gradient(180deg, #e1f5fe 0%, #b3e5fc 100%)'; // Light blue
    } else if (level < 50) {
      return 'linear-gradient(180deg, #fff9c4 0%, #fff59d 100%)'; // Light yellow
    } else if (level < 70) {
      return 'linear-gradient(180deg, #ffe0b2 0%, #ffcc80 100%)'; // Light orange
    } else if (level < 90) {
      return 'linear-gradient(180deg, #ffccbc 0%, #ffab91 100%)'; // Orange
    } else {
      return 'linear-gradient(180deg, #ffcdd2 0%, #ef9a9a 100%)'; // Warm red
    }
  };

  const getTemperatureEmoji = (level) => {
    if (level < 30) return '❄️';
    if (level < 50) return '🌤️';
    if (level < 70) return '☀️';
    if (level < 90) return '🔥';
    return '🌡️';
  };

  const handleAnswerChange = (answer) => {
    setCurrentAnswer(answer);
  };

  const handleSubmit = (answer) => {
    if (onAnswerSubmit) {
      onAnswerSubmit(answer);
    }
    setCurrentAnswer('');
  };

  return (
    <PhoneContainer>
      <PhoneNotch />
      <PhoneScreen warmthColor={warmthColor}>
        <ScreenHeader>
          <AppTitle>📱 학습앱</AppTitle>
          <WarmthIndicator>
            <TemperatureIcon>{getTemperatureEmoji(warmthLevel)}</TemperatureIcon>
            <span>{warmthLevel}%</span>
          </WarmthIndicator>
        </ScreenHeader>

        <ScreenContent>
          <CorrectWarmFeedback warmthLevel={warmthLevel} />

          <ProblemDisplay
            problem={problem}
            currentAnswer={currentAnswer}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSubmit}
            warmthLevel={warmthLevel}
          />
        </ScreenContent>
      </PhoneScreen>
    </PhoneContainer>
  );
};

export default VirtualPhone;
