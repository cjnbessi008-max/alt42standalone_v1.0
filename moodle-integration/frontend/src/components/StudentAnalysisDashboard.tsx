/**
 * 학생 분석 대시보드 컴포넌트
 * 추론 vs 계산 능력 시각화
 */
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface StudentPerformance {
  student_id: number;
  student_name: string;
  reasoning_score: number;
  reasoning_attempts: number;
  reasoning_accuracy: number;
  calculation_score: number;
  calculation_attempts: number;
  calculation_accuracy: number;
  strength_area: 'reasoning' | 'calculation' | 'balanced' | 'insufficient_data';
  overall_score: number;
  insights: string;
  recommendations: string;
  learning_trend: {
    trend: string;
    data_points: Array<{
      week: string;
      accuracy: number;
      attempts: number;
    }>;
  };
  weak_topics: string[];
  strong_topics: string[];
}

const COLORS = {
  reasoning: '#3b82f6',  // 파랑
  calculation: '#10b981',  // 초록
  balanced: '#f59e0b',  // 주황
  weak: '#ef4444',  // 빨강
  strong: '#8b5cf6'  // 보라
};

export const StudentAnalysisDashboard: React.FC<{ studentId: number }> = ({ studentId }) => {
  const [data, setData] = useState<StudentPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentAnalysis();
  }, [studentId]);

  const fetchStudentAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analyze/student/${studentId}`);
      if (!response.ok) throw new Error('분석 데이터를 불러올 수 없습니다');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">분석 데이터 로딩 중...</div>;
  if (error) return <div className="error">오류: {error}</div>;
  if (!data) return <div>데이터 없음</div>;

  // 차트 데이터 준비
  const comparisonData = [
    {
      category: '추론 (Reasoning)',
      점수: data.reasoning_score,
      시도수: data.reasoning_attempts,
      정확도: data.reasoning_accuracy
    },
    {
      category: '계산 (Calculation)',
      점수: data.calculation_score,
      시도수: data.calculation_attempts,
      정확도: data.calculation_accuracy
    }
  ];

  const radarData = [
    { subject: '추론 능력', value: data.reasoning_score },
    { subject: '계산 능력', value: data.calculation_score },
    { subject: '전체 성과', value: data.overall_score },
    { subject: '추론 정확도', value: data.reasoning_accuracy },
    { subject: '계산 정확도', value: data.calculation_accuracy }
  ];

  const strengthLabel = {
    reasoning: '추론에 강함',
    calculation: '계산에 강함',
    balanced: '균형잡힌 능력',
    insufficient_data: '데이터 부족'
  }[data.strength_area];

  return (
    <div className="dashboard-container">
      {/* 헤더 */}
      <div className="dashboard-header">
        <h1>{data.student_name}의 학습 분석</h1>
        <div className="strength-badge" style={{
          backgroundColor: COLORS[data.strength_area] || '#666',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          display: 'inline-block',
          marginTop: '10px'
        }}>
          강점 영역: {strengthLabel}
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="metrics-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        <MetricCard
          title="추론 점수"
          value={`${data.reasoning_score.toFixed(1)}%`}
          subtitle={`${data.reasoning_correct}/${data.reasoning_attempts} 정답`}
          color={COLORS.reasoning}
        />
        <MetricCard
          title="계산 점수"
          value={`${data.calculation_score.toFixed(1)}%`}
          subtitle={`${data.calculation_correct}/${data.calculation_attempts} 정답`}
          color={COLORS.calculation}
        />
        <MetricCard
          title="전체 점수"
          value={`${data.overall_score.toFixed(1)}%`}
          subtitle="평균 성과"
          color={COLORS.balanced}
        />
        <MetricCard
          title="점수 차이"
          value={`${data.strength_score_diff.toFixed(1)}%`}
          subtitle="추론 vs 계산"
          color="#6b7280"
        />
      </div>

      {/* 차트 섹션 */}
      <div className="charts-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '30px',
        marginTop: '30px'
      }}>
        {/* 비교 막대 차트 */}
        <div className="chart-container">
          <h3>추론 vs 계산 비교</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="점수" fill={COLORS.reasoning} />
              <Bar dataKey="정확도" fill={COLORS.calculation} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 레이더 차트 */}
        <div className="chart-container">
          <h3>종합 능력 프로필</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="점수"
                dataKey="value"
                stroke={COLORS.reasoning}
                fill={COLORS.reasoning}
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 학습 추이 */}
        {data.learning_trend.data_points.length > 0 && (
          <div className="chart-container" style={{ gridColumn: '1 / -1' }}>
            <h3>학습 추이 (주간별 정확도)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.learning_trend.data_points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke={COLORS.reasoning}
                  strokeWidth={2}
                  name="정확도 (%)"
                />
              </LineChart>
            </ResponsiveContainer>
            <p style={{ marginTop: '10px', color: '#666' }}>
              추세: {
                data.learning_trend.trend === 'improving' ? '📈 향상 중' :
                data.learning_trend.trend === 'declining' ? '📉 하락 중' :
                '➡️ 안정적'
              }
            </p>
          </div>
        )}
      </div>

      {/* 토픽 분석 */}
      <div className="topics-section" style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="topic-card" style={{ padding: '20px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
          <h3 style={{ color: COLORS.weak }}>약점 토픽</h3>
          {data.weak_topics.length > 0 ? (
            <ul>
              {data.weak_topics.map((topic, i) => (
                <li key={i} style={{ marginTop: '8px' }}>{topic}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#666' }}>약점 토픽이 없습니다!</p>
          )}
        </div>

        <div className="topic-card" style={{ padding: '20px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
          <h3 style={{ color: COLORS.strong }}>강점 토픽</h3>
          {data.strong_topics.length > 0 ? (
            <ul>
              {data.strong_topics.map((topic, i) => (
                <li key={i} style={{ marginTop: '8px' }}>{topic}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#666' }}>더 많은 데이터가 필요합니다.</p>
          )}
        </div>
      </div>

      {/* AI 인사이트 및 추천 */}
      <div className="insights-section" style={{ marginTop: '30px' }}>
        <div className="insight-card" style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>💡 분석 인사이트</h3>
          <p style={{ marginTop: '10px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {data.insights}
          </p>
        </div>

        <div className="recommendation-card" style={{ padding: '20px', backgroundColor: '#ecfdf5', borderRadius: '8px' }}>
          <h3>🎯 학습 추천사항</h3>
          <p style={{ marginTop: '10px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {data.recommendations}
          </p>
        </div>
      </div>
    </div>
  );
};

// 메트릭 카드 컴포넌트
const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  color: string;
}> = ({ title, value, subtitle, color }) => (
  <div style={{
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    borderTop: `4px solid ${color}`
  }}>
    <h4 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>{title}</h4>
    <div style={{ fontSize: '32px', fontWeight: 'bold', color }}>{value}</div>
    <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>{subtitle}</p>
  </div>
);

export default StudentAnalysisDashboard;
