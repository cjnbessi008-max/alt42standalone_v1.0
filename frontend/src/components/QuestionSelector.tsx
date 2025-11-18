import { Question } from '../../../shared/types';
import './QuestionSelector.css';

interface QuestionSelectorProps {
  questions: Question[];
  selectedQuestion: Question | null;
  onSelectQuestion: (question: Question) => void;
  loading: boolean;
}

function QuestionSelector({
  questions,
  selectedQuestion,
  onSelectQuestion,
  loading
}: QuestionSelectorProps) {
  if (loading) {
    return (
      <div className="question-selector loading">
        <div className="loader"></div>
        <p>문제를 불러오는 중...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="question-selector empty">
        <p>사용 가능한 문제가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="question-selector">
      <h2 className="selector-title">문제 선택</h2>
      <div className="questions-grid">
        {questions.map((question) => (
          <div
            key={question.id}
            className={`question-card ${
              selectedQuestion?.id === question.id ? 'selected' : ''
            }`}
            onClick={() => onSelectQuestion(question)}
          >
            <div className="card-header">
              <h3>{question.title}</h3>
              <div className="card-badges">
                <span className={`badge difficulty-${question.difficulty}`}>
                  {question.difficulty}
                </span>
              </div>
            </div>
            <p className="card-preview">
              {question.content.substring(0, 100)}
              {question.content.length > 100 ? '...' : ''}
            </p>
            <div className="card-footer">
              {question.metadata.tags?.map((tag, idx) => (
                <span key={idx} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuestionSelector;
