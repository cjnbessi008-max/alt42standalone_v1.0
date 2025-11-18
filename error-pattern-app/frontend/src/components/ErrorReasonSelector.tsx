import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlRadio,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { getCategories, createErrorReason } from '../services/api';
import type { ErrorCategory, QuestionError } from '../types';

interface ErrorReasonSelectorProps {
  questionError: QuestionError;
  onSubmit: () => void;
}

export const ErrorReasonSelector: React.FC<ErrorReasonSelectorProps> = ({
  questionError,
  onSubmit,
}) => {
  const [categories, setCategories] = useState<ErrorCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState<string>('아마도');
  const [studentNote, setStudentNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError('카테고리를 불러오는데 실패했습니다.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      setError('실수 이유를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createErrorReason({
        questionErrorId: questionError.id,
        categoryId: selectedCategory,
        confidenceLevel: confidenceLevel as any,
        studentNote,
      });

      setSuccess(true);
      setTimeout(() => {
        onSubmit();
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.error || '실수 이유 저장에 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          왜 틀렸을까요?
        </Typography>

        {/* Question Display */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            문제
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {questionError.questionText || '문제 내용'}
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="error">
                내 답변: {questionError.studentAnswer}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="success.main">
                정답: {questionError.correctAnswer}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Category Selection */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          실수 이유를 선택해주세요
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={`${category.icon} ${category.nameKo}`}
              onClick={() => setSelectedCategory(category.id)}
              color={selectedCategory === category.id ? 'primary' : 'default'}
              variant={selectedCategory === category.id ? 'filled' : 'outlined'}
              sx={{
                fontSize: '1rem',
                padding: '20px 10px',
                cursor: 'pointer',
                borderColor: category.color,
                ...(selectedCategory === category.id && {
                  bgcolor: category.color,
                  color: 'white',
                }),
              }}
            />
          ))}
        </Box>

        {/* Confidence Level */}
        {selectedCategory && (
          <>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">얼마나 확신하시나요?</FormLabel>
              <RadioGroup
                row
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(e.target.value)}
              >
                {['확실함', '아마도', '잘 모르겠음'].map((level) => (
                  <FormControlRadio
                    key={level}
                    value={level}
                    control={<Radio />}
                    label={level}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {/* Student Note */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="추가 메모 (선택사항)"
              placeholder="어떤 부분이 어려웠는지 자유롭게 적어주세요."
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              sx={{ mb: 3 }}
            />
          </>
        )}

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            실수 이유가 저장되었습니다!
          </Alert>
        )}

        {/* Submit Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onSubmit} disabled={loading}>
            나중에
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!selectedCategory || loading}
          >
            {loading ? <CircularProgress size={24} /> : '제출'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ErrorReasonSelector;
