import React from 'react';
import styled, { keyframes } from 'styled-components';

interface VirtualPhoneProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const slideIn = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const PhoneContainer = styled.div<{ position: string }>`
  position: fixed;
  ${({ position }) => {
    switch (position) {
      case 'top-left':
        return 'top: 20px; left: 20px;';
      case 'top-right':
        return 'top: 20px; right: 20px;';
      case 'bottom-left':
        return 'bottom: 20px; left: 20px;';
      case 'bottom-right':
      default:
        return 'bottom: 20px; right: 20px;';
    }
  }}
  z-index: 1000;
  animation: ${slideIn} 0.5s ease-out;
`;

const PhoneFrame = styled.div`
  width: 375px;
  height: 667px;
  background: linear-gradient(145deg, #1a1a1a, #000000);
  border-radius: 30px;
  padding: 10px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  display: flex;
  flex-direction: column;
  position: relative;

  /* iPhone-style notch */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 150px;
    height: 20px;
    background: #000;
    border-radius: 0 0 15px 15px;
    z-index: 2;
  }

  /* Speaker */
  &::after {
    content: '';
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 5px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    z-index: 3;
  }
`;

const PhoneScreen = styled.div`
  flex: 1;
  background: #ffffff;
  border-radius: 22px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const StatusBar = styled.div`
  height: 30px;
  background: linear-gradient(180deg, #f8f8f8 0%, #ffffff 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  font-size: 11px;
  color: #000;
  font-weight: 500;
  border-bottom: 1px solid #e0e0e0;
  z-index: 1;
`;

const StatusTime = styled.span`
  font-weight: 600;
`;

const StatusIcons = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const ScreenContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: #ffffff;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const NavigationBar = styled.div`
  height: 50px;
  background: #f8f8f8;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px solid #e0e0e0;

  /* Home indicator (iPhone style) */
  &::before {
    content: '';
    width: 120px;
    height: 4px;
    background: #000;
    border-radius: 2px;
    opacity: 0.3;
  }
`;

const PhoneBrand = styled.div`
  position: absolute;
  bottom: -15px;
  right: 10px;
  font-size: 10px;
  color: #666;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const VirtualPhone: React.FC<VirtualPhoneProps> = ({
  children,
  position = 'bottom-right',
}) => {
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <PhoneContainer position={position}>
      <PhoneFrame>
        <PhoneScreen>
          <StatusBar>
            <StatusTime>{getCurrentTime()}</StatusTime>
            <StatusIcons>
              <span>📶</span>
              <span>📡</span>
              <span>🔋</span>
            </StatusIcons>
          </StatusBar>
          <ScreenContent>{children}</ScreenContent>
          <NavigationBar />
        </PhoneScreen>
        <PhoneBrand>ALT42</PhoneBrand>
      </PhoneFrame>
    </PhoneContainer>
  );
};

export default VirtualPhone;
