import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import type { ValidationResult } from '../types';

interface ValidationFeedbackProps {
  validations: ValidationResult[];
  overallPassed: boolean;
  scorePreview?: number;
  feedbackPreview?: string;
  maxPoints?: number;
}

const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  validations,
  overallPassed,
  scorePreview,
  feedbackPreview,
  maxPoints = 100,
}) => {
  const passedCount = validations.filter(v => v.passed).length;
  const totalCount = validations.length;
  const progressPercent = (passedCount / totalCount) * 100;

  const getValidationIcon = (validation: ValidationResult) => {
    if (validation.passed) {
      return <CheckCircleIcon color="success" />;
    }
    if (validation.warning_message) {
      return <WarningIcon color="warning" />;
    }
    return <ErrorIcon color="error" />;
  };

  const getValidationLabel = (type: string): string => {
    const labels: Record<string, string> = {
      format: '형식 검증',
      range: '범위 검증',
      logic: '로직 검증',
      calculation: '계산 검증',
    };
    return labels[type] || type;
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            검산 체크포인트 결과
          </Typography>

          {/* Overall status */}
          <Alert
            severity={overallPassed ? 'success' : 'warning'}
            sx={{ mb: 2 }}
          >
            <AlertTitle>
              {overallPassed ? '모든 검증 통과!' : '일부 검증 실패'}
            </AlertTitle>
            {feedbackPreview}
          </Alert>

          {/* Score preview */}
          {scorePreview !== undefined && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  예상 점수
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {scorePreview} / {maxPoints}점
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(scorePreview / maxPoints) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Progress */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                검증 진행률
              </Typography>
              <Typography variant="body2">
                {passedCount} / {totalCount} 통과
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              color={overallPassed ? 'success' : 'warning'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          {/* Validation details */}
          <List>
            {validations.map((validation, index) => (
              <ListItem
                key={index}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getValidationIcon(validation)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getValidationLabel(validation.validation_type)}
                        <Chip
                          label={validation.passed ? '통과' : '실패'}
                          size="small"
                          color={validation.passed ? 'success' : 'error'}
                        />
                      </Box>
                    }
                  />
                </Box>

                {validation.error_message && (
                  <Alert severity="error" sx={{ mt: 1, width: '100%' }}>
                    {validation.error_message}
                  </Alert>
                )}

                {validation.warning_message && (
                  <Alert severity="warning" sx={{ mt: 1, width: '100%' }}>
                    {validation.warning_message}
                  </Alert>
                )}

                {validation.suggestions && validation.suggestions.length > 0 && (
                  <Box sx={{ mt: 1, width: '100%', pl: 5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LightbulbIcon fontSize="small" /> 힌트:
                    </Typography>
                    <List dense>
                      {validation.suggestions.map((suggestion, idx) => (
                        <ListItem key={idx} sx={{ py: 0 }}>
                          <Typography variant="body2" color="text.secondary">
                            • {suggestion}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ValidationFeedback;
