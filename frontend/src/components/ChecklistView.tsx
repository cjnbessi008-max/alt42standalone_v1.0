import React from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import { Checklist, ChecklistType } from '../types/checklist';
import { ChecklistItem } from './ChecklistItem';

interface ChecklistViewProps {
  checklist: Checklist;
  onItemToggle: (itemId: string, isCompleted: boolean) => void;
  readonly?: boolean;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  checklist,
  onItemToggle,
  readonly = false,
}) => {
  const progressPercentage =
    checklist.total_items > 0
      ? (checklist.completed_items / checklist.total_items) * 100
      : 0;

  const getTypeColor = (type: ChecklistType) => {
    switch (type) {
      case ChecklistType.GENERATION_PIPELINE:
        return 'primary';
      case ChecklistType.LEARNING_PROGRESS:
        return 'success';
      case ChecklistType.QUALITY_ASSURANCE:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: ChecklistType) => {
    switch (type) {
      case ChecklistType.GENERATION_PIPELINE:
        return 'Module Generation';
      case ChecklistType.LEARNING_PROGRESS:
        return 'Learning Progress';
      case ChecklistType.QUALITY_ASSURANCE:
        return 'Quality Assurance';
      default:
        return type;
    }
  };

  // Group items by pipeline stage if it's a pipeline checklist
  const groupedItems =
    checklist.checklist_type === ChecklistType.GENERATION_PIPELINE
      ? checklist.items.reduce((acc, item) => {
          const stage = item.pipeline_stage || 'Other';
          if (!acc[stage]) {
            acc[stage] = [];
          }
          acc[stage].push(item);
          return acc;
        }, {} as Record<string, typeof checklist.items>)
      : { All: checklist.items };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={3}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="h4">{checklist.title}</Typography>
          <Chip
            label={getTypeLabel(checklist.checklist_type)}
            color={getTypeColor(checklist.checklist_type)}
          />
          {checklist.auto_generated && (
            <Chip label="Auto-generated" size="small" variant="outlined" />
          )}
        </Box>

        {checklist.description && (
          <Typography variant="body1" color="text.secondary" mb={2}>
            {checklist.description}
          </Typography>
        )}

        {/* Progress */}
        <Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Progress: {checklist.completed_items} / {checklist.total_items}{' '}
              items completed
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {progressPercentage.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        {progressPercentage === 100 && (
          <Alert severity="success" sx={{ mt: 2 }}>
            🎉 All tasks completed! Great job!
          </Alert>
        )}
      </Box>

      {/* Items */}
      <Box>
        {Object.entries(groupedItems).map(([stage, items]) => (
          <Box key={stage} mb={3}>
            {stage !== 'All' && (
              <Typography variant="h6" mb={2} color="primary">
                {stage.replace(/_/g, ' ').toUpperCase()}
              </Typography>
            )}
            {items
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={onItemToggle}
                  disabled={readonly}
                />
              ))}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
