/**
 * 루틴 카드 표시 컴포넌트
 */
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  EmojiEvents,
  TrendingUp,
  Schedule,
  ArrowForward,
} from '@mui/icons-material';
import type { RoutineCard } from '../types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface RoutineCardViewProps {
  card: RoutineCard;
  onComplete?: () => void;
}

const RoutineCardView: React.FC<RoutineCardViewProps> = ({ card, onComplete }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
      default:
        return difficulty;
    }
  };

  const cardDate = format(new Date(card.card_date), 'yyyy년 MM월 dd일', { locale: ko });
  const isCompleted = card.status === 'completed';

  return (
    <Card elevation={3} sx={{ maxWidth: 800, margin: 'auto', mt: 3 }}>
      <CardContent>
        {/* 헤더 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="overline" color="text.secondary">
            {cardDate}
          </Typography>
          <Typography variant="h4" component="h1" gutterBottom>
            {card.title}
          </Typography>
          {isCompleted && (
            <Alert severity="success" icon={<CheckCircle />}>
              완료한 카드입니다!
            </Alert>
          )}
        </Box>

        {/* 동기부여 메시지 */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
          <Typography variant="body1" color="primary.contrastText">
            💪 {card.motivation_message}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 학습 목표 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <EmojiEvents sx={{ mr: 1, color: 'warning.main' }} />
            오늘의 학습 목표
          </Typography>
          <List dense>
            {card.learning_goals.map((goal, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircle color="primary" />
                </ListItemIcon>
                <ListItemText primary={goal} />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 추천 활동 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📚 추천 학습 활동
          </Typography>
          {card.recommended_activities.map((activity, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {activity.title}
                </Typography>
                <Chip
                  label={getDifficultyLabel(activity.difficulty)}
                  color={getDifficultyColor(activity.difficulty)}
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {activity.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  icon={<Schedule />}
                  label={`${activity.duration_minutes}분`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={activity.subject}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={activity.topic}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Card>
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 진행 상황 요약 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUp sx={{ mr: 1, color: 'info.main' }} />
            나의 학습 현황
          </Typography>
          <Box sx={{ pl: 2 }}>
            {card.progress_summary.current_topics.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  현재 학습 중
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {card.progress_summary.current_topics.map((topic, idx) => (
                    <Chip key={idx} label={topic} size="small" />
                  ))}
                </Box>
              </Box>
            )}
            {card.progress_summary.strengths.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="success.main">
                  강점 💪
                </Typography>
                <List dense>
                  {card.progress_summary.strengths.map((strength, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={`• ${strength}`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            {card.progress_summary.areas_for_improvement.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="info.main">
                  더 연습하면 좋아요 📝
                </Typography>
                <List dense>
                  {card.progress_summary.areas_for_improvement.map((area, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={`• ${area}`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 다음 단계 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <ArrowForward sx={{ mr: 1, color: 'secondary.main' }} />
            다음에 할 학습
          </Typography>
          <List dense>
            {card.next_steps.map((step, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <ArrowForward color="secondary" />
                </ListItemIcon>
                <ListItemText primary={step} />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* 완료 버튼 */}
        {!isCompleted && onComplete && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<CheckCircle />}
              onClick={onComplete}
              sx={{ px: 4, py: 1.5 }}
            >
              오늘의 학습 완료하기
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RoutineCardView;
