/**
 * Student Dashboard Component
 * Integrates all speed comparison features
 */
import React, { useState } from 'react';
import SpeedComparisonCard from './SpeedComparisonCard';
import SpeedTrendChart from './SpeedTrendChart';
import CohortLeaderboard from './CohortLeaderboard';
import './StudentDashboard.css';

interface StudentDashboardProps {
  studentId: string;
  moduleId: string;
  cohortId?: string;
  moduleName?: string;
  showLeaderboard?: boolean;
  showTrends?: boolean;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  studentId,
  moduleId,
  cohortId,
  moduleName = '수학 모듈',
  showLeaderboard = true,
  showTrends = true,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'leaderboard'>('overview');

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          {moduleName}
          <span className="dashboard-subtitle">Learning Analytics Dashboard</span>
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">개요</span>
        </button>

        {showTrends && (
          <button
            className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            <span className="tab-icon">📈</span>
            <span className="tab-label">추이</span>
          </button>
        )}

        {showLeaderboard && (
          <button
            className={`tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <span className="tab-icon">🏆</span>
            <span className="tab-label">순위</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="tab-panel">
            <SpeedComparisonCard
              studentId={studentId}
              moduleId={moduleId}
              cohortId={cohortId}
              showRecommendations={true}
            />

            {showTrends && (
              <div className="preview-section">
                <h3 className="preview-title">최근 학습 추이</h3>
                <SpeedTrendChart
                  studentId={studentId}
                  moduleId={moduleId}
                  cohortId={cohortId}
                  trendDays={7}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && showTrends && (
          <div className="tab-panel">
            <div className="trend-options">
              <h3 className="section-title">학습 속도 상세 분석</h3>
              <p className="section-description">
                시간에 따른 학습 속도 변화를 확인하고 개선 추세를 파악하세요.
              </p>
            </div>

            <SpeedTrendChart
              studentId={studentId}
              moduleId={moduleId}
              cohortId={cohortId}
              trendDays={30}
            />

            {/* Additional trend views could be added here */}
            <div className="trend-insights">
              <h4 className="insights-title">💡 인사이트</h4>
              <ul className="insights-list">
                <li>최근 7일간 학습 속도가 개선되고 있습니다.</li>
                <li>정확도를 유지하면서 속도를 높이는 중입니다.</li>
                <li>반 평균에 비해 안정적인 학습 패턴을 보이고 있습니다.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && showLeaderboard && cohortId && (
          <div className="tab-panel">
            <div className="leaderboard-intro">
              <h3 className="section-title">반 순위</h3>
              <p className="section-description">
                친구들과 함께 학습하며 건강한 경쟁을 즐기세요!
              </p>
            </div>

            <CohortLeaderboard
              cohortId={cohortId}
              moduleId={moduleId}
              limit={20}
              sortBy="overall"
              anonymize={true}
              showCurrentStudent={true}
              currentStudentId={studentId}
            />

            <div className="leaderboard-note">
              <p>
                <strong>참고:</strong> 순위는 학습 속도와 정확도를 종합하여 계산됩니다.
                빠르게 푸는 것도 중요하지만, 정확하게 이해하는 것이 더 중요합니다!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Information */}
      <div className="dashboard-footer">
        <div className="footer-info">
          <span className="info-item">
            👤 학생 ID: {studentId.substring(0, 8)}...
          </span>
          <span className="info-separator">•</span>
          <span className="info-item">
            📚 모듈 ID: {moduleId.substring(0, 8)}...
          </span>
          {cohortId && (
            <>
              <span className="info-separator">•</span>
              <span className="info-item">
                👥 반 ID: {cohortId.substring(0, 8)}...
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
