/**
 * Main App Component
 * 메인 애플리케이션 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import StressDashboard from './components/StressDashboard';
import StressIndicatorCard from './components/StressIndicatorCard';
import { StressIndicator, LearningActivity } from './types';
import stressAPI from './api';
import './App.css';

const App: React.FC = () => {
  const [indicators, setIndicators] = useState<StressIndicator[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  // 샘플 학습 활동 데이터
  const [simulatorData, setSimulatorData] = useState<LearningActivity>({
    student_id: 'student001',
    module_id: 'module001',
    session_id: `session_${Date.now()}`,
    time_spent_minutes: 15,
    problems_attempted: 10,
    problems_correct: 8,
    retry_count: 2,
    average_response_time: 30,
    response_time_trend: 0.1,
  });

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentIndicators();
    }
  }, [selectedStudentId, selectedModuleId]);

  const fetchStudentIndicators = async () => {
    try {
      setLoading(true);
      const data = await stressAPI.getStudentStressIndicators(
        selectedStudentId,
        selectedModuleId || undefined,
        10
      );
      setIndicators(data);
    } catch (error) {
      console.error('스트레스 지표 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    try {
      setLoading(true);
      const indicator = await stressAPI.calculateStress(simulatorData);
      setIndicators([indicator, ...indicators]);
      alert('스트레스 지표가 계산되었습니다!');
    } catch (error) {
      console.error('스트레스 계산 실패:', error);
      alert('스트레스 계산에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>학습 스트레스 지표 시스템</h1>
        <p>Learning Stress Indicator System</p>
      </header>

      <main className="app-main">
        <div className="container">
          {/* 대시보드 */}
          <StressDashboard moduleId={selectedModuleId || undefined} />

          {/* 필터 및 제어 */}
          <div className="controls-section">
            <h3>필터 및 제어</h3>
            <div className="controls-grid">
              <div className="control-group">
                <label htmlFor="studentId">학생 ID:</label>
                <input
                  id="studentId"
                  type="text"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  placeholder="예: student001"
                />
              </div>

              <div className="control-group">
                <label htmlFor="moduleId">모듈 ID (선택):</label>
                <input
                  id="moduleId"
                  type="text"
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  placeholder="예: module001"
                />
              </div>

              <div className="control-group">
                <button
                  className="btn-primary"
                  onClick={fetchStudentIndicators}
                  disabled={!selectedStudentId || loading}
                >
                  조회
                </button>
              </div>

              <div className="control-group">
                <button
                  className="btn-secondary"
                  onClick={() => setShowSimulator(!showSimulator)}
                >
                  {showSimulator ? '시뮬레이터 숨기기' : '시뮬레이터 표시'}
                </button>
              </div>
            </div>
          </div>

          {/* 시뮬레이터 */}
          {showSimulator && (
            <div className="simulator-section">
              <h3>학습 활동 시뮬레이터</h3>
              <div className="simulator-grid">
                <div className="simulator-group">
                  <label>학생 ID:</label>
                  <input
                    type="text"
                    value={simulatorData.student_id}
                    onChange={(e) =>
                      setSimulatorData({ ...simulatorData, student_id: e.target.value })
                    }
                  />
                </div>

                <div className="simulator-group">
                  <label>모듈 ID:</label>
                  <input
                    type="text"
                    value={simulatorData.module_id}
                    onChange={(e) =>
                      setSimulatorData({ ...simulatorData, module_id: e.target.value })
                    }
                  />
                </div>

                <div className="simulator-group">
                  <label>학습 시간 (분):</label>
                  <input
                    type="number"
                    value={simulatorData.time_spent_minutes}
                    onChange={(e) =>
                      setSimulatorData({
                        ...simulatorData,
                        time_spent_minutes: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="simulator-group">
                  <label>시도한 문제 수:</label>
                  <input
                    type="number"
                    value={simulatorData.problems_attempted}
                    onChange={(e) =>
                      setSimulatorData({
                        ...simulatorData,
                        problems_attempted: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="simulator-group">
                  <label>정답 문제 수:</label>
                  <input
                    type="number"
                    value={simulatorData.problems_correct}
                    onChange={(e) =>
                      setSimulatorData({
                        ...simulatorData,
                        problems_correct: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="simulator-group">
                  <label>재시도 횟수:</label>
                  <input
                    type="number"
                    value={simulatorData.retry_count}
                    onChange={(e) =>
                      setSimulatorData({
                        ...simulatorData,
                        retry_count: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="simulator-group">
                  <label>평균 응답 시간 (초):</label>
                  <input
                    type="number"
                    value={simulatorData.average_response_time}
                    onChange={(e) =>
                      setSimulatorData({
                        ...simulatorData,
                        average_response_time: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="simulator-group">
                  <label>응답 시간 추세 (-1 ~ 1):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="-1"
                    max="1"
                    value={simulatorData.response_time_trend}
                    onChange={(e) =>
                      setSimulatorData({
                        ...simulatorData,
                        response_time_trend: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <button className="btn-simulate" onClick={handleSimulate} disabled={loading}>
                스트레스 지표 계산
              </button>
            </div>
          )}

          {/* 스트레스 지표 목록 */}
          <div className="indicators-section">
            <h3>스트레스 지표</h3>
            {loading ? (
              <div className="loading-message">로딩 중...</div>
            ) : indicators.length > 0 ? (
              <div className="indicators-list">
                {indicators.map((indicator, index) => (
                  <StressIndicatorCard key={index} indicator={indicator} />
                ))}
              </div>
            ) : (
              <div className="empty-message">
                스트레스 지표가 없습니다. 학생 ID를 입력하고 조회하거나, 시뮬레이터를 사용하세요.
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 KAIST Touch Math Academy - Learning Stress Indicator System</p>
      </footer>
    </div>
  );
};

export default App;
