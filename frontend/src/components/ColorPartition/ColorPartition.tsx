/**
 * Color Partition Main Component
 * Provides UI for inputting function and displaying analysis
 */
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { functionAPI } from '../../services/api';
import type {
  FunctionAnalysisRequest,
  FunctionAnalysisResponse,
  IntervalProperty,
} from '../../types';
import ColorPartitionGraph from './ColorPartitionGraph';
import IntervalLegend from './IntervalLegend';

const DEFAULT_EXPRESSION = 'x**2 - 4*x + 3';

export const ColorPartition: React.FC = () => {
  const [expression, setExpression] = useState(DEFAULT_EXPRESSION);
  const [xMin, setXMin] = useState(-2);
  const [xMax, setXMax] = useState(6);
  const [selectedProperties, setSelectedProperties] = useState<IntervalProperty[]>([
    'increasing',
    'decreasing',
  ]);
  const [analysisResult, setAnalysisResult] = useState<FunctionAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const propertyOptions: { value: IntervalProperty; label: string }[] = [
    { value: 'increasing', label: '증가 (Increasing)' },
    { value: 'decreasing', label: '감소 (Decreasing)' },
    { value: 'concave_up', label: '아래로 볼록 (Concave Up)' },
    { value: 'concave_down', label: '위로 볼록 (Concave Down)' },
    { value: 'positive', label: '양수 (Positive)' },
    { value: 'negative', label: '음수 (Negative)' },
  ];

  const handlePropertyToggle = (property: IntervalProperty) => {
    setSelectedProperties((prev) =>
      prev.includes(property)
        ? prev.filter((p) => p !== property)
        : [...prev, property]
    );
  };

  const handleAnalyze = async () => {
    if (!expression.trim()) {
      setError('함수를 입력해주세요. (Please enter a function)');
      return;
    }

    if (selectedProperties.length === 0) {
      setError('최소 하나의 성질을 선택해주세요. (Please select at least one property)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: FunctionAnalysisRequest = {
        expression: expression.trim(),
        x_min: xMin,
        x_max: xMax,
        properties: selectedProperties,
      };

      const result = await functionAPI.analyzeFunction(request);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          '함수 분석 중 오류가 발생했습니다. (Error analyzing function)'
      );
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', padding: 2 }}>
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Color Partition - 함수 구간 분석
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          수학 함수의 구간별 성질을 색깔 층으로 시각화합니다.
        </Typography>

        <Grid container spacing={2} sx={{ marginTop: 2 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="함수 (Function Expression)"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="x**2 - 4*x + 3"
              helperText="예: x**2, sin(x), exp(x), x**3 - 2*x"
              variant="outlined"
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="최소 x 값 (x min)"
              type="number"
              value={xMin}
              onChange={(e) => setXMin(Number(e.target.value))}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="최대 x 값 (x max)"
              type="number"
              value={xMax}
              onChange={(e) => setXMax(Number(e.target.value))}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset" variant="standard">
              <FormLabel component="legend">분석할 성질 (Properties to Analyze)</FormLabel>
              <FormGroup row>
                {propertyOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={selectedProperties.includes(option.value)}
                        onChange={() => handlePropertyToggle(option.value)}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAnalyze}
              disabled={loading}
              fullWidth
              sx={{ height: '48px' }}
            >
              {loading ? <CircularProgress size={24} /> : '분석하기 (Analyze)'}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ marginTop: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {analysisResult && (
        <>
          <Paper elevation={3} sx={{ padding: 2, marginBottom: 2, height: '500px' }}>
            <ColorPartitionGraph
              plotPoints={analysisResult.plot_points}
              intervals={analysisResult.intervals}
              expression={analysisResult.expression}
              showIntervals={true}
            />
          </Paper>

          <IntervalLegend intervals={analysisResult.intervals} />

          {analysisResult.derivative && (
            <Paper elevation={2} sx={{ padding: 2, marginTop: 2, backgroundColor: '#f5f5f5' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                1차 도함수 (First Derivative):
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                f'(x) = {analysisResult.derivative}
              </Typography>

              {analysisResult.second_derivative && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', marginTop: 1 }}>
                    2차 도함수 (Second Derivative):
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    f''(x) = {analysisResult.second_derivative}
                  </Typography>
                </>
              )}
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default ColorPartition;
