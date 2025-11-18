/**
 * Concept Understanding Heatmap Component
 * Visualizes student understanding scores across different concepts
 */

import React, { useState, useEffect } from 'react';
import '../styles/ConceptHeatmap.css';

interface HeatmapCell {
  conceptId: string | null;
  score: number;
  masteryLevel: string;
  attemptsCount: number;
  lastInteractionAt: Date | null;
}

interface HeatmapRow {
  studentId: string;
  scores: HeatmapCell[];
}

interface HeatmapData {
  moduleId: string;
  concepts: string[];
  students: string[];
  matrix: HeatmapRow[];
}

interface ConceptHeatmapProps {
  moduleId: string;
  studentIds?: string[];
  onCellClick?: (studentId: string, conceptName: string, data: HeatmapCell) => void;
  showStudentNames?: boolean;
  showScores?: boolean;
  colorScheme?: 'red-green' | 'blue-yellow' | 'grayscale';
  height?: string;
}

export const ConceptHeatmap: React.FC<ConceptHeatmapProps> = ({
  moduleId,
  studentIds,
  onCellClick,
  showStudentNames = true,
  showScores = true,
  colorScheme = 'red-green',
  height = '600px'
}) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    fetchHeatmapData();
  }, [moduleId, studentIds]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      const studentIdsParam = studentIds ? `?studentIds=${studentIds.join(',')}` : '';
      const response = await fetch(`/api/heatmap/${moduleId}${studentIdsParam}`);

      if (!response.ok) {
        throw new Error('Failed to fetch heatmap data');
      }

      const result = await response.json();
      if (result.success) {
        setHeatmapData(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load heatmap');
    } finally {
      setLoading(false);
    }
  };

  const getCellColor = (score: number, masteryLevel: string): string => {
    if (score === 0 && masteryLevel === 'not_started') {
      return colorScheme === 'grayscale' ? '#f5f5f5' : '#ffffff';
    }

    switch (colorScheme) {
      case 'red-green':
        if (score >= 90) return '#4caf50'; // Green - Mastered
        if (score >= 80) return '#8bc34a'; // Light green - Proficient
        if (score >= 60) return '#ffeb3b'; // Yellow - Developing
        if (score >= 40) return '#ff9800'; // Orange - Struggling
        return '#f44336'; // Red - Not started/Very low

      case 'blue-yellow':
        if (score >= 90) return '#2196f3'; // Blue - Mastered
        if (score >= 80) return '#64b5f6'; // Light blue - Proficient
        if (score >= 60) return '#fff59d'; // Light yellow - Developing
        if (score >= 40) return '#ffeb3b'; // Yellow - Struggling
        return '#ffccbc'; // Light orange - Not started/Very low

      case 'grayscale':
        const intensity = Math.floor((score / 100) * 200) + 55; // 55-255 range
        return `rgb(${intensity}, ${intensity}, ${intensity})`;

      default:
        return '#e0e0e0';
    }
  };

  const getTextColor = (score: number): string => {
    if (colorScheme === 'grayscale') {
      return score > 50 ? '#000000' : '#666666';
    }
    return score > 60 ? '#000000' : '#000000';
  };

  const handleCellClick = (row: number, col: number) => {
    if (!heatmapData) return;

    const studentId = heatmapData.students[row];
    const conceptName = heatmapData.concepts[col];
    const cellData = heatmapData.matrix[row].scores[col];

    setSelectedCell({ row, col });

    if (onCellClick) {
      onCellClick(studentId, conceptName, cellData);
    }
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

  if (loading) {
    return (
      <div className="heatmap-loading">
        <div className="spinner"></div>
        <p>히트맵 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="heatmap-error">
        <p>오류: {error}</p>
        <button onClick={fetchHeatmapData}>다시 시도</button>
      </div>
    );
  }

  if (!heatmapData || heatmapData.matrix.length === 0) {
    return (
      <div className="heatmap-empty">
        <p>표시할 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="concept-heatmap-container">
      <div className="heatmap-header">
        <h3>개념 이해도 히트맵</h3>
        <div className="heatmap-legend">
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: getCellColor(95, 'mastered') }}></span>
            완전 습득 (90-100%)
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: getCellColor(85, 'proficient') }}></span>
            능숙 (80-89%)
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: getCellColor(70, 'developing') }}></span>
            발전 중 (60-79%)
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: getCellColor(50, 'struggling') }}></span>
            어려움 (40-59%)
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: getCellColor(20, 'not_started') }}></span>
            미흡 ({`<`}40%)
          </span>
        </div>
      </div>

      <div className="heatmap-wrapper" style={{ height }}>
        <div className="heatmap-scroll">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th className="header-cell student-header">학생</th>
                {heatmapData.concepts.map((concept, idx) => (
                  <th key={idx} className="header-cell concept-header">
                    <div className="concept-name">{concept}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.matrix.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="student-cell">
                    {showStudentNames ? row.studentId : `학생 ${rowIdx + 1}`}
                  </td>
                  {row.scores.map((cell, colIdx) => (
                    <td
                      key={colIdx}
                      className={`heatmap-cell ${
                        selectedCell?.row === rowIdx && selectedCell?.col === colIdx
                          ? 'selected'
                          : ''
                      }`}
                      style={{
                        backgroundColor: getCellColor(cell.score, cell.masteryLevel),
                        color: getTextColor(cell.score)
                      }}
                      onClick={() => handleCellClick(rowIdx, colIdx)}
                      title={`${heatmapData.concepts[colIdx]}\n점수: ${cell.score.toFixed(1)}%\n상태: ${getMasteryLabel(cell.masteryLevel)}\n시도 횟수: ${cell.attemptsCount}`}
                    >
                      <div className="cell-content">
                        {showScores && (
                          <span className="cell-score">{Math.round(cell.score)}</span>
                        )}
                        {cell.attemptsCount > 0 && (
                          <span className="cell-attempts">({cell.attemptsCount})</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="heatmap-footer">
        <p>총 {heatmapData.students.length}명 학생, {heatmapData.concepts.length}개 개념</p>
      </div>
    </div>
  );
};

export default ConceptHeatmap;
