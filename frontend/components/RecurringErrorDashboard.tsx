/**
 * Recurring Error Dashboard Component
 *
 * Displays recurring error points with high recurrence rates
 * for teacher intervention and student support.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Button,
  Tooltip,
  IconButton,
  Badge,
  Divider
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface RecurringError {
  id: string;
  module_id: string;
  concept_id: string;
  error_title: string;
  error_summary: string;
  recurrence_rate: number;
  total_occurrences: number;
  unique_students: number;
  severity_score: number;
  priority_rank: number;
  recommended_action: string | null;
  visualization_data: {
    timeline?: Record<string, number>;
    severity_distribution?: Record<string, number>;
  };
  is_highlighted: boolean;
  created_at: string;
  updated_at: string;
}

interface RecurringErrorDashboardProps {
  moduleId: string;
  onRefresh?: () => void;
  showActions?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

// ============================================================================
// Helper Functions
// ============================================================================

const getSeverityColor = (score: number): 'error' | 'warning' | 'info' | 'success' => {
  if (score >= 75) return 'error';
  if (score >= 50) return 'warning';
  if (score >= 25) return 'info';
  return 'success';
};

const getSeverityLabel = (score: number): string => {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// ============================================================================
// Main Component
// ============================================================================

export const RecurringErrorDashboard: React.FC<RecurringErrorDashboardProps> = ({
  moduleId,
  onRefresh,
  showActions = true,
  autoRefresh = false,
  refreshInterval = 60000
}) => {
  const [errors, setErrors] = useState<RecurringError[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchRecurringErrors = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/error-tracking/modules/${moduleId}/recurring-errors?highlighted_only=true&limit=20`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recurring errors');
      }

      const data: RecurringError[] = await response.json();
      setErrors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurringErrors();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchRecurringErrors, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [moduleId, autoRefresh, refreshInterval]);

  const handleRefresh = () => {
    fetchRecurringErrors();
    onRefresh?.();
  };

  const handleToggleHighlight = async (errorId: string, currentState: boolean) => {
    try {
      const response = await fetch(
        `/api/error-tracking/recurring-errors/${errorId}/highlight`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_highlighted: !currentState })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update highlight status');
      }

      // Refresh the list
      fetchRecurringErrors();
    } catch (err) {
      console.error('Error toggling highlight:', err);
    }
  };

  // ============================================================================
  // Render Loading State
  // ============================================================================

  if (loading && errors.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  // ============================================================================
  // Render Error State
  // ============================================================================

  if (error) {
    return (
      <Alert severity="error" onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  // ============================================================================
  // Render Empty State
  // ============================================================================

  if (errors.length === 0) {
    return (
      <Box textAlign="center" py={6}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No recurring errors detected
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Great job! Students are performing well with minimal repeated errors.
        </Typography>
      </Box>
    );
  }

  // ============================================================================
  // Render Main Dashboard
  // ============================================================================

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Recurring Error Points
        </Typography>
        {showActions && (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Total Error Points
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {errors.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Average Recurrence Rate
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {(errors.reduce((sum, e) => sum + e.recurrence_rate, 0) / errors.length).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Students Affected
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {Math.max(...errors.map(e => e.unique_students))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Cards */}
      <Grid container spacing={3}>
        {errors.map((recurringError) => (
          <Grid item xs={12} key={recurringError.id}>
            <Card
              elevation={3}
              sx={{
                borderLeft: `6px solid`,
                borderLeftColor: `${getSeverityColor(recurringError.severity_score)}.main`
              }}
            >
              <CardContent>
                {/* Header Row */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Badge badgeContent={recurringError.priority_rank} color="primary">
                        <WarningIcon color={getSeverityColor(recurringError.severity_score)} />
                      </Badge>
                      <Typography variant="h6" fontWeight="bold">
                        {recurringError.error_title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Concept: {recurringError.concept_id}
                    </Typography>
                  </Box>
                  {showActions && (
                    <Tooltip title={recurringError.is_highlighted ? "Hide from dashboard" : "Show on dashboard"}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleHighlight(recurringError.id, recurringError.is_highlighted)}
                      >
                        {recurringError.is_highlighted ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {/* Metrics Row */}
                <Grid container spacing={2} mb={2}>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Recurrence Rate
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" fontWeight="bold">
                          {recurringError.recurrence_rate.toFixed(1)}%
                        </Typography>
                        <TrendingUpIcon fontSize="small" color="error" />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(recurringError.recurrence_rate, 100)}
                        color={getSeverityColor(recurringError.severity_score)}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Severity Score
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" fontWeight="bold">
                          {recurringError.severity_score.toFixed(1)}
                        </Typography>
                        <Chip
                          label={getSeverityLabel(recurringError.severity_score)}
                          color={getSeverityColor(recurringError.severity_score)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Total Occurrences
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {recurringError.total_occurrences}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Students Affected
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="h6" fontWeight="bold">
                          {recurringError.unique_students}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Error Summary */}
                <Typography variant="body2" paragraph>
                  {recurringError.error_summary}
                </Typography>

                {/* Recommended Action */}
                {recurringError.recommended_action && (
                  <Alert severity="info" icon={<TrendingUpIcon />}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Recommended Action
                    </Typography>
                    <Typography variant="body2">
                      {recurringError.recommended_action}
                    </Typography>
                  </Alert>
                )}

                {/* Footer */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Typography variant="caption" color="textSecondary">
                    First detected: {formatDate(recurringError.created_at)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Last updated: {formatDate(recurringError.updated_at)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RecurringErrorDashboard;
