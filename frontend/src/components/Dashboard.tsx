/**
 * Dropout Analysis Dashboard
 * 전체 dropout 현황을 한눈에 보는 대시보드
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dropoutApi } from '../services/api';
import type { DashboardData } from '../types/dropout';
import { DROPOUT_REASON_LABELS } from '../types/dropout';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashboardData = await dropoutApi.getDashboard(period);
      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError('대시보드 데이터를 불러오는데 실패했습니다.');
      console.error(err);
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

  if (error || !data) {
    return <Alert severity="error">{error || '데이터를 불러올 수 없습니다.'}</Alert>;
  }

  const { overview, hotspots, students_at_risk, dropout_trend } = data;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dropout 분석 대시보드
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {overview.period}
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                전체 세션
              </Typography>
              <Typography variant="h4">{overview.total_sessions}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Dropout 수
              </Typography>
              <Typography variant="h4" color="error">
                {overview.dropout_count}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Dropout 비율
              </Typography>
              <Typography
                variant="h4"
                color={overview.dropout_rate > 0.3 ? 'error' : 'success'}
              >
                {(overview.dropout_rate * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                평균 세션 시간
              </Typography>
              <Typography variant="h4">
                {overview.avg_session_duration.toFixed(0)}분
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dropout 추세
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dropout_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stroke="#f44336"
                    name="Dropout 수"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="rate"
                    stroke="#ff9800"
                    name="Dropout 비율"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Students at Risk */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} color="warning" />
                위험 학생
              </Typography>
              <List>
                {students_at_risk.slice(0, 5).map((student, index) => (
                  <React.Fragment key={student.student_id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={student.student_name}
                        secondary={
                          <>
                            최근 {student.recent_dropout_count}회 중단
                            <br />
                            중단율: {(student.dropout_rate * 100).toFixed(0)}%
                          </>
                        }
                      />
                      <Chip
                        label={student.primary_concern}
                        size="small"
                        color="warning"
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Dropout Hotspots */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dropout 핫스팟 (중단이 자주 발생하는 지점)
              </Typography>
              <Grid container spacing={2}>
                {hotspots.map((hotspot, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          {hotspot.location}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          중단 횟수: {hotspot.dropout_count}회
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          주요 이유: {DROPOUT_REASON_LABELS[hotspot.common_reason]?.ko || hotspot.common_reason}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={`심각도: ${(hotspot.severity_score * 100).toFixed(0)}%`}
                            size="small"
                            color={
                              hotspot.severity_score > 0.7
                                ? 'error'
                                : hotspot.severity_score > 0.4
                                ? 'warning'
                                : 'default'
                            }
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
