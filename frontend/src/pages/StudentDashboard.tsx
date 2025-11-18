import { useState, useEffect } from 'react';
import { Sparkles, Calendar, Award, TrendingUp } from 'lucide-react';
import GrowthPointCard from '../components/GrowthPointCard';
import { insightsApi } from '../services/api';
import type { DailyGrowthReport } from '../types';

export default function StudentDashboard() {
  const [report, setReport] = useState<DailyGrowthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo student ID - in production, this would come from authentication
  const studentId = 'demo-student-123';

  useEffect(() => {
    loadDailyReport();
  }, []);

  const loadDailyReport = async () => {
    try {
      setLoading(true);
      const response = await insightsApi.getDaily(studentId);
      setReport(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load daily report:', err);
      setError('메타인지 성장 포인트를 불러오는데 실패했습니다. 학습 활동 데이터가 충분한지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="flex items-start">
          <Calendar className="w-6 h-6 text-yellow-600 mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">알림</h3>
            <p className="text-yellow-700">{error}</p>
            <p className="text-sm text-yellow-600 mt-2">
              학습 활동을 기록하면 AI가 자동으로 성장 포인트를 분석해드립니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Sparkles className="w-8 h-8 mr-3" />
              오늘의 메타인지 성장 포인트
            </h1>
            <p className="text-primary-100 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {today}
            </p>
          </div>
          {report.overall_improvement !== 0 && (
            <div className="text-right">
              <p className="text-primary-100 text-sm mb-1">전체 개선율</p>
              <p className="text-4xl font-bold flex items-center justify-end">
                <TrendingUp className="w-8 h-8 mr-2" />
                {report.overall_improvement > 0 ? '+' : ''}
                {report.overall_improvement.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {report.summary && (
        <div className="card bg-blue-50 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-blue-900 mb-3 flex items-center">
            <Award className="w-6 h-6 mr-2" />
            학습 요약
          </h2>
          <p className="text-blue-800 leading-relaxed">{report.summary}</p>
        </div>
      )}

      {/* Key Achievements */}
      {report.key_achievements && report.key_achievements.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">주요 성취</h2>
          <ul className="space-y-2">
            {report.key_achievements.map((achievement, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  ✓
                </span>
                <span className="text-gray-700">{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Growth Insights */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">성장 포인트 상세</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {report.insights.map((insight) => (
            <GrowthPointCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div className="card bg-purple-50 border-2 border-purple-200">
          <h2 className="text-xl font-bold text-purple-900 mb-4">다음 단계 추천</h2>
          <ul className="space-y-3">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-sm">
                  {index + 1}
                </span>
                <span className="text-purple-800">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
