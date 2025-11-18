/**
 * Time Recommendations Component
 * Displays optimal learning time recommendations
 */
import React from 'react';
import type { RecommendationSummary } from '../types';

interface Props {
  recommendations: RecommendationSummary;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TimeRecommendations: React.FC<Props> = ({ recommendations }) => {
  if (!recommendations.top_recommendations || recommendations.top_recommendations.length === 0) {
    return <div>No recommendations available</div>;
  }

  return (
    <div style={styles.container}>
      {recommendations.top_recommendations.map((rec, index) => (
        <div key={rec.id} style={styles.recCard}>
          <div style={styles.rank}>#{index + 1}</div>
          <div style={styles.content}>
            <div style={styles.time}>
              <span style={styles.day}>{DAY_NAMES[rec.recommended_day_of_week]}</span>
              <span style={styles.hour}>{`${rec.recommended_hour.toString().padStart(2, '0')}:00`}</span>
            </div>
            <div style={styles.details}>
              <div style={styles.detailItem}>
                <span style={styles.label}>Focus Score:</span>
                <span style={styles.value}>{Math.round(rec.average_focus_score)}/100</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Confidence:</span>
                <span style={styles.value}>{Math.round(rec.confidence_score)}%</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Duration:</span>
                <span style={styles.value}>{rec.recommended_duration_minutes} min</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Based on:</span>
                <span style={styles.value}>{rec.sample_size} sessions</span>
              </div>
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${rec.confidence_score}%`,
                  backgroundColor: getConfidenceColor(rec.confidence_score),
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return '#4caf50';
  if (confidence >= 60) return '#ff9800';
  return '#f44336';
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  recCard: {
    display: 'flex',
    alignItems: 'stretch',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
  },
  rank: {
    backgroundColor: '#2196f3',
    color: '#fff',
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '80px',
  },
  content: {
    flex: 1,
    padding: '15px',
  },
  time: {
    marginBottom: '10px',
  },
  day: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginRight: '15px',
  },
  hour: {
    fontSize: '20px',
    color: '#666',
  },
  details: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
    marginBottom: '10px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '2px',
  },
  value: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e0e0e0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
};
