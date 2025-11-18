/**
 * Student Dashboard - Shows individual student's DMN status
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Alert,
} from '@mui/material';
import { DMNStatusIndicator } from '../components/dmn/DMNStatusIndicator';
import { DMNHistoryChart } from '../components/dmn/DMNHistoryChart';
import { useDMNStatus } from '../hooks/useDMNStatus';

const StudentDashboard: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [sessionId] = useState(`session-${Date.now()}`);
  const [sessionActive, setSessionActive] = useState(false);

  const {
    currentStatus,
    history,
    connected,
    error,
    sendEvent,
  } = useDMNStatus({
    studentId: studentId || '',
    sessionId,
    courseId: 'demo-course-456',
    autoConnect: sessionActive,
  });

  // Track user interactions
  useEffect(() => {
    if (!sessionActive) return;

    const handleClick = (e: MouseEvent) => {
      sendEvent({
        event_type: 'click',
        event_data: { x: e.clientX, y: e.clientY },
        page_url: window.location.pathname,
        element_target: (e.target as HTMLElement).tagName,
      });
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      sendEvent({
        event_type: 'keypress',
        event_data: { key: e.key },
        page_url: window.location.pathname,
      });
    };

    const handleScroll = () => {
      sendEvent({
        event_type: 'scroll',
        event_data: { scrollY: window.scrollY },
        page_url: window.location.pathname,
      });
    };

    const handleFocus = () => {
      sendEvent({
        event_type: 'focus',
        page_url: window.location.pathname,
      });
    };

    const handleBlur = () => {
      sendEvent({
        event_type: 'blur',
        page_url: window.location.pathname,
      });
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keypress', handleKeyPress);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [sessionActive, sendEvent]);

  const handleStartSession = () => {
    setSessionActive(true);
  };

  const handleEndSession = () => {
    setSessionActive(false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          학생 대시보드
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Student ID: {studentId}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!sessionActive && (
          <Alert severity="info" sx={{ mb: 2 }}>
            학습 세션을 시작하면 실시간 집중도 모니터링이 시작됩니다.
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Current Status */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                현재 상태
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <DMNStatusIndicator
                  status={currentStatus}
                  size="large"
                  showDetails={true}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                {!sessionActive ? (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleStartSession}
                  >
                    학습 세션 시작
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={handleEndSession}
                  >
                    학습 세션 종료
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                연결 상태: {connected ? '✅ 연결됨' : '❌ 연결 안 됨'}
              </Typography>
            </Paper>
          </Grid>

          {/* Metrics */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                행동 지표
              </Typography>
              {currentStatus?.metrics ? (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        상호작용 횟수
                      </Typography>
                      <Typography variant="h6">
                        {currentStatus.metrics.interaction_count}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        마우스 활동도
                      </Typography>
                      <Typography variant="h6">
                        {Math.round(currentStatus.metrics.mouse_movement_intensity * 100)}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        키보드 활동
                      </Typography>
                      <Typography variant="h6">
                        {currentStatus.metrics.keyboard_activity_rate.toFixed(1)}/s
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        집중 시간
                      </Typography>
                      <Typography variant="h6">
                        {currentStatus.metrics.page_focus_duration}s
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        유휴 시간
                      </Typography>
                      <Typography variant="h6">
                        {currentStatus.metrics.idle_time_seconds}s
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        클릭 빈도
                      </Typography>
                      <Typography variant="h6">
                        {currentStatus.metrics.click_frequency.toFixed(1)}/min
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  학습 세션을 시작하면 행동 지표가 표시됩니다.
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* History Chart */}
          {history.length > 0 && (
            <Grid item xs={12}>
              <DMNHistoryChart history={history} language="ko" />
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default StudentDashboard;
