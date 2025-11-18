import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  IconButton,
  Grid,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Rule } from '@/types/rule';
import { ComplexityWarningIcon } from './ComplexityWarningIcon';

interface RuleDashboardProps {
  rules: Rule[];
  onDelete?: (id: string) => void;
  onEdit?: (rule: Rule) => void;
}

const ruleTypeLabels: Record<string, string> = {
  validation: '검증',
  calculation: '계산',
  progression: '진행',
  feedback: '피드백',
};

const ruleTypeColors: Record<string, 'primary' | 'secondary' | 'success' | 'info'> = {
  validation: 'primary',
  calculation: 'secondary',
  progression: 'success',
  feedback: 'info',
};

export const RuleDashboard: React.FC<RuleDashboardProps> = ({
  rules,
  onDelete,
  onEdit,
}) => {
  if (rules.length === 0) {
    return (
      <Box
        sx={{
          p: 6,
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          아직 생성된 규칙이 없습니다.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          새 규칙을 추가하여 시작하세요.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {rules.map((rule) => (
        <Grid item xs={12} md={6} lg={4} key={rule.id}>
          <Card
            elevation={2}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s',
              '&:hover': {
                elevation: 6,
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {rule.name}
                  </Typography>
                  <Chip
                    label={ruleTypeLabels[rule.type]}
                    color={ruleTypeColors[rule.type]}
                    size="small"
                  />
                </Box>
                {rule.complexity && (
                  <ComplexityWarningIcon
                    analysis={rule.complexity}
                    size="medium"
                  />
                )}
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                {rule.description}
              </Typography>

              <Box
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    display: 'block',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '100px',
                    overflow: 'auto',
                  }}
                >
                  {rule.conditions}
                </Typography>
              </Box>

              {rule.complexity && (
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Chip
                    label={`복잡도: ${rule.complexity.score}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`조건: ${rule.complexity.metrics.conditionCount}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`중첩: ${rule.complexity.metrics.nestingDepth}`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              )}

              <Typography variant="caption" color="text.secondary">
                생성일: {new Date(rule.createdAt).toLocaleDateString('ko-KR')}
              </Typography>
            </CardContent>

            {(onDelete || onEdit) && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  p: 1,
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              >
                {onEdit && (
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onEdit(rule)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(rule.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            )}
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
