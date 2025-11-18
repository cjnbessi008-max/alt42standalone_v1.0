import React from 'react';
import {
  Card,
  CardContent,
  Checkbox,
  Typography,
  Box,
  LinearProgress,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { ChecklistItem as ChecklistItemType } from '../types/checklist';

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (itemId: string, isCompleted: boolean) => void;
  disabled?: boolean;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggle,
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(item.id, event.target.checked);
  };

  return (
    <Card
      sx={{
        mb: 2,
        opacity: item.is_completed ? 0.7 : 1,
        borderLeft: item.is_completed ? '4px solid #4caf50' : '4px solid #e0e0e0',
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="flex-start">
          <Checkbox
            checked={item.is_completed}
            onChange={handleChange}
            disabled={disabled}
            icon={<RadioButtonUncheckedIcon />}
            checkedIcon={<CheckCircleIcon />}
            sx={{ mt: -1 }}
          />
          <Box flex={1} ml={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography
                variant="h6"
                sx={{
                  textDecoration: item.is_completed ? 'line-through' : 'none',
                }}
              >
                {item.title}
              </Typography>
              {item.is_required && (
                <Chip label="Required" size="small" color="primary" />
              )}
              {item.pipeline_stage && (
                <Chip
                  label={item.pipeline_stage.replace('_', ' ')}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>

            {item.description && (
              <Typography variant="body2" color="text.secondary" mb={1}>
                {item.description}
              </Typography>
            )}

            {item.progress_percentage > 0 && !item.is_completed && (
              <Box mt={1}>
                <Box display="flex" alignItems="center" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Progress: {item.progress_percentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.progress_percentage}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
