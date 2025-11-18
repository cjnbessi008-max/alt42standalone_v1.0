import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import Thermometer from '../components/Thermometer';

const StatsPage: React.FC = () => {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const response = await statsApi.getUserStats(user.id);
      return response.data.data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  const progress = data?.progress;
  const recentResponses = data?.recentResponses || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-white to-secondary-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">학습 통계</h1>

        {/* Overview cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">총 문제</div>
            <div className="text-3xl font-bold text-primary-600">
              {progress?.totalProblems || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">정답 수</div>
            <div className="text-3xl font-bold text-green-600">
              {progress?.correctAnswers || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">정확도</div>
            <div className="text-3xl font-bold text-blue-600">
              {progress?.accuracy.toFixed(1) || 0}%
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">평균 확신도</div>
            <div className="text-3xl font-bold text-orange-600">
              {progress?.averageConfidence.toFixed(1) || 0}%
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Thermometer visualization */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              정확도 시각화
            </h2>
            <Thermometer value={progress?.accuracy || 0} showSlider={false} />
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              최근 활동
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {recentResponses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  아직 풀어본 문제가 없습니다
                </p>
              ) : (
                recentResponses.map((response: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      response.isCorrect
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-gray-800">
                        {response.problem?.title}
                      </div>
                      <div
                        className={`text-2xl ${
                          response.isCorrect ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {response.isCorrect ? '✓' : '✗'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span>확신도: {response.confidenceLevel}%</span>
                      <span className="mx-2">•</span>
                      <span>
                        난이도: {response.problem?.difficulty || '?'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
