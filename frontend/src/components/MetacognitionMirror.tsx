/**
 * Main Metacognition Mirror Component
 * "지금 뭘 하고 있지?" - Real-time metacognition display
 */

import { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Alert,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { useMetacognitionStore } from '../hooks/useMetacognitionStore';
import { useBehaviorTracking } from '../hooks/useBehaviorTracking';
import { socketService } from '../services/socketService';
import CurrentActivityCard from './CurrentActivityCard';
import FocusLevelIndicator from './FocusLevelIndicator';
import ReflectionPromptsPanel from './ReflectionPromptsPanel';
import RecentActivitiesTimeline from './RecentActivitiesTimeline';
import TimeDistributionChart from './TimeDistributionChart';
import LearningInsightsPanel from './LearningInsightsPanel';

interface MetacognitionMirrorProps {
  studentId: string;
}

export default function MetacognitionMirror({ studentId }: MetacognitionMirrorProps) {
  const { metacognitionState, currentActivity, focusAlerts, addFocusAlert } = useMetacognitionStore();
  const [showWelcome, setShowWelcome] = useState(true);

  const { trackEvent } = useBehaviorTracking(
    studentId,
    currentActivity?.activityId || null
  );

  useEffect(() => {
    // Listen for focus alerts
    socketService.onFocusAlert((alert) => {
      addFocusAlert(alert);
    });

    // Track component mount as interaction
    trackEvent('focus_change', { type: 'metacognition_mirror_opened' });

    // Hide welcome message after 5 seconds
    const timer = setTimeout(() => setShowWelcome(false), 5000);

    return () => {
      socketService.offFocusAlert();
      clearTimeout(timer);
    };
  }, [addFocusAlert, trackEvent]);

  if (!metacognitionState) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          메타인지 데이터를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Welcome Message */}
      {showWelcome && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          onClose={() => setShowWelcome(false)}
        >
          <Typography variant="h6" gutterBottom>
            👋 환영합니다!
          </Typography>
          <Typography variant="body2">
            이 페이지는 당신의 학습 과정을 실시간으로 비춰주는 "메타인지 미러"입니다.
            <br />
            <strong>"지금 뭘 하고 있지?"</strong>를 항상 인식하며 더 효과적으로 학습하세요.
          </Typography>
        </Alert>
      )}

      {/* Focus Alerts */}
      {focusAlerts.length > 0 && (
        <Stack spacing={1} sx={{ mb: 3 }}>
          {focusAlerts.slice(-2).map((alert, index) => (
            <Alert key={index} severity="warning">
              <Typography variant="body2">
                집중도가 낮아지고 있습니다. {alert.recommendations?.join(', ')}
              </Typography>
            </Alert>
          ))}
        </Stack>
      )}

      <Grid container spacing={3}>
        {/* Current Activity - Prominent Display */}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PsychologyIcon sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h4" component="h1">
                지금 뭘 하고 있지?
              </Typography>
            </Box>

            {currentActivity ? (
              <CurrentActivityCard activity={currentActivity} />
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6">
                  현재 진행 중인 학습 활동이 없습니다
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  새로운 학습을 시작해보세요!
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Focus Level Indicator */}
        <Grid item xs={12} md={6}>
          <FocusLevelIndicator
            focusLevel={metacognitionState.focusLevel}
            timestamp={metacognitionState.timestamp}
          />
        </Grid>

        {/* Reflection Prompts */}
        <Grid item xs={12} md={6}>
          <ReflectionPromptsPanel
            prompts={metacognitionState.reflectionPrompts}
            onPromptClick={(promptId) => {
              trackEvent('click', { type: 'reflection_prompt', promptId });
            }}
          />
        </Grid>

        {/* Recent Activities Timeline */}
        <Grid item xs={12} md={6}>
          <RecentActivitiesTimeline
            activities={metacognitionState.recentActivities}
          />
        </Grid>

        {/* Time Distribution */}
        <Grid item xs={12} md={6}>
          <TimeDistributionChart
            timeDistribution={metacognitionState.timeDistribution}
          />
        </Grid>

        {/* Learning Pattern Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                나의 학습 패턴
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    선호 학습 시간대
                  </Typography>
                  <Chip
                    label={metacognitionState.learningPattern.preferredLearningTime}
                    color="primary"
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    평균 집중 시간
                  </Typography>
                  <Typography variant="h6">
                    {Math.floor(metacognitionState.learningPattern.attentionSpan / 60)}분
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    평균 세션 길이
                  </Typography>
                  <Typography variant="h6">
                    {Math.floor(metacognitionState.learningPattern.averageSessionDuration / 60)}분
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    시간당 휴식 횟수
                  </Typography>
                  <Typography variant="h6">
                    {metacognitionState.learningPattern.breakFrequency}회
                  </Typography>
                </Grid>
              </Grid>

              {/* Strengths and Improvements */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  강점
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {metacognitionState.learningPattern.strengths.map((strength, index) => (
                    <Chip
                      key={index}
                      label={strength}
                      color="success"
                      size="small"
                      icon={<TrendingUpIcon />}
                    />
                  ))}
                </Stack>

                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  개선 영역
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {metacognitionState.learningPattern.areasForImprovement.map((area, index) => (
                    <Chip
                      key={index}
                      label={area}
                      color="warning"
                      size="small"
                      icon={<LightbulbIcon />}
                    />
                  ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Learning Insights */}
        <Grid item xs={12}>
          <LearningInsightsPanel studentId={studentId} />
        </Grid>
      </Grid>

      {/* Last Updated */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          <AccessTimeIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
          마지막 업데이트: {new Date(metacognitionState.timestamp).toLocaleString('ko-KR')}
        </Typography>
      </Box>
    </Box>
  );
}
