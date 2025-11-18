import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { EmotionSelector } from '../components/EmotionSelector';
import { EmotionTimeline } from '../components/EmotionTimeline';
import { DailySummaryCard } from '../components/DailySummaryCard';
import { emotionApi, sessionApi, summaryApi } from '../services/api';
import type { EmotionRecord, DailyEmotionSummary, LearningSession } from '../types';

export const StudentDashboard: React.FC = () => {
  // For demo purposes, using a hardcoded student ID
  // In a real app, this would come from authentication
  const studentId = 'demo-student-id';

  const [emotions, setEmotions] = useState<EmotionRecord[]>([]);
  const [recentSummaries, setRecentSummaries] = useState<DailyEmotionSummary[]>([]);
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load recent emotions
      const emotionsRes = await emotionApi.getByStudent(studentId, 20);
      setEmotions(emotionsRes.data);

      // Load recent summaries (last 7 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      try {
        const summariesRes = await summaryApi.getRange(studentId, startDate, endDate);
        setRecentSummaries(summariesRes.data);
      } catch (err) {
        console.log('No summaries found, will generate on demand');
      }

      // Check for active session
      try {
        const activeSessionsRes = await sessionApi.getActive(studentId);
        if (activeSessionsRes.data.length > 0) {
          setActiveSession(activeSessionsRes.data[0]);
        }
      } catch (err) {
        console.log('No active session');
      }
    } catch (err: any) {
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartSession = async () => {
    try {
      const session = await sessionApi.start({
        student_id: studentId,
        course_id: 'MATH101',
        course_name: '미적분학 기초',
        activity_type: 'lecture',
      });
      setActiveSession(session.data);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      await sessionApi.end(activeSession.id);
      setActiveSession(null);
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        학습 감정 기록
      </Typography>

      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
          <br />
          <Typography variant="caption">
            데모 모드입니다. 백엔드 서버가 실행 중인지 확인해주세요.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Session Control */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            {activeSession ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  📚 학습 중: {activeSession.course_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  시작 시간: {new Date(activeSession.started_at).toLocaleString('ko-KR')}
                </Typography>
                <Button variant="outlined" color="error" onClick={handleEndSession}>
                  학습 종료
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  학습을 시작하세요
                </Typography>
                <Button variant="contained" onClick={handleStartSession}>
                  학습 시작
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Emotion Selector */}
        <Grid item xs={12} md={6}>
          <EmotionSelector
            studentId={studentId}
            sessionId={activeSession?.id}
            onEmotionRecorded={loadData}
          />
        </Grid>

        {/* Recent Emotions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              최근 감정 기록
            </Typography>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              <EmotionTimeline emotions={emotions.slice(0, 5)} />
            </Box>
          </Paper>
        </Grid>

        {/* Daily Summaries */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            일일 요약
          </Typography>
        </Grid>

        {recentSummaries.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">
              아직 생성된 일일 요약이 없습니다. 감정을 기록하면 자동으로 생성됩니다.
            </Alert>
          </Grid>
        ) : (
          recentSummaries.map((summary) => (
            <Grid item xs={12} sm={6} md={4} key={summary.id}>
              <DailySummaryCard summary={summary} />
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};
