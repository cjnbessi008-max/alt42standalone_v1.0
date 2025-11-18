import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Stack,
  Paper,
  Fade,
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';

interface Step {
  stepNumber: number;
  stepType: string;
  summary?: string;
  durationSeconds?: number;
  status: 'completed' | 'active' | 'pending';
}

interface MetacognitiveMirrorProps {
  currentSummary: string;
  currentStep: number;
  totalSteps: number;
  stepHistory: Step[];
  strategies: string[];
  loading?: boolean;
}

const STEP_TYPE_LABELS: Record<string, string> = {
  'reading': '문제 읽기',
  'analyzing': '정보 파악',
  'strategy-planning': '전략 수립',
  'executing': '실행',
  'verifying': '검증',
  'reflecting': '반성',
};

const STRATEGY_LABELS: Record<string, string> = {
  'problem-reading': '문제 분석',
  'information-extraction': '정보 추출',
  'visualization': '시각화',
  'step-planning': '단계별 계획',
  'calculation': '계산',
  'verification': '검증',
  'self-correction': '자기 수정',
};

export default function MetacognitiveMirror({
  currentSummary,
  currentStep,
  totalSteps,
  stepHistory,
  strategies,
  loading = false,
}: MetacognitiveMirrorProps) {
  const [displaySummary, setDisplaySummary] = useState(currentSummary);

  useEffect(() => {
    setDisplaySummary(currentSummary);
  }, [currentSummary]);

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <Box>
      {/* Current Step Panel */}
      <Fade in={true}>
        <Card
          elevation={3}
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <PsychologyIcon fontSize="large" />
              <Typography variant="h6" fontWeight="bold">
                지금 이런 생각을 하고 있어요
              </Typography>
            </Stack>

            {loading ? (
              <Box>
                <Typography variant="body1" sx={{ mb: 1, opacity: 0.9 }}>
                  생각을 분석하는 중...
                </Typography>
                <LinearProgress
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'white',
                    },
                  }}
                />
              </Box>
            ) : (
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                {displaySummary || '문제를 풀기 시작해보세요!'}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Fade>

      {/* Step History Timeline */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <TimelineIcon />
            <Typography variant="h6">
              지금까지의 문제 풀이 과정
            </Typography>
          </Stack>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              진행률: {Math.round(progress)}%
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>

          <Stack spacing={1.5}>
            {stepHistory.map((step) => (
              <Paper
                key={step.stepNumber}
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor:
                    step.status === 'active'
                      ? 'primary.50'
                      : step.status === 'completed'
                      ? 'success.50'
                      : 'grey.50',
                  border: '1px solid',
                  borderColor:
                    step.status === 'active'
                      ? 'primary.main'
                      : 'transparent',
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {step.status === 'completed' ? (
                      <CheckCircleIcon color="success" />
                    ) : step.status === 'active' ? (
                      <RadioButtonCheckedIcon color="primary" />
                    ) : (
                      <RadioButtonCheckedIcon color="disabled" />
                    )}

                    <Box>
                      <Typography variant="subtitle2">
                        {step.stepNumber}.{' '}
                        {STEP_TYPE_LABELS[step.stepType] || step.stepType}
                      </Typography>
                      {step.summary && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {step.summary}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  {step.durationSeconds !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(step.durationSeconds)}초
                    </Typography>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Cognitive Strategies */}
      {strategies && strategies.length > 0 && (
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              사용한 전략
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {strategies.map((strategy) => (
                <Chip
                  key={strategy}
                  label={STRATEGY_LABELS[strategy] || strategy}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
