import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SmartphoneFrame from './components/SmartphoneFrame';
import EquationSolver from './components/EquationSolver';
import { problemsAPI } from './services/api';
import { ProblemWithHints } from './types';

function App() {
  const [problems, setProblems] = useState<ProblemWithHints[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [studentId] = useState<number>(3); // Default student ID for demo
  const [showResults, setShowResults] = useState<boolean>(false);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [solvedCount, setSolvedCount] = useState<number>(0);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const problemsList = await problemsAPI.getAll({ active: true });

      // Load hints for each problem
      const problemsWithHints = await Promise.all(
        problemsList.map(async (p) => {
          const withHints = await problemsAPI.getWithHints(p.id);
          return withHints || p;
        })
      );

      setProblems(problemsWithHints);
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProblemComplete = (success: boolean, score: number) => {
    if (success) {
      setTotalScore((prev) => prev + score);
      setSolvedCount((prev) => prev + 1);
    }

    // Move to next problem
    if (currentProblemIndex < problems.length - 1) {
      setTimeout(() => {
        setCurrentProblemIndex((prev) => prev + 1);
      }, 2000);
    } else {
      // Show results
      setTimeout(() => {
        setShowResults(true);
      }, 2000);
    }
  };

  const handleRestart = () => {
    setCurrentProblemIndex(0);
    setTotalScore(0);
    setSolvedCount(0);
    setShowResults(false);
  };

  const handleSelectProblem = (index: number) => {
    setCurrentProblemIndex(index);
    setShowResults(false);
  };

  if (loading) {
    return (
      <AppContainer>
        <LoadingScreen>
          <LoadingSpinner />
          <LoadingText>문제를 불러오는 중...</LoadingText>
        </LoadingScreen>
      </AppContainer>
    );
  }

  if (problems.length === 0) {
    return (
      <AppContainer>
        <ErrorScreen>
          <ErrorText>문제를 찾을 수 없습니다.</ErrorText>
          <ErrorSubText>데이터베이스에 문제를 추가해주세요.</ErrorSubText>
        </ErrorScreen>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Header>
        <Logo>⚖️ Balance Machine</Logo>
        <Stats>
          <StatItem>
            문제: {currentProblemIndex + 1} / {problems.length}
          </StatItem>
          <StatItem>해결: {solvedCount}</StatItem>
          <StatItem>점수: {totalScore.toFixed(0)}</StatItem>
        </Stats>
      </Header>

      <MainContent>
        <ProblemListSection>
          <ProblemListTitle>문제 목록</ProblemListTitle>
          <ProblemList>
            {problems.map((problem, index) => (
              <ProblemCard
                key={problem.id}
                active={index === currentProblemIndex}
                onClick={() => handleSelectProblem(index)}
              >
                <ProblemNumber>{index + 1}</ProblemNumber>
                <ProblemInfo>
                  <ProblemTitle>{problem.title}</ProblemTitle>
                  <ProblemDifficulty>
                    {'⭐'.repeat(problem.difficulty_level)}
                  </ProblemDifficulty>
                </ProblemInfo>
              </ProblemCard>
            ))}
          </ProblemList>
        </ProblemListSection>

        <SmartphoneFrame position="bottom-right">
          {showResults ? (
            <ResultsScreen>
              <ResultsTitle>🎉 완료!</ResultsTitle>
              <ResultsStats>
                <ResultStat>
                  <ResultLabel>해결한 문제</ResultLabel>
                  <ResultValue>{solvedCount} / {problems.length}</ResultValue>
                </ResultStat>
                <ResultStat>
                  <ResultLabel>총 점수</ResultLabel>
                  <ResultValue>{totalScore.toFixed(0)}점</ResultValue>
                </ResultStat>
                <ResultStat>
                  <ResultLabel>평균 점수</ResultLabel>
                  <ResultValue>
                    {solvedCount > 0 ? (totalScore / solvedCount).toFixed(0) : 0}점
                  </ResultValue>
                </ResultStat>
              </ResultsStats>
              <RestartButton onClick={handleRestart}>
                🔄 다시 시작
              </RestartButton>
            </ResultsScreen>
          ) : (
            <EquationSolver
              problem={problems[currentProblemIndex]}
              studentId={studentId}
              onComplete={handleProblemComplete}
            />
          )}
        </SmartphoneFrame>
      </MainContent>
    </AppContainer>
  );
}

export default App;

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  margin-bottom: 20px;
`;

const Logo = styled.h1`
  font-size: 32px;
  color: white;
  margin: 0;
`;

const Stats = styled.div`
  display: flex;
  gap: 20px;
`;

const StatItem = styled.div`
  color: white;
  font-size: 18px;
  font-weight: 500;
`;

const MainContent = styled.main`
  display: flex;
  gap: 20px;
  align-items: flex-start;
`;

const ProblemListSection = styled.section`
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ProblemListTitle = styled.h2`
  font-size: 24px;
  color: #2c3e50;
  margin-bottom: 15px;
`;

const ProblemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ProblemCard = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  padding: 15px;
  background: ${({ active }) =>
    active
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'white'};
  color: ${({ active }) => (active ? 'white' : '#2c3e50')};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const ProblemNumber = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  margin-right: 15px;
`;

const ProblemInfo = styled.div`
  flex: 1;
`;

const ProblemTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 5px;
`;

const ProblemDifficulty = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 6px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color: white;
  font-size: 24px;
  margin-top: 20px;
`;

const ErrorScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const ErrorText = styled.div`
  color: white;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const ErrorSubText = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
`;

const ResultsScreen = styled.div`
  padding: 40px 20px;
  text-align: center;
`;

const ResultsTitle = styled.h2`
  font-size: 36px;
  color: #2c3e50;
  margin-bottom: 30px;
`;

const ResultsStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
`;

const ResultStat = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
`;

const ResultLabel = styled.div`
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 5px;
`;

const ResultValue = styled.div`
  font-size: 32px;
  font-weight: bold;
`;

const RestartButton = styled.button`
  padding: 15px 30px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;
