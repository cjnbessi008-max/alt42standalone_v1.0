import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { problemAPI } from '../services/api';
import { getDifficultyColor } from '../utils/formatters';
import type { Problem } from '../types';

const ProblemList: React.FC = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);

  useEffect(() => {
    loadProblems();
  }, [difficultyFilter]);

  const loadProblems = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Problem[];
      if (difficultyFilter && difficultyFilter !== 'all') {
        data = await problemAPI.getByDifficulty(difficultyFilter as any);
      } else {
        data = await problemAPI.getAll();
      }

      setProblems(data);
    } catch (err) {
      console.error('Failed to load problems:', err);
      setError('문제를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultyChange = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null
  ) => {
    setDifficultyFilter(newFilter);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <SchoolIcon fontSize="large" />
          LMS 검산 체크포인트 시스템
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          문제를 풀고 제출 전 검산 체크포인트를 통과하세요
        </Typography>
      </Box>

      {/* Difficulty Filter */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={difficultyFilter}
          exclusive
          onChange={handleDifficultyChange}
          aria-label="난이도 필터"
        >
          <ToggleButton value="all" aria-label="전체">
            전체
          </ToggleButton>
          <ToggleButton value="easy" aria-label="쉬움">
            쉬움
          </ToggleButton>
          <ToggleButton value="medium" aria-label="보통">
            보통
          </ToggleButton>
          <ToggleButton value="hard" aria-label="어려움">
            어려움
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          💡 <strong>검산 체크포인트란?</strong> 답안 제출 전 자동으로 검증하여 즉각적인 피드백을 제공합니다.
          형식, 범위, 로직, 계산 검증을 통과하면 LMS에 제출할 수 있습니다.
        </Typography>
      </Alert>

      {/* Problem Grid */}
      <Grid container spacing={3}>
        {problems.map((problem) => (
          <Grid item xs={12} sm={6} md={4} key={problem.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={problem.difficulty}
                    size="small"
                    color={getDifficultyColor(problem.difficulty) as any}
                  />
                  <Chip
                    label={problem.problem_type}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Typography variant="h6" component="h2" gutterBottom>
                  {problem.title}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {problem.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TrophyIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {problem.points}점
                  </Typography>
                  {problem.max_attempts && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        최대 {problem.max_attempts}회 시도
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  size="medium"
                  fullWidth
                  variant="contained"
                  onClick={() => navigate(`/problem/${problem.id}`)}
                >
                  문제 풀기
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {problems.length === 0 && !loading && !error && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            문제가 없습니다.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ProblemList;
