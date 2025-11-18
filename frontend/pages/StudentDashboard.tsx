/**
 * StudentDashboard Page
 * Main dashboard for students to view their thinking style
 */
import React, { useState, useEffect } from 'react';
import ThinkingStyleProfile from '../components/ThinkingStyleProfile';
import { ThinkingStyleType } from '../components/ThinkingStyleBadge';

interface StudentDashboardProps {
  studentId: string;
}

// Mock data interface (replace with actual API calls)
interface ProfileData {
  studentId: string;
  primaryStyle: ThinkingStyleType;
  secondaryStyle?: ThinkingStyleType;
  isHybrid: boolean;
  scores: {
    computational: number;
    intuitive: number;
    visual: number;
  };
  confidenceLevel: 'low' | 'medium' | 'high';
  dataPointsCount: number;
  lastAssessed: Date;
  recommendations: string[];
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentId }) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/v1/thinking-styles/students/${studentId}`);
        // const data = await response.json();

        // Mock data for demonstration
        const mockData: ProfileData = {
          studentId: studentId,
          primaryStyle: 'visual',
          secondaryStyle: 'computational',
          isHybrid: true,
          scores: {
            computational: 62.5,
            intuitive: 38.0,
            visual: 78.5,
          },
          confidenceLevel: 'high',
          dataPointsCount: 145,
          lastAssessed: new Date(),
          recommendations: [
            '시각 자료를 활용한 학습이 효과적입니다',
            '다이어그램과 그래프를 그리며 개념을 정리해보세요',
            '단계별 계산 과정도 함께 연습하면 도움이 됩니다',
            '컬러 펜을 사용하여 중요한 내용을 표시해보세요',
          ],
        };

        // Simulate API delay
        setTimeout(() => {
          setProfileData(mockData);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError('프로필 데이터를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">오류 발생</h3>
          <p className="text-red-600">{error || '데이터를 불러올 수 없습니다.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">나의 학습 대시보드</h1>
          <p className="text-gray-600">나의 사고 스타일을 확인하고 맞춤 학습 방법을 알아보세요</p>
        </div>

        {/* Main Profile */}
        <div className="mb-8">
          <ThinkingStyleProfile {...profileData} />
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning Tips Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 나에게 맞는 학습 전략</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">1.</span>
                <p>문제를 읽을 때 먼저 그림이나 다이어그램으로 시각화해보세요</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">2.</span>
                <p>개념 지도(마인드맵)를 그리며 내용을 정리하세요</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">3.</span>
                <p>공식을 암기하기보다 시각적으로 이해하려고 노력하세요</p>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 학습 활동</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">완료한 문제</span>
                <span className="text-2xl font-bold text-blue-600">145개</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">학습 시간</span>
                <span className="text-2xl font-bold text-green-600">8.5시간</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">정답률</span>
                <span className="text-2xl font-bold text-orange-600">82%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>알림:</strong> 사고 스타일은 고정된 것이 아닙니다. 다양한 학습 방법을
            시도하면서 자신에게 가장 효과적인 방법을 찾아가세요!
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
