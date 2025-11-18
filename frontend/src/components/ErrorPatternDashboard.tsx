/**
 * ErrorPatternDashboard - 학생 오류 패턴 대시보드
 *
 * 학생 개인의 오답 원인 분포와 학습 진척도를 시각화합니다.
 */
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
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
import {
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

// Types
type ErrorType = '개념' | '계산' | '조건누락';

interface ErrorStats {
  개념: number;
  계산: number;
  조건누락: number;
}

interface ErrorPattern {
  module_name: string;
  error_type: ErrorType;
  count: number;
  is_improving: boolean;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface TrendData {
  date: string;
  개념: number;
  계산: number;
  조건누락: number;
}

interface ErrorPatternDashboardProps {
  studentId: string;
  studentName?: string;
  errorStats: ErrorStats;
  recentErrors: ErrorPattern[];
  improvementTrend?: TrendData[];
  totalAttempts: number;
  correctRate: number;
}

// Constants
const ERROR_COLORS = {
  개념: '#FF6B6B',
  계산: '#4ECDC4',
  조건누락: '#FFD93D',
};

const ErrorPatternDashboard: React.FC<ErrorPatternDashboardProps> = ({
  studentId,
  studentName = '학생',
  errorStats,
  recentErrors,
  improvementTrend = [],
  totalAttempts,
  correctRate,
}) => {
  // 파이 차트 데이터 준비
  const pieData = [
    { name: '개념', value: errorStats.개념 },
    { name: '계산', value: errorStats.계산 },
    { name: '조건누락', value: errorStats.조건누락 },
  ].filter((item) => item.value > 0);

  const totalErrors = errorStats.개념 + errorStats.계산 + errorStats.조건누락;

  // 막대 차트 데이터 (모듈별)
  const moduleData = recentErrors.reduce((acc, pattern) => {
    const existing = acc.find((item) => item.module === pattern.module_name);
    if (existing) {
      existing[pattern.error_type] = (existing[pattern.error_type] || 0) + pattern.count;
    } else {
      acc.push({
        module: pattern.module_name,
        개념: pattern.error_type === '개념' ? pattern.count : 0,
        계산: pattern.error_type === '계산' ? pattern.count : 0,
        조건누락: pattern.error_type === '조건누락' ? pattern.count : 0,
      });
    }
    return acc;
  }, [] as any[]);

  // 트렌드 아이콘
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'decreasing':
        return <TrendingDownIcon fontSize="small" color="success" />;
      case 'increasing':
        return <TrendingUpIcon fontSize="small" color="error" />;
      default:
        return <RemoveIcon fontSize="small" color="disabled" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        {studentName}님의 학습 분석
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        오답 원인을 분석하여 맞춤형 학습을 추천합니다
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="primary">
              {totalAttempts}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              총 문제 풀이
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main">
              {Math.round(correctRate)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              정답률
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="error.main">
              {totalErrors}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              총 오답 수
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main">
              {recentErrors.filter((e) => !e.is_improving).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              개선 필요 항목
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Error Distribution - Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                오답 원인 분포
              </Typography>
              {totalErrors > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={ERROR_COLORS[entry.name as ErrorType]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box mt={2}>
                    {Object.entries(errorStats).map(([type, count]) => (
                      <Box key={type} display="flex" alignItems="center" mb={1}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: ERROR_COLORS[type as ErrorType],
                            mr: 1,
                          }}
                        />
                        <Typography variant="body2" flex={1}>
                          {type}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {count}건 (
                          {totalErrors > 0
                            ? Math.round((count / totalErrors) * 100)
                            : 0}
                          %)
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Box p={4} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    아직 오답 데이터가 없습니다
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Error Patterns by Module */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                모듈별 오답 분석
              </Typography>
              {moduleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={moduleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="module" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="개념" fill={ERROR_COLORS.개념} />
                    <Bar dataKey="계산" fill={ERROR_COLORS.계산} />
                    <Bar dataKey="조건누락" fill={ERROR_COLORS.조건누락} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box p={4} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    아직 모듈 데이터가 없습니다
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Improvement Trend */}
        {improvementTrend.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  오답 추이
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={improvementTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="개념"
                      stroke={ERROR_COLORS.개념}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="계산"
                      stroke={ERROR_COLORS.계산}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="조건누락"
                      stroke={ERROR_COLORS.조건누락}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recent Error Patterns */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                최근 오답 패턴
              </Typography>
              {recentErrors.length > 0 ? (
                <List>
                  {recentErrors.map((pattern, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={pattern.error_type}
                              size="small"
                              sx={{
                                backgroundColor: ERROR_COLORS[pattern.error_type],
                                color: 'white',
                              }}
                            />
                            <Typography variant="body1">
                              {pattern.module_name}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            <Typography variant="body2" color="text.secondary">
                              {pattern.count}회 발생
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                              {getTrendIcon(pattern.trend)}
                              <Typography
                                variant="caption"
                                color={
                                  pattern.trend === 'decreasing'
                                    ? 'success.main'
                                    : pattern.trend === 'increasing'
                                    ? 'error.main'
                                    : 'text.secondary'
                                }
                              >
                                {pattern.trend === 'decreasing'
                                  ? '개선 중'
                                  : pattern.trend === 'increasing'
                                  ? '증가 추세'
                                  : '변화 없음'}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box p={2} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    최근 오답 패턴이 없습니다
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ErrorPatternDashboard;
