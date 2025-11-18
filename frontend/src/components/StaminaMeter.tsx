interface StaminaMetrics {
  fatigueIndex: number;
  accuracyRate: number;
  avgResponseTime: number;
  recommendedBreak: boolean;
}

interface Props {
  metrics: StaminaMetrics;
}

export default function StaminaMeter({ metrics }: Props) {
  const staminaScore = Math.max(0, 100 - metrics.fatigueIndex);

  const getColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColor = (score: number) => {
    if (score >= 75) return 'text-green-700';
    if (score >= 50) return 'text-yellow-700';
    if (score >= 25) return 'text-orange-700';
    return 'text-red-700';
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">실시간 사고 체력 지수</h2>

      {/* Main Stamina Score */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">사고 체력</span>
          <span className={`text-2xl font-bold ${getTextColor(staminaScore)}`}>
            {staminaScore.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`${getColor(staminaScore)} h-4 rounded-full transition-all duration-500`}
            style={{ width: `${staminaScore}%` }}
          />
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            {metrics.accuracyRate?.toFixed(0) || 0}%
          </div>
          <div className="text-sm text-gray-600">정답률</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            {(metrics.avgResponseTime / 1000).toFixed(1)}s
          </div>
          <div className="text-sm text-gray-600">평균 응답 시간</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            {metrics.fatigueIndex?.toFixed(0) || 0}
          </div>
          <div className="text-sm text-gray-600">피로도 지수</div>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          {staminaScore >= 75 && '🟢 매우 좋음: 집중력이 뛰어납니다!'}
          {staminaScore >= 50 && staminaScore < 75 && '🟡 양호: 학습을 계속하세요.'}
          {staminaScore >= 25 && staminaScore < 50 && '🟠 주의: 피로가 쌓이고 있습니다.'}
          {staminaScore < 25 && '🔴 경고: 휴식이 필요합니다.'}
        </p>
      </div>
    </div>
  );
}
