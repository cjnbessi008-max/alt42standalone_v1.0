import React, { useState, useEffect } from 'react';
import { Problem, InteractionData } from '@/types';
import { useAppStore } from '@/stores/appStore';
import MathematicalGarden from '../MathematicalGarden/MathematicalGarden';
import './ProblemView.css';

interface ProblemViewProps {
  problem: Problem;
}

const ProblemView: React.FC<ProblemViewProps> = ({ problem }) => {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    message: string;
  }>({ show: false, isCorrect: false, message: '' });
  const [interactionData, setInteractionData] = useState<InteractionData>({
    clicks: 0,
    drags: 0,
    hover_time: 0,
    custom_events: [],
  });
  const [startTime] = useState(Date.now());

  const { submitAnswer, loadProblem } = useAppStore();

  useEffect(() => {
    // Reset state when problem changes
    setAnswer('');
    setFeedback({ show: false, isCorrect: false, message: '' });
    setInteractionData({
      clicks: 0,
      drags: 0,
      hover_time: 0,
      custom_events: [],
    });
  }, [problem.id]);

  const handleObjectClick = (obj: any, index: number) => {
    setInteractionData((prev) => ({
      ...prev,
      clicks: (prev.clicks || 0) + 1,
      custom_events: [
        ...(prev.custom_events || []),
        {
          event_type: 'object_click',
          timestamp: Date.now(),
          data: { objectValue: obj.value, index },
        },
      ],
    }));
  };

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setFeedback({
        show: true,
        isCorrect: false,
        message: '답을 입력해주세요!',
      });
      return;
    }

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const isCorrect = await submitAnswer(answer, timeSpent, interactionData);

    setFeedback({
      show: true,
      isCorrect,
      message: isCorrect
        ? '정답입니다! 🎉'
        : `틀렸습니다. 정답은 ${problem.correct_answer}입니다.`,
    });

    // Load next problem after a delay
    if (isCorrect) {
      setTimeout(() => {
        loadProblem({
          difficulty_level: problem.difficulty_level,
          target_grade: problem.target_grade,
        });
      }, 2000);
    }
  };

  const handleNextProblem = () => {
    loadProblem({
      difficulty_level: problem.difficulty_level,
      target_grade: problem.target_grade,
    });
  };

  return (
    <div className="problem-view">
      {/* Problem Header */}
      <div className="problem-header">
        <div className="problem-title">{problem.title}</div>
        {problem.description && (
          <div className="problem-description">{problem.description}</div>
        )}
        <div className="problem-meta">
          <span className="badge difficulty-{problem.difficulty_level}">
            {problem.difficulty_level}
          </span>
          <span className="badge type-badge">{problem.problem_type}</span>
        </div>
      </div>

      {/* Garden Visualization */}
      <div className="garden-container">
        <MathematicalGarden
          numbers={problem.numbers}
          layout={problem.visualization_config?.layout || 'grid'}
          objectType={problem.visualization_config?.object_type || 'flower'}
          showLabels={problem.visualization_config?.show_labels !== false}
          animationType={problem.visualization_config?.animation_type || 'grow'}
          onObjectClick={handleObjectClick}
        />
      </div>

      {/* Answer Input */}
      <div className="answer-section">
        <input
          type="text"
          className="answer-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="답을 입력하세요..."
          disabled={feedback.show}
        />
        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={feedback.show}
        >
          제출
        </button>
      </div>

      {/* Feedback */}
      {feedback.show && (
        <div
          className={`feedback animate-slide-up ${
            feedback.isCorrect ? 'feedback-correct' : 'feedback-incorrect'
          }`}
        >
          <div className="feedback-message">{feedback.message}</div>
          {!feedback.isCorrect && (
            <button className="next-button" onClick={handleNextProblem}>
              다음 문제
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemView;
