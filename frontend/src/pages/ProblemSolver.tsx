import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import AnswerInput from '../components/AnswerInput';
import ValidationFeedback from '../components/ValidationFeedback';
import { problemAPI, submissionAPI, checkpointAPI, lmsAPI } from '../services/api';
import { getDifficultyColor, formatTimeSpent } from '../utils/formatters';
import type { Problem, CheckpointResponse } from '../types';

const STUDENT_ID = 'student_001'; // Mock student ID

const ProblemSolver: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [answer, setAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [checkpointResult, setCheckpointResult] = useState<CheckpointResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['문제 풀이', '검산 체크포인트', 'LMS 제출'];

  useEffect(() => {
    loadProblem();
  }, [problemId]);

  const loadProblem = async () => {
    if (!problemId) return;

    try {
      setLoading(true);
      const data = await problemAPI.getById(problemId);
      setProblem(data);

      // Initialize answer based on problem type
      if (data.problem_type === 'math') {
        const title = data.title.toLowerCase();
        if (title.includes('연립')) {
          setAnswer({ x: '', y: '' });
        } else if (title.includes('이차방정식')) {
          setAnswer([]);
        } else {
          setAnswer('');
        }
      } else {
        setAnswer('');
      }
    } catch (error) {
      console.error('Failed to load problem:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!problem || !answer) return;

    try {
      setValidating(true);
      setActiveStep(1);

      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      // Create submission
      const submissionData = await submissionAPI.create({
        student_id: STUDENT_ID,
        problem_id: problem.id,
        answer,
        time_spent_seconds: timeSpent,
      });

      setSubmissionId(submissionData.submission_id);

      // Validate checkpoint
      const validationResult = await checkpointAPI.validate({
        submission_id: submissionData.submission_id,
        perform_full_validation: true,
      });

      setCheckpointResult(validationResult);
    } catch (error) {
      console.error('Validation failed:', error);
      alert('검증 중 오류가 발생했습니다.');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmitToLMS = async () => {
    if (!submissionId) return;

    try {
      setSubmitting(true);
      setActiveStep(2);

      const result = await lmsAPI.submit({
        submission_id: submissionId,
        force_submit: !checkpointResult?.overall_passed,
      });

      if (result.success) {
        setSubmitSuccess(true);
      } else {
        alert('LMS 제출에 실패했습니다.');
      }
    } catch (error) {
      console.error('LMS submission failed:', error);
      alert('LMS 제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  const handleReset = () => {
    setAnswer(problem?.problem_type === 'math' && problem.title.includes('연립')
      ? { x: '', y: '' }
      : problem?.title.includes('이차방정식') ? [] : '');
    setSubmissionId(null);
    setCheckpointResult(null);
    setStartTime(Date.now());
    setActiveStep(0);
    setSubmitSuccess(false);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!problem) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">문제를 찾을 수 없습니다.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
      >
        문제 목록으로
      </Button>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Problem Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h5" component="h1">
            {problem.title}
          </Typography>
          <Chip
            label={problem.difficulty}
            size="small"
            color={getDifficultyColor(problem.difficulty) as any}
          />
          <Chip label={`${problem.points}점`} size="small" variant="outlined" />
        </Box>

        <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
          {problem.description}
        </Typography>

        {problem.hints && problem.hints.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2">💡 힌트</Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              {problem.hints.map((hint, idx) => (
                <li key={idx}><Typography variant="body2">{hint}</Typography></li>
              ))}
            </ul>
          </Alert>
        )}
      </Paper>

      {/* Success Alert */}
      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6">제출 완료!</Typography>
          답안이 성공적으로 LMS에 제출되었습니다.
          {checkpointResult?.score_preview && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              예상 점수: {checkpointResult.score_preview}/{problem.points}점
            </Typography>
          )}
        </Alert>
      )}

      {/* Answer Input */}
      {!submitSuccess && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <AnswerInput
            problem={problem}
            answer={answer}
            onChange={setAnswer}
            disabled={validating || submitting}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={validating ? <CircularProgress size={20} /> : <PlayArrowIcon />}
              onClick={handleValidate}
              disabled={validating || submitting || !answer}
              fullWidth
            >
              {validating ? '검증 중...' : '검산 체크포인트 실행'}
            </Button>

            {checkpointResult && (
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={validating || submitting}
              >
                다시 풀기
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Validation Feedback */}
      {checkpointResult && (
        <>
          <ValidationFeedback
            validations={checkpointResult.validations}
            overallPassed={checkpointResult.overall_passed}
            scorePreview={checkpointResult.score_preview}
            feedbackPreview={checkpointResult.feedback_preview}
            maxPoints={problem.points}
          />

          {!submitSuccess && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={() => setShowSubmitDialog(true)}
                disabled={submitting || !checkpointResult.can_submit}
                fullWidth
              >
                LMS에 제출
              </Button>
            </Box>
          )}

          {!checkpointResult.can_submit && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              최대 시도 횟수를 초과했습니다. 검증을 통과하지 못했지만 제출할 수 없습니다.
            </Alert>
          )}
        </>
      )}

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
        <DialogTitle>LMS에 제출하시겠습니까?</DialogTitle>
        <DialogContent>
          <Typography>
            현재 답안을 LMS에 최종 제출합니다. 제출 후에는 수정할 수 없습니다.
          </Typography>
          {checkpointResult && !checkpointResult.overall_passed && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              일부 검증을 통과하지 못했습니다. 그래도 제출하시겠습니까?
            </Alert>
          )}
          {checkpointResult?.score_preview && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              예상 점수: <strong>{checkpointResult.score_preview}/{problem.points}점</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)} disabled={submitting}>
            취소
          </Button>
          <Button
            onClick={handleSubmitToLMS}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {submitting ? '제출 중...' : '제출'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProblemSolver;
