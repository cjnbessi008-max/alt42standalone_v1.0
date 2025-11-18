import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
} from '@mui/material';
import { getProblemById, parseFunction, Problem, FunctionTree } from '../services/api';
import FunctionTreeVisualization from '../components/FunctionTree/FunctionTreeVisualization';
import MobilePreview from '../components/MobilePreview/MobilePreview';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const ProblemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [tree, setTree] = useState<FunctionTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customExpression, setCustomExpression] = useState('');

  useEffect(() => {
    loadProblem();
  }, [id]);

  const loadProblem = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const problemData = await getProblemById(id);
      setProblem(problemData);

      // Parse the function expression
      const parseResult = await parseFunction(problemData.function_expression, id, false);
      setTree(parseResult.data.tree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomParse = async () => {
    if (!customExpression.trim()) return;

    try {
      setLoading(true);
      const parseResult = await parseFunction(customExpression);
      setTree(parseResult.data.tree);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse expression');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tree) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', backgroundColor: '#f5f5f5', overflow: 'auto' }}>
      <Container maxWidth="xl" sx={{ py: 3, height: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
          >
            목록으로
          </Button>
          {problem && (
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {problem.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                난이도: {problem.difficulty_level} | 카테고리: {problem.category}
              </Typography>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Main Content - Desktop: Side by side, Mobile: Stacked */}
        <Grid container spacing={3} sx={{ height: 'calc(100% - 120px)' }}>
          {/* Left Side: Function Tree Visualization */}
          <Grid item xs={12} lg={8} sx={{ height: { xs: '60vh', lg: '100%' } }}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
              }}
            >
              {/* Custom Expression Input */}
              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="커스텀 수식 입력"
                  placeholder="예: sin(2*x + 3)"
                  value={customExpression}
                  onChange={(e) => setCustomExpression(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomParse()}
                />
                <Button
                  variant="contained"
                  onClick={handleCustomParse}
                  disabled={!customExpression.trim()}
                >
                  파싱
                </Button>
              </Box>

              {tree && (
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <FunctionTreeVisualization
                    tree={tree.root}
                    expression={customExpression || problem?.function_expression || ''}
                  />
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Side: Mobile Preview (우측 하단 가상 스마트폰 화면) */}
          <Grid item xs={12} lg={4} sx={{ height: { xs: '40vh', lg: '100%' } }}>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                justifyContent: { xs: 'center', lg: 'flex-end' },
                alignItems: { xs: 'flex-start', lg: 'flex-end' },
              }}
            >
              <MobilePreview tree={tree} problem={problem} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProblemPage;
