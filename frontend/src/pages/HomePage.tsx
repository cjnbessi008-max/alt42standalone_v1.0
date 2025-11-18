import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { getAllProblems, getProblemsByDifficulty, Problem } from '../services/api';
import FunctionsIcon from '@mui/icons-material/Functions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(0);

  useEffect(() => {
    loadProblems();
  }, [selectedDifficulty]);

  const loadProblems = async () => {
    setLoading(true);
    setError(null);

    try {
      let data: Problem[];
      if (selectedDifficulty === 0) {
        data = await getAllProblems();
      } else {
        data = await getProblemsByDifficulty(selectedDifficulty);
      }
      setProblems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultyChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedDifficulty(newValue);
  };

  const getDifficultyColor = (level: number): 'success' | 'info' | 'warning' | 'error' => {
    if (level <= 2) return 'success';
    if (level === 3) return 'info';
    if (level === 4) return 'warning';
    return 'error';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FunctionsIcon sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h3" fontWeight="bold">
                Function Tree
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                함수 구조 시각화 교육 도구
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            복잡한 수학 함수식을 트리 구조로 분해하여 이해하기 쉽게 시각화합니다.
          </Typography>
        </Paper>

        {/* Difficulty Filter */}
        <Paper elevation={3} sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={selectedDifficulty}
            onChange={handleDifficultyChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="전체" />
            <Tab label="난이도 1" />
            <Tab label="난이도 2" />
            <Tab label="난이도 3" />
            <Tab label="난이도 4" />
            <Tab label="난이도 5" />
          </Tabs>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Problems Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              문제 목록 ({problems.length}개)
            </Typography>
            <Grid container spacing={3}>
              {problems.map((problem) => (
                <Grid item xs={12} sm={6} md={4} key={problem.id}>
                  <Card
                    elevation={2}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      },
                    }}
                  >
                    <CardContent sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip
                          label={`난이도 ${problem.difficulty_level}`}
                          color={getDifficultyColor(problem.difficulty_level)}
                          size="small"
                        />
                        <Chip label={problem.category} size="small" variant="outlined" />
                      </Box>

                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {problem.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {problem.description}
                      </Typography>

                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          backgroundColor: '#f9f9f9',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          overflow: 'auto',
                        }}
                      >
                        {problem.function_expression}
                      </Paper>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        endIcon={<PlayArrowIcon />}
                        onClick={() => navigate(`/problem/${problem.id}`)}
                      >
                        시작하기
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}

              {problems.length === 0 && (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      문제가 없습니다
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
};

export default HomePage;
