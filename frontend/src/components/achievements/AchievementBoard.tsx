/**
 * Achievement Board Component
 * Displays earned achievements and progress toward unlocking new ones
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  CircularProgress,
  Avatar,
  styled,
  alpha
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon
} from '@mui/icons-material';

// ====================================================================
// TYPES
// ====================================================================

interface Achievement {
  id: string;
  name: string;
  name_ko: string;
  description: string;
  description_ko: string;
  category: string;
  points: number;
  tier?: string;
  icon_url?: string;
  badge_color?: string;
  is_active: boolean;
  created_at: string;
}

interface StudentAchievement {
  achievement: Achievement;
  earned_at: string;
  module_name?: string;
}

interface AchievementProgress {
  achievement: Achievement;
  current_value: number;
  target_value: number;
  progress_percentage: number;
  last_updated: string;
}

interface AchievementBoardProps {
  studentId: string;
}

// ====================================================================
// STYLED COMPONENTS
// ====================================================================

const AchievementCard = styled(Card)<{ tier?: string; earned?: boolean }>(({ tier, earned }) => {
  const getTierGradient = (tier?: string) => {
    switch (tier) {
      case 'diamond':
        return 'linear-gradient(135deg, #b9f2ff 0%, #7dd3fc 100%)';
      case 'platinum':
        return 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)';
      case 'gold':
        return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
      case 'silver':
        return 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)';
      case 'bronze':
        return 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)';
      default:
        return 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)';
    }
  };

  return {
    position: 'relative',
    height: '100%',
    background: earned ? getTierGradient(tier) : '#f5f5f5',
    opacity: earned ? 1 : 0.6,
    transition: 'all 0.3s ease',
    border: `2px solid ${earned ? alpha('#000', 0.1) : 'transparent'}`,
    '&:hover': {
      transform: earned ? 'translateY(-4px)' : 'none',
      boxShadow: earned ? '0 8px 24px rgba(0,0,0,0.15)' : 'none'
    }
  };
});

const TierBadge = styled(Chip)<{ tier?: string }>(({ tier }) => {
  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'diamond': return { bg: '#7dd3fc', text: '#0c4a6e' };
      case 'platinum': return { bg: '#c7d2fe', text: '#3730a3' };
      case 'gold': return { bg: '#fde68a', text: '#78350f' };
      case 'silver': return { bg: '#cbd5e1', text: '#334155' };
      case 'bronze': return { bg: '#fdba74', text: '#7c2d12' };
      default: return { bg: '#e5e7eb', text: '#374151' };
    }
  };

  const colors = getTierColor(tier);

  return {
    backgroundColor: colors.bg,
    color: colors.text,
    fontWeight: 'bold',
    fontSize: '0.75rem'
  };
});

const ProgressCard = styled(Card)({
  height: '100%',
  border: '2px dashed #e0e0e0',
  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#1976d2',
    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.1)'
  }
});

// ====================================================================
// MAIN COMPONENT
// ====================================================================

export const AchievementBoard: React.FC<AchievementBoardProps> = ({ studentId }) => {
  const [earnedAchievements, setEarnedAchievements] = useState<StudentAchievement[]>([]);
  const [progressAchievements, setProgressAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ====================================================================
  // DATA FETCHING
  // ====================================================================

  useEffect(() => {
    fetchAchievements();
  }, [studentId]);

  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch earned achievements
      const earnedResponse = await fetch(`/api/v1/students/${studentId}/achievements`);
      if (!earnedResponse.ok) throw new Error('Failed to fetch earned achievements');
      const earnedData = await earnedResponse.json();
      setEarnedAchievements(earnedData);

      // Fetch achievement progress
      const progressResponse = await fetch(`/api/v1/students/${studentId}/achievements/progress`);
      if (!progressResponse.ok) throw new Error('Failed to fetch achievement progress');
      const progressData = await progressResponse.json();
      setProgressAchievements(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  // ====================================================================
  // STATISTICS
  // ====================================================================

  const getAchievementStats = () => {
    const totalPoints = earnedAchievements.reduce((sum, { achievement }) => sum + achievement.points, 0);
    const tierCounts = earnedAchievements.reduce((acc, { achievement }) => {
      const tier = achievement.tier || 'none';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalPoints, tierCounts };
  };

  const stats = getAchievementStats();

  // ====================================================================
  // RENDER HELPERS
  // ====================================================================

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderEarnedAchievement = (studentAchievement: StudentAchievement) => {
    const { achievement, earned_at, module_name } = studentAchievement;

    return (
      <Grid item xs={12} sm={6} md={4} key={achievement.id}>
        <Tooltip
          title={
            <Box>
              <Typography variant="body2" fontWeight="bold">{achievement.description_ko}</Typography>
              <Typography variant="caption">획득일: {formatDate(earned_at)}</Typography>
              {module_name && <Typography variant="caption"><br/>모듈: {module_name}</Typography>}
            </Box>
          }
          arrow
        >
          <AchievementCard tier={achievement.tier} earned={true} elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: achievement.badge_color || '#1976d2'
                  }}
                  src={achievement.icon_url}
                >
                  <TrophyIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box sx={{ textAlign: 'right' }}>
                  {achievement.tier && <TierBadge tier={achievement.tier} label={achievement.tier.toUpperCase()} size="small" />}
                  <Chip
                    icon={<StarIcon />}
                    label={`+${achievement.points}`}
                    size="small"
                    color="warning"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>

              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {achievement.name_ko}
              </Typography>

              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                {achievement.name}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <CheckIcon sx={{ color: 'success.main', fontSize: 18, mr: 0.5 }} />
                <Typography variant="caption" color="success.main" fontWeight="bold">
                  {formatDate(earned_at)} 획득
                </Typography>
              </Box>
            </CardContent>
          </AchievementCard>
        </Tooltip>
      </Grid>
    );
  };

  const renderProgressAchievement = (progress: AchievementProgress) => {
    const { achievement, current_value, target_value, progress_percentage } = progress;

    return (
      <Grid item xs={12} sm={6} md={4} key={achievement.id}>
        <Tooltip
          title={achievement.description_ko}
          arrow
        >
          <ProgressCard elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: '#e0e0e0',
                    opacity: 0.7
                  }}
                  src={achievement.icon_url}
                >
                  <LockIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box sx={{ textAlign: 'right' }}>
                  {achievement.tier && <TierBadge tier={achievement.tier} label={achievement.tier.toUpperCase()} size="small" />}
                  <Chip
                    icon={<StarIcon />}
                    label={`+${achievement.points}`}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>

              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {achievement.name_ko}
              </Typography>

              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                {achievement.name}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    진행률
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {current_value} / {target_value}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progress_percentage, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: progress_percentage >= 75 ? 'success.main' : 'primary.main'
                    }
                  }}
                />
                <Typography variant="caption" color="primary" fontWeight="bold" sx={{ mt: 0.5, display: 'block' }}>
                  {progress_percentage.toFixed(0)}% 완료
                </Typography>
              </Box>
            </CardContent>
          </ProgressCard>
        </Tooltip>
      </Grid>
    );
  };

  // ====================================================================
  // RENDER
  // ====================================================================

  return (
    <Box>
      {/* Header with stats */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} elevation={3}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" color="white" gutterBottom>
            <TrophyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            성취 현황 (Achievements)
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h4" fontWeight="bold">
                  {earnedAchievements.length}
                </Typography>
                <Typography variant="caption">획득한 성취</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalPoints}
                </Typography>
                <Typography variant="caption">성취 포인트</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h4" fontWeight="bold">
                  {progressAchievements.length}
                </Typography>
                <Typography variant="caption">진행 중</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h4" fontWeight="bold">
                  {stats.tierCounts['gold'] || 0}
                </Typography>
                <Typography variant="caption">골드 등급</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={`획득한 성취 (${earnedAchievements.length})`} />
          <Tab label={`진행 중 (${progressAchievements.length})`} />
        </Tabs>
      </Box>

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
          <Typography>오류가 발생했습니다: {error}</Typography>
        </Box>
      )}

      {/* Achievement grids */}
      {!loading && !error && (
        <>
          {/* Earned Achievements Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {earnedAchievements.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <TrophyIcon sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      아직 획득한 성취가 없습니다.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      학습을 시작하고 첫 번째 성취를 달성해보세요!
                    </Typography>
                  </Box>
                </Grid>
              ) : (
                earnedAchievements.map(renderEarnedAchievement)
              )}
            </Grid>
          )}

          {/* In Progress Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              {progressAchievements.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <LockIcon sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      진행 중인 성취가 없습니다.
                    </Typography>
                  </Box>
                </Grid>
              ) : (
                progressAchievements.map(renderProgressAchievement)
              )}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};

export default AchievementBoard;
