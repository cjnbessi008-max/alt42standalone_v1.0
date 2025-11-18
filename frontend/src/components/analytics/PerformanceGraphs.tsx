/**
 * Performance Graphs Component
 * Displays student learning analytics and achievement progress with interactive charts
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ChartIcon
} from '@mui/icons-material';

// ====================================================================
// TYPES
// ====================================================================

interface DataPoint {
  date: string;
  value: number;
  label: string;
}

interface SummaryStats {
  avg: number;
  max: number;
  min: number;
  total?: number;
  trend?: 'improving' | 'declining' | 'stable';
}

interface GraphData {
  metric_name: string;
  metric_name_ko: string;
  period: string;
  data_points: DataPoint[];
  summary_stats: SummaryStats;
}

interface PerformanceGraphsProps {
  studentId: string;
  defaultPeriod?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  showMetrics?: string[];
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

const formatDate = (dateStr: string, period: string): string => {
  const date = new Date(dateStr);

  if (period === 'daily') {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } else if (period === 'weekly') {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } else if (period === 'monthly') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  return dateStr;
};

const getTrendIcon = (trend?: string) => {
  if (trend === 'improving') {
    return <TrendingUpIcon sx={{ color: 'success.main', fontSize: '20px' }} />;
  } else if (trend === 'declining') {
    return <TrendingDownIcon sx={{ color: 'error.main', fontSize: '20px' }} />;
  }
  return <ChartIcon sx={{ color: 'info.main', fontSize: '20px' }} />;
};

const getTrendColor = (trend?: string): 'success' | 'error' | 'info' => {
  if (trend === 'improving') return 'success';
  if (trend === 'declining') return 'error';
  return 'info';
};

// ====================================================================
// GRAPH COMPONENTS
// ====================================================================

const AccuracyTrendChart: React.FC<{ data: GraphData }> = ({ data }) => {
  const chartData = data.data_points.map(point => ({
    date: formatDate(point.date, data.period),
    accuracy: point.value,
    fullDate: point.date
  }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            {data.metric_name_ko} ({data.metric_name})
          </Typography>
          <Chip
            icon={getTrendIcon(data.summary_stats.trend)}
            label={data.summary_stats.trend === 'improving' ? '개선 중' : data.summary_stats.trend === 'declining' ? '하락 중' : '안정'}
            color={getTrendColor(data.summary_stats.trend)}
            size="small"
          />
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(1)}%`}
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="accuracy"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorAccuracy)"
              name="정확도"
            />
          </AreaChart>
        </ResponsiveContainer>

        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">평균</Typography>
              <Typography variant="h6">{data.summary_stats.avg.toFixed(1)}%</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">최고</Typography>
              <Typography variant="h6">{data.summary_stats.max.toFixed(1)}%</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">최저</Typography>
              <Typography variant="h6">{data.summary_stats.min.toFixed(1)}%</Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

const ProblemsSolvedChart: React.FC<{ data: GraphData }> = ({ data }) => {
  const chartData = data.data_points.map(point => ({
    date: formatDate(point.date, data.period),
    problems: point.value,
    fullDate: point.date
  }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            {data.metric_name_ko} ({data.metric_name})
          </Typography>
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `${value}개`}
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <Bar dataKey="problems" fill="#82ca9d" name="해결한 문제" />
          </BarChart>
        </ResponsiveContainer>

        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">평균/일</Typography>
              <Typography variant="h6">{data.summary_stats.avg.toFixed(1)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">최고/일</Typography>
              <Typography variant="h6">{data.summary_stats.max}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">총 문제</Typography>
              <Typography variant="h6">{data.summary_stats.total || 0}</Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

const PointsEarnedChart: React.FC<{ data: GraphData }> = ({ data }) => {
  const chartData = data.data_points.map(point => ({
    date: formatDate(point.date, data.period),
    points: point.value,
    fullDate: point.date
  }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            {data.metric_name_ko} ({data.metric_name})
          </Typography>
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `+${value} pts`}
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="points"
              stroke="#ffa726"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="포인트"
            />
          </LineChart>
        </ResponsiveContainer>

        <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">평균 획득/일</Typography>
              <Typography variant="h6">+{data.summary_stats.avg.toFixed(0)} pts</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">총 획득 포인트</Typography>
              <Typography variant="h6">+{data.summary_stats.total || 0} pts</Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

// ====================================================================
// MAIN COMPONENT
// ====================================================================

export const PerformanceGraphs: React.FC<PerformanceGraphsProps> = ({
  studentId,
  defaultPeriod = 'weekly',
  showMetrics = ['accuracy_trend', 'problems_solved_trend', 'points_earned']
}) => {
  const [period, setPeriod] = useState<string>(defaultPeriod);
  const [graphData, setGraphData] = useState<GraphData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ====================================================================
  // DATA FETCHING
  // ====================================================================

  useEffect(() => {
    fetchGraphData();
  }, [studentId, period, showMetrics]);

  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);

    try {
      const metricsParam = showMetrics.join(',');
      const endpoint = `/api/v1/students/${studentId}/performance-graphs?period=${period}&metrics=${metricsParam}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const data = await response.json();
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching performance graphs:', err);
    } finally {
      setLoading(false);
    }
  };

  // ====================================================================
  // RENDER HELPERS
  // ====================================================================

  const renderGraph = (graph: GraphData) => {
    const metricType = graph.metric_name.toLowerCase();

    if (metricType.includes('accuracy')) {
      return <AccuracyTrendChart key={graph.metric_name} data={graph} />;
    } else if (metricType.includes('problems') || metricType.includes('solved')) {
      return <ProblemsSolvedChart key={graph.metric_name} data={graph} />;
    } else if (metricType.includes('points')) {
      return <PointsEarnedChart key={graph.metric_name} data={graph} />;
    }

    // Default graph for unknown types
    return null;
  };

  // ====================================================================
  // RENDER
  // ====================================================================

  return (
    <Box>
      {/* Header with period selector */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          <ChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          학습 분석 (Performance Analytics)
        </Typography>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>기간 (Period)</InputLabel>
          <Select
            value={period}
            label="기간 (Period)"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="daily">일별 (Daily)</MenuItem>
            <MenuItem value="weekly">주별 (Weekly)</MenuItem>
            <MenuItem value="monthly">월별 (Monthly)</MenuItem>
            <MenuItem value="all_time">전체 (All Time)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          오류가 발생했습니다: {error}
        </Alert>
      )}

      {/* Graphs grid */}
      {!loading && !error && (
        <Grid container spacing={3}>
          {graphData.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                아직 분석할 데이터가 충분하지 않습니다. 학습을 시작해보세요!
              </Alert>
            </Grid>
          ) : (
            graphData.map((graph, index) => (
              <Grid item xs={12} md={6} key={index}>
                {renderGraph(graph)}
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};

export default PerformanceGraphs;
