/**
 * Student Dashboard Page
 *
 * Real-time confusion level visualization for students
 */

import React, { useEffect, useState } from 'react';
import { useConfusionTracking, useBehaviorTracking } from '../hooks/useConfusionTracking';
import { useLMSIntegration, useLTILaunch } from '../hooks/useLMSIntegration';
import {
  ConfusionIndicator,
  ConfusionHeatMap,
  ConfusionChart,
} from '../components/ConfusionLevelVisualization';

interface StudentDashboardProps {
  studentId: string;
  moduleId: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentId, moduleId }) => {
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

  // LMS Integration
  const ltiData = useLTILaunch();
  const {
    connected: lmsConnected,
    loading: lmsLoading,
    sendProgress,
  } = useLMSIntegration({
    lmsData: ltiData || {
      platform: 'Standalone',
      courseId: moduleId,
      activityId: moduleId,
      lmsUserId: studentId,
    },
    autoSync: true,
  });

  // Confusion tracking with real-time updates
  const {
    confusionState,
    loading: confusionLoading,
    error,
    submitMetrics,
    refresh,
  } = useConfusionTracking({
    studentId,
    moduleId,
    enableRealtime: true,
  });

  // Behavior tracking
  const behaviorTracking = useBehaviorTracking();

  // Handle concept click in heat map
  const handleConceptClick = (conceptId: string) => {
    setSelectedConceptId(conceptId);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [refresh]);

  // Send progress to LMS when confusion state changes
  useEffect(() => {
    if (confusionState && lmsConnected && ltiData) {
      const score = Math.max(0, 100 - confusionState.overallConfusion);
      sendProgress(studentId, ltiData.activityId, score, false);
    }
  }, [confusionState, lmsConnected, ltiData, studentId, sendProgress]);

  if (confusionLoading || lmsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">학습 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-lg mb-2">오류 발생</h2>
          <p className="text-red-600">{error.message}</p>
          <button
            onClick={refresh}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!confusionState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">학습 데이터를 찾을 수 없습니다</p>
      </div>
    );
  }

  const selectedConcept = selectedConceptId
    ? confusionState.conceptConfusion.find((c) => c.conceptId === selectedConceptId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">학습 대시보드</h1>
              <p className="text-sm text-gray-600 mt-1">
                {confusionState.studentName} - 실시간 학습 상태
              </p>
            </div>
            {lmsConnected && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">LMS 연동됨</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Alert Banner */}
        {confusionState.needsIntervention && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 font-medium">
                  학습에 어려움을 겪고 있습니다. 선생님께 도움을 요청하세요!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overall Confusion Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">전체 학습 상태</h2>
          <div className="flex items-center justify-center">
            <ConfusionIndicator
              level={confusionState.overallConfusion}
              size="large"
              showLabel={true}
              showValue={true}
              variant="circle"
            />
          </div>
          <div className="mt-6">
            <ConfusionIndicator
              level={confusionState.overallConfusion}
              size="large"
              showLabel={false}
              showValue={true}
              variant="bar"
              className="flex justify-center"
            />
          </div>
        </div>

        {/* Concept Heat Map */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <ConfusionHeatMap
            concepts={confusionState.conceptConfusion}
            onConceptClick={handleConceptClick}
          />
        </div>

        {/* Confusion History Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">시간대별 혼란도 변화</h3>
          <ConfusionChart
            data={confusionState.confusionHistory}
            variant="area"
            height={300}
            showGrid={true}
          />
        </div>

        {/* Selected Concept Detail */}
        {selectedConcept && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-800">{selectedConcept.conceptName} 상세</h3>
              <button
                onClick={() => setSelectedConceptId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ConfusionIndicator
                  level={selectedConcept.confusionLevel}
                  size="medium"
                  showLabel={true}
                  showValue={true}
                  variant="circle"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">소요 시간:</span>
                  <span className="font-semibold">{Math.round(selectedConcept.metrics.timeSpent)}초</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">시도 횟수:</span>
                  <span className="font-semibold">{selectedConcept.metrics.attemptCount}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">정답 여부:</span>
                  <span className={selectedConcept.metrics.isCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {selectedConcept.metrics.isCorrect ? '정답' : '오답'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">도움 요청:</span>
                  <span className="font-semibold">{selectedConcept.metrics.helpRequestCount}회</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">개념별 학습 기록</h4>
              <ConfusionChart
                data={selectedConcept.history}
                variant="line"
                height={200}
                showGrid={true}
              />
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500">
          마지막 업데이트: {new Date(confusionState.lastUpdated).toLocaleString('ko-KR')}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
