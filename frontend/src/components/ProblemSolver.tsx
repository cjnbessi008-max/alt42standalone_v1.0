import { useState, useEffect } from 'react';
import { api, Student, Problem, AttemptWithFeedback, ReasoningAnalysis } from '../api/client';
import './ProblemSolver.css';

interface Props {
  student: Student;
  problem: Problem;
  onNextProblem: () => void;
}

type Stage = 'answering' | 'explaining' | 'feedback' | 'success';

export default function ProblemSolver({ student, problem, onNextProblem }: Props) {
  const [stage, setStage] = useState<Stage>('answering');
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [attemptResult, setAttemptResult] = useState<AttemptWithFeedback | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<ReasoningAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Reset state when problem changes
  useEffect(() => {
    setStage('answering');
    setAnswer('');
    setExplanation('');
    setAttemptResult(null);
    setFeedbackResult(null);
    setError('');
    setStartTime(Date.now());
  }, [problem.id]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!answer.trim()) {
      setError('답변을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await api.submitAnswer({
        student_id: student.id,
        problem_id: problem.id,
        submitted_answer: answer.trim(),
        time_spent_seconds: timeSpent,
      });

      setAttemptResult(response.data);

      if (response.data.attempt.is_correct) {
        setStage('success');
      } else {
        setStage('explaining');
      }
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
      setError('답변 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExplanation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!explanation.trim()) {
      setError('추론 과정을 설명해주세요.');
      return;
    }

    if (!attemptResult) {
      setError('답변 제출 정보가 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.submitReasoning({
        attempt_id: attemptResult.attempt.id,
        student_id: student.id,
        explanation_text: explanation.trim(),
        language: 'ko',
      });

      setFeedbackResult(response.data);
      setStage('feedback');
    } catch (err: any) {
      console.error('Failed to submit reasoning:', err);
      setError('추론 분석에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextProblem = () => {
    onNextProblem();
  };

  return (
    <div className="problem-solver">
      {/* Problem Display */}
      <div className="card problem-card">
        <div className="problem-header">
          <span className="problem-type">{problem.problem_type}</span>
          <span className="difficulty">난이도: {'⭐'.repeat(problem.difficulty_level)}</span>
        </div>
        <h2>{problem.title}</h2>
        <p className="problem-description">{problem.description}</p>
      </div>

      {/* Stage: Answering */}
      {stage === 'answering' && (
        <div className="card answer-card">
          <h3>📝 답변을 입력하세요</h3>
          <form onSubmit={handleSubmitAnswer}>
            <div className="form-group">
              <label htmlFor="answer">답:</label>
              <input
                id="answer"
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="답을 입력하세요"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? '제출 중...' : '답 제출하기'}
            </button>
          </form>
        </div>
      )}

      {/* Stage: Explaining (after incorrect answer) */}
      {stage === 'explaining' && attemptResult && (
        <div className="card explanation-card">
          <div className="warning">
            <h3>❌ 틀렸어요!</h3>
            <p>하지만 괜찮아요. 실수에서 배울 수 있어요!</p>
          </div>

          <div className="your-answer">
            <strong>당신의 답변:</strong> {attemptResult.attempt.submitted_answer}
          </div>

          <h3>🤔 왜 그렇게 풀었나요?</h3>
          <p className="instruction">
            어떤 생각으로 그 답을 냈는지 <strong>한 문장으로</strong> 설명해주세요.
          </p>

          <form onSubmit={handleSubmitExplanation}>
            <div className="form-group">
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="예: 분자끼리 더하고 분모끼리 더했어요."
                rows={3}
                disabled={loading}
                autoFocus
              />
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? 'AI가 분석 중...' : '설명 제출하기'}
            </button>
          </form>
        </div>
      )}

      {/* Stage: Feedback (AI analysis) */}
      {stage === 'feedback' && feedbackResult && (
        <div className="card feedback-card">
          <div className="feedback-header">
            <h3>💡 AI 피드백</h3>
            <span className="confidence">
              확신도: {((feedbackResult.ai_feedback.confidence_score || 0) * 100).toFixed(0)}%
            </span>
          </div>

          <div className="feedback-section">
            <h4>🔍 잘못된 추론</h4>
            <div className="feedback-box misconception">
              {feedbackResult.ai_feedback.identified_misconception}
            </div>
          </div>

          <div className="feedback-section">
            <h4>✅ 올바른 방법</h4>
            <div className="feedback-box corrective">
              {feedbackResult.ai_feedback.corrective_feedback}
            </div>
          </div>

          {feedbackResult.ai_feedback.encouragement && (
            <div className="feedback-section">
              <h4>💪 격려</h4>
              <div className="feedback-box encouragement">
                {feedbackResult.ai_feedback.encouragement}
              </div>
            </div>
          )}

          {feedbackResult.next_steps && (
            <div className="info">
              <strong>다음 단계:</strong> {feedbackResult.next_steps}
            </div>
          )}

          <button onClick={handleNextProblem} className="next-button">
            다음 문제 풀기 →
          </button>
        </div>
      )}

      {/* Stage: Success */}
      {stage === 'success' && (
        <div className="card success-card">
          <div className="success">
            <h3>🎉 정답입니다!</h3>
            <p>훌륭해요! 계속 이런 식으로 잘하고 있어요.</p>
          </div>

          <button onClick={handleNextProblem} className="next-button">
            다음 문제 풀기 →
          </button>
        </div>
      )}
    </div>
  );
}
