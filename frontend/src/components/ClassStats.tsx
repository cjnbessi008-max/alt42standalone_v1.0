interface ClassStats {
  total_students: number;
  total_sessions: number;
  avg_stamina_score: string;
  total_questions: number;
  avg_questions_per_minute: string;
  critical_fatigue_count: number;
  high_fatigue_count: number;
}

interface Props {
  stats: ClassStats | null;
}

export default function ClassStats({ stats }: Props) {
  if (!stats) {
    return (
      <div className="card">
        <p className="text-gray-600">통계 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-6">학급 전체 통계</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-primary-50 rounded-lg">
          <div className="text-3xl font-bold text-primary-600">
            {stats.total_students}
          </div>
          <div className="text-sm text-gray-600 mt-1">총 학생 수</div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-3xl font-bold text-green-600">
            {parseFloat(stats.avg_stamina_score).toFixed(0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">평균 사고 체력</div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">
            {stats.total_sessions}
          </div>
          <div className="text-sm text-gray-600 mt-1">총 학습 세션</div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-3xl font-bold text-purple-600">
            {stats.total_questions}
          </div>
          <div className="text-sm text-gray-600 mt-1">총 문제 풀이</div>
        </div>
      </div>

      {/* Fatigue Warning */}
      {(stats.critical_fatigue_count > 0 || stats.high_fatigue_count > 0) && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <div className="font-bold text-red-800">피로도 경고</div>
              <div className="text-sm text-red-700">
                {stats.critical_fatigue_count > 0 && (
                  <span>심각한 피로: {stats.critical_fatigue_count}명 </span>
                )}
                {stats.high_fatigue_count > 0 && (
                  <span>높은 피로: {stats.high_fatigue_count}명</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
