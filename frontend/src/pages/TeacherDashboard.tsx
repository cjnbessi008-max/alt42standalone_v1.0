/**
 * Teacher Dashboard
 * Main dashboard for teachers showing module overview and concept heatmap
 */

import React, { useState, useEffect } from 'react';
import ConceptHeatmap from '../components/ConceptHeatmap';
import '../styles/TeacherDashboard.css';

interface Module {
  id: string;
  name: string;
  description: string;
  status: 'generating' | 'active' | 'archived';
  studentCount: number;
  conceptCount: number;
  createdAt: Date;
}

interface ConceptAnalysis {
  conceptId: string;
  conceptName: string;
  avgUnderstandingScore: number;
  strugglingStudents: number;
  masteredStudents: number;
}

interface HeatmapCell {
  conceptId: string | null;
  score: number;
  masteryLevel: string;
  attemptsCount: number;
  lastInteractionAt: Date | null;
}

export const TeacherDashboard: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [conceptAnalysis, setConceptAnalysis] = useState<ConceptAnalysis[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showStudentNames, setShowStudentNames] = useState(true);
  const [showScores, setShowScores] = useState(true);
  const [colorScheme, setColorScheme] = useState<'red-green' | 'blue-yellow' | 'grayscale'>('red-green');
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    studentId: string;
    conceptName: string;
    data: HeatmapCell;
  } | null>(null);

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      fetchConceptAnalysis(selectedModule);
    }
  }, [selectedModule]);

  const fetchModules = async () => {
    // In production, fetch from API
    // Mock data for demonstration
    const mockModules: Module[] = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: '분수 학습 모듈',
        description: '3학년 학생들을 위한 분수 기초 및 연산',
        status: 'active',
        studentCount: 25,
        conceptCount: 10,
        createdAt: new Date('2024-01-15')
      }
    ];

    setModules(mockModules);
    if (mockModules.length > 0) {
      setSelectedModule(mockModules[0].id);
    }
  };

  const fetchConceptAnalysis = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/heatmap/${moduleId}/analysis`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConceptAnalysis(result.data.concepts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch concept analysis:', error);
    }
  };

  const handleCellClick = (studentId: string, conceptName: string, data: HeatmapCell) => {
    setSelectedCellInfo({ studentId, conceptName, data });
  };

  const handleModuleChange = (moduleId: string) => {
    setSelectedModule(moduleId);
    setSelectedCellInfo(null);
  };

  const getMasteryLabel = (masteryLevel: string): string => {
    const labels: Record<string, string> = {
      'mastered': '완전 습득',
      'proficient': '능숙',
      'developing': '발전 중',
      'struggling': '어려움',
      'not_started': '미시작'
    };
    return labels[masteryLevel] || masteryLevel;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '없음';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="teacher-dashboard">
      <header className="dashboard-header">
        <h1>교사 대시보드</h1>
        <p className="subtitle">학생들의 개념 이해도를 한눈에 파악하세요</p>
      </header>

      <div className="dashboard-content">
        {/* Module Selection */}
        <section className="module-selection">
          <h2>모듈 선택</h2>
          <div className="module-cards">
            {modules.map(module => (
              <div
                key={module.id}
                className={`module-card ${selectedModule === module.id ? 'selected' : ''}`}
                onClick={() => handleModuleChange(module.id)}
              >
                <h3>{module.name}</h3>
                <p className="module-description">{module.description}</p>
                <div className="module-stats">
                  <span className="stat">
                    <strong>{module.studentCount}</strong> 학생
                  </span>
                  <span className="stat">
                    <strong>{module.conceptCount}</strong> 개념
                  </span>
                  <span className={`status status-${module.status}`}>
                    {module.status === 'active' ? '활성' : module.status === 'generating' ? '생성 중' : '보관됨'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Heatmap Controls */}
        {selectedModule && (
          <section className="heatmap-controls">
            <h2>히트맵 설정</h2>
            <div className="controls-grid">
              <label className="control-item">
                <input
                  type="checkbox"
                  checked={showStudentNames}
                  onChange={(e) => setShowStudentNames(e.target.checked)}
                />
                학생 이름 표시
              </label>

              <label className="control-item">
                <input
                  type="checkbox"
                  checked={showScores}
                  onChange={(e) => setShowScores(e.target.checked)}
                />
                점수 표시
              </label>

              <label className="control-item">
                색상 테마:
                <select
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value as any)}
                  className="color-scheme-select"
                >
                  <option value="red-green">빨강-초록</option>
                  <option value="blue-yellow">파랑-노랑</option>
                  <option value="grayscale">회색조</option>
                </select>
              </label>
            </div>
          </section>
        )}

        {/* Heatmap Visualization */}
        {selectedModule && (
          <section className="heatmap-section">
            <ConceptHeatmap
              moduleId={selectedModule}
              studentIds={selectedStudents.length > 0 ? selectedStudents : undefined}
              onCellClick={handleCellClick}
              showStudentNames={showStudentNames}
              showScores={showScores}
              colorScheme={colorScheme}
              height="600px"
            />
          </section>
        )}

        {/* Selected Cell Details */}
        {selectedCellInfo && (
          <section className="cell-details">
            <h2>선택된 셀 상세 정보</h2>
            <div className="details-card">
              <div className="detail-row">
                <span className="detail-label">학생:</span>
                <span className="detail-value">{selectedCellInfo.studentId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">개념:</span>
                <span className="detail-value">{selectedCellInfo.conceptName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">이해도 점수:</span>
                <span className="detail-value score-value">
                  {selectedCellInfo.data.score.toFixed(1)}%
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">숙련도:</span>
                <span className={`detail-value mastery-${selectedCellInfo.data.masteryLevel}`}>
                  {getMasteryLabel(selectedCellInfo.data.masteryLevel)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">시도 횟수:</span>
                <span className="detail-value">{selectedCellInfo.data.attemptsCount}회</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">마지막 학습:</span>
                <span className="detail-value">
                  {formatDate(selectedCellInfo.data.lastInteractionAt)}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Concept Analysis */}
        {selectedModule && conceptAnalysis.length > 0 && (
          <section className="concept-analysis">
            <h2>개념별 분석</h2>
            <div className="analysis-table-wrapper">
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>개념</th>
                    <th>평균 이해도</th>
                    <th>어려움을 겪는 학생</th>
                    <th>습득 완료 학생</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {conceptAnalysis
                    .sort((a, b) => a.avgUnderstandingScore - b.avgUnderstandingScore)
                    .map(concept => (
                      <tr key={concept.conceptId}>
                        <td className="concept-name-cell">{concept.conceptName}</td>
                        <td className="score-cell">
                          <div className="score-bar-container">
                            <div
                              className="score-bar"
                              style={{
                                width: `${concept.avgUnderstandingScore}%`,
                                backgroundColor:
                                  concept.avgUnderstandingScore >= 80
                                    ? '#4caf50'
                                    : concept.avgUnderstandingScore >= 60
                                    ? '#ffeb3b'
                                    : '#ff9800'
                              }}
                            />
                            <span className="score-text">
                              {concept.avgUnderstandingScore.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="count-cell">{concept.strugglingStudents}명</td>
                        <td className="count-cell">{concept.masteredStudents}명</td>
                        <td className="status-cell">
                          {concept.avgUnderstandingScore >= 80 ? (
                            <span className="status-badge status-good">양호</span>
                          ) : concept.avgUnderstandingScore >= 60 ? (
                            <span className="status-badge status-warning">주의</span>
                          ) : (
                            <span className="status-badge status-critical">개선 필요</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
