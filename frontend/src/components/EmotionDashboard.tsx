/**
 * EmotionDashboard Component
 *
 * Displays real-time emotion detection data and historical patterns
 * for teachers to monitor student emotional states.
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Alert,
  Chip,
  Paper,
} from '@mui/material';
import {
  SentimentVeryDissatisfied,
  Psychology,
  HelpOutline,
  CheckCircle,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { emotionApi } from '../services/emotionApi';
import { EmotionState, EmotionType } from '../types/emotion';

interface EmotionDashboardProps {
  studentId: string;
  sessionId: string;
  refreshInterval?: number; // milliseconds
}

const emotionConfig = {
  frustration: {
    label: '좌절 (Frustration)',
    icon: <SentimentVeryDissatisfied />,
    color: '#f44336',
  },
  concentration: {
    label: '집중 (Concentration)',
    icon: <Psychology />,
    color: '#4caf50',
  },
  confusion: {
    label: '답답함 (Confusion)',
    icon: <HelpOutline />,
    color: '#ff9800',
  },
  neutral: {
    label: '중립 (Neutral)',
    icon: <CheckCircle />,
    color: '#9e9e9e',
  },
};

export const EmotionDashboard: React.FC<EmotionDashboardProps> = ({
  studentId,
  sessionId,
  refreshInterval = 10000,
}) => {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionState[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch emotion dashboard data
   */
  const fetchDashboardData = async () => {
    try {
      const data = await emotionApi.getEmotionDashboard(sessionId, studentId);

      setCurrentEmotion(data.current_emotion);
      setEmotionHistory(data.emotion_history);
      setRecommendations(data.recommendations);
      setAlerts(data.alerts);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch emotion dashboard:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [studentId, sessionId, refreshInterval]);

  /**
   * Render emotion score bar
   */
  const renderEmotionScore = (
    emotion: EmotionType,
    score: number,
    confidence?: number
  ) => {
    const config = emotionConfig[emotion];

    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {config.icon}
          <Typography variant="body2" sx={{ ml: 1, flex: 1 }}>
            {config.label}
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {(score * 100).toFixed(0)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={score * 100}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: `${config.color}20`,
            '& .MuiLinearProgress-bar': {
              backgroundColor: config.color,
            },
          }}
        />
        {confidence !== undefined && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            신뢰도: {(confidence * 100).toFixed(0)}%
          </Typography>
        )}
      </Box>
    );
  };

  /**
   * Render emotion history chart
   */
  const renderEmotionChart = () => {
    if (emotionHistory.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          감정 이력 데이터가 아직 없습니다
        </Typography>
      );
    }

    const chartData = emotionHistory.map((state, index) => ({
      time: index,
      좌절: (state.frustration_score * 100).toFixed(0),
      집중: (state.concentration_score * 100).toFixed(0),
      답답함: (state.confusion_score * 100).toFixed(0),
    }));

    return (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="좌절"
            stroke={emotionConfig.frustration.color}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="집중"
            stroke={emotionConfig.concentration.color}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="답답함"
            stroke={emotionConfig.confusion.color}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>감정 데이터 로딩 중...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        학습자 감정 상태 모니터링
      </Typography>

      <Grid container spacing={2}>
        {/* Current Emotion State */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                현재 감정 상태
              </Typography>

              {currentEmotion ? (
                <>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      backgroundColor: `${emotionConfig[currentEmotion.primary_emotion].color}15`,
                      border: `2px solid ${emotionConfig[currentEmotion.primary_emotion].color}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {emotionConfig[currentEmotion.primary_emotion].icon}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {emotionConfig[currentEmotion.primary_emotion].label}
                      </Typography>
                      <Chip
                        label={`${(currentEmotion.confidence * 100).toFixed(0)}% 신뢰도`}
                        size="small"
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                  </Paper>

                  {renderEmotionScore(
                    'frustration',
                    currentEmotion.frustration_score
                  )}
                  {renderEmotionScore(
                    'concentration',
                    currentEmotion.concentration_score
                  )}
                  {renderEmotionScore(
                    'confusion',
                    currentEmotion.confusion_score
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    분석된 이벤트: {currentEmotion.events_analyzed}개 |{' '}
                    {new Date(currentEmotion.detected_at).toLocaleTimeString('ko-KR')}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  아직 감정 데이터가 없습니다. 학습자의 활동을 수집 중입니다.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Emotion History Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                감정 변화 추이
              </Typography>
              {renderEmotionChart()}
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  주의 알림
                </Typography>
                {alerts.map((alert, index) => (
                  <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                    {alert}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  권장 사항
                </Typography>
                {recommendations.map((rec, index) => (
                  <Alert key={index} severity="info" sx={{ mb: 1 }}>
                    {rec}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
