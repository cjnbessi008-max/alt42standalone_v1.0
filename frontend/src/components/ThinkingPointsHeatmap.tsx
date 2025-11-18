/**
 * ThinkingPointsHeatmap Component
 *
 * Visualizes where students spend the most time and struggle the most
 * within a problem, using a color-coded heatmap.
 *
 * @example
 * ```tsx
 * <ThinkingPointsHeatmap
 *   problemId="uuid"
 *   moduleId="uuid"
 *   viewMode="teacher" // or "student"
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';
import { thinkingPointsAPI } from '../api/thinkingPoints';

// ============================================================================
// TYPES
// ============================================================================

interface HeatmapSection {
  section_identifier: string;
  section_type: string;
  avg_time_seconds: number;
  median_time_seconds: number;
  struggle_rate: number;
  total_students: number;
  needs_attention: boolean;
  difficulty_score: number;
}

interface HeatmapData {
  problem_id: string;
  sections: HeatmapSection[];
  overall_difficulty: number;
  high_struggle_sections: string[];
}

interface ThinkingPointsHeatmapProps {
  problemId: string;
  moduleId: string;
  viewMode: 'teacher' | 'student';
  studentId?: string; // Required if viewMode is 'student'
  onSectionClick?: (sectionId: string) => void;
  showLabels?: boolean;
  colorScheme?: 'time' | 'struggle' | 'difficulty';
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ThinkingPointsHeatmap: React.FC<ThinkingPointsHeatmapProps> = ({
  problemId,
  moduleId,
  viewMode,
  studentId,
  onSectionClick,
  showLabels = true,
  colorScheme = 'difficulty'
}) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    const fetchHeatmapData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await thinkingPointsAPI.getHeatmap(moduleId, problemId);
        setHeatmapData(data);
      } catch (err) {
        setError('Failed to load thinking points data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [problemId, moduleId]);

  // ============================================================================
  // COLOR CALCULATION
  // ============================================================================

  const getColorForValue = (section: HeatmapSection): string => {
    let value: number;

    switch (colorScheme) {
      case 'time':
        // Normalize time to 0-1 range (assuming max 300 seconds = 5 minutes)
        value = Math.min(section.avg_time_seconds / 300, 1);
        break;
      case 'struggle':
        value = section.struggle_rate;
        break;
      case 'difficulty':
      default:
        // Normalize difficulty score to 0-1 range (assuming max 100)
        value = Math.min(section.difficulty_score / 100, 1);
        break;
    }

    // Color gradient from green (low) to yellow (medium) to red (high)
    if (value < 0.33) {
      // Green to yellow
      const r = Math.floor(255 * (value / 0.33));
      const g = 255;
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    } else if (value < 0.66) {
      // Yellow to orange
      const r = 255;
      const g = Math.floor(255 * (1 - (value - 0.33) / 0.33));
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Orange to red
      const r = 255;
      const g = Math.floor(100 * (1 - (value - 0.66) / 0.34));
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const getIntensity = (section: HeatmapSection): number => {
    switch (colorScheme) {
      case 'time':
        return Math.min(section.avg_time_seconds / 300, 1);
      case 'struggle':
        return section.struggle_rate;
      case 'difficulty':
      default:
        return Math.min(section.difficulty_score / 100, 1);
    }
  };

  // ============================================================================
  // FORMATTING HELPERS
  // ============================================================================

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}초`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${minutes}분 ${secs}초`;
    }
  };

  const formatSectionName = (identifier: string): string => {
    // Convert snake_case to Title Case
    return identifier
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  if (loading) {
    return (
      <div className="thinking-points-heatmap loading">
        <div className="spinner">Loading heatmap data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="thinking-points-heatmap error">
        <p>{error}</p>
      </div>
    );
  }

  if (!heatmapData || heatmapData.sections.length === 0) {
    return (
      <div className="thinking-points-heatmap empty">
        <p>아직 데이터가 충분하지 않습니다. 문제를 풀면 고민한 지점이 표시됩니다.</p>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const maxValue = Math.max(...heatmapData.sections.map(s => getIntensity(s)));

  return (
    <div className="thinking-points-heatmap">
      <div className="heatmap-header">
        <h3>고민한 지점 분석</h3>
        <div className="overall-stats">
          <span className="stat">
            전체 난이도: <strong>{heatmapData.overall_difficulty.toFixed(1)}</strong>
          </span>
          {viewMode === 'teacher' && (
            <span className="stat">
              어려워하는 섹션: <strong>{heatmapData.high_struggle_sections.length}개</strong>
            </span>
          )}
        </div>
      </div>

      <div className="heatmap-legend">
        <span className="legend-label">쉬움</span>
        <div className="legend-gradient"></div>
        <span className="legend-label">어려움</span>
      </div>

      <div className="heatmap-grid">
        {heatmapData.sections.map((section, index) => {
          const intensity = getIntensity(section);
          const relativeIntensity = maxValue > 0 ? intensity / maxValue : 0;

          return (
            <div
              key={section.section_identifier}
              className={`heatmap-cell ${section.needs_attention ? 'needs-attention' : ''}`}
              style={{
                backgroundColor: getColorForValue(section),
                opacity: 0.5 + relativeIntensity * 0.5
              }}
              onClick={() => onSectionClick?.(section.section_identifier)}
              role="button"
              tabIndex={0}
              aria-label={`${formatSectionName(section.section_identifier)}: ${formatTime(section.avg_time_seconds)}`}
            >
              {showLabels && (
                <div className="cell-content">
                  <div className="section-name">{formatSectionName(section.section_identifier)}</div>
                  <div className="section-stats">
                    <div className="stat-row">
                      <span className="stat-label">평균 시간:</span>
                      <span className="stat-value">{formatTime(section.avg_time_seconds)}</span>
                    </div>
                    {viewMode === 'teacher' && (
                      <>
                        <div className="stat-row">
                          <span className="stat-label">학생 수:</span>
                          <span className="stat-value">{section.total_students}명</span>
                        </div>
                        <div className="stat-row">
                          <span className="stat-label">어려움 비율:</span>
                          <span className="stat-value">{(section.struggle_rate * 100).toFixed(0)}%</span>
                        </div>
                      </>
                    )}
                  </div>
                  {section.needs_attention && (
                    <div className="attention-badge">⚠️ 주의 필요</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {viewMode === 'teacher' && heatmapData.high_struggle_sections.length > 0 && (
        <div className="struggle-summary">
          <h4>학생들이 어려워하는 부분:</h4>
          <ul>
            {heatmapData.high_struggle_sections.slice(0, 5).map(sectionId => (
              <li key={sectionId}>{formatSectionName(sectionId)}</li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .thinking-points-heatmap {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .heatmap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .heatmap-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }

        .overall-stats {
          display: flex;
          gap: 20px;
        }

        .overall-stats .stat {
          font-size: 14px;
          color: #666;
        }

        .overall-stats .stat strong {
          color: #333;
          font-weight: 600;
        }

        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .legend-label {
          font-size: 12px;
          color: #666;
        }

        .legend-gradient {
          flex: 1;
          height: 20px;
          background: linear-gradient(to right, rgb(0, 255, 0), rgb(255, 255, 0), rgb(255, 100, 0), rgb(255, 0, 0));
          border-radius: 4px;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .heatmap-cell {
          position: relative;
          min-height: 120px;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          border: 2px solid transparent;
        }

        .heatmap-cell:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: #333;
        }

        .heatmap-cell.needs-attention {
          border-color: #ff4444;
          border-width: 3px;
        }

        .cell-content {
          color: #fff;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }

        .section-name {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .section-stats {
          font-size: 12px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .stat-label {
          opacity: 0.9;
        }

        .stat-value {
          font-weight: 600;
        }

        .attention-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(255, 68, 68, 0.9);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        .struggle-summary {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 16px;
          margin-top: 20px;
        }

        .struggle-summary h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #856404;
        }

        .struggle-summary ul {
          margin: 0;
          padding-left: 20px;
        }

        .struggle-summary li {
          color: #856404;
          margin-bottom: 4px;
        }

        .loading, .error, .empty {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .spinner {
          font-size: 16px;
        }

        .error {
          color: #d32f2f;
        }
      `}</style>
    </div>
  );
};

export default ThinkingPointsHeatmap;
