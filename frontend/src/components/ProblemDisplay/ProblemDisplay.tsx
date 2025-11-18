import React from 'react';
import styled from 'styled-components';
import { QuizProblem } from '../../types';
import TrapShadow from '../TrapShadow/TrapShadow';

interface ProblemDisplayProps {
  problem: QuizProblem;
  showTrapShadows?: boolean;
}

const Container = styled.div`
  padding: 20px;
  position: relative;
  min-height: 100%;
`;

const QuestionHeader = styled.div`
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
`;

const QuestionTitle = styled.h3`
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
  font-weight: 500;
`;

const QuestionText = styled.div`
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 20px;
  position: relative;

  /* Handle HTML content from Moodle */
  p {
    margin: 0 0 10px 0;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 10px 0;
  }

  code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
  }
`;

const AnswersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AnswerOption = styled.div<{ isCorrect?: boolean }>`
  padding: 12px 15px;
  background: ${({ isCorrect }) => (isCorrect ? '#f0f8ff' : '#ffffff')};
  border: 2px solid ${({ isCorrect }) => (isCorrect ? '#4a90e2' : '#e0e0e0')};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: #4a90e2;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
    transform: translateX(2px);
  }
`;

const AnswerText = styled.div`
  font-size: 14px;
  line-height: 1.5;
  color: #333;

  /* Handle HTML in answers */
  p {
    margin: 0;
  }
`;

const AnswerLabel = styled.span`
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #4a90e2;
  color: white;
  text-align: center;
  line-height: 24px;
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
`;

const TrapCounter = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #ff8c00, #ffa500);
  color: white;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 11px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(255, 140, 0, 0.3);
  z-index: 5;
`;

const NoTrapsMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
  font-style: italic;
`;

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  showTrapShadows = true,
}) => {
  const { question, answers, trapPoints } = problem;

  // Convert HTML entities and render HTML content safely
  const createMarkup = (html: string) => {
    return { __html: html };
  };

  return (
    <Container>
      {showTrapShadows && trapPoints.length > 0 && (
        <TrapCounter>
          🎯 함정 포인트: {trapPoints.length}개
        </TrapCounter>
      )}

      <QuestionHeader>
        <QuestionTitle>{question.name || '문제'}</QuestionTitle>
      </QuestionHeader>

      <QuestionText
        dangerouslySetInnerHTML={createMarkup(question.questiontext)}
      />

      <AnswersContainer>
        {answers.map((answer, index) => (
          <AnswerOption
            key={answer.id}
            isCorrect={answer.fraction > 0}
          >
            <AnswerLabel>
              {String.fromCharCode(65 + index)}
            </AnswerLabel>
            <AnswerText
              dangerouslySetInnerHTML={createMarkup(answer.answer)}
            />
          </AnswerOption>
        ))}
      </AnswersContainer>

      {/* Render trap shadows */}
      {showTrapShadows &&
        trapPoints.map((trapPoint) => (
          <TrapShadow
            key={trapPoint.id}
            trapPoint={trapPoint}
            onHover={(tp) => console.log('Trap hovered:', tp.description)}
            onClick={(tp) => console.log('Trap clicked:', tp.description)}
          />
        ))}

      {showTrapShadows && trapPoints.length === 0 && (
        <NoTrapsMessage>
          이 문제에는 함정 포인트가 없습니다.
        </NoTrapsMessage>
      )}
    </Container>
  );
};

export default ProblemDisplay;
