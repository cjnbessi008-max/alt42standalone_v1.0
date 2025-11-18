import type { Summary } from '../types';
import { CheckCircle, XCircle, Clock, Target } from 'lucide-react';

interface SummaryCardProps {
  summary: Summary;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  const stats = [
    {
      label: '총 문제 수',
      value: summary.totalProblems,
      icon: Target,
      color: '#3b82f6',
    },
    {
      label: '정답',
      value: summary.correctCount,
      icon: CheckCircle,
      color: '#10b981',
    },
    {
      label: '오답',
      value: summary.incorrectCount,
      icon: XCircle,
      color: '#ef4444',
    },
    {
      label: '정답률',
      value: `${summary.accuracyRate.toFixed(1)}%`,
      icon: Target,
      color: summary.accuracyRate >= 80 ? '#10b981' : summary.accuracyRate >= 50 ? '#f59e0b' : '#ef4444',
    },
    {
      label: '소요 시간',
      value: `${summary.totalTimeMinutes}분`,
      icon: Clock,
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="grid grid-cols-5" style={{ gap: '1rem' }}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="card"
            style={{
              textAlign: 'center',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <Icon size={32} color={stat.color} />
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: stat.color,
                marginBottom: '0.25rem',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {stat.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
