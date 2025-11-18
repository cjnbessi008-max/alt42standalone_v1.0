import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CategoryIcon from '@mui/icons-material/Category';
import BuildIcon from '@mui/icons-material/Build';

const nodeColors = {
  concept: {
    bg: '#e3f2fd',
    border: '#2196f3',
    icon: LightbulbIcon,
  },
  entity: {
    bg: '#f3e5f5',
    border: '#9c27b0',
    icon: CategoryIcon,
  },
  operation: {
    bg: '#fff3e0',
    border: '#ff9800',
    icon: BuildIcon,
  },
};

export const CustomNode = memo(({ data }: NodeProps) => {
  const nodeType = data.nodeType || 'concept';
  const colors = nodeColors[nodeType as keyof typeof nodeColors] || nodeColors.concept;
  const IconComponent = colors.icon;

  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 2,
        border: 2,
        borderColor: colors.border,
        backgroundColor: colors.bg,
        minWidth: 150,
        maxWidth: 200,
        boxShadow: 2,
        position: 'relative',
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      <Handle type="target" position={Position.Top} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <IconComponent sx={{ fontSize: 20, color: colors.border }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          {data.label}
        </Typography>
        {data.onDelete && (
          <IconButton
            size="small"
            onClick={data.onDelete}
            sx={{
              padding: 0.5,
              '&:hover': { color: 'error.main' },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {data.description && (
        <Tooltip title={data.description} placement="bottom">
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.description}
          </Typography>
        </Tooltip>
      )}

      <Handle type="source" position={Position.Bottom} />
    </Box>
  );
});

CustomNode.displayName = 'CustomNode';
