/**
 * Teacher Dashboard
 * View student engagement metrics and DMN drift data
 */

import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Refresh, Send } from '@mui/icons-material';
import api from '../services/api';
import { LearningSession, DmnDriftMetrics, AggregateStats, DriftLevel } from '../types';

interface TeacherDashboardProps {
  studentId?: number;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ studentId }) => {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [metrics, setMetrics] = useState<DmnDriftMetrics[]>([]);
  const [aggregateStats, setAggregateStats] = useState<AggregateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<LearningSession | null>(null);
  const [interventionDialog, setInterventionDialog] = useState(false);
  const [interventionText, setInterventionText] = useState('');

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const fetchData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);

      // Fetch sessions
      const sessionsData = await api.getStudentSessions(studentId);
      setSessions(sessionsData);

      // Fetch metrics
      const metricsData = await api.getStudentMetrics(studentId);
      setMetrics(metricsData.metrics);
      setAggregateStats(metricsData.aggregate_stats);

    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDriftLevelColor = (level: DriftLevel): string => {
    const colors = {
      low: '#4caf50',
      moderate: '#ff9800',
      high: '#f44336',
      critical: '#d32f2f'
    };
    return colors[level] || '#9e9e9e';
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleSendIntervention = async () => {
    if (!selectedSession) return;

    // This would call an intervention API
    console.log('Sending intervention:', interventionText);

    setInterventionDialog(false);
    setInterventionText('');
    setSelectedSession(null);
  };

  // Prepare chart data
  const driftTrendData = metrics
    .slice(0, 20)
    .reverse()
    .map((m, i) => ({
      index: i + 1,
      drift: m.dmn_drift_score,
      accuracy: m.accuracy_rate,
      time: new Date(m.calculated_at).toLocaleTimeString()
    }));

  const driftDistributionData = aggregateStats
    ? Object.entries(aggregateStats.drift_level_distribution).map(([level, count]) => ({
        level,
        count,
        color: getDriftLevelColor(level as DriftLevel)
      }))
    : [];

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Student Engagement Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchData}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Drift Score
              </Typography>
              <Typography variant="h4">
                {aggregateStats?.avg_drift_score.toFixed(1) || 'N/A'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Lower is better
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Accuracy
              </Typography>
              <Typography variant="h4">
                {aggregateStats?.avg_accuracy.toFixed(1) || 'N/A'}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Across all sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sessions
              </Typography>
              <Typography variant="h4">
                {sessions.length}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {sessions.filter(s => s.status === 'active').length} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Measurements
              </Typography>
              <Typography variant="h4">
                {aggregateStats?.total_measurements || 0}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Data points collected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={3}>
        {/* Drift Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                DMN Drift Trend (Last 20 Measurements)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={driftTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="drift"
                    stroke="#f44336"
                    name="Drift Score"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#4caf50"
                    name="Accuracy %"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Drift Level Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Drift Level Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={driftDistributionData}
                    dataKey="count"
                    nameKey="level"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {driftDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sessions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Learning Sessions
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Module</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Drift Score</TableCell>
                  <TableCell>Accuracy</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.slice(0, 10).map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.module_name}</TableCell>
                    <TableCell>
                      {new Date(session.session_start).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {formatDuration(session.total_duration_seconds)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={session.dmn_drift_score.toFixed(1)}
                        size="small"
                        color={
                          session.dmn_drift_score < 40
                            ? 'success'
                            : session.dmn_drift_score < 60
                            ? 'warning'
                            : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {session.accuracy_rate?.toFixed(1) || 'N/A'}%
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={session.status}
                        size="small"
                        color={session.status === 'active' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<Send />}
                        onClick={() => {
                          setSelectedSession(session);
                          setInterventionDialog(true);
                        }}
                        disabled={session.status !== 'active'}
                      >
                        Intervene
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Intervention Dialog */}
      <Dialog
        open={interventionDialog}
        onClose={() => setInterventionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Intervention Message</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Message to Student"
            fullWidth
            multiline
            rows={4}
            value={interventionText}
            onChange={(e) => setInterventionText(e.target.value)}
            placeholder="e.g., Take a short break and come back refreshed!"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterventionDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSendIntervention}
            variant="contained"
            disabled={!interventionText.trim()}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherDashboard;
