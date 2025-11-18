interface Question {
  id: number;
  questionNumber: number;
  questionText: string;
  questionType: string;
}

interface Props {
  question: Question;
  userAnswer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onClick: () => void;
}

export default function QuestionCard({
  question,
  userAnswer,
  onAnswerChange,
  onSubmit,
  onClick,
}: Props) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="card" onClick={onClick}>
      <div className="mb-4">
        <span className="text-sm text-gray-600">문제 {question.questionNumber}</span>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        {question.questionText}
      </h2>

      <div className="mb-6">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="input text-center text-2xl font-bold"
          placeholder="답을 입력하세요"
          autoFocus
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!userAnswer.trim()}
        className="btn btn-primary w-full text-lg py-3"
      >
        제출하기
      </button>

      <p className="text-sm text-gray-500 text-center mt-4">
        💡 팁: Enter 키를 눌러도 제출할 수 있습니다
      </p>
    </div>
  );
}
