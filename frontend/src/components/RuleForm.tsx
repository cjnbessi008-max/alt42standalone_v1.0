import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  Alert,
  AlertTitle,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { RuleFormData, RuleType, ComplexityAnalysis } from '@/types/rule';
import { RuleComplexityAnalyzer } from '@/utils/complexityAnalyzer';
import { ComplexityWarningIcon } from './ComplexityWarningIcon';

interface RuleFormProps {
  onSubmit: (data: RuleFormData, analysis: ComplexityAnalysis) => void;
  initialData?: Partial<RuleFormData>;
}

const ruleTypes: { value: RuleType; label: string; description: string }[] = [
  {
    value: 'validation',
    label: '검증 규칙',
    description: '입력 값의 유효성을 검사하는 규칙',
  },
  {
    value: 'calculation',
    label: '계산 규칙',
    description: '수학적 계산이나 변환을 수행하는 규칙',
  },
  {
    value: 'progression',
    label: '진행 규칙',
    description: '학습 진행 상태를 결정하는 규칙',
  },
  {
    value: 'feedback',
    label: '피드백 규칙',
    description: '사용자에게 피드백을 제공하는 규칙',
  },
];

export const RuleForm: React.FC<RuleFormProps> = ({ onSubmit, initialData }) => {
  const { control, handleSubmit, watch } = useForm<RuleFormData>({
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'validation',
      description: initialData?.description || '',
      conditions: initialData?.conditions || '',
    },
  });

  const [analysis, setAnalysis] = useState<ComplexityAnalysis | null>(null);
  const conditions = watch('conditions');

  useEffect(() => {
    if (conditions) {
      const newAnalysis = RuleComplexityAnalyzer.analyze(conditions);
      setAnalysis(newAnalysis);
    } else {
      setAnalysis(null);
    }
  }, [conditions]);

  const onFormSubmit = (data: RuleFormData) => {
    if (analysis) {
      onSubmit(data, analysis);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'success';
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit(onFormSubmit)}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          규칙 작성
        </Typography>

        <Stack spacing={3}>
          <Controller
            name="name"
            control={control}
            rules={{ required: '규칙 이름을 입력하세요' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="규칙 이름"
                fullWidth
                required
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="규칙 유형"
                select
                fullWidth
                required
              >
                {ruleTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box>
                      <Typography variant="body1">{type.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="description"
            control={control}
            rules={{ required: '설명을 입력하세요' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="설명"
                fullWidth
                multiline
                rows={2}
                required
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                조건 (규칙 로직)
              </Typography>
              {analysis && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`복잡도: ${analysis.score}/100`}
                    color={getSeverityColor(analysis.severity)}
                    size="small"
                  />
                  <ComplexityWarningIcon analysis={analysis} size="small" />
                </Box>
              )}
            </Box>

            <Controller
              name="conditions"
              control={control}
              rules={{ required: '조건을 입력하세요' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={8}
                  required
                  placeholder="예: if (score >= 80 && attendance > 0.9) { return 'pass'; }"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || '규칙의 조건을 입력하세요'}
                  sx={{
                    '& textarea': {
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                    },
                  }}
                />
              )}
            />
          </Box>

          {analysis && analysis.warnings.length > 0 && (
            <Alert severity={getSeverityColor(analysis.severity)}>
              <AlertTitle>복잡도 경고</AlertTitle>
              <Stack spacing={1}>
                {analysis.warnings.map((warning, index) => (
                  <Box key={index}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      • {warning.message}
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 2, display: 'block' }}>
                      💡 {warning.recommendation}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Alert>
          )}

          {analysis && analysis.severity === 'none' && (
            <Alert severity="success">
              <AlertTitle>좋은 규칙입니다!</AlertTitle>
              <Typography variant="body2">
                이 규칙은 복잡도가 낮고 이해하기 쉽습니다.
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button type="submit" variant="contained" size="large">
              규칙 저장
            </Button>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
};
