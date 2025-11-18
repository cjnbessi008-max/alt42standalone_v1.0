/**
 * BypassPrompt Component
 *
 * Displays a prompt offering easier problem when concentration drops
 */

import React, { useState } from 'react';
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
  Stack
} from '@mui/material';
import {
  TrendingDown,
  Schedule,
  ErrorOutline,
  LightbulbOutlined,
  CheckCircleOutline
} from '@mui/icons-material';

interface BypassPromptProps {
  open: boolean;
  triggerReason: 'low_concentration' | 'multiple_failures' | 'excessive_time';
  originalDifficulty: number;
  bypassDifficulty: number;
  concentrationScore?: number;
  failureCount?: number;
  avgTimeSpent?: number;
  onAccept: () => void;
  onDecline: () => void;
}

export const BypassPrompt: React.FC<BypassPromptProps> = ({
  open,
  triggerReason,
  originalDifficulty,
  bypassDifficulty,
  concentrationScore,
  failureCount,
  avgTimeSpent,
  onAccept,
  onDecline
}) => {
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    await onAccept();
    setAccepting(false);
  };

  // Get trigger-specific content
  const getTriggerContent = () => {
    switch (triggerReason) {
      case 'low_concentration':
        return {
          icon: <TrendingDown sx={{ fontSize: 48, color: '#ff9800' }} />,
          title: '집중력이 조금 떨어진 것 같아요',
          description: '지금은 쉬운 문제로 자신감을 되찾는 게 어떨까요?',
          color: '#ff9800',
          metric: concentrationScore
            ? `현재 집중도: ${Math.round(concentrationScore * 100)}%`
            : undefined
        };
      case 'multiple_failures':
        return {
          icon: <ErrorOutline sx={{ fontSize: 48, color: '#f44336' }} />,
          title: '이 문제가 조금 어려운 것 같아요',
          description: '더 쉬운 문제로 연습한 후 다시 도전해볼까요?',
          color: '#f44336',
          metric: failureCount ? `${failureCount}번 오답` : undefined
        };
      case 'excessive_time':
        return {
          icon: <Schedule sx={{ fontSize: 48, color: '#2196f3' }} />,
          title: '이 문제에 시간이 많이 걸리고 있어요',
          description: '기초를 다지고 다시 도전하는 건 어떨까요?',
          color: '#2196f3',
          metric: avgTimeSpent
            ? `평균 ${Math.round(avgTimeSpent / 60)}분 소요`
            : undefined
        };
      default:
        return {
          icon: <LightbulbOutlined sx={{ fontSize: 48, color: '#4caf50' }} />,
          title: '더 쉬운 문제를 추천해드립니다',
          description: '단계적으로 학습하면 더 효과적이에요!',
          color: '#4caf50'
        };
    }
  };

  const content = getTriggerContent();

  return (
    <Dialog
      open={open}
      onClose={onDecline}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          {content.icon}
          <Typography variant="h5" fontWeight="bold" textAlign="center">
            {content.title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography variant="body1" textAlign="center" color="text.secondary">
            {content.description}
          </Typography>

          {content.metric && (
            <Alert severity="info" icon={false} sx={{ borderRadius: 2 }}>
              <Typography variant="body2" textAlign="center">
                {content.metric}
              </Typography>
            </Alert>
          )}

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
              <Box textAlign="center">
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  현재 난이도
                </Typography>
                <Chip
                  label={`레벨 ${originalDifficulty}`}
                  sx={{
                    mt: 0.5,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>

              <Typography variant="h4" sx={{ opacity: 0.7 }}>
                →
              </Typography>

              <Box textAlign="center">
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  추천 난이도
                </Typography>
                <Chip
                  label={`레벨 ${bypassDifficulty}`}
                  icon={<CheckCircleOutline />}
                  sx={{
                    mt: 0.5,
                    backgroundColor: '#4caf50',
                    color: 'white',
                    fontWeight: 'bold',
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
              </Box>
            </Stack>
          </Box>

          <Alert severity="success" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>효과적인 학습법:</strong> 쉬운 문제를 먼저 마스터하면 어려운 문제도
              쉽게 풀 수 있어요!
            </Typography>
          </Alert>

          <Typography variant="caption" color="text.secondary" textAlign="center">
            쉬운 문제를 푼 후 언제든지 원래 문제로 돌아올 수 있습니다
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onDecline}
          variant="outlined"
          size="large"
          fullWidth
          sx={{ borderRadius: 2 }}
        >
          계속 도전하기
        </Button>
        <Button
          onClick={handleAccept}
          variant="contained"
          size="large"
          fullWidth
          disabled={accepting}
          sx={{
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
            }
          }}
        >
          {accepting ? '준비 중...' : '쉬운 문제로 연습하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BypassPrompt;
