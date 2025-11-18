import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../services/api'

export default function StudentDashboard() {
  // In real app, get student ID from authentication
  const [studentId] = useState('student-1') // Mock

  const { data: performance, isLoading } = useQuery({
    queryKey: ['student-performance', studentId],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return {
        full_name: '김지우',
        total_sessions: 12,
        total_peak_periods: 8,
        avg_peak_score: 0.856,
        total_learning_time_sec: 3600,
      }
    },
  })

  const { data: recentPeaks } = useQuery({
    queryKey: ['student-peaks', studentId],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: '1',
          period_start: '2024-11-18T10:15:00',
          duration_sec: 180,
          peak_score: 0.92,
          peak_quality: 'excellent',
          problem_title: '분수 덧셈',
        },
        {
          id: '2',
          period_start: '2024-11-17T14:20:00',
          duration_sec: 145,
          peak_score: 0.78,
          peak_quality: 'good',
          problem_title: '분수 개념',
        },
      ]
    },
  })

  if (isLoading) {
    return <div className="loading">로딩 중...</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">학생 대시보드</h1>
        <p className="dashboard-subtitle">안녕하세요, {performance?.full_name}님!</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">총 학습 세션</div>
          <div className="stat-value">
            {performance?.total_sessions}
            <span className="stat-unit">회</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">사고 전성기 구간</div>
          <div className="stat-value">
            {performance?.total_peak_periods}
            <span className="stat-unit">구간</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">평균 집중도 점수</div>
          <div className="stat-value">
            {((performance?.avg_peak_score || 0) * 100).toFixed(0)}
            <span className="stat-unit">점</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">총 학습 시간</div>
          <div className="stat-value">
            {Math.floor((performance?.total_learning_time_sec || 0) / 60)}
            <span className="stat-unit">분</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">최근 사고 전성기 구간</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {recentPeaks?.map((peak: any) => (
            <div
              key={peak.id}
              style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '8px',
                borderLeft: `4px solid ${
                  peak.peak_quality === 'excellent' ? '#27ae60' :
                  peak.peak_quality === 'good' ? '#3498db' : '#95a5a6'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{peak.problem_title}</strong>
                  <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                    {new Date(peak.period_start).toLocaleString('ko-KR')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
                    {(peak.peak_score * 100).toFixed(0)}점
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                    {peak.duration_sec}초 집중
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
