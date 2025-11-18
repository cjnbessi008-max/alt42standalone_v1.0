import {
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { SubmitAnswerResponse, Fraction } from '../types';
import { useState } from 'react';
import FractionVisualizer from './FractionVisualizer';

interface FeedbackDisplayProps {
  result: SubmitAnswerResponse;
  onNext: () => void;
}

const FeedbackDisplay = ({ result, onNext }: FeedbackDisplayProps) => {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <Box mt={4}>
      {/* Correct/Incorrect Alert */}
      <Alert
        severity={result.is_correct ? 'success' : 'error'}
        icon={result.is_correct ? <CheckCircleIcon /> : <ErrorIcon />}
        sx={{ mb: 3, fontSize: '1.1rem' }}
      >
        <AlertTitle sx={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
          {result.is_correct ? '정답입니다! 🎉' : '다시 한 번 시도해보세요'}
        </AlertTitle>
        {result.is_equivalent && '답이 맞지만, 더 간단히 할 수 있어요!'}
      </Alert>

      {/* Error Analysis */}
      {!result.is_correct && result.error_analysis && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>
            <ErrorIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            오류 분석
          </Typography>

          <Box my={2}>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              실수한 부분:
            </Typography>
            <Typography variant="body1" paragraph>
              {result.error_analysis.identified_mistake}
            </Typography>
          </Box>

          <Box my={2}>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              설명:
            </Typography>
            <Typography variant="body1" paragraph>
              {result.error_analysis.explanation}
            </Typography>
          </Box>

          <Box my={2}>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              <LightbulbIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#ffc107' }} />
              힌트:
            </Typography>
            <Typography variant="body1" paragraph color="primary">
              {result.error_analysis.hint}
            </Typography>
          </Box>

          {result.error_analysis.common_misconception && (
            <Alert severity="info" sx={{ my: 2 }}>
              <AlertTitle>흔한 실수</AlertTitle>
              {result.error_analysis.common_misconception}
            </Alert>
          )}

          {result.error_analysis.step_by_step && result.error_analysis.step_by_step.length > 0 && (
            <Box my={2}>
              <Button
                variant="outlined"
                onClick={() => setShowSteps(!showSteps)}
                sx={{ mb: 2 }}
              >
                {showSteps ? '단계별 풀이 숨기기' : '단계별 풀이 보기'}
              </Button>

              <Collapse in={showSteps}>
                <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="body1" fontWeight="bold" gutterBottom>
                    단계별 풀이:
                  </Typography>
                  <List>
                    {result.error_analysis.step_by_step.map((step, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <PlayArrowIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={`${index + 1}. ${step}`} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Collapse>
            </Box>
          )}
        </Paper>
      )}

      {/* Correct Answer Display */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          정답:
        </Typography>
        <Box display="flex" justifyContent="center" alignItems="center" gap={4}>
          <Typography variant="h3" color="success.main">
            {result.correct_answer.numerator} / {result.correct_answer.denominator}
          </Typography>
          <FractionVisualizer
            fraction={result.correct_answer as Fraction}
            visualType="pizza"
            size={150}
          />
        </Box>
      </Paper>

      {/* Next Button */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Button variant="contained" size="large" onClick={onNext} sx={{ px: 6, py: 2 }}>
          다음 문제
        </Button>
      </Box>
    </Box>
  );
};

export default FeedbackDisplay;
