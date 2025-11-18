import { useState } from 'react';
import { motion } from 'framer-motion';
import ProblemSolver from './components/ProblemSolver';
import MoodResetAnimation from './components/MoodResetAnimation';
import ProgressBar from './components/ProgressBar';
import { sampleProblems } from './data/problems';
import { UserProgress } from './types';

function App() {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [solvedProblems, setSolvedProblems] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const progress: UserProgress = {
    totalProblems: sampleProblems.length,
    solvedProblems,
    currentProblemIndex
  };

  const handleCorrectAnswer = () => {
    setShowAnimation(true);
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setSolvedProblems(prev => prev + 1);

    // Move to next problem or show completion
    if (currentProblemIndex < sampleProblems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleWrongAnswer = () => {
    // Could add logic for wrong answers (e.g., track attempts)
    console.log('Wrong answer - try again!');
  };

  const handleRestart = () => {
    setCurrentProblemIndex(0);
    setSolvedProblems(0);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            backgroundColor: '#fff',
            borderRadius: '20px',
            padding: '60px 40px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '600px'
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{ fontSize: '100px', marginBottom: '20px' }}
          >
            🎊
          </motion.div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#2D3748',
            marginBottom: '16px'
          }}>
            모든 문제를 완료했습니다!
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#718096',
            marginBottom: '40px'
          }}>
            총 {sampleProblems.length}개의 문제를 모두 풀었어요. 정말 잘했어요! 🌟
          </p>
          <motion.button
            onClick={handleRestart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '16px 40px',
              fontSize: '18px',
              fontWeight: '700',
              color: '#fff',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            다시 시작하기
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      padding: '20px'
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}
      >
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '10px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
        }}>
          수학 문제 풀이 📚
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.9)'
        }}>
          문제를 풀고 기분을 리셋해보세요!
        </p>
      </motion.div>

      {/* Progress Bar */}
      <ProgressBar progress={progress} />

      {/* Problem Solver */}
      <ProblemSolver
        key={currentProblemIndex}
        problem={sampleProblems[currentProblemIndex]}
        onCorrectAnswer={handleCorrectAnswer}
        onWrongAnswer={handleWrongAnswer}
      />

      {/* Mood Reset Animation */}
      <MoodResetAnimation
        show={showAnimation}
        onComplete={handleAnimationComplete}
      />
    </div>
  );
}

export default App;
