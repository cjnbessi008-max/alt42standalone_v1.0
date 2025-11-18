/**
 * ClassificationReviewQueue - 교사용 분류 검토 인터페이스
 *
 * AI가 수행한 오답 분류를 교사가 검토하고 수정할 수 있습니다.
 */
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  ButtonGroup,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

// Types
type ErrorType = '개념' | '계산' | '조건누락';

interface Classification {
  id: string;
  student_name: string;
  module_name: string;
  problem_text: string;
  correct_answer: string;
  student_answer: string;
  work_shown?: string;
  classification_type: ErrorType;
  confidence: number;
  explanation: string;
  feedback: string;
  ai_reasoning: string;
  classified_at: string;
}

interface ClassificationReviewQueueProps {
  pendingReviews: Classification[];
  onVerify: (id: string, verified: boolean, override?: ErrorType, notes?: string) => Promise<void>;
  onBulkVerify: (ids: string[], verified: boolean) => Promise<void>;
}

const ERROR_COLORS = {
  개념: '#FF6B6B',
  계산: '#4ECDC4',
  조건누락: '#FFD93D',
};

const ClassificationReviewQueue: React.FC<ClassificationReviewQueueProps> = ({
  pendingReviews,
  onVerify,
  onBulkVerify,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<Classification | null>(null);
  const [overrideType, setOverrideType] = useState<ErrorType | null>(null);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // 검토 대화상자 열기
  const handleOpenReview = (classification: Classification) => {
    setCurrentReview(classification);
    setOverrideType(null);
    setTeacherNotes('');
    setReviewDialogOpen(true);
  };

  // 검토 대화상자 닫기
  const handleCloseReview = () => {
    setReviewDialogOpen(false);
    setCurrentReview(null);
    setOverrideType(null);
    setTeacherNotes('');
  };

  // 개별 검토 승인/거부
  const handleReview = async (approved: boolean) => {
    if (!currentReview) return;

    setLoading(true);
    try {
      await onVerify(
        currentReview.id,
        approved,
        overrideType || undefined,
        teacherNotes || undefined
      );
      handleCloseReview();
    } catch (error) {
      console.error('Review failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 일괄 승인
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;

    setLoading(true);
    try {
      await onBulkVerify(Array.from(selectedIds), true);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Bulk approve failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 선택/선택 해제
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === pendingReviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingReviews.map((r) => r.id)));
    }
  };

  // 신뢰도별 필터링 통계
  const stats = {
    high: pendingReviews.filter((r) => r.confidence >= 0.85).length,
    medium: pendingReviews.filter((r) => r.confidence >= 0.6 && r.confidence < 0.85).length,
    low: pendingReviews.filter((r) => r.confidence < 0.6).length,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            분류 검토 대기열
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI가 분류한 오답을 검토하고 승인하세요
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Chip
            label={`대기 중: ${pendingReviews.length}건`}
            color="primary"
            variant="outlined"
          />
          {selectedIds.size > 0 && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={handleBulkApprove}
              disabled={loading}
            >
              선택 항목 승인 ({selectedIds.size})
            </Button>
          )}
        </Box>
      </Box>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                높은 신뢰도 (≥85%)
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.high}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                중간 신뢰도 (60-85%)
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.medium}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                낮은 신뢰도 (&lt;60%)
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.low}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bulk Actions */}
      {pendingReviews.length > 0 && (
        <Box mb={2}>
          <Button size="small" onClick={toggleSelectAll}>
            {selectedIds.size === pendingReviews.length ? '전체 해제' : '전체 선택'}
          </Button>
        </Box>
      )}

      {/* Review List */}
      {pendingReviews.length === 0 ? (
        <Card>
          <CardContent>
            <Box p={4} textAlign="center">
              <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                모든 검토 완료!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                현재 검토 대기 중인 분류가 없습니다.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <List>
          {pendingReviews.map((classification) => (
            <Card key={classification.id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  {/* Selection Checkbox */}
                  <Grid item xs={12} md={1} display="flex" alignItems="center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(classification.id)}
                      onChange={() => toggleSelection(classification.id)}
                      style={{ width: 20, height: 20, cursor: 'pointer' }}
                    />
                  </Grid>

                  {/* Main Content */}
                  <Grid item xs={12} md={8}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip
                        label={classification.classification_type}
                        size="small"
                        sx={{
                          backgroundColor: ERROR_COLORS[classification.classification_type],
                          color: 'white',
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {classification.student_name} · {classification.module_name}
                      </Typography>
                    </Box>

                    <Typography variant="body1" gutterBottom>
                      <strong>문제:</strong> {classification.problem_text}
                    </Typography>

                    <Box display="flex" gap={2} mb={1}>
                      <Typography variant="body2">
                        <strong>정답:</strong> {classification.correct_answer}
                      </Typography>
                      <Typography variant="body2" color="error">
                        <strong>학생 답:</strong> {classification.student_answer}
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      {classification.explanation}
                    </Typography>

                    {/* Confidence Bar */}
                    <Box mt={2}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption">신뢰도</Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {Math.round(classification.confidence * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={classification.confidence * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#E0E0E0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor:
                              classification.confidence >= 0.85
                                ? 'success.main'
                                : classification.confidence >= 0.6
                                ? 'warning.main'
                                : 'error.main',
                          },
                        }}
                      />
                    </Box>
                  </Grid>

                  {/* Actions */}
                  <Grid item xs={12} md={3} display="flex" flexDirection="column" gap={1}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleOpenReview(classification)}
                      fullWidth
                    >
                      검토하기
                    </Button>
                    <Tooltip title="상세 보기">
                      <IconButton size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </List>
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={handleCloseReview}
        maxWidth="md"
        fullWidth
      >
        {currentReview && (
          <>
            <DialogTitle>분류 검토</DialogTitle>
            <DialogContent>
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  학생
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {currentReview.student_name}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" mt={2}>
                  문제
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {currentReview.problem_text}
                </Typography>

                <Grid container spacing={2} mt={1}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      정답
                    </Typography>
                    <Typography variant="body1">{currentReview.correct_answer}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      학생 답안
                    </Typography>
                    <Typography variant="body1" color="error">
                      {currentReview.student_answer}
                    </Typography>
                  </Grid>
                </Grid>

                {currentReview.work_shown && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      학생 풀이 과정
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {currentReview.work_shown}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider />

              <Box my={3}>
                <Alert
                  severity="info"
                  icon={
                    <Chip
                      label={currentReview.classification_type}
                      size="small"
                      sx={{
                        backgroundColor: ERROR_COLORS[currentReview.classification_type],
                        color: 'white',
                      }}
                    />
                  }
                >
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>AI 분류 결과</strong>
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {currentReview.explanation}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    신뢰도: {Math.round(currentReview.confidence * 100)}%
                  </Typography>
                </Alert>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  분류 수정 (선택사항)
                </Typography>
                <ButtonGroup fullWidth>
                  {(['개념', '계산', '조건누락'] as ErrorType[]).map((type) => (
                    <Button
                      key={type}
                      variant={overrideType === type ? 'contained' : 'outlined'}
                      onClick={() => setOverrideType(overrideType === type ? null : type)}
                      sx={{
                        backgroundColor:
                          overrideType === type ? ERROR_COLORS[type] : 'transparent',
                        borderColor: ERROR_COLORS[type],
                        color: overrideType === type ? 'white' : ERROR_COLORS[type],
                        '&:hover': {
                          backgroundColor: ERROR_COLORS[type],
                          color: 'white',
                        },
                      }}
                    >
                      {type}
                    </Button>
                  ))}
                </ButtonGroup>
              </Box>

              <TextField
                label="검토 노트 (선택사항)"
                multiline
                rows={3}
                fullWidth
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                placeholder="추가 코멘트를 입력하세요..."
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseReview} disabled={loading}>
                취소
              </Button>
              <Button
                onClick={() => handleReview(false)}
                color="error"
                disabled={loading}
                startIcon={<CancelIcon />}
              >
                거부
              </Button>
              <Button
                onClick={() => handleReview(true)}
                variant="contained"
                color="success"
                disabled={loading}
                startIcon={<CheckCircleIcon />}
              >
                승인
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ClassificationReviewQueue;
