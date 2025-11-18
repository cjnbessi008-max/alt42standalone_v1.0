import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import type { PredictionResponse } from '../types';

interface WrongAnswerPredictionModalProps {
  open: boolean;
  prediction: PredictionResponse | null;
  onReview: () => void;
  onSubmitAnyway: () => void;
}

const WrongAnswerPredictionModal: React.FC<WrongAnswerPredictionModalProps> = ({
  open,
  prediction,
  onReview,
  onSubmitAnyway,
}) => {
  if (!prediction || !prediction.is_likely_wrong) {
    return null;
  }

  const confidenceColor =
    prediction.confidence > 0.8 ? 'error' :
    prediction.confidence > 0.6 ? 'warning' :
    'info';

  const confidenceLabel =
    prediction.confidence > 0.8 ? '높음' :
    prediction.confidence > 0.6 ? '중간' :
    '낮음';

  return (
    <Dialog
      open={open}
      onClose={onReview}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3,
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: 'warning.light',
        color: 'warning.contrastText'
      }}>
        <WarningAmberIcon />
        <Typography variant="h6" component="span">
          잠깐! 답을 다시 확인해볼까요?
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`예측 신뢰도: ${confidenceLabel} (${Math.round(prediction.confidence * 100)}%)`}
            color={confidenceColor}
            size="small"
            sx={{ mb: 2 }}
          />
        </Box>

        {prediction.error_type && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              예상되는 문제: {prediction.error_type}
            </Typography>
          </Alert>
        )}

        {prediction.explanation && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" color="text.secondary" paragraph>
              {prediction.explanation}
            </Typography>
          </Box>
        )}

        {prediction.suggestion && (
          <Box
            sx={{
              p: 2,
              bgcolor: 'info.light',
              borderRadius: 1,
              display: 'flex',
              gap: 1,
              alignItems: 'flex-start'
            }}
          >
            <LightbulbIcon color="info" />
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" color="info.dark">
                힌트
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {prediction.suggestion}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onReview}
          variant="contained"
          color="primary"
          size="large"
          fullWidth
        >
          다시 풀어보기
        </Button>
        <Button
          onClick={onSubmitAnyway}
          variant="outlined"
          color="inherit"
          size="large"
          fullWidth
        >
          그래도 제출하기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WrongAnswerPredictionModal;
