/**
 * Emotion Volatility Dashboard
 * 감정 기복 시각화 대시보드
 *
 * LMS와 연동하여 학생들의 시간대별 감정 기복을 시각화하는 React 컴포넌트
 */

import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TimeSlot {
  hour: number;
  day_of_week: number;
  label: string;
}

interface EmotionVolatilityMetric {
  time_slot: TimeSlot;
  volatility_score: number;
  avg_intensity: number;
  emotion_distribution: { [key: string]: number };
  sample_count: number;
  volatility_level: 'low' | 'medium' | 'high' | 'extreme';
}

interface VolatilityReport {
  status: string;
  summary: {
    total_timeslots_analyzed: number;
    avg_volatility: number;
    max_volatility: number;
    most_volatile_day: {
      day: string;
      avg_volatility: number;
    };
    most_volatile_hour: {
      hour: string;
      avg_volatility: number;
    };
  };
  top_volatile_timeslots: EmotionVolatilityMetric[];
  volatility_by_day: { [key: string]: number };
  volatility_by_hour: { [key: string]: number };
  recommendations: string[];
}

interface DashboardProps {
  studentId?: string;
  moduleId?: string;
  apiBaseUrl?: string;
}

const EmotionVolatilityDashboard: React.FC<DashboardProps> = ({
  studentId,
  moduleId,
  apiBaseUrl = '/api'
}) => {
  const [report, setReport] = useState<VolatilityReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed'>('overview');

  useEffect(() => {
    fetchVolatilityReport();
  }, [studentId, moduleId]);

  const fetchVolatilityReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (studentId) params.append('student_id', studentId);
      if (moduleId) params.append('module_id', moduleId);

      // const response = await axios.get(
      //   `${apiBaseUrl}/analysis/volatility-report?${params.toString()}`
      // );
      // setReport(response.data);

      // 테스트용 더미 데이터
      setReport(generateDummyReport());
    } catch (err) {
      setError('감정 기복 데이터를 불러오는데 실패했습니다.');
      console.error('Failed to fetch volatility report:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateDummyReport = (): VolatilityReport => {
    return {
      status: 'success',
      summary: {
        total_timeslots_analyzed: 50,
        avg_volatility: 2.8,
        max_volatility: 5.2,
        most_volatile_day: {
          day: 'Wednesday',
          avg_volatility: 3.5
        },
        most_volatile_hour: {
          hour: '14:00',
          avg_volatility: 4.1
        }
      },
      top_volatile_timeslots: [
        {
          time_slot: { hour: 14, day_of_week: 3, label: 'Wednesday 14:00-15:00' },
          volatility_score: 5.2,
          avg_intensity: 7.5,
          emotion_distribution: { frustrated: 8, confused: 5, neutral: 2 },
          sample_count: 15,
          volatility_level: 'extreme'
        },
        {
          time_slot: { hour: 10, day_of_week: 1, label: 'Monday 10:00-11:00' },
          volatility_score: 4.3,
          avg_intensity: 6.2,
          emotion_distribution: { anxious: 7, neutral: 4, happy: 3 },
          sample_count: 14,
          volatility_level: 'high'
        },
        {
          time_slot: { hour: 16, day_of_week: 5, label: 'Friday 16:00-17:00' },
          volatility_score: 3.9,
          avg_intensity: 5.8,
          emotion_distribution: { bored: 9, frustrated: 4, neutral: 2 },
          sample_count: 15,
          volatility_level: 'high'
        }
      ],
      volatility_by_day: {
        Monday: 3.2,
        Tuesday: 2.5,
        Wednesday: 3.5,
        Thursday: 2.8,
        Friday: 3.1
      },
      volatility_by_hour: {
        '09:00': 2.3,
        '10:00': 3.1,
        '11:00': 2.7,
        '14:00': 4.1,
        '15:00': 3.4,
        '16:00': 2.9
      },
      recommendations: [
        '⚠️ Wednesday 14:00-15:00 시간대에 감정 기복이 가장 심합니다 (기복 점수: 5.20).',
        '주요 감정: frustrated (8회), confused (5회). 이 시간대의 학습 난이도나 활동 유형을 조정해보세요.',
        '평균 감정 강도가 높습니다. 학생들이 스트레스를 받고 있을 수 있으니 휴식 시간을 늘리거나 활동의 강도를 낮춰보세요.',
        '⚠️ 극심한 감정 기복이 감지되었습니다. 이 시간대의 학습 환경과 활동을 재검토하는 것을 강력히 권장합니다.'
      ]
    };
  };

  const getVolatilityColor = (level: string): string => {
    const colors = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      extreme: '#9c27b0'
    };
    return colors[level as keyof typeof colors] || '#757575';
  };

  const getVolatilityLabel = (level: string): string => {
    const labels = {
      low: '낮음',
      medium: '보통',
      high: '높음',
      extreme: '극심'
    };
    return labels[level as keyof typeof labels] || '알 수 없음';
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>감정 기복 데이터를 분석하는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !report || report.status !== 'success') {
    return (
      <div className="dashboard-container" style={styles.container}>
        <div style={styles.error}>
          <p>{error || '데이터를 불러올 수 없습니다.'}</p>
          <button onClick={fetchVolatilityReport} style={styles.retryButton}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>감정 기복 분석 대시보드</h1>
        <p style={styles.subtitle}>
          학습 중 학생들의 시간대별 감정 변화를 분석합니다
        </p>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>평균 기복 점수</div>
          <div style={styles.summaryValue}>{report.summary.avg_volatility}</div>
          <div style={styles.summarySubtext}>분석된 {report.summary.total_timeslots_analyzed}개 시간대</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>최대 기복 점수</div>
          <div style={{...styles.summaryValue, color: '#f44336'}}>{report.summary.max_volatility}</div>
          <div style={styles.summarySubtext}>주의가 필요합니다</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>가장 불안정한 요일</div>
          <div style={styles.summaryValue}>{report.summary.most_volatile_day.day}</div>
          <div style={styles.summarySubtext}>평균 {report.summary.most_volatile_day.avg_volatility}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>가장 불안정한 시간</div>
          <div style={styles.summaryValue}>{report.summary.most_volatile_hour.hour}</div>
          <div style={styles.summarySubtext}>평균 {report.summary.most_volatile_hour.avg_volatility}</div>
        </div>
      </div>

      {/* Top Volatile Time Slots */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>감정 기복이 심한 시간대 TOP 5</h2>
        <div style={styles.timeSlotList}>
          {report.top_volatile_timeslots.map((metric, index) => (
            <div key={index} style={styles.timeSlotCard}>
              <div style={styles.timeSlotHeader}>
                <div style={styles.timeSlotRank}>#{index + 1}</div>
                <div style={styles.timeSlotLabel}>{metric.time_slot.label}</div>
                <div
                  style={{
                    ...styles.volatilityBadge,
                    backgroundColor: getVolatilityColor(metric.volatility_level)
                  }}
                >
                  {getVolatilityLabel(metric.volatility_level)}
                </div>
              </div>

              <div style={styles.timeSlotMetrics}>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>기복 점수:</span>
                  <span style={styles.metricValue}>{metric.volatility_score.toFixed(2)}</span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>평균 강도:</span>
                  <span style={styles.metricValue}>{metric.avg_intensity.toFixed(2)}</span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>샘플 수:</span>
                  <span style={styles.metricValue}>{metric.sample_count}</span>
                </div>
              </div>

              <div style={styles.emotionDistribution}>
                <div style={styles.emotionDistributionLabel}>감정 분포:</div>
                <div style={styles.emotionTags}>
                  {Object.entries(metric.emotion_distribution).map(([emotion, count]) => (
                    <span key={emotion} style={styles.emotionTag}>
                      {emotion} ({count})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Volatility by Day */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>요일별 평균 기복</h2>
        <div style={styles.chartContainer}>
          {Object.entries(report.volatility_by_day).map(([day, volatility]) => (
            <div key={day} style={styles.barItem}>
              <div style={styles.barLabel}>{day}</div>
              <div style={styles.barContainer}>
                <div
                  style={{
                    ...styles.bar,
                    width: `${(volatility / 5) * 100}%`,
                    backgroundColor: volatility > 3.5 ? '#f44336' : volatility > 2.5 ? '#ff9800' : '#4caf50'
                  }}
                ></div>
              </div>
              <div style={styles.barValue}>{volatility.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Volatility by Hour */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>시간대별 평균 기복</h2>
        <div style={styles.chartContainer}>
          {Object.entries(report.volatility_by_hour).map(([hour, volatility]) => (
            <div key={hour} style={styles.barItem}>
              <div style={styles.barLabel}>{hour}</div>
              <div style={styles.barContainer}>
                <div
                  style={{
                    ...styles.bar,
                    width: `${(volatility / 5) * 100}%`,
                    backgroundColor: volatility > 3.5 ? '#f44336' : volatility > 2.5 ? '#ff9800' : '#4caf50'
                  }}
                ></div>
              </div>
              <div style={styles.barValue}>{volatility.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>개선 권장사항</h2>
        <div style={styles.recommendationsList}>
          {report.recommendations.map((recommendation, index) => (
            <div key={index} style={styles.recommendationItem}>
              <div style={styles.recommendationIcon}>💡</div>
              <div style={styles.recommendationText}>{recommendation}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div style={styles.footer}>
        <button onClick={fetchVolatilityReport} style={styles.refreshButton}>
          🔄 데이터 새로고침
        </button>
      </div>
    </div>
  );
};

// Inline styles (실제 프로젝트에서는 CSS 파일 또는 styled-components 사용 권장)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    color: '#f44336'
  },
  retryButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px'
  },
  summaryValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: '5px'
  },
  summarySubtext: {
    fontSize: '12px',
    color: '#999'
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px'
  },
  timeSlotList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  timeSlotCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '15px',
    backgroundColor: '#fafafa'
  },
  timeSlotHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '15px'
  },
  timeSlotRank: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#3498db',
    minWidth: '40px'
  },
  timeSlotLabel: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#333',
    flex: 1
  },
  volatilityBadge: {
    padding: '5px 15px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  timeSlotMetrics: {
    display: 'flex',
    gap: '20px',
    marginBottom: '15px'
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  metricLabel: {
    fontSize: '12px',
    color: '#666'
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  emotionDistribution: {
    borderTop: '1px solid #e0e0e0',
    paddingTop: '15px'
  },
  emotionDistributionLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px'
  },
  emotionTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  emotionTag: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: '5px 12px',
    borderRadius: '15px',
    fontSize: '13px'
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  barItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  barLabel: {
    minWidth: '100px',
    fontSize: '14px',
    color: '#333',
    fontWeight: '500'
  },
  barContainer: {
    flex: 1,
    height: '30px',
    backgroundColor: '#e0e0e0',
    borderRadius: '15px',
    overflow: 'hidden'
  },
  bar: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '15px'
  },
  barValue: {
    minWidth: '50px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right'
  },
  recommendationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  recommendationItem: {
    display: 'flex',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '6px'
  },
  recommendationIcon: {
    fontSize: '24px'
  },
  recommendationText: {
    flex: 1,
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.6'
  },
  footer: {
    textAlign: 'center',
    marginTop: '30px'
  },
  refreshButton: {
    padding: '12px 30px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'background-color 0.3s'
  }
};

export default EmotionVolatilityDashboard;
