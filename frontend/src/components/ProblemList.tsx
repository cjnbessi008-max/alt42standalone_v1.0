import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Problem, problemsAPI, Stats } from '../services/api';
import { ProblemItem } from './ProblemItem';
import { PriorityFilter } from './PriorityFilter';

interface ProblemListProps {
  isInstructorMode: boolean;
}

export const ProblemList: React.FC<ProblemListProps> = ({ isInstructorMode }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    priority: 'all',
    difficulty: 'all',
    subject: 'all',
    sort: 'recent',
  });

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        difficulty: filters.difficulty !== 'all' ? filters.difficulty : undefined,
        subject: filters.subject !== 'all' ? filters.subject : undefined,
        sort: filters.sort !== 'recent' ? filters.sort : undefined,
      };

      const [problemsData, statsData] = await Promise.all([
        problemsAPI.getAll(filterParams),
        problemsAPI.getStats(),
      ]);

      setProblems(problemsData);
      setStats(statsData);
    } catch (err) {
      setError('문제를 불러오는 중 오류가 발생했습니다.');
      console.error('Error fetching problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [filters]);

  const handleUpdatePriority = async (id: number, priority: string | null) => {
    try {
      await problemsAPI.updatePriority(id, priority);
      fetchProblems();
    } catch (err) {
      setError('우선순위 업데이트 중 오류가 발생했습니다.');
      console.error('Error updating priority:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  전체 문제
                </Typography>
                <Typography variant="h4">{stats.total.count}</Typography>
              </CardContent>
            </Card>
          </Grid>
          {stats.by_priority.map((item) => {
            const labels: Record<string, string> = {
              important: '⭐ 중요',
              solve_first: '🚩 먼저 풀기',
              review: '📌 복습',
            };
            if (!item.priority_flag) return null;
            return (
              <Grid item xs={12} sm={6} md={3} key={item.priority_flag}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      {labels[item.priority_flag]}
                    </Typography>
                    <Typography variant="h4">{item.count}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <PriorityFilter
          priority={filters.priority}
          difficulty={filters.difficulty}
          subject={filters.subject}
          sort={filters.sort}
          onPriorityChange={(value) => setFilters({ ...filters, priority: value })}
          onDifficultyChange={(value) => setFilters({ ...filters, difficulty: value })}
          onSubjectChange={(value) => setFilters({ ...filters, subject: value })}
          onSortChange={(value) => setFilters({ ...filters, sort: value })}
        />
      </Paper>

      {problems.length === 0 ? (
        <Alert severity="info">표시할 문제가 없습니다.</Alert>
      ) : (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {problems.length}개의 문제
          </Typography>
          {problems.map((problem) => (
            <ProblemItem
              key={problem.id}
              problem={problem}
              onUpdatePriority={handleUpdatePriority}
              isInstructorMode={isInstructorMode}
            />
          ))}
        </Box>
      )}
    </Container>
  );
};
