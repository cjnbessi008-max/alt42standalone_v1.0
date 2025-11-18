import React, { useState } from 'react';
import styled from 'styled-components';

const ProblemContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  margin-top: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
`;

const ProblemTitle = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ProblemQuestion = styled.div`
  font-size: 2rem;
  font-weight: 600;
  color: #1976d2;
  text-align: center;
  padding: 30px;
  background: #f5f5f5;
  border-radius: 15px;
  margin: 20px 0;
  font-family: 'Courier New', monospace;
`;

const AnswerInput = styled.input`
  width: 100%;
  padding: 15px 20px;
  font-size: 1.3rem;
  border: 3px solid #e0e0e0;
  border-radius: 12px;
  margin: 20px 0;
  text-align: center;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;

  &:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.1);
  }

  &::placeholder {
    color: #bdbdbd;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #bdbdbd;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const HintBox = styled.div`
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  padding: 15px;
  margin-top: 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #e65100;
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #757575;
  font-size: 1.1rem;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px dashed #e0e0e0;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;

  .label {
    font-size: 0.8rem;
    color: #757575;
    margin-bottom: 5px;
  }

  .value {
    font-size: 1.2rem;
    font-weight: 600;
    color: #333;
  }
`;

const ProblemDisplay = ({ problem, currentAnswer, onAnswerChange, onSubmit, warmthLevel }) => {
  const [attempts, setAttempts] = useState(0);

  if (!problem) {
    return (
      <ProblemContainer>
        <NoDataMessage>
          📚 문제를 불러와주세요<br/>
          <small style={{ fontSize: '0.9rem', marginTop: '10px', display: 'block' }}>
            상단의 "새 문제 불러오기" 버튼을 클릭하세요
          </small>
        </NoDataMessage>
      </ProblemContainer>
    );
  }

  const handleSubmit = () => {
    if (!currentAnswer.trim()) return;

    setAttempts(prev => prev + 1);
    if (onSubmit) {
      onSubmit(currentAnswer);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const getHint = () => {
    if (warmthLevel === 0) {
      return '💡 힌트: 문제를 풀어보세요!';
    } else if (warmthLevel < 30) {
      return '💡 힌트: 다시 한번 생각해보세요. 방향이 조금 다른 것 같아요.';
    } else if (warmthLevel < 50) {
      return '💡 힌트: 좋아요! 방향은 맞는 것 같아요. 조금만 더!';
    } else if (warmthLevel < 70) {
      return '💡 힌트: 훌륭해요! 거의 다 왔어요!';
    } else if (warmthLevel < 90) {
      return '🎉 힌트: 아주 좋아요! 거의 정답이에요!';
    } else {
      return '⭐ 완벽해요! 정답입니다!';
    }
  };

  return (
    <ProblemContainer>
      <ProblemTitle>
        <span>📝</span>
        <span>{problem.title || '문제'}</span>
      </ProblemTitle>

      <ProblemQuestion>
        {problem.question}
      </ProblemQuestion>

      <AnswerInput
        type="text"
        value={currentAnswer}
        onChange={(e) => onAnswerChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="답을 입력하세요 (예: 3/4)"
      />

      <SubmitButton
        onClick={handleSubmit}
        disabled={!currentAnswer.trim()}
      >
        {warmthLevel >= 90 ? '✓ 정답 확인됨!' : '제출하기'}
      </SubmitButton>

      <HintBox>
        {getHint()}
      </HintBox>

      <StatsContainer>
        <StatItem>
          <div className="label">시도 횟수</div>
          <div className="value">{attempts}</div>
        </StatItem>
        <StatItem>
          <div className="label">정확도</div>
          <div className="value">{warmthLevel}%</div>
        </StatItem>
      </StatsContainer>
    </ProblemContainer>
  );
};

export default ProblemDisplay;
