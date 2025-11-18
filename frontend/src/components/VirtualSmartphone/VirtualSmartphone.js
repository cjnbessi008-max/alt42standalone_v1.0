import React from 'react';
import styled from 'styled-components';
import EquationSolver from './EquationSolver';

const PhoneContainer = styled.div`
  width: 375px;
  height: 667px;
  background: #000;
  border-radius: 40px;
  padding: 15px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 375px;
    height: auto;
    min-height: 500px;
  }
`;

const PhoneScreen = styled.div`
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 30px;
  overflow: hidden;
  position: relative;
`;

const Notch = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 150px;
  height: 25px;
  background: #000;
  border-radius: 0 0 20px 20px;
  z-index: 10;
`;

const ScreenContent = styled.div`
  width: 100%;
  height: 100%;
  padding-top: 30px;
  overflow-y: auto;
`;

const VirtualSmartphone = ({ studentId, studentName }) => {
  return (
    <PhoneContainer>
      <PhoneScreen>
        <Notch />
        <ScreenContent>
          <EquationSolver studentId={studentId} studentName={studentName} />
        </ScreenContent>
      </PhoneScreen>
    </PhoneContainer>
  );
};

export default VirtualSmartphone;
