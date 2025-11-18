import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import QuizList from './components/Quiz/QuizList';
import QuizTaking from './components/Quiz/QuizTaking';
import QuizResults from './components/Quiz/QuizResults';
import FocusSettings from './components/Settings/FocusSettings';
import { Quiz, FocusSettings as FocusSettingsType } from './types';
import { quizApi, focusApi } from './services/api';

type AppView = 'list' | 'taking' | 'results';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('list');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [completedAttemptId, setCompletedAttemptId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [focusSettings, setFocusSettings] = useState<FocusSettingsType>({
    blur_intensity: 5,
    dim_opacity: 70,
    hide_timer: false,
    hide_score: false,
    hide_navigation: false,
    fullscreen_mode: true,
    sound_enabled: false,
    theme: 'auto'
  });

  // 데모용 사용자 ID (실제로는 로그인 시스템에서 가져와야 함)
  const userId = 2;

  useEffect(() => {
    loadFocusSettings();
  }, []);

  const loadFocusSettings = async () => {
    try {
      const response = await focusApi.getSettings(userId);
      setFocusSettings(response.data);
    } catch (error) {
      console.error('Failed to load focus settings:', error);
    }
  };

  const handleSelectQuiz = async (quiz: Quiz) => {
    try {
      const response = await quizApi.getById(quiz.id);
      setSelectedQuiz(response.data);
      setView('taking');
    } catch (error) {
      console.error('Failed to load quiz:', error);
      alert('퀴즈를 불러올 수 없습니다.');
    }
  };

  const handleQuizComplete = (attemptId: number) => {
    setCompletedAttemptId(attemptId);
    setView('results');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedQuiz(null);
    setCompletedAttemptId(null);
  };

  const handleExitQuiz = () => {
    if (window.confirm('퀴즈를 종료하시겠습니까? 진행 상황이 저장됩니다.')) {
      handleBackToList();
    }
  };

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Navbar>
          <NavBrand onClick={handleBackToList}>
            <Logo>🎓</Logo>
            <BrandText>LMS Focus Mode</BrandText>
          </NavBrand>
          <NavActions>
            <NavButton onClick={() => setShowSettings(true)}>
              ⚙️ 설정
            </NavButton>
            <UserInfo>
              <UserAvatar>👤</UserAvatar>
              <UserName>학생</UserName>
            </UserInfo>
          </NavActions>
        </Navbar>

        <MainContent>
          {view === 'list' && (
            <QuizList onSelectQuiz={handleSelectQuiz} />
          )}

          {view === 'taking' && selectedQuiz && (
            <QuizTaking
              quiz={selectedQuiz}
              userId={userId}
              focusSettings={focusSettings}
              onComplete={handleQuizComplete}
              onExit={handleExitQuiz}
            />
          )}

          {view === 'results' && completedAttemptId && (
            <QuizResults
              attemptId={completedAttemptId}
              onBackToList={handleBackToList}
            />
          )}
        </MainContent>

        {showSettings && (
          <FocusSettings
            userId={userId}
            onClose={() => {
              setShowSettings(false);
              loadFocusSettings(); // Reload settings after closing
            }}
          />
        )}
      </AppContainer>
    </>
  );
};

export default App;

// Global Styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }
`;

// Styled Components
const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Navbar = styled.nav`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.05);
  }
`;

const Logo = styled.div`
  font-size: 2rem;
`;

const BrandText = styled.h1`
  font-size: 1.5rem;
  color: #333;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const NavButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border-radius: 20px;
`;

const UserAvatar = styled.div`
  font-size: 1.5rem;
`;

const UserName = styled.span`
  color: #333;
  font-weight: 600;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem 0;
`;
