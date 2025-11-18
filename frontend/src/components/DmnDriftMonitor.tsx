/**
 * DMN Drift Monitor Component
 * Real-time display of student engagement metrics
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import api from '../services/api';
import { DmnDriftMetrics, DriftLevel } from '../types';

interface DmnDriftMonitorProps {
  sessionId: number;
  refreshInterval?: number; // milliseconds
  onInterventionNeeded?: (metrics: DmnDriftMetrics) => void;
}

const DmnDriftMonitor: React.FC<DmnDriftMonitorProps> = ({
  sessionId,
  refreshInterval = 30000, // 30 seconds default
  onInterventionNeeded
}) => {
  const [metrics, setMetrics] = useState<DmnDriftMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [sessionId, refreshInterval]);

  useEffect(() => {
    if (metrics?.intervention_needed && onInterventionNeeded) {
      onInterventionNeeded(metrics);
    }
  }, [metrics?.intervention_needed]);

  const fetchMetrics = async () => {
    try {
      // Calculate new metrics
      await api.calculateMetrics(sessionId);

      // Get latest metrics
      const latestMetrics = await api.getLatestMetrics(sessionId);
      setMetrics(latestMetrics);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const getDriftLevelColor = (level: DriftLevel): string => {
    switch (level) {
      case 'low':
        return 'success';
      case 'moderate':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDriftLevelIcon = (level: DriftLevel) => {
    switch (level) {
      case 'low':
        return <CheckCircle color="success" />;
      case 'moderate':
        return <Warning color="warning" />;
      case 'high':
        return <Warning color="error" />;
      case 'critical':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp color="error" />;
    if (trend < -5) return <TrendingDown color="success" />;
    return null;
  };

  if (loading && !metrics) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            DMN Drift Monitor
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error && !metrics) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Engagement Monitor
          </Typography>
          <Chip
            icon={getDriftLevelIcon(metrics.drift_level)}
            label={metrics.drift_level.toUpperCase()}
            color={getDriftLevelColor(metrics.drift_level) as any}
            size="small"
          />
        </Box>

        {/* DMN Drift Score */}
        <Box mb={3}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            DMN Drift Score
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Box flexGrow={1}>
              <LinearProgress
                variant="determinate"
                value={metrics.dmn_drift_score}
                color={getDriftLevelColor(metrics.drift_level) as any}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Typography variant="h6" fontWeight="bold">
              {metrics.dmn_drift_score.toFixed(1)}
            </Typography>
          </Box>
        </Box>

        {/* Metrics Grid */}
        <Grid container spacing={2}>
          {/* Accuracy */}
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Accuracy Rate
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="h6">
                  {metrics.accuracy_rate.toFixed(1)}%
                </Typography>
                {getTrendIcon(metrics.accuracy_trend)}
              </Box>
            </Box>
          </Grid>

          {/* Response Time */}
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Avg Response Time
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="h6">
                  {(metrics.avg_response_time_ms / 1000).toFixed(1)}s
                </Typography>
                {getTrendIcon(metrics.response_time_trend)}
              </Box>
            </Box>
          </Grid>

          {/* Focus Loss */}
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Focus Losses
              </Typography>
              <Typography variant="h6">
                {metrics.focus_loss_count}
              </Typography>
            </Box>
          </Grid>

          {/* Idle Time */}
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Idle Time
              </Typography>
              <Typography variant="h6">
                {Math.floor(metrics.idle_time_seconds / 60)}m {metrics.idle_time_seconds % 60}s
              </Typography>
            </Box>
          </Grid>

          {/* Click Frequency */}
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Clicks/min
              </Typography>
              <Typography variant="h6">
                {metrics.click_frequency.toFixed(1)}
              </Typography>
            </Box>
          </Grid>

          {/* Scroll Activity */}
          <Grid item xs={6}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Scroll Activity
              </Typography>
              <Typography variant="h6">
                {metrics.scroll_activity_score.toFixed(1)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Intervention Alert */}
        {metrics.intervention_needed && metrics.recommended_action && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Intervention Recommended
            </Typography>
            <Typography variant="body2">
              {metrics.recommended_action}
            </Typography>
          </Alert>
        )}

        {/* Last Updated */}
        <Typography variant="caption" color="textSecondary" display="block" mt={2}>
          Last updated: {new Date(metrics.calculated_at).toLocaleTimeString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DmnDriftMonitor;
