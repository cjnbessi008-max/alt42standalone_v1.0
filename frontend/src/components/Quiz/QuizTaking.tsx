import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Quiz, Question, QuizAttempt, FocusSettings } from '../../types';
import { quizApi } from '../../services/api';
import FocusMode from '../FocusMode/FocusMode';

interface QuizTakingProps {
  quiz: Quiz;
  userId: number;
  focusSettings: FocusSettings;
  onComplete: (attemptId: number) => void;
  onExit: () => void;
}

const QuizTaking: React.FC<QuizTakingProps> = ({
  quiz,
  userId,
  focusSettings,
  onComplete,
  onExit
}) => {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    startQuiz();
  }, []);

  useEffect(() => {
    if (quiz.time_limit && timeRemaining === null) {
      setTimeRemaining(quiz.time_limit);
    }
  }, [quiz]);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const startQuiz = async () => {
    try {
      const response = await quizApi.startAttempt(quiz.id, userId);
      setAttempt(response.data);
    } catch (error) {
      console.error('Failed to start quiz:', error);
      alert('퀴즈를 시작할 수 없습니다.');
    }
  };

  const handleAnswerSelect = async (questionId: number, optionId: number) => {
    if (!attempt) return;

    const newAnswers = new Map(selectedAnswers);
    newAnswers.set(questionId, optionId);
    setSelectedAnswers(newAnswers);

    try {
      await quizApi.submitAnswer(attempt.id, questionId, optionId);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < (quiz.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!attempt) return;

    if (window.confirm('퀴즈를 제출하시겠습니까?')) {
      try {
        await quizApi.completeAttempt(attempt.id);
        onComplete(attempt.id);
      } catch (error) {
        console.error('Failed to complete quiz:', error);
        alert('퀴즈 제출에 실패했습니다.');
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quiz.questions || quiz.questions.length === 0) {
    return <Message>문제가 없습니다.</Message>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <FocusMode settings={focusSettings} isActive={isFocusMode}>
      <QuizContainer>
        {!focusSettings.hide_navigation && (
          <Header>
            <QuizTitle>{quiz.title}</QuizTitle>
            <HeaderActions>
              <FocusModeButton onClick={() => setIsFocusMode(!isFocusMode)}>
                {isFocusMode ? '🎯 집중 모드 ON' : '⚪ 집중 모드 OFF'}
              </FocusModeButton>
              <ExitButton onClick={onExit}>나가기</ExitButton>
            </HeaderActions>
          </Header>
        )}

        {!focusSettings.hide_timer && timeRemaining !== null && (
          <TimerBar $warning={timeRemaining < 60}>
            <TimerText>남은 시간: {formatTime(timeRemaining)}</TimerText>
          </TimerBar>
        )}

        {!focusSettings.hide_score && (
          <ProgressBar>
            <ProgressFill $progress={progress} />
            <ProgressText>
              문제 {currentQuestionIndex + 1} / {quiz.questions.length}
            </ProgressText>
          </ProgressBar>
        )}

        <QuestionCard>
          <QuestionNumber>문제 {currentQuestionIndex + 1}</QuestionNumber>
          <QuestionText>{currentQuestion.question_text}</QuestionText>

          <OptionsContainer>
            {currentQuestion.options?.map(option => (
              <OptionButton
                key={option.id}
                $selected={selectedAnswers.get(currentQuestion.id) === option.id}
                onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
              >
                <OptionRadio $selected={selectedAnswers.get(currentQuestion.id) === option.id} />
                <OptionText>{option.option_text}</OptionText>
              </OptionButton>
            ))}
          </OptionsContainer>
        </QuestionCard>

        <Navigation>
          <NavButton
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            ← 이전
          </NavButton>

          <SubmitButton onClick={handleSubmitQuiz}>
            제출하기
          </SubmitButton>

          <NavButton
            onClick={handleNext}
            disabled={currentQuestionIndex === quiz.questions.length - 1}
          >
            다음 →
          </NavButton>
        </Navigation>
      </QuizContainer>
    </FocusMode>
  );
};

export default QuizTaking;

// Styled Components
const QuizContainer = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
`;

const QuizTitle = styled.h1`
  font-size: 1.8rem;
  color: #333;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const FocusModeButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ExitButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: #d32f2f;
  }
`;

const TimerBar = styled.div<{ $warning: boolean }>`
  background: ${props => props.$warning ? '#ff5722' : '#2196f3'};
  color: white;
  padding: 0.8rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  animation: ${props => props.$warning ? 'pulse 1s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const TimerText = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
`;

const ProgressBar = styled.div`
  position: relative;
  height: 40px;
  background: #f0f0f0;
  border-radius: 20px;
  margin-bottom: 2rem;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  color: #333;
`;

const QuestionCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const QuestionNumber = styled.div`
  color: #666;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`;

const QuestionText = styled.h2`
  font-size: 1.5rem;
  color: #222;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OptionButton = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  padding: 1.2rem;
  background: ${props => props.$selected ? '#e3f2fd' : '#fafafa'};
  border: 2px solid ${props => props.$selected ? '#2196f3' : '#e0e0e0'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;

  &:hover {
    background: ${props => props.$selected ? '#e3f2fd' : '#f0f0f0'};
    border-color: ${props => props.$selected ? '#2196f3' : '#bdbdbd'};
    transform: translateX(4px);
  }
`;

const OptionRadio = styled.div<{ $selected: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid ${props => props.$selected ? '#2196f3' : '#bdbdbd'};
  background: ${props => props.$selected ? '#2196f3' : 'white'};
  margin-right: 1rem;
  flex-shrink: 0;
  position: relative;

  ${props => props.$selected && `
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: white;
    }
  `}
`;

const OptionText = styled.span`
  font-size: 1.1rem;
  color: #333;
`;

const Navigation = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const NavButton = styled.button`
  padding: 0.8rem 1.5rem;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #e0e0e0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  padding: 0.8rem 2rem;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

const Message = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #666;
`;
