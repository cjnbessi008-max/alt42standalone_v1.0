/**
 * Tension Curve Visualization Component
 *
 * Displays student learning tension curves with interactive visualizations
 * Shows accuracy rate, tension score, and learning phase over time
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
  Scatter,
  ReferenceLine
} from 'recharts';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Paper,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';

// Types
interface TensionHistoryPoint {
  timestamp: string;
  tension_score: number;
  accuracy: number;
  difficulty: number;
}

interface TensionCurveData {
  student_id: string;
  module_id: string;
  student_name?: string;
  module_name?: string;
  current_metrics: {
    accuracy_rate: number;
    tension_score: number;
    learning_curve_phase: string;
    total_attempts: number;
    current_difficulty_level: number;
    tension_history: TensionHistoryPoint[];
  };
  snapshots: any[];
  average_tension: number;
  max_tension: number;
  min_tension: number;
  tension_volatility: number;
  time_range_days: number;
  total_study_time_hours: number;
}

interface TensionCurveProps {
  studentId: string;
  moduleId: string;
  timeRangeDays?: number;
  showPredictions?: boolean;
  showRecommendations?: boolean;
  onDataLoad?: (data: TensionCurveData) => void;
}

// Learning phase color mapping
const PHASE_COLORS: Record<string, string> = {
  early: '#9E9E9E',      // Gray
  growth: '#4CAF50',     // Green
  plateau: '#FF9800',    // Orange
  mastery: '#2196F3',    // Blue
  struggling: '#F44336'  // Red
};

// Tension category thresholds
const TENSION_THRESHOLDS = {
  low: 30,
  moderate: 60,
  high: 100
};

const TensionCurveVisualization: React.FC<TensionCurveProps> = ({
  studentId,
  moduleId,
  timeRangeDays = 30,
  showPredictions = false,
  showRecommendations = true,
  onDataLoad
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TensionCurveData | null>(null);
  const [timeRange, setTimeRange] = useState<number>(timeRangeDays);
  const [activeTab, setActiveTab] = useState<number>(0);

  // Fetch tension curve data
  useEffect(() => {
    fetchTensionCurveData();
  }, [studentId, moduleId, timeRange]);

  const fetchTensionCurveData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/tension-curve/student/${studentId}/module/${moduleId}?` +
        `time_range_days=${timeRange}&` +
        `include_predictions=${showPredictions}&` +
        `include_recommendations=${showRecommendations}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        onDataLoad?.(result.data);
      } else {
        throw new Error(result.error || 'Failed to load tension curve data');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tension curve:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          학습 텐션 곡선 데이터를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (error || !data) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <strong>오류:</strong> {error || '데이터를 불러올 수 없습니다'}
      </Alert>
    );
  }

  // Get tension category
  const getTensionCategory = (score: number): string => {
    if (score < TENSION_THRESHOLDS.low) return 'low';
    if (score < TENSION_THRESHOLDS.moderate) return 'moderate';
    return 'high';
  };

  // Get tension color
  const getTensionColor = (score: number): string => {
    const category = getTensionCategory(score);
    if (category === 'low') return '#4CAF50';
    if (category === 'moderate') return '#FF9800';
    return '#F44336';
  };

  // Format chart data
  const chartData = data.current_metrics.tension_history.map(point => ({
    timestamp: new Date(point.timestamp).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    }),
    tension: point.tension_score,
    accuracy: point.accuracy,
    difficulty: point.difficulty * 10 // Scale to 0-100 for visualization
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">{label}</Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}
              {entry.name !== 'difficulty' && '%'}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  // Render metrics card
  const renderMetricsCard = (
    title: string,
    value: string | number,
    subtitle?: string,
    color?: string,
    icon?: React.ReactNode
  ) => (
    <Card sx={{ height: '100%', borderLeft: `4px solid ${color || '#1976d2'}` }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ color: color || 'text.primary' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && <Box sx={{ fontSize: 40, opacity: 0.5 }}>{icon}</Box>}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          학습 텐션 곡선 분석
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data.student_name && `학생: ${data.student_name} | `}
          {data.module_name && `모듈: ${data.module_name}`}
        </Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>기간</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            label="기간"
          >
            <MenuItem value={7}>최근 7일</MenuItem>
            <MenuItem value={30}>최근 30일</MenuItem>
            <MenuItem value={90}>최근 3개월</MenuItem>
            <MenuItem value={180}>최근 6개월</MenuItem>
          </Select>
        </FormControl>

        {/* Learning Phase Indicator */}
        <Chip
          label={`학습 단계: ${data.current_metrics.learning_curve_phase}`}
          sx={{
            bgcolor: PHASE_COLORS[data.current_metrics.learning_curve_phase] || '#9E9E9E',
            color: 'white',
            fontWeight: 'bold'
          }}
        />
      </Box>

      {/* Key Metrics Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricsCard(
            '현재 정답률',
            `${data.current_metrics.accuracy_rate.toFixed(1)}%`,
            `총 ${data.current_metrics.total_attempts}회 시도`,
            '#2196F3',
            <TrendingUp />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricsCard(
            '텐션 점수',
            data.current_metrics.tension_score.toFixed(1),
            getTensionCategory(data.current_metrics.tension_score),
            getTensionColor(data.current_metrics.tension_score),
            getTensionCategory(data.current_metrics.tension_score) === 'high' ? (
              <Warning />
            ) : (
              <CheckCircle />
            )
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricsCard(
            '현재 난이도',
            `${data.current_metrics.current_difficulty_level} / 10`,
            '자동 조정됨',
            '#FF9800'
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricsCard(
            '총 학습 시간',
            `${data.total_study_time_hours.toFixed(1)}시간`,
            `${timeRange}일간`,
            '#4CAF50'
          )}
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="텐션 곡선" />
          <Tab label="정확도 추이" />
          <Tab label="난이도 분석" />
          <Tab label="종합 분석" />
        </Tabs>
      </Paper>

      {/* Chart Area */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Tab 0: Tension Curve */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                시간별 텐션 변화
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tensionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F44336" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#F44336" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine
                    y={TENSION_THRESHOLDS.low}
                    stroke="#4CAF50"
                    strokeDasharray="3 3"
                    label="낮음"
                  />
                  <ReferenceLine
                    y={TENSION_THRESHOLDS.moderate}
                    stroke="#FF9800"
                    strokeDasharray="3 3"
                    label="보통"
                  />
                  <Area
                    type="monotone"
                    dataKey="tension"
                    stroke="#F44336"
                    fillOpacity={1}
                    fill="url(#tensionGradient)"
                    name="텐션 점수"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Tab 1: Accuracy Trend */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                정답률 추이
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#2196F3"
                    strokeWidth={3}
                    name="정답률 (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Tab 2: Difficulty Analysis */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                난이도 vs 성과
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis yAxisId="left" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="right"
                    dataKey="difficulty"
                    fill="#FF9800"
                    opacity={0.6}
                    name="난이도"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#2196F3"
                    strokeWidth={2}
                    name="정답률 (%)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Tab 3: Comprehensive Analysis */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                종합 분석
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="tension"
                    fill="#F44336"
                    stroke="#F44336"
                    opacity={0.3}
                    name="텐션"
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#2196F3"
                    strokeWidth={2}
                    name="정답률"
                  />
                  <Line
                    type="monotone"
                    dataKey="difficulty"
                    stroke="#FF9800"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="난이도"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                텐션 통계
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>평균 텐션:</Typography>
                  <Typography fontWeight="bold">
                    {data.average_tension.toFixed(1)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>최대 텐션:</Typography>
                  <Typography fontWeight="bold" color="error.main">
                    {data.max_tension.toFixed(1)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>최소 텐션:</Typography>
                  <Typography fontWeight="bold" color="success.main">
                    {data.min_tension.toFixed(1)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>변동성:</Typography>
                  <Typography fontWeight="bold">
                    {data.tension_volatility.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                학습 권장사항
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {data.current_metrics.tension_score > 60 ? (
                <Alert severity="warning" icon={<Warning />}>
                  높은 텐션 수준이 감지되었습니다. 난이도를 낮추거나 힌트를 제공하는 것을 권장합니다.
                </Alert>
              ) : data.current_metrics.tension_score < 30 &&
                data.current_metrics.accuracy_rate > 85 ? (
                <Alert severity="success" icon={<CheckCircle />}>
                  우수한 학습 진행 상태입니다. 난이도를 높여 도전해보세요!
                </Alert>
              ) : (
                <Alert severity="info" icon={<Info />}>
                  적절한 학습 진행 상태입니다. 현재 페이스를 유지하세요.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TensionCurveVisualization;
