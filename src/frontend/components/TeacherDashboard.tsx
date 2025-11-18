/**
 * TeacherDashboard Component
 *
 * Provides teachers with class-wide comprehension analytics and intervention alerts
 *
 * Features:
 * - Class overview metrics
 * - Student intervention alerts
 * - Individual student performance
 * - Export capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Info,
  Refresh,
  Download,
  Person,
} from '@mui/icons-material';
import axios from 'axios';

interface ClassOverview {
  module_id: string;
  total_students: number;
  avg_comprehension: number;
  avg_reading_speed: number;
  students_needing_help: number;
  first_attempt_success_rate: number;
}

interface InterventionAlert {
  student_id: string;
  module_id: string;
  problem_id: string;
  intervention_flag: 'monitor' | 'immediate';
  comprehension_score: number;
  reading_speed_wpm: number;
  message: string;
  suggested_actions: string[];
  created_at: string;
}

interface StudentSummary {
  id: number;
  student_id: string;
  avg_comprehension_score: number;
  avg_reading_speed_wpm: number;
  first_attempt_success_rate: number;
  comprehension_trend: 'improving' | 'declining' | 'stable';
  teacher_action_needed: boolean;
}

interface TeacherDashboardProps {
  moduleId: string;
  teacherId: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  moduleId,
  teacherId,
}) => {
  const [overview, setOverview] = useState<ClassOverview | null>(null);
  const [interventions, setInterventions] = useState<InterventionAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadDashboardData();
  }, [moduleId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load class overview
      const overviewResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/class-overview/${moduleId}`
      );
      setOverview(overviewResponse.data);

      // Load intervention alerts
      const interventionsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/reading-analytics/interventions`,
        { params: { module_id: moduleId, days: 7 } }
      );
      setInterventions(interventionsResponse.data);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      // Export analytics data
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/reading-analytics/export`,
        {
          params: { module_id: moduleId },
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reading_analytics_${moduleId}_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
      alert('데이터 내보내기에 실패했습니다.');
    }
  };

  const getSeverityColor = (flag: 'monitor' | 'immediate'): 'warning' | 'error' => {
    return flag === 'immediate' ? 'error' : 'warning';
  };

  const getSeverityIcon = (flag: 'monitor' | 'immediate') => {
    return flag === 'immediate' ? <Warning color="error" /> : <Info color="warning" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadDashboardData}>
          재시도
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">학급 이해도 대시보드</Typography>
        <Box>
          <Button
            startIcon={<Download />}
            onClick={handleExport}
            sx={{ mr: 1 }}
          >
            데이터 내보내기
          </Button>
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Class Overview */}
      {overview && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  전체 학생 수
                </Typography>
                <Typography variant="h4">{overview.total_students}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  평균 이해도
                </Typography>
                <Typography variant="h4">
                  {Math.round(overview.avg_comprehension)}
                  <Typography component="span" variant="h6" color="text.secondary">
                    /100
                  </Typography>
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  도움 필요 학생
                </Typography>
                <Typography variant="h4" color={overview.students_needing_help > 0 ? 'error' : 'success'}>
                  {overview.students_needing_help}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  첫 시도 정답률
                </Typography>
                <Typography variant="h4">
                  {Math.round(overview.first_attempt_success_rate)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label="개입 필요 학생" />
          <Tab label="전체 학생 현황" />
        </Tabs>
      </Box>

      {/* Intervention Alerts Tab */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              개입이 필요한 학생 ({interventions.length}명)
            </Typography>

            {interventions.length === 0 ? (
              <Alert severity="success" icon={<CheckCircle />}>
                현재 특별한 주의가 필요한 학생이 없습니다.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>심각도</TableCell>
                      <TableCell>학생 ID</TableCell>
                      <TableCell>문제 ID</TableCell>
                      <TableCell>이해도 점수</TableCell>
                      <TableCell>읽기 속도</TableCell>
                      <TableCell>메시지</TableCell>
                      <TableCell>권장 조치</TableCell>
                      <TableCell>시간</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {interventions.map((alert, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip
                            icon={getSeverityIcon(alert.intervention_flag)}
                            label={alert.intervention_flag === 'immediate' ? '긴급' : '모니터링'}
                            color={getSeverityColor(alert.intervention_flag)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 1, fontSize: 20 }} />
                            {alert.student_id}
                          </Box>
                        </TableCell>
                        <TableCell>{alert.problem_id}</TableCell>
                        <TableCell>
                          <Typography
                            color={
                              alert.comprehension_score >= 60
                                ? 'success.main'
                                : alert.comprehension_score >= 40
                                ? 'warning.main'
                                : 'error.main'
                            }
                          >
                            {Math.round(alert.comprehension_score)}
                          </Typography>
                        </TableCell>
                        <TableCell>{Math.round(alert.reading_speed_wpm)} WPM</TableCell>
                        <TableCell>
                          <Typography variant="body2">{alert.message}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {alert.suggested_actions.map((action, i) => (
                              <Chip key={i} label={action} size="small" sx={{ m: 0.5 }} />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(alert.created_at).toLocaleString('ko-KR')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Students Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              전체 학생 학습 현황
            </Typography>
            <Alert severity="info">
              개별 학생 상세 분석 기능은 개발 중입니다.
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TeacherDashboard;
