import { useState } from 'react';
import { motion } from 'framer-motion';
import { Problem } from '../types';

interface ProblemSolverProps {
  problem: Problem;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
}

const ProblemSolver: React.FC<ProblemSolverProps> = ({
  problem,
  onCorrectAnswer,
  onWrongAnswer
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleOptionClick = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;

    const correct = selectedOption === problem.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setTimeout(() => {
        onCorrectAnswer();
        resetState();
      }, 1500);
    }
  };

  const handleRetry = () => {
    resetState();
    onWrongAnswer();
  };

  const resetState = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        backgroundColor: '#fff',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        minHeight: '400px'
      }}
    >
      {/* Problem number */}
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#667eea',
        marginBottom: '20px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        문제 #{problem.id}
      </div>

      {/* Question */}
      <h2 style={{
        fontSize: '24px',
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: '30px',
        lineHeight: '1.4'
      }}>
        {problem.question}
      </h2>

      {/* Options */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '30px'
      }}>
        {problem.options.map((option, index) => (
          <motion.button
            key={index}
            onClick={() => handleOptionClick(index)}
            whileHover={{ scale: showFeedback ? 1 : 1.02 }}
            whileTap={{ scale: showFeedback ? 1 : 0.98 }}
            style={{
              padding: '18px 24px',
              fontSize: '16px',
              fontWeight: '500',
              textAlign: 'left',
              borderRadius: '12px',
              border: '2px solid',
              borderColor:
                showFeedback && index === problem.correctAnswer
                  ? '#48BB78'
                  : showFeedback && index === selectedOption && !isCorrect
                  ? '#F56565'
                  : selectedOption === index
                  ? '#667eea'
                  : '#E2E8F0',
              backgroundColor:
                showFeedback && index === problem.correctAnswer
                  ? '#F0FFF4'
                  : showFeedback && index === selectedOption && !isCorrect
                  ? '#FFF5F5'
                  : selectedOption === index
                  ? '#F7FAFC'
                  : '#fff',
              color:
                showFeedback && index === problem.correctAnswer
                  ? '#22543D'
                  : showFeedback && index === selectedOption && !isCorrect
                  ? '#742A2A'
                  : selectedOption === index
                  ? '#667eea'
                  : '#2D3748',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ marginRight: '12px', fontWeight: '700' }}>
              {String.fromCharCode(65 + index)}.
            </span>
            {option}
            {showFeedback && index === problem.correctAnswer && ' ✓'}
            {showFeedback && index === selectedOption && !isCorrect && ' ✗'}
          </motion.button>
        ))}
      </div>

      {/* Feedback message */}
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '20px',
            backgroundColor: isCorrect ? '#F0FFF4' : '#FFF5F5',
            border: `2px solid ${isCorrect ? '#48BB78' : '#F56565'}`,
            color: isCorrect ? '#22543D' : '#742A2A',
            fontSize: '15px',
            fontWeight: '500'
          }}
        >
          {isCorrect ? '정답입니다! 🎉' : '틀렸습니다. 다시 시도해보세요.'}
          {problem.explanation && isCorrect && (
            <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.9 }}>
              {problem.explanation}
            </div>
          )}
        </motion.div>
      )}

      {/* Submit button */}
      {!showFeedback ? (
        <motion.button
          onClick={handleSubmit}
          disabled={selectedOption === null}
          whileHover={{ scale: selectedOption !== null ? 1.05 : 1 }}
          whileTap={{ scale: selectedOption !== null ? 0.95 : 1 }}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '18px',
            fontWeight: '700',
            color: '#fff',
            background: selectedOption !== null
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : '#CBD5E0',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            boxShadow: selectedOption !== null
              ? '0 4px 15px rgba(102, 126, 234, 0.4)'
              : 'none'
          }}
        >
          정답 확인
        </motion.button>
      ) : !isCorrect && (
        <motion.button
          onClick={handleRetry}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '18px',
            fontWeight: '700',
            color: '#fff',
            background: 'linear-gradient(135deg, #F56565 0%, #C53030 100%)',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(245, 101, 101, 0.4)'
          }}
        >
          다시 시도
        </motion.button>
      )}
    </motion.div>
  );
};

export default ProblemSolver;
