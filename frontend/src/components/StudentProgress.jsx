import { useState, useEffect } from 'react';
import { studentProgressAPI } from '../api';

function StudentProgress({ studentName, onBack }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [studentName]);

  const loadProgress = async () => {
    try {
      const response = await studentProgressAPI.getByName(studentName);
      if (response.data.success) {
        setProgress(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      // If no progress exists yet, that's okay
      setProgress({
        student_name: studentName,
        stats: { total_problems: 0, correct_answers: 0, accuracy_percentage: 0 },
        mistake_breakdown: [],
        recent_attempts: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">학습 현황을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const { stats, mistake_breakdown, recent_attempts } = progress;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            ← 뒤로 가기
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          {studentName}님의 학습 현황
        </h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">총 푼 문제</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.total_problems || 0}
                </p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">정답 수</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.correct_answers || 0}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">정답률</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.accuracy_percentage
                    ? `${stats.accuracy_percentage.toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Mistake Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            실수 유형 분석
          </h2>

          {mistake_breakdown && mistake_breakdown.length > 0 ? (
            <div className="space-y-3">
              {mistake_breakdown.map((mistake, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-4"
                    style={{ backgroundColor: mistake.color + '30' }}
                  >
                    <span className="text-xl">{mistake.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800">
                        {mistake.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        {mistake.count}회
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(mistake.count / mistake_breakdown[0].count) * 100}%`,
                          backgroundColor: mistake.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              아직 실수 유형 데이터가 없습니다.
              <br />
              문제를 풀고 실수 유형을 선택해보세요!
            </p>
          )}
        </div>

        {/* Recent Attempts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            최근 풀이 기록
          </h2>

          {recent_attempts && recent_attempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      문제
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      난이도
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      결과
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      시도 시간
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent_attempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-800">
                        {attempt.problem_title}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {attempt.difficulty_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {attempt.is_correct ? (
                          <span className="text-green-600 font-semibold">✓ 정답</span>
                        ) : (
                          <span className="text-red-600 font-semibold">✗ 오답</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        {new Date(attempt.attempted_at).toLocaleString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              아직 풀이 기록이 없습니다.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentProgress;
