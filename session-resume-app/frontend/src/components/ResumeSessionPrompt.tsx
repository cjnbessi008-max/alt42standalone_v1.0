/**
 * ResumeSessionPrompt Component - Prompt user to resume or start new session
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import { PlayArrow, Refresh } from '@mui/icons-material';
import { sessionApi } from '../services/api';
import type { ResumeInfo } from '../types';

interface ResumeSessionPromptProps {
  moduleId: string;
  studentId: string;
  onResume: (sessionId: string) => void;
  onStartNew: () => void;
}

export const ResumeSessionPrompt: React.FC<ResumeSessionPromptProps> = ({
  moduleId,
  studentId,
  onResume,
  onStartNew,
}) => {
  const [open, setOpen] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<ResumeInfo['session'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await sessionApi.getResumeInfo(moduleId, studentId);

        if (data.has_session && data.session?.can_resume) {
          setSessionInfo(data.session);
          setOpen(true);
        }
      } catch (err) {
        console.error('Failed to check session:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [moduleId, studentId]);

  const handleResume = () => {
    setOpen(false);
    if (sessionInfo) {
      onResume(sessionInfo.id);
    }
  };

  const handleStartNew = () => {
    setOpen(false);
    onStartNew();
  };

  if (loading || !sessionInfo) return null;

  const progressPercentage = sessionInfo.progress_percentage || 0;
  const problemsCompleted = Math.round(
    (sessionInfo.total_problems * progressPercentage) / 100
  );

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Prevent closing by clicking outside
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        이전 학습을 이어서 하시겠어요?
        <Typography variant="caption" display="block" color="text.secondary">
          Continue where you left off?
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            마지막 학습: {sessionInfo.time_since_last_active}
          </Typography>

          <Box sx={{ mt: 2, mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.5,
              }}
            >
              <Typography variant="body2">진행률</Typography>
              <Typography variant="body2" fontWeight="medium">
                {problemsCompleted} / {sessionInfo.total_problems} 문제
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            {progressPercentage.toFixed(1)}% 완료
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ mt: 2 }}>
          문제 {sessionInfo.current_problem_index + 1}번부터 계속하시겠어요?
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleStartNew}
          startIcon={<Refresh />}
          variant="outlined"
          color="secondary"
        >
          처음부터 다시
        </Button>
        <Button
          onClick={handleResume}
          startIcon={<PlayArrow />}
          variant="contained"
          color="primary"
          autoFocus
        >
          이어서 하기
        </Button>
      </DialogActions>
    </Dialog>
  );
};
