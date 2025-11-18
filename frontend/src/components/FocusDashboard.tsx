/**
 * Focus Dashboard Component
 * Displays user's focus analysis and time recommendations
 */
import React, { useEffect, useState } from 'react';
import { analyticsApi, recommendationsApi } from '../services/api';
import type { FocusTrend, RecommendationSummary } from '../types';
import { FocusChart } from './FocusChart';
import { TimeRecommendations } from './TimeRecommendations';

export const FocusDashboard: React.FC = () => {
  const [trends, setTrends] = useState<FocusTrend | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [trendsResponse, recsResponse] = await Promise.all([
        analyticsApi.getTrends(30),
        recommendationsApi.getSummary(),
      ]);

      setTrends(trendsResponse.data);
      setRecommendations(recsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateNewRecommendations = async () => {
    try {
      await recommendationsApi.generate(5);
      await loadDashboardData(); // Reload data
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate recommendations');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Focus Analysis Dashboard</h1>

      {/* Overview Stats */}
      <div style={styles.statsGrid}>
        <StatCard
          title="Total Sessions"
          value={trends?.total_sessions || 0}
          subtitle={`Last 30 days`}
        />
        <StatCard
          title="Avg Focus Score"
          value={Math.round(trends?.average_focus_score || 0)}
          subtitle={getTrendText(trends?.trend)}
          color={getTrendColor(trends?.trend)}
        />
        <StatCard
          title="Avg Engagement"
          value={Math.round(trends?.average_engagement_score || 0)}
          subtitle="0-100 scale"
        />
        <StatCard
          title="Recommendations"
          value={recommendations?.total_recommendations || 0}
          subtitle="Active recommendations"
        />
      </div>

      {/* Focus Trends Chart */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Focus Trends</h2>
        <FocusChart />
      </div>

      {/* Time Recommendations */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Optimal Learning Times</h2>
        {recommendations?.has_recommendations ? (
          <TimeRecommendations recommendations={recommendations} />
        ) : (
          <div style={styles.noData}>
            <p>Not enough data to generate recommendations yet.</p>
            <p>Complete at least 5 focus sessions to get personalized time recommendations.</p>
          </div>
        )}
        <button style={styles.button} onClick={generateNewRecommendations}>
          Generate New Recommendations
        </button>
      </div>

      {/* Optimal Days */}
      {recommendations?.optimal_days && recommendations.optimal_days.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Best Days for Learning</h2>
          <div style={styles.daysList}>
            {recommendations.optimal_days.map((day) => (
              <span key={day} style={styles.dayBadge}>
                {day}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Optimal Hours */}
      {recommendations?.optimal_hours && recommendations.optimal_hours.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Best Hours for Learning</h2>
          <div style={styles.hoursList}>
            {recommendations.optimal_hours.map((hour) => (
              <span key={hour} style={styles.hourBadge}>
                {`${hour.toString().padStart(2, '0')}:00`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{
  title: string;
  value: number | string;
  subtitle?: string;
  color?: string;
}> = ({ title, value, subtitle, color }) => (
  <div style={styles.statCard}>
    <div style={styles.statTitle}>{title}</div>
    <div style={{ ...styles.statValue, color: color || '#333' }}>{value}</div>
    {subtitle && <div style={styles.statSubtitle}>{subtitle}</div>}
  </div>
);

// Helper Functions
const getTrendText = (trend?: string): string => {
  switch (trend) {
    case 'improving':
      return '↗ Improving';
    case 'declining':
      return '↘ Declining';
    case 'stable':
      return '→ Stable';
    default:
      return 'Analyzing...';
  }
};

const getTrendColor = (trend?: string): string => {
  switch (trend) {
    case 'improving':
      return '#4caf50';
    case 'declining':
      return '#f44336';
    case 'stable':
      return '#ff9800';
    default:
      return '#999';
  }
};

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '30px',
    color: '#333',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statCard: {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
  },
  statTitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  statSubtitle: {
    fontSize: '12px',
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '30px',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666',
  },
  error: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#f44336',
  },
  noData: {
    textAlign: 'center',
    padding: '30px',
    color: '#666',
  },
  button: {
    backgroundColor: '#2196f3',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  daysList: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  dayBadge: {
    backgroundColor: '#4caf50',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '20px',
    fontSize: '16px',
  },
  hoursList: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  hourBadge: {
    backgroundColor: '#2196f3',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '20px',
    fontSize: '16px',
  },
};
