import React from 'react';
import { useExamStore } from '../store/examStore';
import { Difficulty, QuestionStatus, RoundNumber } from '../types';

interface ExamReviewScreenProps {
  onRestart: () => void;
}

const ExamReviewScreen: React.FC<ExamReviewScreenProps> = ({ onRestart }) => {
  const currentSession = useExamStore((state) => state.currentSession);
  const clearCurrentSession = useExamStore((state) => state.clearCurrentSession);

  if (!currentSession) {
    return <div>세션이 없습니다.</div>;
  }

  // 통계 계산
  const calculateStats = () => {
    const stats = {
      totalQuestions: currentSession.questionCount,
      solvedCorrect: 0,
      solvedWrong: 0,
      unsolved: 0,
      givenUp: 0,
      easyQuestionsTotal: 0,
      easyQuestionsUnsolved: 0,
      questionsOver3Min: 0,
      last10MinuteQuestions: [] as number[],
      timeByRound: {
        [RoundNumber.ROUND_1]: 0,
        [RoundNumber.ROUND_2]: 0,
        [RoundNumber.ROUND_3]: 0,
      },
    };

    const totalTime = currentSession.totalTimeMinutes * 60;
    const last10MinutesThreshold = currentSession.startTime.getTime() + (totalTime - 600) * 1000;

    currentSession.questions.forEach((question) => {
      // 최종 상태
      const lastRound = question.rounds[question.rounds.length - 1];
      if (lastRound) {
        if (lastRound.status === QuestionStatus.SOLVED_CORRECT) stats.solvedCorrect++;
        else if (lastRound.status === QuestionStatus.SOLVED_WRONG) stats.solvedWrong++;
        else if (lastRound.status === QuestionStatus.GIVEN_UP) stats.givenUp++;
        else stats.unsolved++;
      } else {
        stats.unsolved++;
      }

      // 쉬운 문제 통계
      const easyRounds = question.rounds.filter(r => r.difficulty === Difficulty.EASY);
      if (easyRounds.length > 0) {
        stats.easyQuestionsTotal++;
        if (lastRound?.status !== QuestionStatus.SOLVED_CORRECT && lastRound?.status !== QuestionStatus.SOLVED_WRONG) {
          stats.easyQuestionsUnsolved++;
        }
      }

      // 3분 이상 문제
      const totalTimeSpent = question.rounds.reduce((sum, r) => sum + r.timeSpent, 0);
      if (totalTimeSpent >= 180) {
        stats.questionsOver3Min++;
      }

      // 라운드별 시간
      question.rounds.forEach((round) => {
        stats.timeByRound[round.roundNumber] += round.timeSpent;
      });

      // 마지막 10분 문제
      question.rounds.forEach((round) => {
        if (round.startTime.getTime() >= last10MinutesThreshold) {
          if (!stats.last10MinuteQuestions.includes(question.questionIndex)) {
            stats.last10MinuteQuestions.push(question.questionIndex);
          }
        }
      });
    });

    return stats;
  };

  const stats = calculateStats();

  // 코칭 메시지 생성
  const generateCoachingMessages = () => {
    const messages: string[] = [];

    if (stats.easyQuestionsUnsolved > 0) {
      messages.push(
        `🎯 쉬운 문제 ${stats.easyQuestionsUnsolved}개를 놓쳤어요. 다음엔 1라운드에서 바로 처리하는 연습을 추가하자!`
      );
    }

    if (stats.questionsOver3Min > 0) {
      messages.push(
        `⏰ ${stats.questionsOver3Min}개 문제에 3분 이상 사용했어요. 이건 실제 시험에서 위험 신호야. 3라운드 '버리는 연습' 강도를 올리자.`
      );
    }

    if (stats.last10MinuteQuestions.length > 5) {
      messages.push(
        `🏃‍♀️ 마지막 10분에 ${stats.last10MinuteQuestions.length}개 문제를 다뤘어요. 막판 몰아서 푸는 패턴이 보여요. 시간 배분을 다시 생각해보자!`
      );
    }

    if (stats.givenUp > 2) {
      messages.push(
        `💪 과감하게 ${stats.givenUp}개 문제를 버렸어요! 좋은 판단이야. 이 시간에 다른 문제를 풀 수 있었을 거예요.`
      );
    }

    if (messages.length === 0) {
      messages.push(
        `🎉 훌륭한 시간 관리였어요! 계속 이 패턴을 유지하면서, 정확도를 더 높여보자.`
      );
    }

    return messages;
  };

  const coachingMessages = generateCoachingMessages();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const handleNewSession = () => {
    clearCurrentSession();
    onRestart();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">세션 회고</h1>
          <p className="text-gray-600">{currentSession.examName}</p>
          <p className="text-sm text-gray-500">
            {currentSession.examDate.toLocaleDateString('ko-KR')} {currentSession.examDate.toLocaleTimeString('ko-KR')}
          </p>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-green-600">{stats.solvedCorrect}</div>
            <div className="text-gray-600 text-sm">정답 처리</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-red-600">{stats.solvedWrong}</div>
            <div className="text-gray-600 text-sm">오답 처리</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-purple-600">{stats.givenUp}</div>
            <div className="text-gray-600 text-sm">과감히 버림</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-gray-600">{stats.unsolved}</div>
            <div className="text-gray-600 text-sm">미처리</div>
          </div>
        </div>

        {/* 코칭 메시지 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">💡 코칭 메시지</h2>
          <div className="space-y-3">
            {coachingMessages.map((message, index) => (
              <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-gray-700">{message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 상세 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 쉬운 문제 통계 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 쉬운 문제 분석</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">총 쉬운 문제 수:</span>
                <span className="font-semibold">{stats.easyQuestionsTotal}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">미해결 쉬운 문제:</span>
                <span className={`font-semibold ${stats.easyQuestionsUnsolved > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.easyQuestionsUnsolved}개
                </span>
              </div>
            </div>
          </div>

          {/* 시간 분석 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">⏰ 시간 분석</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">3분 이상 문제:</span>
                <span className={`font-semibold ${stats.questionsOver3Min > 2 ? 'text-red-600' : 'text-gray-800'}`}>
                  {stats.questionsOver3Min}개
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">마지막 10분 문제:</span>
                <span className="font-semibold">{stats.last10MinuteQuestions.length}개</span>
              </div>
            </div>
          </div>
        </div>

        {/* 라운드별 시간 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🔄 라운드별 시간 사용</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-medium">1라운드 (쉬운 문제)</span>
                <span className="font-semibold">{formatTime(stats.timeByRound[RoundNumber.ROUND_1])}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{
                    width: `${(stats.timeByRound[RoundNumber.ROUND_1] / (currentSession.totalTimeMinutes * 60)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-medium">2라운드 (보통 문제)</span>
                <span className="font-semibold">{formatTime(stats.timeByRound[RoundNumber.ROUND_2])}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full"
                  style={{
                    width: `${(stats.timeByRound[RoundNumber.ROUND_2] / (currentSession.totalTimeMinutes * 60)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-medium">3라운드 (어려운 문제)</span>
                <span className="font-semibold">{formatTime(stats.timeByRound[RoundNumber.ROUND_3])}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full"
                  style={{
                    width: `${(stats.timeByRound[RoundNumber.ROUND_3] / (currentSession.totalTimeMinutes * 60)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 타임라인 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 문항별 타임라인</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {currentSession.questions.map((question) => {
              const lastRound = question.rounds[question.rounds.length - 1];
              const totalTime = question.rounds.reduce((sum, r) => sum + r.timeSpent, 0);

              let statusColor = 'bg-gray-200';
              let statusText = '미처리';
              if (lastRound) {
                if (lastRound.status === QuestionStatus.SOLVED_CORRECT) {
                  statusColor = 'bg-green-500';
                  statusText = '정답';
                } else if (lastRound.status === QuestionStatus.SOLVED_WRONG) {
                  statusColor = 'bg-red-500';
                  statusText = '오답';
                } else if (lastRound.status === QuestionStatus.GIVEN_UP) {
                  statusColor = 'bg-purple-500';
                  statusText = '버림';
                }
              }

              return (
                <div key={question.questionIndex} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-700 w-16">문항 {question.questionIndex}</div>
                  <div className={`px-3 py-1 ${statusColor} text-white rounded-full text-sm font-medium w-20 text-center`}>
                    {statusText}
                  </div>
                  <div className="text-gray-600 text-sm flex-1">
                    {question.rounds.map((round, idx) => (
                      <span key={idx} className="mr-2">
                        R{round.roundNumber}
                        {round.difficulty && ` (${round.difficulty === Difficulty.EASY ? '쉬움' : round.difficulty === Difficulty.MEDIUM ? '보통' : round.difficulty === Difficulty.HARD ? '어려움' : '모름'})`}
                      </span>
                    ))}
                  </div>
                  <div className="text-gray-600 font-medium">{formatTime(totalTime)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={handleNewSession}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg shadow-lg transition-colors"
          >
            새로운 세션 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamReviewScreen;
