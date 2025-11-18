import React from 'react';
import {
  Tooltip,
  IconButton,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  LightbulbOutlined as LightbulbIcon,
} from '@mui/icons-material';
import { ComplexityAnalysis, ComplexitySeverity } from '@/types/rule';

interface ComplexityWarningIconProps {
  analysis: ComplexityAnalysis;
  size?: 'small' | 'medium' | 'large';
}

const severityConfig: Record<
  ComplexitySeverity,
  {
    icon: React.ReactElement;
    color: string;
    label: string;
  }
> = {
  none: {
    icon: <CheckCircleIcon />,
    color: '#4caf50',
    label: '복잡도 없음',
  },
  low: {
    icon: <InfoIcon />,
    color: '#2196f3',
    label: '낮은 복잡도',
  },
  medium: {
    icon: <WarningIcon />,
    color: '#ff9800',
    label: '중간 복잡도',
  },
  high: {
    icon: <ErrorIcon />,
    color: '#f44336',
    label: '높은 복잡도',
  },
  critical: {
    icon: <ErrorIcon />,
    color: '#d32f2f',
    label: '매우 높은 복잡도',
  },
};

export const ComplexityWarningIcon: React.FC<ComplexityWarningIconProps> = ({
  analysis,
  size = 'medium',
}) => {
  const config = severityConfig[analysis.severity];

  const tooltipContent = (
    <Box sx={{ maxWidth: 400, p: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
        {config.label} (점수: {analysis.score}/100)
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
          메트릭:
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', ml: 1 }}>
          • 조건 개수: {analysis.metrics.conditionCount}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', ml: 1 }}>
          • 중첩 깊이: {analysis.metrics.nestingDepth}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', ml: 1 }}>
          • 엔티티 수: {analysis.metrics.entityCount}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', ml: 1 }}>
          • 순환 참조: {analysis.metrics.hasCyclicDependency ? '있음' : '없음'}
        </Typography>
      </Box>

      {analysis.warnings.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            경고 사항:
          </Typography>
          <List dense sx={{ py: 0 }}>
            {analysis.warnings.map((warning, index) => (
              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <LightbulbIcon fontSize="small" sx={{ color: '#ffd54f' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      {warning.message}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      💡 {warning.recommendation}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {analysis.warnings.length === 0 && analysis.severity === 'none' && (
        <Typography variant="caption" sx={{ color: '#4caf50' }}>
          ✓ 이 규칙은 복잡도가 낮고 이해하기 쉽습니다.
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip
      title={tooltipContent}
      arrow
      placement="right"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            '& .MuiTooltip-arrow': {
              color: 'rgba(0, 0, 0, 0.9)',
            },
          },
        },
      }}
    >
      <IconButton
        size={size}
        sx={{
          color: config.color,
          '&:hover': {
            backgroundColor: `${config.color}20`,
          },
        }}
      >
        {config.icon}
      </IconButton>
    </Tooltip>
  );
};
