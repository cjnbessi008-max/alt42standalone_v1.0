import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface SmartphoneFrameProps {
  children: ReactNode;
  position?: 'bottom-right' | 'center';
}

const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({
  children,
  position = 'bottom-right',
}) => {
  return (
    <PhoneContainer position={position}>
      <PhoneFrame>
        <PhoneNotch />
        <PhoneScreen>{children}</PhoneScreen>
        <PhoneButton />
      </PhoneFrame>
    </PhoneContainer>
  );
};

export default SmartphoneFrame;

const PhoneContainer = styled.div<{ position: string }>`
  position: ${({ position }) => (position === 'bottom-right' ? 'fixed' : 'relative')};
  ${({ position }) =>
    position === 'bottom-right'
      ? `
    bottom: 20px;
    right: 20px;
  `
      : `
    margin: 0 auto;
  `}
  z-index: 1000;
`;

const PhoneFrame = styled.div`
  position: relative;
  width: 375px;
  height: 667px;
  background: linear-gradient(to bottom, #2c3e50, #34495e);
  border-radius: 40px;
  padding: 15px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 2px #1a1a1a,
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 40px;
    padding: 2px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
`;

const PhoneNotch = styled.div`
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 150px;
  height: 25px;
  background: #1a1a1a;
  border-radius: 0 0 15px 15px;
  z-index: 10;

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 20px;
    width: 8px;
    height: 8px;
    background: #333;
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    top: 6px;
    right: 20px;
    width: 60px;
    height: 8px;
    background: #1a1a1a;
    border-radius: 4px;
  }
`;

const PhoneScreen = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
  border-radius: 28px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
`;

const PhoneButton = styled.div`
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 140px;
  height: 5px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  z-index: 10;
`;
