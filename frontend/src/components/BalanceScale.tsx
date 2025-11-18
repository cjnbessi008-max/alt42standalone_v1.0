import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface BalanceScaleProps {
  leftSide: string;
  rightSide: string;
  isBalanced?: boolean;
}

const BalanceScale: React.FC<BalanceScaleProps> = ({
  leftSide,
  rightSide,
  isBalanced = true,
}) => {
  // Calculate tilt angle based on balance
  const tiltAngle = isBalanced ? 0 : 5;

  return (
    <ScaleContainer>
      <BeamContainer
        animate={{ rotate: tiltAngle }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        {/* Left Pan */}
        <Pan position="left">
          <PanContent>{leftSide}</PanContent>
        </Pan>

        {/* Center Fulcrum */}
        <Fulcrum />

        {/* Right Pan */}
        <Pan position="right">
          <PanContent>{rightSide}</PanContent>
        </Pan>

        {/* Beam */}
        <Beam />
      </BeamContainer>

      {/* Equals Sign */}
      <EqualsSign>=</EqualsSign>

      {/* Base */}
      <Base />
    </ScaleContainer>
  );
};

export default BalanceScale;

const ScaleContainer = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
`;

const BeamContainer = styled(motion.div)`
  position: relative;
  width: 400px;
  height: 200px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const Beam = styled.div`
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 8px;
  background: linear-gradient(to bottom, #8b7355, #6b5d4f);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
`;

const Fulcrum = styled.div`
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-bottom: 40px solid #555;
  z-index: 2;
`;

const Pan = styled.div<{ position: 'left' | 'right' }>`
  position: absolute;
  top: 0;
  ${({ position }) => (position === 'left' ? 'left: 20px' : 'right: 20px')};
  width: 140px;
  height: 100px;
  background: linear-gradient(to bottom, #f0f0f0, #d0d0d0);
  border: 3px solid #999;
  border-radius: 0 0 60px 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 3;

  &::before {
    content: '';
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 20px;
    background: #666;
  }
`;

const PanContent = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  padding: 10px;
  user-select: none;
`;

const EqualsSign = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: bold;
  color: #ff6b6b;
  z-index: 10;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
`;

const Base = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 60px;
  background: linear-gradient(to bottom, #555, #333);
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 0;

  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 10px;
    background: #222;
    border-radius: 50%;
  }
`;
