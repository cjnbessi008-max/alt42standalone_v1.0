/**
 * AnswerFeedbackCard - 답안 제출 후 피드백 표시 컴포넌트
 *
 * 학생이 문제에 답한 후 정답/오답 여부와 함께
 * 오답일 경우 원인 분류(개념/계산/조건누락)를 표시합니다.
 */
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Lightbulb as LightbulbIcon,
  Calculate as CalculateIcon,
  Assignment as AssignmentIcon,
  MenuBook as MenuBookIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';

// Types
type ErrorType = '개념' | '계산' | '조건누락';

interface Classification {
  type: ErrorType;
  confidence: number;
  explanation: string;
  feedback: string;
  teacher_verified: boolean;
}

interface ResourceRecommendation {
  id: string;
  feedback_type: string;
  title?: string;
  content: string;
  resource_url?: string;
}

interface AnswerFeedbackCardProps {
  isCorrect: boolean;
  classification?: Classification;
  recommendedResources?: ResourceRecommendation[];
  onRetry?: () => void;
  onViewExplanation?: () => void;
}

// Helper functions
const getErrorTypeIcon = (type: ErrorType) => {
  switch (type) {
    case '개념':
      return <LightbulbIcon sx={{ fontSize: 40 }} />;
    case '계산':
      return <CalculateIcon sx={{ fontSize: 40 }} />;
    case '조건누락':
      return <AssignmentIcon sx={{ fontSize: 40 }} />;
    default:
      return null;
  }
};

const getErrorTypeColor = (type: ErrorType): string => {
  switch (type) {
    case '개념':
      return '#FF6B6B'; // Red
    case '계산':
      return '#4ECDC4'; // Teal
    case '조건누락':
      return '#FFD93D'; // Yellow
    default:
      return '#95A5A6'; // Gray
  }
};

const getErrorTypeDescription = (type: ErrorType): string => {
  switch (type) {
    case '개념':
      return '개념 이해 부족';
    case '계산':
      return '계산 실수';
    case '조건누락':
      return '조건 확인 필요';
    default:
      return '';
  }
};

const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.9) return '매우 확실';
  if (confidence >= 0.7) return '확실';
  if (confidence >= 0.5) return '보통';
  return '검토 필요';
};

const AnswerFeedbackCard: React.FC<AnswerFeedbackCardProps> = ({
  isCorrect,
  classification,
  recommendedResources = [],
  onRetry,
  onViewExplanation,
}) => {
  // 정답인 경우
  if (isCorrect) {
    return (
      <Card sx={{ maxWidth: 800, margin: '0 auto', mt: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />
            <Box>
              <Typography variant="h4" color="success.main" gutterBottom>
                정답입니다! 🎉
              </Typography>
              <Typography variant="body1" color="text.secondary">
                잘했습니다! 다음 문제로 넘어가세요.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // 오답이지만 분류 없음
  if (!classification) {
    return (
      <Card sx={{ maxWidth: 800, margin: '0 auto', mt: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <CancelIcon sx={{ fontSize: 60, color: 'error.main' }} />
            <Box>
              <Typography variant="h4" color="error.main" gutterBottom>
                오답입니다
              </Typography>
              <Typography variant="body1" color="text.secondary">
                다시 한 번 시도해보세요.
              </Typography>
            </Box>
          </Box>
          {onRetry && (
            <Box mt={2}>
              <Button variant="contained" onClick={onRetry}>
                다시 풀기
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // 오답이고 분류 있음
  const errorColor = getErrorTypeColor(classification.type);
  const errorDescription = getErrorTypeDescription(classification.type);

  return (
    <Card sx={{ maxWidth: 800, margin: '0 auto', mt: 3 }}>
      <CardContent>
        {/* Header - Error Type */}
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          mb={3}
          p={2}
          sx={{
            backgroundColor: `${errorColor}15`,
            borderLeft: `4px solid ${errorColor}`,
            borderRadius: 1,
          }}
        >
          <Box sx={{ color: errorColor }}>
            {getErrorTypeIcon(classification.type)}
          </Box>
          <Box flex={1}>
            <Typography variant="h5" gutterBottom>
              오답 원인: {classification.type}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {errorDescription}
            </Typography>
          </Box>
          <Chip
            label={getConfidenceLabel(classification.confidence)}
            color={classification.confidence >= 0.7 ? 'success' : 'warning'}
            size="small"
          />
        </Box>

        {/* Confidence Score */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              분석 신뢰도
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {Math.round(classification.confidence * 100)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={classification.confidence * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#E0E0E0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: errorColor,
              },
            }}
          />
        </Box>

        {/* Explanation */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            <strong>분석 결과</strong>
          </Typography>
          <Typography variant="body2">{classification.explanation}</Typography>
        </Alert>

        {/* Feedback */}
        <Box
          p={2}
          sx={{
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mb: 3,
          }}
        >
          <Typography variant="subtitle2" gutterBottom color="primary">
            💬 선생님의 피드백
          </Typography>
          <Typography variant="body1">{classification.feedback}</Typography>
        </Box>

        {/* Teacher Verification Badge */}
        {classification.teacher_verified && (
          <Chip
            label="✓ 선생님 확인 완료"
            color="success"
            size="small"
            sx={{ mb: 2 }}
          />
        )}

        {/* Recommended Resources */}
        {recommendedResources.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              추천 학습 자료
            </Typography>
            <List>
              {recommendedResources.map((resource) => (
                <ListItem
                  key={resource.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    <MenuBookIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={resource.title || '학습 자료'}
                    secondary={resource.content}
                  />
                  {resource.resource_url && (
                    <Button
                      size="small"
                      endIcon={<PlayArrowIcon />}
                      href={resource.resource_url}
                      target="_blank"
                    >
                      학습하기
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* Actions */}
        <Box display="flex" gap={2} mt={3}>
          {onRetry && (
            <Button variant="contained" onClick={onRetry} fullWidth>
              다시 풀기
            </Button>
          )}
          {onViewExplanation && (
            <Button
              variant="outlined"
              onClick={onViewExplanation}
              fullWidth
            >
              정답 보기
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AnswerFeedbackCard;
