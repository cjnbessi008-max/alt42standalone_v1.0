/**
 * Demo Page - Dot Expansion Feature
 * Demonstrates the integration with Moodle LMS
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  ButtonGroup,
  Paper,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DotExpansion from '../components/DotExpansion';
import VirtualPhone from '../components/VirtualPhone';
import { moodleApi } from '../services/moodleApi';
import type { MoodleProblem, DotPattern, DotColor } from '../types';

const DemoPage: React.FC = () => {
  // State
  const [currentProblem, setCurrentProblem] = useState<MoodleProblem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dot Expansion settings
  const [dotCount, setDotCount] = useState(24);
  const [pattern, setPattern] = useState<DotPattern>('grid');
  const [color, setColor] = useState<DotColor>('primary');
  const [animate, setAnimate] = useState(true);
  const [glowEffect, setGlowEffect] = useState(true);

  // Load initial problem
  useEffect(() => {
    loadRandomProblem();
  }, []);

  // Load problem from Moodle API
  const loadRandomProblem = async () => {
    setLoading(true);
    setError(null);

    try {
      const problemId = Math.floor(Math.random() * 5) + 1;
      const response = await moodleApi.getProblem(problemId);

      if (response.success && response.data) {
        setCurrentProblem(response.data);
        setDotCount(response.data.possibilitiesCount);
      } else {
        setError(response.error || 'Failed to load problem');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Handle dot click
  const handleDotClick = (index: number) => {
    console.log(`Dot ${index + 1} clicked`);
    // Track interaction for learning analytics
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Dot Expansion Demo
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          경우의 수 시각화 시스템 - Moodle LMS 연동
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Chip label="Moodle 3.7" color="primary" />
          <Chip label="PHP 7.1.9" color="secondary" />
          <Chip label="MySQL 5.7" />
          <Chip label="React 18" color="success" />
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {/* Left Column - Controls */}
        <Box>
          {/* Current Problem */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                현재 문제
              </Typography>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {currentProblem && !loading && (
                <>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                    {currentProblem.questionText}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={`난이도: ${'⭐'.repeat(currentProblem.difficulty)}`}
                      size="small"
                      color="warning"
                    />
                    <Chip
                      label={`경우의 수: ${currentProblem.possibilitiesCount}`}
                      size="small"
                      color="info"
                    />
                    <Chip
                      label={currentProblem.questionType}
                      size="small"
                    />
                  </Box>
                </>
              )}
            </CardContent>
            <CardActions>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadRandomProblem}
                disabled={loading}
                fullWidth
                variant="contained"
              >
                다른 문제 불러오기
              </Button>
            </CardActions>
          </Card>

          {/* Visualization Controls */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              시각화 설정
            </Typography>

            {/* Dot Count */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                점 개수: {dotCount}
              </Typography>
              <Slider
                value={dotCount}
                onChange={(_, value) => setDotCount(value as number)}
                min={1}
                max={100}
                marks={[
                  { value: 1, label: '1' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                  { value: 75, label: '75' },
                  { value: 100, label: '100' }
                ]}
              />
            </Box>

            {/* Pattern Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>패턴</InputLabel>
              <Select
                value={pattern}
                label="패턴"
                onChange={(e) => setPattern(e.target.value as DotPattern)}
              >
                <MenuItem value="grid">그리드 (Grid)</MenuItem>
                <MenuItem value="circle">원형 (Circle)</MenuItem>
                <MenuItem value="pyramid">피라미드 (Pyramid)</MenuItem>
                <MenuItem value="tree">트리 (Tree)</MenuItem>
                <MenuItem value="scatter">분산 (Scatter)</MenuItem>
              </Select>
            </FormControl>

            {/* Color Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>색상</InputLabel>
              <Select
                value={color}
                label="색상"
                onChange={(e) => setColor(e.target.value as DotColor)}
              >
                <MenuItem value="primary">Primary</MenuItem>
                <MenuItem value="secondary">Secondary</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>

            {/* Toggle Buttons */}
            <ButtonGroup fullWidth variant="outlined" sx={{ mb: 2 }}>
              <Button
                onClick={() => setAnimate(!animate)}
                variant={animate ? 'contained' : 'outlined'}
              >
                애니메이션 {animate ? 'ON' : 'OFF'}
              </Button>
              <Button
                onClick={() => setGlowEffect(!glowEffect)}
                variant={glowEffect ? 'contained' : 'outlined'}
              >
                빛 효과 {glowEffect ? 'ON' : 'OFF'}
              </Button>
            </ButtonGroup>

            {/* Sync with Problem */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PlayArrowIcon />}
              onClick={() => currentProblem && setDotCount(currentProblem.possibilitiesCount)}
              disabled={!currentProblem}
            >
              문제와 동기화
            </Button>
          </Paper>
        </Box>

        {/* Right Column - Desktop Preview */}
        <Box>
          <Paper
            sx={{
              p: 4,
              minHeight: 600,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'background.default'
            }}
          >
            <Typography variant="h6" gutterBottom>
              데스크톱 미리보기
            </Typography>
            <Box sx={{ mt: 2 }}>
              <DotExpansion
                count={dotCount}
                pattern={pattern}
                config={{
                  color,
                  glowEffect,
                  size: 20,
                  spacing: 8,
                  animationDuration: 300
                }}
                maxDotsPerRow={10}
                onDotClick={handleDotClick}
                animate={animate}
              />
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Virtual Phone Display - Bottom Right */}
      <VirtualPhone position="bottom-right" phoneModel="iphone" scale={0.5}>
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            모바일 앱
          </Typography>

          {currentProblem && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                {currentProblem.questionText}
              </Typography>
            </Box>
          )}

          <Box sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.paper',
            borderRadius: 1,
            p: 1
          }}>
            <DotExpansion
              count={dotCount}
              pattern={pattern}
              config={{
                color,
                glowEffect,
                size: 12,
                spacing: 4,
                animationDuration: 300
              }}
              maxDotsPerRow={6}
              onDotClick={handleDotClick}
              animate={animate}
            />
          </Box>

          <Typography
            variant="caption"
            sx={{ mt: 1, textAlign: 'center', fontSize: '9px' }}
            color="text.secondary"
          >
            경우의 수: {dotCount}
          </Typography>
        </Box>
      </VirtualPhone>

      {/* Footer Info */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          🎓 KAIST Touch Math Academy - AI Education System Pipeline
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Moodle LMS Integration (MySQL 5.7, PHP 7.1.9, Moodle 3.7)
        </Typography>
      </Box>
    </Container>
  );
};

export default DemoPage;
