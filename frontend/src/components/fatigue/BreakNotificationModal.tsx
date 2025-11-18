/**
 * BreakNotificationModal Component
 *
 * Modal that appears when the system recommends a break.
 * Non-blocking overlay allowing students to accept, dismiss, or defer the break.
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
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Alert
} from '@mui/material';
import {
  SelfImprovement,
  DirectionsWalk,
  LocalCafe,
  Visibility,
  Schedule,
  Close,
  CheckCircle
} from '@mui/icons-material';

interface BreakRecommendation {
  id: string;
  breakType: 'micro' | 'short' | 'medium' | 'long';
  durationMinutes: number;
  reason: string;
  fatigueScore: number;
  urgency: 'low' | 'medium' | 'high';
}

interface BreakNotificationModalProps {
  open: boolean;
  recommendation: BreakRecommendation | null;
  onAccept: (recommendationId: string) => void;
  onDismiss: (recommendationId: string, reason: string) => void;
  onDefer: (recommendationId: string, minutes: number) => void;
}

const BreakNotificationModal: React.FC<BreakNotificationModalProps> = ({
  open,
  recommendation,
  onAccept,
  onDismiss,
  onDefer
}) => {
  const [showDismissForm, setShowDismissForm] = useState(false);
  const [dismissReason, setDismissReason] = useState('');

  if (!recommendation) return null;

  // Break type configurations
  const breakTypeConfig = {
    micro: {
      label: '짧은 휴식',
      color: 'info',
      description: '눈 운동과 간단한 스트레칭'
    },
    short: {
      label: '휴식 필요',
      color: 'warning',
      description: '일어나서 움직이고 물 마시기'
    },
    medium: {
      label: '충분한 휴식',
      color: 'warning',
      description: '걷기, 스트레칭, 간식'
    },
    long: {
      label: '긴급 휴식',
      color: 'error',
      description: '활동적인 휴식이 필요합니다'
    }
  };

  const config = breakTypeConfig[recommendation.breakType];

  // Suggested activities based on break type
  const getSuggestedActivities = () => {
    const activities = {
      micro: [
        { icon: <Visibility />, text: '20-20-20 규칙: 20초간 20피트(6m) 거리 보기' },
        { icon: <SelfImprovement />, text: '목과 어깨 스트레칭' }
      ],
      short: [
        { icon: <DirectionsWalk />, text: '2-3분 걷기' },
        { icon: <LocalCafe />, text: '물 마시기' },
        { icon: <SelfImprovement />, text: '간단한 스트레칭' }
      ],
      medium: [
        { icon: <DirectionsWalk />, text: '5-10분 걷기' },
        { icon: <LocalCafe />, text: '간식과 물' },
        { icon: <SelfImprovement />, text: '전신 스트레칭' }
      ],
      long: [
        { icon: <DirectionsWalk />, text: '실외 산책 10-15분' },
        { icon: <LocalCafe />, text: '식사 또는 충분한 간식' },
        { icon: <SelfImprovement />, text: '요가 또는 가벼운 운동' }
      ]
    };

    return activities[recommendation.breakType] || activities.short;
  };

  const handleAcceptClick = () => {
    onAccept(recommendation.id);
    setShowDismissForm(false);
  };

  const handleDismissClick = () => {
    if (!showDismissForm) {
      setShowDismissForm(true);
      return;
    }

    if (dismissReason.trim()) {
      onDismiss(recommendation.id, dismissReason);
      setShowDismissForm(false);
      setDismissReason('');
    }
  };

  const handleDeferClick = (minutes: number) => {
    onDefer(recommendation.id, minutes);
    setShowDismissForm(false);
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <SelfImprovement color="primary" />
            <Typography variant="h6" component="span">
              휴식 시간입니다!
            </Typography>
          </Box>
          <Chip
            label={config.label}
            color={config.color as any}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Urgency alert for high fatigue */}
        {recommendation.urgency === 'high' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            피로도가 높습니다. 지금 휴식을 취하는 것이 중요합니다.
          </Alert>
        )}

        {/* Reason */}
        <Typography variant="body1" gutterBottom>
          {recommendation.reason}
        </Typography>

        {/* Fatigue score */}
        <Box sx={{ my: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            현재 피로도
          </Typography>
          <Typography variant="h4" color="primary">
            {recommendation.fatigueScore.toFixed(0)}/100
          </Typography>
        </Box>

        {/* Recommended duration */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Schedule color="action" />
          <Typography variant="body2" color="text.secondary">
            권장 휴식 시간: <strong>{recommendation.durationMinutes}분</strong>
          </Typography>
        </Box>

        {/* Suggested activities */}
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          추천 활동:
        </Typography>
        <List dense>
          {getSuggestedActivities().map((activity, index) => (
            <ListItem key={index}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {activity.icon}
              </ListItemIcon>
              <ListItemText primary={activity.text} />
            </ListItem>
          ))}
        </List>

        {/* Dismiss form */}
        {showDismissForm && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom>
              왜 지금 휴식할 수 없나요? (선택사항)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="예: 문제를 거의 다 풀었어요"
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Box display="flex" flexDirection="column" width="100%" gap={1}>
          {/* Primary action: Accept */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            startIcon={<CheckCircle />}
            onClick={handleAcceptClick}
          >
            휴식 시작 ({recommendation.durationMinutes}분)
          </Button>

          {/* Secondary actions */}
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => handleDeferClick(5)}
              startIcon={<Schedule />}
            >
              5분 후
            </Button>

            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => handleDeferClick(10)}
              startIcon={<Schedule />}
            >
              10분 후
            </Button>

            <Button
              variant="text"
              size="small"
              fullWidth
              onClick={handleDismissClick}
              startIcon={<Close />}
              color="inherit"
            >
              {showDismissForm ? '확인' : '나중에'}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default BreakNotificationModal;
