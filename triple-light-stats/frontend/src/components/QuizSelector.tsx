import React from 'react';
import './QuizSelector.css';
import type { Quiz } from '../types';

interface QuizSelectorProps {
  quizzes: Quiz[];
  selectedQuizId: number | null;
  onSelect: (quizId: number) => void;
  loading: boolean;
}

const QuizSelector: React.FC<QuizSelectorProps> = ({
  quizzes,
  selectedQuizId,
  onSelect,
  loading
}) => {
  return (
    <div className="quiz-selector">
      <label htmlFor="quiz-select">퀴즈 선택:</label>
      <select
        id="quiz-select"
        value={selectedQuizId || ''}
        onChange={(e) => onSelect(Number(e.target.value))}
        disabled={loading || quizzes.length === 0}
      >
        <option value="">-- 퀴즈를 선택하세요 --</option>
        {quizzes.map((quiz) => (
          <option key={quiz.id} value={quiz.id}>
            {quiz.name} ({quiz.attemptCount}명)
          </option>
        ))}
      </select>
    </div>
  );
};

export default QuizSelector;
