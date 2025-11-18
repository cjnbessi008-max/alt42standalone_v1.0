/**
 * Student Dropout Detail View
 * 개별 학생의 dropout 패턴 상세 분석
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  TrendingDown as TrendingDownIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { dropoutApi } from '../services/api';
import type { StudentPattern } from '../types/dropout';
import { DROPOUT_REASON_LABELS } from '../types/dropout';
import { format } from 'date-fns';

const StudentDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [data, setData] = useState<StudentPattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  const loadStudentData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      const studentData = await dropoutApi.getStudentPattern(studentId);
      setData(studentData);
      setError(null);
    } catch (err) {
      setError('학생 데이터를 불러오는데 실패했습니다.');
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

  const getEngagementColor = (trend?: string) => {
    switch (trend) {
      case 'increasing':
        return 'success';
      case 'decreasing':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        {data.student_name}
      </Typography>

      {/* Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                총 세션
              </Typography>
              <Typography variant="h4">{data.total_sessions}</Typography>
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
                {data.dropout_sessions}
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
                color={data.dropout_rate > 0.3 ? 'error' : 'success'}
              >
                {(data.dropout_rate * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                참여도 추세
              </Typography>
              <Chip
                label={data.learning_profile.engagement_trend || 'stable'}
                color={getEngagementColor(data.learning_profile.engagement_trend)}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Common Dropout Reasons */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingDownIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                주요 중단 이유
              </Typography>
              <List>
                {data.common_reasons.map((reason, index) => (
                  <React.Fragment key={reason.reason}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={DROPOUT_REASON_LABELS[reason.reason]?.ko || reason.reason}
                        secondary={`${reason.frequency}회 발생`}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LightbulbIcon sx={{ mr: 1, verticalAlign: 'middle' }} color="primary" />
                권장사항
              </Typography>
              <List>
                {data.recommendations.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${index + 1}. ${recommendation}`}
                      primaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Dropouts */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                최근 Dropout 상세 내역
              </Typography>
              {data.recent_dropouts.map((dropout, index) => (
                <Paper key={dropout.id} sx={{ p: 2, mb: 2 }} elevation={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        날짜
                      </Typography>
                      <Typography variant="body1">
                        {format(new Date(dropout.analyzed_at), 'yyyy-MM-dd HH:mm')}
                      </Typography>

                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                        중단 지점
                      </Typography>
                      <Typography variant="body1">
                        {dropout.dropout_point || 'N/A'}
                      </Typography>

                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                        주요 이유
                      </Typography>
                      <Chip
                        label={DROPOUT_REASON_LABELS[dropout.primary_reason]?.ko || dropout.primary_reason}
                        color="error"
                        size="small"
                      />
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        (신뢰도: {(dropout.confidence * 100).toFixed(0)}%)
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        주요 지표
                      </Typography>
                      <Typography variant="body2">
                        • 정답률: {(dropout.metrics.accuracy_rate * 100).toFixed(0)}%
                      </Typography>
                      <Typography variant="body2">
                        • 연속 오답: {dropout.metrics.consecutive_errors}회
                      </Typography>
                      <Typography variant="body2">
                        • 총 시간: {Math.floor(dropout.metrics.total_duration_seconds / 60)}분
                      </Typography>
                      <Typography variant="body2">
                        • 문제당 평균 시간: {dropout.metrics.avg_time_per_problem.toFixed(0)}초
                      </Typography>

                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                        권장사항
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {dropout.recommendations.ko}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDetail;
