interface SessionSummary {
  id: number;
  totalQuestions: number;
  correctAnswers: number;
  mentalStaminaScore: string;
  fatigueLevel: string;
  avgResponseTime: number;
}

interface Props {
  summary: SessionSummary;
  onRestart: () => void;
}

export default function SessionSummary({ summary, onRestart }: Props) {
  const accuracyRate = (summary.correctAnswers / summary.totalQuestions) * 100;
  const staminaScore = parseFloat(summary.mentalStaminaScore);

  const getFatigueLevelText = (level: string) => {
    switch (level) {
      case 'low': return { text: '낮음', color: 'text-green-600', emoji: '😊' };
      case 'medium': return { text: '보통', color: 'text-yellow-600', emoji: '😐' };
      case 'high': return { text: '높음', color: 'text-orange-600', emoji: '😓' };
      case 'critical': return { text: '매우 높음', color: 'text-red-600', emoji: '😰' };
      default: return { text: '알 수 없음', color: 'text-gray-600', emoji: '❓' };
    }
  };

  const fatigueInfo = getFatigueLevelText(summary.fatigueLevel);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="card text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              학습 세션 완료!
            </h1>
            <p className="text-gray-600">수고하셨습니다</p>
          </div>

          {/* Mental Stamina Score */}
          <div className="mb-8 p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">최종 사고 체력 점수</div>
            <div className="text-6xl font-bold text-primary-600 mb-2">
              {staminaScore.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">/ 100점</div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="card bg-gray-50">
              <div className="text-3xl font-bold text-gray-900">
                {summary.totalQuestions}
              </div>
              <div className="text-sm text-gray-600">총 문제 수</div>
            </div>

            <div className="card bg-gray-50">
              <div className="text-3xl font-bold text-green-600">
                {summary.correctAnswers}
              </div>
              <div className="text-sm text-gray-600">정답 수</div>
            </div>

            <div className="card bg-gray-50">
              <div className="text-3xl font-bold text-primary-600">
                {accuracyRate.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">정답률</div>
            </div>

            <div className="card bg-gray-50">
              <div className="text-3xl font-bold text-orange-600">
                {(summary.avgResponseTime / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-gray-600">평균 응답 시간</div>
            </div>
          </div>

          {/* Fatigue Level */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">피로도 수준</div>
            <div className={`text-2xl font-bold ${fatigueInfo.color}`}>
              {fatigueInfo.emoji} {fatigueInfo.text}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg text-left">
            <h3 className="font-bold text-lg mb-2">💡 추천사항</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {staminaScore >= 75 ? (
                <>
                  <li>✅ 훌륭한 집중력을 보여주셨습니다!</li>
                  <li>✅ 학습을 계속 이어가도 좋습니다.</li>
                </>
              ) : staminaScore >= 50 ? (
                <>
                  <li>👍 좋은 성과입니다.</li>
                  <li>💡 10-15분 휴식 후 다시 시작하는 것을 권장합니다.</li>
                </>
              ) : (
                <>
                  <li>⚠️ 피로가 누적되었습니다.</li>
                  <li>🛌 충분한 휴식을 취하세요 (20-30분).</li>
                  <li>💧 수분을 섭취하고 가벼운 스트레칭을 해보세요.</li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onRestart}
              className="btn btn-primary w-full text-lg py-3"
            >
              다시 시작하기
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="btn btn-secondary w-full"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
