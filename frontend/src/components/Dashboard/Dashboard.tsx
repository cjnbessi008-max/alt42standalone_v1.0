import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { MoodleQuiz, CorrelationData, QuestionStats } from '../../types';
import apiService from '../../services/api';

interface DashboardProps {
  onQuizSelected: (quizId: number) => void;
  selectedQuizId: number | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onQuizSelected, selectedQuizId }) => {
  const [quizzes, setQuizzes] = useState<MoodleQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [loadingCorrelation, setLoadingCorrelation] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      loadCorrelationData(selectedQuizId);
    }
  }, [selectedQuizId]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError('Failed to load quizzes. Please check your Moodle connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCorrelationData = async (quizId: number) => {
    try {
      setLoadingCorrelation(true);
      setError(null);
      const data = await apiService.getCorrelationData(quizId);
      setCorrelationData(data);
    } catch (err) {
      setError('Failed to load correlation data.');
      console.error(err);
    } finally {
      setLoadingCorrelation(false);
    }
  };

  const handleQuizChange = (quizId: number) => {
    onQuizSelected(quizId);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Correlation Heat Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Visualize question correlations from Moodle quizzes
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Select Quiz</InputLabel>
          <Select
            value={selectedQuizId || ''}
            onChange={(e) => handleQuizChange(Number(e.target.value))}
            label="Select Quiz"
            disabled={loading}
          >
            {quizzes.map((quiz) => (
              <MenuItem key={quiz.id} value={quiz.id}>
                {quiz.name} (Course ID: {quiz.course})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {loadingCorrelation && (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress size={30} sx={{ mr: 2 }} />
          <Typography>Calculating correlations...</Typography>
        </Box>
      )}

      {correlationData && !loadingCorrelation && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {correlationData.quizName}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Questions
                    </Typography>
                    <Typography variant="h4">
                      {correlationData.questions.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Average Success Rate
                    </Typography>
                    <Typography variant="h4">
                      {(
                        correlationData.questions.reduce(
                          (sum, q) => sum + q.successRate,
                          0
                        ) / correlationData.questions.length * 100
                      ).toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Data Updated
                    </Typography>
                    <Typography variant="h6">
                      {new Date(correlationData.timestamp).toLocaleTimeString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Question Statistics
            </Typography>
            <Grid container spacing={2}>
              {correlationData.questions.map((question) => (
                <Grid item xs={12} sm={6} md={4} key={question.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          Question {question.slot}
                        </Typography>
                        <Chip
                          label={`${(question.successRate * 100).toFixed(0)}%`}
                          size="small"
                          color={question.successRate >= 0.7 ? 'success' : question.successRate >= 0.4 ? 'warning' : 'error'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Attempts: {question.totalAttempts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Correct: {question.correctAttempts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Mark: {question.averageMark.toFixed(2)} / {question.maxMark}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
