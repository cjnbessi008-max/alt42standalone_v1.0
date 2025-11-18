import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { useStore } from '../stores/useStore';
import { studentApi } from '../services/api';

const COLORS = ['#f44336', '#ff9800', '#4caf50', '#2196f3', '#9c27b0'];

const DashboardPage = () => {
  const { currentStudentId } = useStore();
  const [errorStats, setErrorStats] = useState<Array<{ error_type: string; count: number; percentage: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [currentStudentId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stats = await studentApi.getErrorStats(currentStudentId);
      setErrorStats(stats);
    } catch (err: any) {
      setError(err.response?.data?.message || '대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      arithmetic_error: '계산 실수',
      conceptual_error: '개념 오류',
      simplification_error: '간단히 하기 오류',
      format_error: '형식 오류',
    };
    return labels[type] || type;
  };

  const chartData = errorStats.map((stat) => ({
    name: getErrorTypeLabel(stat.error_type),
    count: stat.count,
    percentage: stat.percentage,
  }));

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        분석 대시보드
      </Typography>

      {errorStats.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            아직 분석할 데이터가 충분하지 않습니다.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            문제를 더 풀어보면 오류 패턴 분석을 확인할 수 있습니다.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Error Statistics Cards */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                오류 유형별 통계
              </Typography>
              <Grid container spacing={2} mt={1}>
                {errorStats.map((stat, index) => (
                  <Grid item xs={12} sm={6} md={3} key={stat.error_type}>
                    <Card sx={{ borderLeft: `4px solid ${COLORS[index % COLORS.length]}` }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {getErrorTypeLabel(stat.error_type)}
                        </Typography>
                        <Typography variant="h4" color="primary">
                          {stat.count}회
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          전체의 {stat.percentage.toFixed(1)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Bar Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                오류 발생 횟수
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#2196f3" name="발생 횟수" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Pie Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                오류 유형 비율
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Recommendations */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                개선 권장사항
              </Typography>
              {errorStats.length > 0 && (
                <Box mt={2}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body1" fontWeight="bold">
                      가장 많이 발생한 오류: {getErrorTypeLabel(errorStats[0].error_type)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {errorStats[0].error_type === 'conceptual_error' &&
                        '개념에 대한 이해도를 높이기 위해 기본 개념 복습을 권장합니다.'}
                      {errorStats[0].error_type === 'arithmetic_error' &&
                        '계산 실수가 많습니다. 천천히 꼼꼼하게 계산하는 연습을 해보세요.'}
                      {errorStats[0].error_type === 'simplification_error' &&
                        '분수를 간단히 하는 연습이 필요합니다. 최대공약수를 찾는 연습을 해보세요.'}
                      {errorStats[0].error_type === 'format_error' &&
                        '답을 입력할 때 형식을 주의깊게 확인해주세요.'}
                    </Typography>
                  </Alert>

                  {errorStats[0].percentage > 50 && (
                    <Alert severity="warning">
                      <Typography variant="body2">
                        특정 오류 유형이 50% 이상을 차지하고 있습니다. 해당 부분에 집중적인 학습이 필요합니다.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default DashboardPage;
