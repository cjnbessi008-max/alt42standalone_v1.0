import React from 'react';
import styled from 'styled-components';
import { FaCalculator } from 'react-icons/fa';

const HeaderContainer = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 15px 30px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: bold;
`;

const StudentInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 14px;
`;

const StudentName = styled.div`
  font-weight: 600;
`;

const Label = styled.div`
  opacity: 0.8;
  font-size: 12px;
`;

function Header({ studentName }) {
  return (
    <HeaderContainer>
      <Logo>
        <FaCalculator />
        <span>Alt42 방정식 풀이</span>
      </Logo>
      <StudentInfo>
        <Label>학습자</Label>
        <StudentName>{studentName}</StudentName>
      </StudentInfo>
    </HeaderContainer>
  );
}

export default Header;
