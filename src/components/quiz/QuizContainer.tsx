import React, { useEffect } from 'react';
import { useQuizStore } from '../../stores/quizStore';
import { useFocusResetStore } from '../../stores/focusResetStore';
import { QuestionCard } from './QuestionCard';
import { ProgressBar } from './ProgressBar';
import { FocusResetModal } from '../focus-reset/FocusResetModal';
import { Button } from '../common/Button';

export const QuizContainer: React.FC = () => {
  const {
    session,
    currentQuestion,
    isAnswered,
    showExplanation,
    submitAnswer,
    nextQuestion,
    resetQuiz
  } = useQuizStore();

  const {
    isActive: isFocusResetActive,
    shouldShowFocusReset,
    startFocusReset,
    completeFocusReset,
    skipFocusReset,
    incrementQuestionCount
  } = useFocusResetStore();

  const [showResults, setShowResults] = React.useState(false);

  useEffect(() => {
    if (session?.endTime) {
      setShowResults(true);
    }
  }, [session?.endTime]);

  const handleSubmitAnswer = (answer: string | number) => {
    const usedFocusReset = useFocusResetStore.getState().totalResets > 0;
    submitAnswer(answer, usedFocusReset);
  };

  const handleNextQuestion = () => {
    if (!session || !currentQuestion) return;

    incrementQuestionCount();

    // 머리정리 모드 체크
    if (shouldShowFocusReset()) {
      const currentQuestionId = currentQuestion.id;
      const nextQuestionIndex = session.currentQuestionIndex + 1;
      const nextQuestionId =
        nextQuestionIndex < session.questions.length
          ? session.questions[nextQuestionIndex].id
          : '';

      if (nextQuestionId) {
        startFocusReset(currentQuestionId, nextQuestionId);
        return; // 머리정리 모드가 끝난 후 nextQuestion 호출됨
      }
    }

    nextQuestion();
  };

  const handleFocusResetComplete = () => {
    completeFocusReset();
    nextQuestion();
  };

  const handleFocusResetSkip = () => {
    skipFocusReset();
    nextQuestion();
  };

  const handleRestart = () => {
    setShowResults(false);
    resetQuiz();
  };

  if (!session) {
    return null;
  }

  if (showResults) {
    const accuracy = (session.score / session.totalQuestions) * 100;
    const totalTime = session.endTime
      ? Math.floor((session.endTime - session.startTime) / 1000)
      : 0;
    const avgTimePerQuestion = totalTime / session.totalQuestions;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-6">
            {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👏' : '💪'}
          </div>

          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            퀴즈 완료!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <div className="bg-primary-50 rounded-lg p-6">
              <div className="text-4xl font-bold text-primary-700 mb-2">
                {session.score} / {session.totalQuestions}
              </div>
              <div className="text-gray-600">정답 개수</div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <div className="text-4xl font-bold text-green-700 mb-2">
                {accuracy.toFixed(0)}%
              </div>
              <div className="text-gray-600">정답률</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-4xl font-bold text-blue-700 mb-2">
                {avgTimePerQuestion.toFixed(0)}초
              </div>
              <div className="text-gray-600">평균 시간</div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-gray-700">
              {accuracy >= 80
                ? '🌟 훌륭합니다! 매우 잘 이해하고 계시네요!'
                : accuracy >= 60
                ? '👍 잘했어요! 조금만 더 연습하면 완벽해질 거예요!'
                : '💪 포기하지 마세요! 다시 도전하면 더 좋은 결과가 있을 거예요!'}
            </p>
          </div>

          <div className="flex gap-4">
            <Button variant="primary" size="lg" fullWidth onClick={handleRestart}>
              다시 시작하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <ProgressBar
        current={session.currentQuestionIndex}
        total={session.totalQuestions}
        score={session.score}
      />

      {/* Question Card */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          onSubmit={handleSubmitAnswer}
          isAnswered={isAnswered}
          showExplanation={showExplanation}
        />
      )}

      {/* Navigation */}
      {isAnswered && (
        <div className="mt-6 flex justify-end">
          <Button variant="primary" size="lg" onClick={handleNextQuestion}>
            {session.currentQuestionIndex < session.totalQuestions - 1
              ? '다음 문제'
              : '결과 보기'}
          </Button>
        </div>
      )}

      {/* Focus Reset Modal */}
      {isFocusResetActive && (
        <FocusResetModal
          onComplete={handleFocusResetComplete}
          onSkip={handleFocusResetSkip}
        />
      )}
    </div>
  );
};
