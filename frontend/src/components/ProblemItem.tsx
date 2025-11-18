import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Stack,
} from '@mui/material';
import {
  Star as StarIcon,
  Flag as FlagIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { Problem } from '../services/api';

interface ProblemItemProps {
  problem: Problem;
  onUpdatePriority: (id: number, priority: string | null) => void;
  isInstructorMode: boolean;
}

const priorityConfig = {
  important: {
    icon: <StarIcon sx={{ color: '#ffa726' }} />,
    label: '⭐ 중요',
    color: '#ffa726',
  },
  solve_first: {
    icon: <FlagIcon sx={{ color: '#ef5350' }} />,
    label: '🚩 먼저 풀기',
    color: '#ef5350',
  },
  review: {
    icon: <RefreshIcon sx={{ color: '#42a5f5' }} />,
    label: '📌 복습 필요',
    color: '#42a5f5',
  },
};

const difficultyColors = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
} as const;

const difficultyLabels = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

export const ProblemItem: React.FC<ProblemItemProps> = ({
  problem,
  onUpdatePriority,
  isInstructorMode,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePriorityChange = (priority: string | null) => {
    onUpdatePriority(problem.id, priority);
    handleMenuClose();
  };

  const priorityInfo = problem.priority_flag ? priorityConfig[problem.priority_flag] : null;

  return (
    <Card
      sx={{
        mb: 2,
        borderLeft: priorityInfo ? `4px solid ${priorityInfo.color}` : 'none',
        position: 'relative',
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              {priorityInfo && (
                <Chip
                  icon={priorityInfo.icon}
                  label={priorityInfo.label}
                  size="small"
                  sx={{
                    backgroundColor: `${priorityInfo.color}20`,
                    color: priorityInfo.color,
                    fontWeight: 'bold',
                  }}
                />
              )}
              <Chip
                label={difficultyLabels[problem.difficulty]}
                size="small"
                color={difficultyColors[problem.difficulty]}
              />
              <Chip label={problem.subject} size="small" variant="outlined" />
            </Stack>

            <Typography variant="h6" component="h3" gutterBottom>
              {problem.title}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {problem.description}
            </Typography>
          </Box>

          {isInstructorMode && (
            <Box>
              <IconButton onClick={handleMenuOpen} size="small">
                <MoreVertIcon />
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => handlePriorityChange('important')}>
                  <StarIcon sx={{ mr: 1, color: '#ffa726' }} /> 중요 표시
                </MenuItem>
                <MenuItem onClick={() => handlePriorityChange('solve_first')}>
                  <FlagIcon sx={{ mr: 1, color: '#ef5350' }} /> 먼저 풀기
                </MenuItem>
                <MenuItem onClick={() => handlePriorityChange('review')}>
                  <RefreshIcon sx={{ mr: 1, color: '#42a5f5' }} /> 복습 필요
                </MenuItem>
                <MenuItem onClick={() => handlePriorityChange(null)}>
                  <StarBorderIcon sx={{ mr: 1 }} /> 우선순위 제거
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
