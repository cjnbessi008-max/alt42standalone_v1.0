import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
  Card,
  CardContent,
  Rating,
} from '@mui/material';
import { AutoAwesome, CheckCircle, Error } from '@mui/icons-material';
import { conceptAPI } from '../services/api';

const ConceptSummaryGenerator = () => {
  const [conceptName, setConceptName] = useState('');
  const [gradeLevel, setGradeLevel] = useState(5);
  const [conceptDescription, setConceptDescription] = useState('');
  const [moduleContext, setModuleContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [validation, setValidation] = useState(null);

  const handleGenerateSummary = async () => {
    if (!conceptName || !gradeLevel) {
      setError('개념 이름과 학년을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);
    setValidation(null);

    try {
      const data = {
        concept_name: conceptName,
        grade_level: parseInt(gradeLevel),
        concept_description: conceptDescription || undefined,
        module_context: moduleContext || undefined,
      };

      const result = await conceptAPI.generateSummary(data);
      setSummary(result);

      // Automatically validate the generated summary
      handleValidateSummary(result.summary);
    } catch (err) {
      setError(err.response?.data?.error || '요약 생성에 실패했습니다.');
      console.error('Error generating summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateSummary = async (summaryText) => {
    try {
      const validationResult = await conceptAPI.validateSummary(
        conceptName,
        summaryText,
        parseInt(gradeLevel)
      );
      setValidation(validationResult);
    } catch (err) {
      console.error('Error validating summary:', err);
    }
  };

  const handleRegenerateSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await conceptAPI.regenerateSummary(
        conceptName,
        parseInt(gradeLevel),
        validation?.feedback || null,
        summary?.summary || null
      );
      setSummary(result);
      setValidation(null);

      // Validate the new summary
      handleValidateSummary(result.summary);
    } catch (err) {
      setError(err.response?.data?.error || '요약 재생성에 실패했습니다.');
      console.error('Error regenerating summary:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 3 }}>
      <Paper elevation={3} sx={{ padding: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" />
          AI 개념 요약 생성기
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          수학 개념을 입력하면 AI가 학생 친화적인 1줄 요약을 자동 생성합니다
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={3}>
          <TextField
            label="개념 이름 *"
            value={conceptName}
            onChange={(e) => setConceptName(e.target.value)}
            placeholder="예: 분수, 변수, 방정식"
            fullWidth
            required
          />

          <TextField
            label="학년 *"
            type="number"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            inputProps={{ min: 1, max: 12 }}
            fullWidth
            required
            helperText="1-12학년"
          />

          <TextField
            label="개념 설명 (선택)"
            value={conceptDescription}
            onChange={(e) => setConceptDescription(e.target.value)}
            placeholder="개념에 대한 상세 설명을 입력하세요"
            multiline
            rows={3}
            fullWidth
          />

          <TextField
            label="모듈 맥락 (선택)"
            value={moduleContext}
            onChange={(e) => setModuleContext(e.target.value)}
            placeholder="예: 초등 수학 분수 단원"
            fullWidth
          />

          <Button
            variant="contained"
            size="large"
            onClick={handleGenerateSummary}
            disabled={loading || !conceptName || !gradeLevel}
            startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
            fullWidth
          >
            {loading ? '요약 생성 중...' : 'AI 요약 생성'}
          </Button>

          {error && (
            <Alert severity="error" icon={<Error />}>
              {error}
            </Alert>
          )}

          {summary && (
            <>
              <Card variant="outlined" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle />
                    생성된 요약
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'medium', my: 2 }}>
                    "{summary.summary}"
                  </Typography>
                  <Chip
                    label={`신뢰도: ${(summary.confidence * 100).toFixed(0)}%`}
                    color="success"
                    size="small"
                  />
                </CardContent>
              </Card>

              {summary.alternative_summaries && summary.alternative_summaries.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    대안 요약:
                  </Typography>
                  <Stack spacing={1}>
                    {summary.alternative_summaries.map((alt, index) => (
                      <Paper key={index} sx={{ padding: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2">
                          {index + 1}. "{alt}"
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {summary.rationale && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    생성 근거:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    {summary.rationale}
                  </Typography>
                </Box>
              )}

              {validation && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      품질 검증
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2">전체 점수</Typography>
                        <Rating value={validation.overall_score} readOnly precision={0.1} max={5} />
                        <Typography variant="caption" color="text.secondary">
                          {validation.overall_score ? validation.overall_score.toFixed(1) : 'N/A'} / 5.0
                        </Typography>
                      </Box>
                      {validation.feedback && (
                        <Alert severity={validation.approved ? 'success' : 'warning'}>
                          {validation.feedback}
                        </Alert>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              <Button
                variant="outlined"
                onClick={handleRegenerateSummary}
                disabled={loading}
              >
                다시 생성하기
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default ConceptSummaryGenerator;
