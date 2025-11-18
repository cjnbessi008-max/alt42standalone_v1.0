import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function TeacherDashboard() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['system-overview'],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return {
        total_students: 25,
        total_sessions: 148,
        total_events: 12450,
        total_peak_periods: 89,
        avg_peak_score: 0.762,
      }
    },
  })

  const { data: topPerformers } = useQuery({
    queryKey: ['top-performers'],
    queryFn: async () => {
      return [
        { student_name: '김지우', avg_peak_score: 0.92, total_peak_periods: 12 },
        { student_name: '이서연', avg_peak_score: 0.88, total_peak_periods: 10 },
        { student_name: '박민준', avg_peak_score: 0.85, total_peak_periods: 11 },
        { student_name: '정하은', avg_peak_score: 0.82, total_peak_periods: 9 },
        { student_name: '최시우', avg_peak_score: 0.78, total_peak_periods: 8 },
      ]
    },
  })

  if (isLoading) {
    return <div className="loading">로딩 중...</div>
  }

  const chartData = topPerformers?.map((p: any) => ({
    name: p.student_name,
    점수: (p.avg_peak_score * 100).toFixed(0),
    구간수: p.total_peak_periods,
  }))

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">교사 대시보드</h1>
        <p className="dashboard-subtitle">전체 학생 학습 현황 및 사고 전성기 분석</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">전체 학생</div>
          <div className="stat-value">
            {overview?.total_students}
            <span className="stat-unit">명</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">총 학습 세션</div>
          <div className="stat-value">
            {overview?.total_sessions}
            <span className="stat-unit">회</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">사고 전성기 구간</div>
          <div className="stat-value">
            {overview?.total_peak_periods}
            <span className="stat-unit">구간</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">평균 집중도</div>
          <div className="stat-value">
            {((overview?.avg_peak_score || 0) * 100).toFixed(0)}
            <span className="stat-unit">점</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">우수 학생 (사고 전성기 기준)</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="점수" fill="#667eea" />
            <Bar yAxisId="right" dataKey="구간수" fill="#764ba2" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="section">
        <h2 className="section-title">우수 학생 목록</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e1e8ed' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>순위</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>학생명</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>평균 집중도</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>전성기 구간 수</th>
            </tr>
          </thead>
          <tbody>
            {topPerformers?.map((student: any, index: number) => (
              <tr key={index} style={{ borderBottom: '1px solid #e1e8ed' }}>
                <td style={{ padding: '1rem' }}>#{index + 1}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{student.student_name}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span style={{
                    background: student.avg_peak_score >= 0.85 ? '#27ae60' : '#3498db',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                  }}>
                    {(student.avg_peak_score * 100).toFixed(0)}점
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {student.total_peak_periods}회
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
