import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { QuizAttempt } from '../../types';
import { quizApi } from '../../services/api';

interface QuizResultsProps {
  attemptId: number;
  onBackToList: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ attemptId, onBackToList }) => {
  const [results, setResults] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [attemptId]);

  const loadResults = async () => {
    try {
      const response = await quizApi.getResults(attemptId);
      setResults(response.data);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingMessage>결과 불러오는 중...</LoadingMessage>;
  }

  if (!results) {
    return <ErrorMessage>결과를 불러올 수 없습니다.</ErrorMessage>;
  }

  const score = results.score || 0;
  const isPassed = score >= 70;

  return (
    <Container>
      <ResultCard>
        <ResultHeader $isPassed={isPassed}>
          <ResultIcon>{isPassed ? '🎉' : '📝'}</ResultIcon>
          <ResultTitle>{isPassed ? '합격!' : '불합격'}</ResultTitle>
          <ResultSubtitle>{results.quiz_title}</ResultSubtitle>
        </ResultHeader>

        <ScoreSection>
          <ScoreCircle $score={score}>
            <ScoreValue>{score.toFixed(1)}%</ScoreValue>
            <ScoreLabel>점수</ScoreLabel>
          </ScoreCircle>

          <ScoreDetails>
            <ScoreDetail>
              <DetailLabel>획득 점수</DetailLabel>
              <DetailValue>{results.earned_points} / {results.total_points}</DetailValue>
            </ScoreDetail>
            <ScoreDetail>
              <DetailLabel>정답률</DetailLabel>
              <DetailValue>
                {results.answers?.filter(a => a.is_correct).length || 0} / {results.answers?.length || 0}
              </DetailValue>
            </ScoreDetail>
          </ScoreDetails>
        </ScoreSection>

        {results.answers && results.answers.length > 0 && (
          <AnswersSection>
            <SectionTitle>답안 상세</SectionTitle>
            {results.answers.map((answer, index) => (
              <AnswerItem key={answer.id} $isCorrect={answer.is_correct}>
                <AnswerHeader>
                  <AnswerNumber>문제 {index + 1}</AnswerNumber>
                  <AnswerBadge $isCorrect={answer.is_correct}>
                    {answer.is_correct ? '✓ 정답' : '✗ 오답'}
                  </AnswerBadge>
                </AnswerHeader>

                <AnswerQuestion>{answer.question_text}</AnswerQuestion>

                <AnswerInfo>
                  <InfoRow>
                    <InfoLabel>선택한 답:</InfoLabel>
                    <InfoValue>{answer.selected_option_text || '미선택'}</InfoValue>
                  </InfoRow>
                  {!answer.is_correct && (
                    <InfoRow>
                      <InfoLabel>정답:</InfoLabel>
                      <InfoValue $correct>{answer.correct_answer}</InfoValue>
                    </InfoRow>
                  )}
                  <InfoRow>
                    <InfoLabel>획득 점수:</InfoLabel>
                    <InfoValue>{answer.points_earned} / {answer.max_points}</InfoValue>
                  </InfoRow>
                </AnswerInfo>
              </AnswerItem>
            ))}
          </AnswersSection>
        )}

        <ActionButtons>
          <BackButton onClick={onBackToList}>목록으로 돌아가기</BackButton>
        </ActionButtons>
      </ResultCard>
    </Container>
  );
};

export default QuizResults;

// Styled Components
const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
`;

const ResultCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ResultHeader = styled.div<{ $isPassed: boolean }>`
  background: ${props => props.$isPassed
    ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
    : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
  };
  color: white;
  padding: 3rem 2rem;
  text-align: center;
`;

const ResultIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const ResultTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
`;

const ResultSubtitle = styled.div`
  font-size: 1.2rem;
  opacity: 0.9;
`;

const ScoreSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  padding: 3rem 2rem;
  border-bottom: 1px solid #e0e0e0;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 2rem;
  }
`;

const ScoreCircle = styled.div<{ $score: number }>`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: conic-gradient(
    #4caf50 0%,
    #4caf50 ${props => props.$score}%,
    #e0e0e0 ${props => props.$score}%,
    #e0e0e0 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: white;
  }
`;

const ScoreValue = styled.div`
  position: relative;
  z-index: 1;
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
`;

const ScoreLabel = styled.div`
  position: relative;
  z-index: 1;
  font-size: 1rem;
  color: #666;
`;

const ScoreDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ScoreDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const DetailLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const DetailValue = styled.div`
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
`;

const AnswersSection = styled.div`
  padding: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1.5rem;
`;

const AnswerItem = styled.div<{ $isCorrect: boolean }>`
  background: ${props => props.$isCorrect ? '#f1f8f4' : '#fff3e0'};
  border-left: 4px solid ${props => props.$isCorrect ? '#4caf50' : '#ff9800'};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const AnswerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const AnswerNumber = styled.div`
  font-weight: bold;
  color: #666;
`;

const AnswerBadge = styled.span<{ $isCorrect: boolean }>`
  background: ${props => props.$isCorrect ? '#4caf50' : '#ff9800'};
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
`;

const AnswerQuestion = styled.div`
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const AnswerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 1rem;
`;

const InfoLabel = styled.span`
  color: #666;
  font-weight: 600;
  min-width: 100px;
`;

const InfoValue = styled.span<{ $correct?: boolean }>`
  color: ${props => props.$correct ? '#4caf50' : '#333'};
  font-weight: ${props => props.$correct ? 'bold' : 'normal'};
`;

const ActionButtons = styled.div`
  padding: 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem;
  font-size: 1.3rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 4rem;
  font-size: 1.2rem;
  color: #f44336;
`;
