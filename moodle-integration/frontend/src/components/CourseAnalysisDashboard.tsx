/**
 * 코스 분석 대시보드 컴포넌트
 * 코스 전체 학생의 추론 vs 계산 능력 분포 시각화
 */
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface CoursePerformance {
  course_id: number;
  course_name: string;
  total_students: number;
  total_questions: number;
  reasoning_questions: number;
  calculation_questions: number;
  reasoning_strong_count: number;
  calculation_strong_count: number;
  balanced_count: number;
  avg_reasoning_score: number;
  avg_calculation_score: number;
  avg_overall_score: number;
  score_distribution: Record<string, number>;
  top_performers: Array<{
    student_id: number;
    name: string;
    score: number;
    strength: string;
  }>;
  struggling_students: Array<{
    student_id: number;
    name: string;
    score: number;
    weak_topics: string[];
  }>;
}

const COLORS = {
  reasoning: '#3b82f6',
  calculation: '#10b981',
  balanced: '#f59e0b',
  pie: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
};

export const CourseAnalysisDashboard: React.FC<{ courseId: number }> = ({ courseId }) => {
  const [data, setData] = useState<CoursePerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourseAnalysis();
  }, [courseId]);

  const fetchCourseAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analyze/course/${courseId}`);
      if (!response.ok) throw new Error('코스 분석 데이터를 불러올 수 없습니다');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">코스 분석 중...</div>;
  if (error) return <div className="error">오류: {error}</div>;
  if (!data) return <div>데이터 없음</div>;

  // 학생 강점 분포 데이터
  const strengthDistribution = [
    { name: '추론 강점', value: data.reasoning_strong_count, color: COLORS.reasoning },
    { name: '계산 강점', value: data.calculation_strong_count, color: COLORS.calculation },
    { name: '균형잡힘', value: data.balanced_count, color: COLORS.balanced }
  ];

  // 점수 분포 데이터
  const scoreDistData = Object.entries(data.score_distribution).map(([range, count]) => ({
    range,
    학생수: count
  }));

  // 평균 점수 비교
  const avgScoreData = [
    { category: '추론', 평균점수: data.avg_reasoning_score },
    { category: '계산', 평균점수: data.avg_calculation_score },
    { category: '전체', 평균점수: data.avg_overall_score }
  ];

  // 문제 유형 분포
  const questionTypeData = [
    { name: '추론 문제', value: data.reasoning_questions },
    { name: '계산 문제', value: data.calculation_questions }
  ];

  return (
    <div className="course-dashboard">
      {/* 헤더 */}
      <div className="dashboard-header">
        <h1>{data.course_name}</h1>
        <p style={{ color: '#6b7280', marginTop: '8px' }}>
          전체 학생 수: {data.total_students}명 | 전체 문제 수: {data.total_questions}개
        </p>
      </div>

      {/* 주요 통계 카드 */}
      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginTop: '24px'
      }}>
        <StatCard
          title="전체 학생"
          value={data.total_students}
          icon="👥"
          color="#3b82f6"
        />
        <StatCard
          title="추론 강점 학생"
          value={data.reasoning_strong_count}
          subtitle={`${((data.reasoning_strong_count / data.total_students) * 100).toFixed(1)}%`}
          icon="🧠"
          color="#3b82f6"
        />
        <StatCard
          title="계산 강점 학생"
          value={data.calculation_strong_count}
          subtitle={`${((data.calculation_strong_count / data.total_students) * 100).toFixed(1)}%`}
          icon="🔢"
          color="#10b981"
        />
        <StatCard
          title="균형잡힌 학생"
          value={data.balanced_count}
          subtitle={`${((data.balanced_count / data.total_students) * 100).toFixed(1)}%`}
          icon="⚖️"
          color="#f59e0b"
        />
        <StatCard
          title="평균 추론 점수"
          value={`${data.avg_reasoning_score.toFixed(1)}%`}
          color="#3b82f6"
        />
        <StatCard
          title="평균 계산 점수"
          value={`${data.avg_calculation_score.toFixed(1)}%`}
          color="#10b981"
        />
      </div>

      {/* 차트 그리드 */}
      <div className="charts-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginTop: '32px'
      }}>
        {/* 학생 강점 분포 파이 차트 */}
        <div className="chart-card">
          <h3>학생 강점 영역 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={strengthDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.name}: ${entry.value}명`}
              >
                {strengthDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 문제 유형 분포 */}
        <div className="chart-card">
          <h3>문제 유형 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={questionTypeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.name}: ${entry.value}개`}
              >
                <Cell fill={COLORS.reasoning} />
                <Cell fill={COLORS.calculation} />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 평균 점수 비교 */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <h3>카테고리별 평균 점수</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgScoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="평균점수" fill={COLORS.reasoning} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 점수 분포 */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <h3>학생 점수 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="학생수" fill={COLORS.balanced} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상위/하위 학생 리스트 */}
      <div className="student-lists" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginTop: '32px'
      }}>
        {/* 상위 학생 */}
        <div className="student-list-card" style={{
          padding: '20px',
          backgroundColor: '#ecfdf5',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#059669' }}>🏆 상위 학생 (Top 5)</h3>
          <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #d1fae5' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>순위</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>이름</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>점수</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>강점</th>
              </tr>
            </thead>
            <tbody>
              {data.top_performers.map((student, index) => (
                <tr key={student.student_id} style={{ borderBottom: '1px solid #d1fae5' }}>
                  <td style={{ padding: '8px' }}>{index + 1}</td>
                  <td style={{ padding: '8px' }}>{student.name}</td>
                  <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>
                    {student.score.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: student.strength === 'reasoning' ? '#dbeafe' :
                                      student.strength === 'calculation' ? '#d1fae5' : '#fed7aa',
                      color: student.strength === 'reasoning' ? '#1e40af' :
                             student.strength === 'calculation' ? '#065f46' : '#9a3412'
                    }}>
                      {student.strength === 'reasoning' ? '추론' :
                       student.strength === 'calculation' ? '계산' : '균형'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 도움 필요 학생 */}
        <div className="student-list-card" style={{
          padding: '20px',
          backgroundColor: '#fef2f2',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#dc2626' }}>⚠️ 도움이 필요한 학생</h3>
          {data.struggling_students.length > 0 ? (
            <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #fecaca' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>이름</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>점수</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>약점 토픽</th>
                </tr>
              </thead>
              <tbody>
                {data.struggling_students.map((student) => (
                  <tr key={student.student_id} style={{ borderBottom: '1px solid #fecaca' }}>
                    <td style={{ padding: '8px' }}>{student.name}</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold', color: '#dc2626' }}>
                      {student.score.toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px', fontSize: '12px', color: '#991b1b' }}>
                      {student.weak_topics.slice(0, 2).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#6b7280', marginTop: '16px' }}>
              모든 학생이 양호한 성과를 보이고 있습니다! 👍
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// 통계 카드 컴포넌트
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <div style={{
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    borderLeft: `4px solid ${color}`
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>{title}</p>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color }}>{value}</div>
        {subtitle && <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px' }}>{subtitle}</p>}
      </div>
      {icon && <span style={{ fontSize: '36px', opacity: 0.7 }}>{icon}</span>}
    </div>
  </div>
);

export default CourseAnalysisDashboard;
