/**
 * Student Dashboard Page
 * Integrated dashboard showing rankings, achievements, and performance analytics
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Button
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  LocalFireDepartment as FireIcon,
  Star as StarIcon,
  School as SchoolIcon
} from '@mui/icons-material';

// Import our custom components
import { Leaderboard } from '../components/ranking/Leaderboard';
import { PerformanceGraphs } from '../components/analytics/PerformanceGraphs';
import { AchievementBoard } from '../components/achievements/AchievementBoard';

// ====================================================================
// TYPES
// ====================================================================

interface DashboardData {
  student_id: string;
  student_name: string;
  overall_stats: {
    total_points: number;
    modules_completed: number;
    problems_solved: number;
    accuracy_percentage: number;
    current_streak_days: number;
    longest_streak_days: number;
  };
  ranking_info: {
    global_rank: number | null;
    grade_rank: number | null;
  };
}

interface StudentDashboardProps {
  studentId: string;
}

// ====================================================================
// STAT CARD COMPONENT
// ====================================================================

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}> = ({ icon, label, value, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Avatar sx={{ bgcolor: color, mr: 2 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ====================================================================
// MAIN COMPONENT
// ====================================================================

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentId }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'achievements' | 'leaderboard'>('overview');

  // ====================================================================
  // DATA FETCHING
  // ====================================================================

  useEffect(() => {
    fetchDashboardData();
  }, [studentId]);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/students/${studentId}/dashboard`);

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // ====================================================================
  // RENDER
  // ====================================================================

  if (loading || !dashboardData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  const { student_name, overall_stats, ranking_info } = dashboardData;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 36 }} />
          학습 대시보드 (Learning Dashboard)
        </Typography>
        <Typography variant="h6" color="text.secondary">
          안녕하세요, {student_name}님! 👋
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<StarIcon />}
            label="총 포인트 (Total Points)"
            value={overall_stats.total_points.toLocaleString()}
            color="#f59e0b"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<SchoolIcon />}
            label="완료한 모듈 (Modules)"
            value={overall_stats.modules_completed}
            color="#10b981"
            subtitle={`${overall_stats.problems_solved}개 문제 해결`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingIcon />}
            label="정확도 (Accuracy)"
            value={`${overall_stats.accuracy_percentage.toFixed(1)}%`}
            color={overall_stats.accuracy_percentage >= 85 ? '#10b981' : '#f59e0b'}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<FireIcon />}
            label="연속 학습 (Streak)"
            value={`${overall_stats.current_streak_days}일`}
            color="#ef4444"
            subtitle={`최고 기록: ${overall_stats.longest_streak_days}일`}
          />
        </Grid>
      </Grid>

      {/* Ranking Info Banner */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
        elevation={3}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrophyIcon sx={{ fontSize: 48, mr: 2 }} />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  현재 순위 (Current Rank)
                </Typography>
                <Typography variant="body2">
                  계속해서 좋은 성적을 유지하고 있어요!
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold">
                    {ranking_info.global_rank ? `#${ranking_info.global_rank}` : '-'}
                  </Typography>
                  <Typography variant="caption">전체 순위</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold">
                    {ranking_info.grade_rank ? `#${ranking_info.grade_rank}` : '-'}
                  </Typography>
                  <Typography variant="caption">학년 순위</Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* View Selector */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant={activeView === 'overview' ? 'contained' : 'outlined'}
          onClick={() => setActiveView('overview')}
          sx={{ mr: 1 }}
        >
          전체 보기
        </Button>
        <Button
          variant={activeView === 'analytics' ? 'contained' : 'outlined'}
          onClick={() => setActiveView('analytics')}
          sx={{ mr: 1 }}
        >
          학습 분석
        </Button>
        <Button
          variant={activeView === 'achievements' ? 'contained' : 'outlined'}
          onClick={() => setActiveView('achievements')}
          sx={{ mr: 1 }}
        >
          성취 현황
        </Button>
        <Button
          variant={activeView === 'leaderboard' ? 'contained' : 'outlined'}
          onClick={() => setActiveView('leaderboard')}
        >
          리더보드
        </Button>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Main Content Area */}
      {activeView === 'overview' && (
        <Grid container spacing={4}>
          {/* Performance Graphs */}
          <Grid item xs={12}>
            <PerformanceGraphs
              studentId={studentId}
              defaultPeriod="weekly"
              showMetrics={['accuracy_trend', 'problems_solved_trend', 'points_earned']}
            />
          </Grid>

          {/* Recent Achievements Preview */}
          <Grid item xs={12} md={6}>
            <AchievementBoard studentId={studentId} />
          </Grid>

          {/* Leaderboard Preview */}
          <Grid item xs={12} md={6}>
            <Leaderboard currentStudentId={studentId} limit={10} />
          </Grid>
        </Grid>
      )}

      {activeView === 'analytics' && (
        <PerformanceGraphs
          studentId={studentId}
          defaultPeriod="weekly"
          showMetrics={['accuracy_trend', 'problems_solved_trend', 'points_earned']}
        />
      )}

      {activeView === 'achievements' && (
        <AchievementBoard studentId={studentId} />
      )}

      {activeView === 'leaderboard' && (
        <Leaderboard currentStudentId={studentId} scope="global" limit={50} />
      )}
    </Container>
  );
};

export default StudentDashboard;
