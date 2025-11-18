import { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
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
import { dashboardApi } from '../services/api';
import type { DashboardOverview, TrendData } from '../types';

export default function Dashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, trendsData] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getTrends(7),
      ]);
      setOverview(overviewData);
      setTrends(trendsData.trends);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        대시보드
      </Typography>

      <Grid container spacing={3}>
        {/* 오늘의 통계 */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                오늘의 사고
              </Typography>
              <Typography variant="h4">
                {overview?.today.incidents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                이번 주 사고
              </Typography>
              <Typography variant="h4">
                {overview?.this_week.incidents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                활성 학생
              </Typography>
              <Typography variant="h4">
                {overview?.this_week.active_students || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                오류 수
              </Typography>
              <Typography variant="h4" color="error">
                {overview?.this_week.errors || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 트렌드 차트 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              최근 7일 트렌드
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="incidents"
                  stroke="#8884d8"
                  name="사고 수"
                />
                <Line
                  type="monotone"
                  dataKey="active_students"
                  stroke="#82ca9d"
                  name="활성 학생"
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#ff7300"
                  name="오류"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 최신 리포트 정보 */}
        {overview?.latest_report.date && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                최신 리포트
              </Typography>
              <Typography>
                날짜: {new Date(overview.latest_report.date).toLocaleDateString('ko-KR')}
              </Typography>
              <Typography>
                사고 수: {overview.latest_report.incidents}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
