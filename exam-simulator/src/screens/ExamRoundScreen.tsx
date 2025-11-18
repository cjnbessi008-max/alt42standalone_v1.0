import React, { useState, useEffect } from 'react';
import { useExamStore } from '../store/examStore';
import { Difficulty, QuestionStatus, RoundNumber } from '../types';

interface ExamRoundScreenProps {
  onComplete: () => void;
}

const ExamRoundScreen: React.FC<ExamRoundScreenProps> = ({ onComplete }) => {
  const currentSession = useExamStore((state) => state.currentSession);
  const updateCurrentQuestion = useExamStore((state) => state.updateCurrentQuestion);
  const moveToNextQuestion = useExamStore((state) => state.moveToNextQuestion);
  const moveToPreviousQuestion = useExamStore((state) => state.moveToPreviousQuestion);
  const goToQuestion = useExamStore((state) => state.goToQuestion);
  const advanceToNextRound = useExamStore((state) => state.advanceToNextRound);
  const completeSession = useExamStore((state) => state.completeSession);
  const getRemainingTime = useExamStore((state) => state.getRemainingTime);
  const addMentalEvent = useExamStore((state) => state.addMentalEvent);

  const [remainingTime, setRemainingTime] = useState(getRemainingTime());
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [mentalMessage, setMentalMessage] = useState<string | null>(null);
  const [lastTimeThreshold, setLastTimeThreshold] = useState(100);

  // 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getRemainingTime();
      setRemainingTime(remaining);

      // 멘탈 이벤트 트리거 (시간 기반)
      const totalTime = (currentSession?.totalTimeMinutes || 0) * 60;
      const remainingPercent = (remaining / totalTime) * 100;

      // 70% -> 50%로 떨어질 때
      if (lastTimeThreshold >= 70 && remainingPercent < 50 && remainingPercent >= 30) {
        const message = "지금은 쉬운 문제 수를 늘려야 하는 타이밍이야. '애매한 문제'에 오래 머무르지 말기!";
        addMentalEvent(message, 'time_threshold');
        setMentalMessage(message);
        setLastTimeThreshold(50);
        setTimeout(() => setMentalMessage(null), 5000);
      }

      // 30% 미만
      if (lastTimeThreshold >= 30 && remainingPercent < 30) {
        const message = "이제는 살릴 문제 / 버릴 문제를 나눌 시간. 점수 기대값 낮은 문제는 과감히 못 푼 걸로 두고, 계산만 하면 되는 문제를 우선 처리하자.";
        addMentalEvent(message, 'time_threshold');
        setMentalMessage(message);
        setLastTimeThreshold(30);
        setTimeout(() => setMentalMessage(null), 7000);
      }

      // 시간 종료
      if (remaining <= 0) {
        completeSession();
        onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [getRemainingTime, currentSession, lastTimeThreshold, addMentalEvent, completeSession, onComplete]);

  if (!currentSession) {
    return <div>세션이 없습니다.</div>;
  }

  const progress = ((currentSession.currentQuestionIndex + 1) / currentSession.questionCount) * 100;

  const handleDifficultySelect = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setShowDifficultySelector(false);

    // 난이도에 따라 상태 설정
    if (difficulty === Difficulty.EASY) {
      updateCurrentQuestion(QuestionStatus.IN_PROGRESS, difficulty);
    } else {
      updateCurrentQuestion(QuestionStatus.SCANNED, difficulty);
    }
  };

  const handleActionButton = (action: 'complete' | 'wrong' | 'skip' | 'giveup') => {
    let status: QuestionStatus;
    switch (action) {
      case 'complete':
        status = QuestionStatus.SOLVED_CORRECT;
        break;
      case 'wrong':
        status = QuestionStatus.SOLVED_WRONG;
        break;
      case 'skip':
        status = QuestionStatus.SKIPPED;
        break;
      case 'giveup':
        status = QuestionStatus.GIVEN_UP;
        break;
    }
    updateCurrentQuestion(status);

    // 자동으로 다음 문제로
    if (currentSession.currentQuestionIndex < currentSession.questionCount - 1) {
      moveToNextQuestion();
      setSelectedDifficulty(null);
    }
  };

  const handleNextRound = () => {
    if (currentSession.currentRound < RoundNumber.ROUND_3) {
      advanceToNextRound();
      setSelectedDifficulty(null);
    } else {
      completeSession();
      onComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRoundName = (round: RoundNumber) => {
    switch (round) {
      case RoundNumber.ROUND_1:
        return '1라운드: 쉬운 문제 빠르게';
      case RoundNumber.ROUND_2:
        return '2라운드: 보통 문제 정리';
      case RoundNumber.ROUND_3:
        return '3라운드: 선택과 집중';
    }
  };

  const getQuestionStatus = (questionIndex: number) => {
    const question = currentSession.questions[questionIndex];
    const currentRoundRecords = question.rounds.filter(
      (r) => r.roundNumber === currentSession.currentRound
    );
    if (currentRoundRecords.length === 0) return null;
    return currentRoundRecords[currentRoundRecords.length - 1].status;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 상단: 타이머 & 라운드 */}
      <div className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">{currentSession.examName}</div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {getRoundName(currentSession.currentRound)}
              </div>
            </div>
            <div className={`text-3xl font-bold ${remainingTime < 300 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
              {formatTime(remainingTime)}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 멘탈 메시지 */}
      {mentalMessage && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 animate-pulse">
          <div className="max-w-7xl mx-auto">
            <p className="text-yellow-800 font-medium">💡 {mentalMessage}</p>
          </div>
        </div>
      )}

      {/* 중앙: 문항 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl font-bold text-gray-800 mb-4">
              문항 {currentSession.currentQuestionIndex + 1}
            </div>
            <div className="text-gray-500 mb-8">
              총 {currentSession.questionCount}개 문항 중
            </div>

            {!showDifficultySelector && !selectedDifficulty && (
              <button
                onClick={() => setShowDifficultySelector(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold px-8 py-4 rounded-lg shadow-lg transition-colors"
              >
                난이도 평가하기
              </button>
            )}

            {showDifficultySelector && (
              <div className="space-y-3">
                <p className="text-gray-700 mb-4">이 문제는 어떤가요?</p>
                <button
                  onClick={() => handleDifficultySelect(Difficulty.EASY)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-lg transition-colors"
                >
                  😊 쉬움 - 지금 바로 풀기
                </button>
                <button
                  onClick={() => handleDifficultySelect(Difficulty.MEDIUM)}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 rounded-lg transition-colors"
                >
                  🤔 보통 - 2라운드에 풀기
                </button>
                <button
                  onClick={() => handleDifficultySelect(Difficulty.HARD)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-lg transition-colors"
                >
                  😓 어려움 - 3라운드에 도전
                </button>
                <button
                  onClick={() => handleDifficultySelect(Difficulty.NO_IDEA)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-lg transition-colors"
                >
                  😵 전혀 모르겠음 - 버리기
                </button>
              </div>
            )}

            {selectedDifficulty && (
              <div className="space-y-3">
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-700">
                    선택한 난이도: <span className="font-semibold">
                      {selectedDifficulty === Difficulty.EASY && '쉬움'}
                      {selectedDifficulty === Difficulty.MEDIUM && '보통'}
                      {selectedDifficulty === Difficulty.HARD && '어려움'}
                      {selectedDifficulty === Difficulty.NO_IDEA && '전혀 모르겠음'}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => handleActionButton('complete')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg transition-colors"
                >
                  ✅ 완료 (정답)
                </button>
                <button
                  onClick={() => handleActionButton('wrong')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-lg transition-colors"
                >
                  ❌ 완료 (오답 느낌)
                </button>
                <button
                  onClick={() => handleActionButton('skip')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 rounded-lg transition-colors"
                >
                  ⏭️ 일단 넘기기
                </button>
                {currentSession.currentRound === RoundNumber.ROUND_3 && (
                  <button
                    onClick={() => handleActionButton('giveup')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-lg transition-colors"
                  >
                    🚫 과감히 버리기
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단: 네비게이션 */}
      <div className="bg-white border-t p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={moveToPreviousQuestion}
            disabled={currentSession.currentQuestionIndex === 0}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            ← 이전 문제
          </button>

          <div className="flex gap-2 overflow-x-auto max-w-xl">
            {Array.from({ length: currentSession.questionCount }, (_, i) => {
              const status = getQuestionStatus(i);
              let bgColor = 'bg-gray-200';
              if (status === QuestionStatus.SOLVED_CORRECT) bgColor = 'bg-green-500';
              else if (status === QuestionStatus.SOLVED_WRONG) bgColor = 'bg-red-500';
              else if (status === QuestionStatus.SCANNED) bgColor = 'bg-yellow-500';
              else if (status === QuestionStatus.GIVEN_UP) bgColor = 'bg-purple-500';

              return (
                <button
                  key={i}
                  onClick={() => goToQuestion(i)}
                  className={`w-8 h-8 rounded-full ${bgColor} ${currentSession.currentQuestionIndex === i ? 'ring-4 ring-blue-600' : ''} text-white text-xs font-medium hover:opacity-80 transition-all`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {currentSession.currentQuestionIndex === currentSession.questionCount - 1 ? (
            <button
              onClick={handleNextRound}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {currentSession.currentRound === RoundNumber.ROUND_3 ? '시험 종료' : '다음 라운드 →'}
            </button>
          ) : (
            <button
              onClick={moveToNextQuestion}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              다음 문제 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamRoundScreen;
