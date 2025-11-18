import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

import InverseReflectionCanvas from '../components/InverseReflectionCanvas';
import { problemsApi } from '../services/api';
import type { InverseProblem, Point } from '../types/problem';

const InverseReflectionPage: React.FC = () => {
  const { problemId } = useParams<{ problemId?: string }>();
  const [problem, setProblem] = useState<InverseProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reflectionCount, setReflectionCount] = useState(0);
  const [startTime] = useState(Date.now());

  // Load problem
  useEffect(() => {
    const loadProblem = async () => {
      try {
        setLoading(true);
        let data: InverseProblem;

        if (problemId) {
          data = await problemsApi.getById(problemId);
        } else {
          // Load first available problem or use demo
          const problems = await problemsApi.getAll({ limit: 1 });
          if (problems.length > 0) {
            data = problems[0];
          } else {
            // Demo problem
            data = {
              id: 'demo',
              function_type: 'linear',
              original_function: '2*x + 3',
              inverse_function: '(x - 3) / 2',
              domain_min: -5,
              domain_max: 5,
              difficulty_level: 'easy',
              hints: [
                { step: 1, text: 'Step 1: Replace f(x) with y' },
                { step: 2, text: 'Step 2: Swap x and y' },
                { step: 3, text: 'Step 3: Solve for y' },
              ],
              visualization_config: {
                show_grid: true,
                show_reflection_line: true,
                animation_speed: 'medium',
                color_original: '#2196F3',
                color_inverse: '#F44336',
                color_reflection_line: '#4CAF50',
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          }
        }

        setProblem(data);
        setError(null);
      } catch (err) {
        console.error('Error loading problem:', err);
        setError('Failed to load problem. Using demo problem instead.');

        // Fallback to demo problem
        setProblem({
          id: 'demo',
          function_type: 'linear',
          original_function: '2*x + 3',
          inverse_function: '(x - 3) / 2',
          domain_min: -5,
          domain_max: 5,
          difficulty_level: 'easy',
          hints: [
            { step: 1, text: 'Step 1: Replace f(x) with y' },
            { step: 2, text: 'Step 2: Swap x and y' },
            { step: 3, text: 'Step 3: Solve for y' },
          ],
          visualization_config: {
            show_grid: true,
            show_reflection_line: true,
            animation_speed: 'medium',
            color_original: '#2196F3',
            color_inverse: '#F44336',
            color_reflection_line: '#4CAF50',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    loadProblem();
  }, [problemId]);

  const handlePointReflected = (original: Point, reflected: Point) => {
    setReflectionCount((prev) => prev + 1);
    console.log('Point reflected:', { original, reflected });
  };

  const handleReset = () => {
    setReflectionCount(0);
    window.location.reload();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!problem) {
    return (
      <Alert severity="error">
        Problem not found. Please check the URL or select a different problem.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          🪞 Inverse Reflection Visualization
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          역함수를 거울 반사처럼 시각화하여 이해하기
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Chip label={`난이도: ${problem.difficulty_level}`} color="primary" sx={{ mr: 1 }} />
          <Chip label={problem.function_type} variant="outlined" sx={{ mr: 1 }} />
          <Chip label={`반사 횟수: ${reflectionCount}`} color="secondary" />
        </Box>
      </Paper>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Visualization */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                원함수: <code style={{ color: '#2196F3' }}>f(x) = {problem.original_function}</code>
              </Typography>
              <Typography variant="h6" gutterBottom>
                역함수: <code style={{ color: '#F44336' }}>f⁻¹(x) = {problem.inverse_function}</code>
              </Typography>
            </Box>

            <InverseReflectionCanvas problem={problem} onPointReflected={handlePointReflected} />

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                📍 그래프 위의 점을 클릭하여 반사를 확인하세요
              </Typography>
              <Typography variant="body2" color="text.secondary">
                🔄 원함수의 점 (a, b)는 역함수에서 (b, a)로 반사됩니다
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Controls & Hints */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Controls
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="격자 표시"
                disabled
              />
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="반사선 (y=x) 표시"
                disabled
              />
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="애니메이션"
                disabled
              />
            </FormGroup>

            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" fullWidth onClick={handleReset}>
                초기화
              </Button>
            </Box>
          </Paper>

          {problem.hints && problem.hints.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="h6">힌트</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {problem.hints.map((hint, index) => (
                    <Typography key={index} variant="body2" paragraph>
                      {hint.text}
                    </Typography>
                  ))}
                </AccordionDetails>
              </Accordion>
            </Paper>
          )}

          <Paper sx={{ p: 3, mt: 2, bgcolor: 'info.light' }}>
            <Typography variant="subtitle2" gutterBottom>
              💡 학습 팁
            </Typography>
            <Typography variant="body2" paragraph>
              • 역함수는 원함수의 x와 y를 바꾼 것입니다
            </Typography>
            <Typography variant="body2" paragraph>
              • y=x 선은 대칭축 역할을 합니다
            </Typography>
            <Typography variant="body2">
              • f(f⁻¹(x)) = x가 성립합니다
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InverseReflectionPage;
