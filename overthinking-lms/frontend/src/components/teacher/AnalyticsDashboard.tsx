import { useState, useEffect } from 'react';
import { teachersAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Analytics } from '../../types';
import { TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';

interface AnalyticsDashboardProps {
  teacherId: string;
}

export default function AnalyticsDashboard({ teacherId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: string | undefined;

      if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString();
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString();
      }

      const data = await teachersAPI.getAnalytics(teacherId, startDate);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-600">분석 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-600">분석 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const chartData = analytics.studentMetrics.map((student) => ({
    name: student.studentName || '학생',
    attempts: student.totalAttempts,
    correct: student.correctAnswers,
    overthinking: student.overthinkingCount,
    avgTime: Math.floor(student.avgTimeSpent / 60), // Convert to minutes
  }));

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
              dateRange === 'week'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            최근 7일
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 text-sm font-medium border-t border-b ${
              dateRange === 'month'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            최근 30일
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
              dateRange === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            전체
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">총 문제 시도</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalAttempts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">정답률</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview.totalAttempts > 0
                  ? Math.round(
                      (analytics.overview.correctAttempts / analytics.overview.completedAttempts) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">평균 풀이 시간</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(analytics.overview.avgTimeSpent / 60)}분
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">과도한 고민율</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview.overthinkingRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Performance Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">학생별 성과</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="attempts" fill="#3b82f6" name="총 시도" />
              <Bar dataKey="correct" fill="#10b981" name="정답" />
              <Bar dataKey="overthinking" fill="#f59e0b" name="과도한 고민" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-8">아직 데이터가 없습니다.</p>
        )}
      </div>

      {/* Student Details Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">학생 상세 정보</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  학생
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  총 시도
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  정답 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  정답률
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  평균 시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  과도한 고민
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.studentMetrics.map((student, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.studentName || '학생'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.totalAttempts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.correctAnswers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.totalAttempts > 0
                      ? Math.round((student.correctAnswers / student.totalAttempts) * 100)
                      : 0}
                    %
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.floor(student.avgTimeSpent / 60)}분
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.overthinkingCount >= 3
                          ? 'bg-red-100 text-red-800'
                          : student.overthinkingCount >= 1
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {student.overthinkingCount}회
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
