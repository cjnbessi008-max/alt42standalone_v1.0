import React, { useState, useEffect } from 'react';
import { UnderstandingBar, UnderstandingBarCompact } from '../components/UnderstandingBar';
import { understandingService } from '../services/understandingService';
import { UnderstandingData, UnderstandingMetrics } from '../types/understanding';
import './StudentDashboard.css';

/**
 * Student Dashboard Page
 * 학생용 대시보드 - LMS와 연동하여 이해도를 표시
 */

interface Module {
  id: string;
  name: string;
  description: string;
}

export const StudentDashboard: React.FC = () => {
  // State
  const [studentId] = useState<string>('student-001'); // In real app, get from auth context
  const [modules] = useState<Module[]>([
    { id: 'module-001', name: '분수의 이해', description: '분수의 기본 개념과 연산' },
    { id: 'module-002', name: '소수와 분수', description: '소수와 분수의 관계' },
    { id: 'module-003', name: '분수의 곱셈', description: '분수의 곱셈 원리와 응용' }
  ]);
  const [understandingData, setUnderstandingData] = useState<Record<string, UnderstandingData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Fetch understanding data for all modules
  useEffect(() => {
    const fetchUnderstandingData = async () => {
      setLoading(true);
      try {
        const data: Record<string, UnderstandingData> = {};

        // For demo purposes, using mock data
        // In production, replace with real API calls
        for (const module of modules) {
          const understanding = await understandingService.getMockUnderstandingData(
            studentId,
            module.id
          );
          data[module.id] = understanding;
        }

        setUnderstandingData(data);
      } catch (error) {
        console.error('Failed to fetch understanding data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnderstandingData();
  }, [studentId, modules]);

  // Simulate progress update
  const handleSimulateProgress = async (moduleId: string) => {
    try {
      // Simulate metrics improvement
      const mockMetrics: Partial<UnderstandingMetrics> = {
        accuracy: Math.floor(Math.random() * 100),
        problemsAttempted: Math.floor(Math.random() * 20) + 5,
        consistencyScore: Math.floor(Math.random() * 100)
      };

      const updated = await understandingService.updateUnderstandingLevel({
        studentId,
        moduleId,
        metrics: mockMetrics
      });

      setUnderstandingData(prev => ({
        ...prev,
        [moduleId]: updated
      }));

      alert('이해도가 업데이트되었습니다!');
    } catch (error) {
      console.error('Failed to update understanding:', error);
    }
  };

  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <header className="dashboard-header">
        <h1>학습 대시보드</h1>
        <p className="subtitle">나의 학습 진도와 이해도를 확인하세요</p>
      </header>

      {/* Module Cards with Understanding Bars */}
      <div className="modules-grid">
        {modules.map(module => {
          const understanding = understandingData[module.id];

          return (
            <div
              key={module.id}
              className={`module-card ${selectedModule === module.id ? 'selected' : ''}`}
              onClick={() => setSelectedModule(module.id)}
            >
              <div className="module-card-header">
                <h3>{module.name}</h3>
                <UnderstandingBarCompact level={understanding?.level || 1} />
              </div>

              <p className="module-description">{module.description}</p>

              {understanding && (
                <div className="module-understanding">
                  <UnderstandingBar
                    level={understanding.level}
                    showLabel={true}
                    showDescription={true}
                    animate={true}
                    size="medium"
                  />

                  {understanding.history && understanding.history.length > 0 && (
                    <div className="understanding-progress">
                      <small>
                        마지막 업데이트: {understanding.updatedAt.toLocaleDateString('ko-KR')}
                      </small>
                    </div>
                  )}
                </div>
              )}

              <div className="module-actions">
                <button
                  className="btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSimulateProgress(module.id);
                  }}
                >
                  학습 진행
                </button>
                <button
                  className="btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedModule(selectedModule === module.id ? null : module.id);
                  }}
                >
                  상세 보기
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed View */}
      {selectedModule && understandingData[selectedModule] && (
        <div className="module-detail-panel">
          <div className="panel-header">
            <h2>
              {modules.find(m => m.id === selectedModule)?.name} - 상세 정보
            </h2>
            <button
              className="btn-close"
              onClick={() => setSelectedModule(null)}
            >
              ✕
            </button>
          </div>

          <div className="panel-content">
            <UnderstandingBar
              level={understandingData[selectedModule].level}
              showLabel={true}
              showDescription={true}
              animate={false}
              size="large"
            />

            {understandingData[selectedModule].history && (
              <div className="understanding-history">
                <h3>이해도 변화 기록</h3>
                <ul>
                  {understandingData[selectedModule].history?.map((entry, index) => (
                    <li key={index}>
                      <span className="history-date">
                        {entry.achievedAt.toLocaleDateString('ko-KR')}
                      </span>
                      <span className="history-level">레벨 {entry.level}</span>
                      <span className="history-trigger">({entry.trigger})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="recommendations">
              <h3>추천 학습 활동</h3>
              <ul>
                {understandingData[selectedModule].level === 1 && (
                  <>
                    <li>기본 개념 영상 시청</li>
                    <li>기초 문제 5개 이상 풀이</li>
                    <li>개념 노트 정리하기</li>
                  </>
                )}
                {understandingData[selectedModule].level === 2 && (
                  <>
                    <li>응용 문제 도전하기</li>
                    <li>심화 개념 학습</li>
                    <li>유사 문제 반복 연습</li>
                  </>
                )}
                {understandingData[selectedModule].level === 3 && (
                  <>
                    <li>고난도 문제 풀이</li>
                    <li>다른 학생 멘토링</li>
                    <li>다음 단원으로 진행</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Overall Progress Summary */}
      <div className="progress-summary">
        <h2>전체 학습 현황</h2>
        <div className="summary-stats">
          <div className="stat-card">
            <span className="stat-label">총 모듈</span>
            <span className="stat-value">{modules.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">숙달 모듈</span>
            <span className="stat-value">
              {Object.values(understandingData).filter(d => d.level === 3).length}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">평균 레벨</span>
            <span className="stat-value">
              {Object.values(understandingData).length > 0
                ? (
                    Object.values(understandingData).reduce((sum, d) => sum + d.level, 0) /
                    Object.values(understandingData).length
                  ).toFixed(1)
                : '0.0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
