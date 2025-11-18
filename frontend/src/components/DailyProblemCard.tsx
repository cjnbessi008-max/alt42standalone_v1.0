/**
 * Daily Problem Card Component
 * Displays today's problem for students
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Box,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { CheckCircle, Cancel, Timer } from '@mui/icons-material';

interface Problem {
  id: string;
  problem_content: {
    question: string;
    options?: string[];
  };
  problem_type: string;
  difficulty_level: number;
  topic?: string;
  explanation?: string;
}

interface DailyProblemCardProps {
  problem: Problem;
  missionId: string;
  studentId: string;
  isCompleted?: boolean;
  isCorrect?: boolean;
  onSubmit: (answer: any, timeSpent: number) => Promise<any>;
}

const DailyProblemCard: React.FC<DailyProblemCardProps> = ({
  problem,
  missionId,
  studentId,
  isCompleted = false,
  isCorrect,
  onSubmit,
}) => {
  const [answer, setAnswer] = useState<any>('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [startTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [submitted, setSubmitted] = useState(isCompleted);

  useEffect(() => {
    // Update timer every second
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const handleSubmit = async () => {
    if (!answer) {
      alert('답을 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const submission = {
        problem_id: problem.id,
        answer:
          problem.problem_type === 'multiple_choice'
            ? { selected_option: answer }
            : { text: answer },
        time_spent_seconds: timeSpent,
      };

      const result = await onSubmit(submission, timeSpent);
      setFeedback(result.feedback);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('답안 제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const difficultyColor = (level: number) => {
    if (level <= 2) return 'success';
    if (level <= 3) return 'warning';
    return 'error';
  };

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', mt: 3 }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="div">
            오늘의 문제
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            <Chip
              label={`난이도 ${problem.difficulty_level}`}
              color={difficultyColor(problem.difficulty_level)}
              size="small"
            />
            {problem.topic && <Chip label={problem.topic} size="small" variant="outlined" />}
            <Chip
              icon={<Timer />}
              label={formatTime(timeSpent)}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Question */}
        <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
          {problem.problem_content.question}
        </Typography>

        {/* Answer Input */}
        {!submitted && (
          <Box>
            {problem.problem_type === 'multiple_choice' ? (
              <FormControl component="fieldset">
                <FormLabel component="legend">답을 선택하세요</FormLabel>
                <RadioGroup value={answer} onChange={(e) => setAnswer(e.target.value)}>
                  {problem.problem_content.options?.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={index.toString()}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="답안 입력"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="답을 입력해주세요"
                variant="outlined"
              />
            )}
          </Box>
        )}

        {/* Feedback */}
        {submitted && feedback && (
          <Box mt={2}>
            <Alert
              severity={feedback.is_correct ? 'success' : 'error'}
              icon={feedback.is_correct ? <CheckCircle /> : <Cancel />}
            >
              <Typography variant="body1" fontWeight="bold">
                {feedback.message}
              </Typography>
              {feedback.explanation && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>해설:</strong> {feedback.explanation}
                </Typography>
              )}
            </Alert>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {!submitted ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting || !answer}
            startIcon={submitting && <CircularProgress size={20} />}
          >
            {submitting ? '제출 중...' : '답안 제출'}
          </Button>
        ) : (
          <Button variant="outlined" disabled>
            제출 완료
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default DailyProblemCard;
