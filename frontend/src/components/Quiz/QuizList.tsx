import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Quiz } from '../../types';
import { quizApi } from '../../services/api';

interface QuizListProps {
  onSelectQuiz: (quiz: Quiz) => void;
}

const QuizList: React.FC<QuizListProps> = ({ onSelectQuiz }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const response = await quizApi.getAll();
      setQuizzes(response.data);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | null): string => {
    if (!seconds) return '제한 없음';
    const mins = Math.floor(seconds / 60);
    return `${mins}분`;
  };

  if (loading) {
    return <LoadingMessage>로딩 중...</LoadingMessage>;
  }

  return (
    <Container>
      <Header>
        <Title>📚 퀴즈 목록</Title>
        <Subtitle>원하는 퀴즈를 선택하여 시작하세요</Subtitle>
      </Header>

      <QuizGrid>
        {quizzes.map(quiz => (
          <QuizCard key={quiz.id} onClick={() => onSelectQuiz(quiz)}>
            <QuizHeader>
              <QuizTitle>{quiz.title}</QuizTitle>
              <QuizBadge>{quiz.question_count || 0}문제</QuizBadge>
            </QuizHeader>

            <QuizDescription>{quiz.description}</QuizDescription>

            <QuizMeta>
              <MetaItem>
                <MetaIcon>⏱️</MetaIcon>
                <MetaText>{formatTime(quiz.time_limit)}</MetaText>
              </MetaItem>
              <MetaItem>
                <MetaIcon>🎯</MetaIcon>
                <MetaText>합격: {quiz.passing_score}%</MetaText>
              </MetaItem>
              <MetaItem>
                <MetaIcon>👤</MetaIcon>
                <MetaText>{quiz.creator_name || '관리자'}</MetaText>
              </MetaItem>
            </QuizMeta>

            <StartButton>시작하기 →</StartButton>
          </QuizCard>
        ))}
      </QuizGrid>

      {quizzes.length === 0 && (
        <EmptyMessage>
          <EmptyIcon>📝</EmptyIcon>
          <EmptyText>등록된 퀴즈가 없습니다</EmptyText>
        </EmptyMessage>
      )}
    </Container>
  );
};

export default QuizList;

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #666;
`;

const QuizGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
`;

const QuizCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
  }
`;

const QuizHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const QuizTitle = styled.h2`
  font-size: 1.5rem;
  color: #222;
  margin: 0;
  flex: 1;
`;

const QuizBadge = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
`;

const QuizDescription = styled.p`
  color: #666;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  min-height: 3rem;
`;

const QuizMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const MetaIcon = styled.span`
  font-size: 1.1rem;
`;

const MetaText = styled.span`
  color: #666;
  font-size: 0.9rem;
`;

const StartButton = styled.button`
  width: 100%;
  padding: 0.9rem;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem;
  font-size: 1.3rem;
  color: #666;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 4rem;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyText = styled.div`
  font-size: 1.2rem;
  color: #999;
`;
