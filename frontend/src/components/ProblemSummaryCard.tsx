import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface ProblemSummaryCardProps {
  summary: string[];
  title?: string;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    timestamp?: string;
  };
}

const ProblemSummaryCard: React.FC<ProblemSummaryCardProps> = ({
  summary,
  title = '핵심 3줄 요약',
  metadata,
}) => {
  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      }}
    >
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
          {title}
        </Typography>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', my: 2 }} />

        <List>
          {summary.map((line, index) => (
            <ListItem
              key={index}
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                },
              }}
            >
              <ListItemIcon>
                <CheckCircleOutlineIcon sx={{ color: '#4ade80' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body1" fontWeight="medium">
                    {line}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>

        {metadata && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {metadata.model && (
              <Chip
                label={`Model: ${metadata.model}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              />
            )}
            {metadata.tokensUsed && (
              <Chip
                label={`Tokens: ${metadata.tokensUsed}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              />
            )}
            {metadata.timestamp && (
              <Chip
                icon={<AccessTimeIcon sx={{ color: 'white !important' }} />}
                label={new Date(metadata.timestamp).toLocaleString('ko-KR')}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProblemSummaryCard;
