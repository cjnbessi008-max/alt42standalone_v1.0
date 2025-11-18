import { useState, useEffect } from 'react';
import { useExamStore } from './store/examStore';
import ExamSetupScreen from './screens/ExamSetupScreen';
import ExamRoundScreen from './screens/ExamRoundScreen';
import ExamReviewScreen from './screens/ExamReviewScreen';

type Screen = 'setup' | 'exam' | 'review';

function App() {
  const currentSession = useExamStore((state) => state.currentSession);
  const [currentScreen, setCurrentScreen] = useState<Screen>('setup');

  // 세션 상태에 따라 화면 자동 전환
  useEffect(() => {
    if (!currentSession) {
      setCurrentScreen('setup');
    } else if (currentSession.status === 'in_progress') {
      setCurrentScreen('exam');
    } else if (currentSession.status === 'completed') {
      setCurrentScreen('review');
    }
  }, [currentSession]);

  const handleStartExam = () => {
    setCurrentScreen('exam');
  };

  const handleCompleteExam = () => {
    setCurrentScreen('review');
  };

  const handleRestart = () => {
    setCurrentScreen('setup');
  };

  return (
    <div className="min-h-screen">
      {currentScreen === 'setup' && <ExamSetupScreen onStart={handleStartExam} />}
      {currentScreen === 'exam' && <ExamRoundScreen onComplete={handleCompleteExam} />}
      {currentScreen === 'review' && <ExamReviewScreen onRestart={handleRestart} />}
    </div>
  );
}

export default App;
