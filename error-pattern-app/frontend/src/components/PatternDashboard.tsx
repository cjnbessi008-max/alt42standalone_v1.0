import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Paper,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { getMyPattern } from '../services/api';
import type { PatternAnalysis } from '../types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const PatternDashboard: React.FC = () => {
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [daysBack, setDaysBack] = useState<number>(30);

  useEffect(() => {
    fetchPattern();
  }, [daysBack]);

  const fetchPattern = async () => {
    setLoading(true);
    try {
      const data = await getMyPattern(daysBack);
      setAnalysis(data);
    } catch (err: any) {
      setError(err.response?.data?.error || '패턴 분석을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!analysis) {
    return <Alert severity="info">분석할 데이터가 없습니다.</Alert>;
  }

  const COLORS = [
    '#e74c3c',
    '#3498db',
    '#9b59b6',
    '#e67e22',
    '#f39c12',
    '#1abc9c',
    '#34495e',
    '#95a5a6',
  ];

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        내 실수 패턴 분석
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {format(new Date(analysis.period.start), 'yyyy년 M월 d일', { locale: ko })} ~{' '}
        {format(new Date(analysis.period.end), 'yyyy년 M월 d일', { locale: ko })}
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                총 오답 수
              </Typography>
              <Typography variant="h3">{analysis.totalErrors}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                가장 많은 실수 유형
              </Typography>
              <Typography variant="h5">
                {analysis.categoryDistribution[0]?.category || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {analysis.categoryDistribution[0]?.count || 0}회 (
                {analysis.categoryDistribution[0]?.percentage.toFixed(1) || 0}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                분석 카테고리 수
              </Typography>
              <Typography variant="h3">
                {analysis.categoryDistribution.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Distribution - Pie Chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            실수 유형별 분포
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analysis.categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) =>
                  `${category} (${percentage.toFixed(1)}%)`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {analysis.categoryDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Distribution - Bar Chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            실수 유형별 빈도
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysis.categoryDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3498db" name="오답 수" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trends - Line Chart */}
      {analysis.trends.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              시간별 추이
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analysis.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    format(new Date(date), 'M/d', { locale: ko })
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) =>
                    format(new Date(date), 'yyyy년 M월 d일', { locale: ko })
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#e74c3c"
                  name="오답 수"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI 분석 인사이트
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {analysis.insights}
            </Typography>
          </Paper>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              개선 방안
            </Typography>
            <Box sx={{ mt: 2 }}>
              {analysis.recommendations.map((rec, index) => (
                <Chip
                  key={index}
                  label={`${index + 1}. ${rec}`}
                  sx={{
                    mb: 1,
                    mr: 1,
                    height: 'auto',
                    py: 1,
                    '& .MuiChip-label': {
                      whiteSpace: 'normal',
                    },
                  }}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PatternDashboard;
