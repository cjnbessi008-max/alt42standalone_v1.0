// Line Selector Component for selecting lines to calculate ratio

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
} from '@mui/material';
import { Line } from '@/types/geometry';

interface LineSelectorProps {
  lines: Line[];
  selectedLine1Id: string | null;
  selectedLine2Id: string | null;
  onSelectLine1: (lineId: string) => void;
  onSelectLine2: (lineId: string) => void;
  onCalculate: () => void;
}

const LineSelector: React.FC<LineSelectorProps> = ({
  lines,
  selectedLine1Id,
  selectedLine2Id,
  onSelectLine1,
  onSelectLine2,
  onCalculate,
}) => {
  const canCalculate = selectedLine1Id && selectedLine2Id;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          선분 선택
        </Typography>

        {/* Line 1 Selection */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            선분 1:
          </Typography>
          <List dense>
            {lines.map((line) => (
              <ListItem key={line.id} disablePadding>
                <ListItemButton
                  selected={selectedLine1Id === line.id}
                  onClick={() => onSelectLine1(line.id)}
                >
                  <ListItemText
                    primary={line.label || `Line ${line.id}`}
                    secondary={`${Math.round(line.length)} px`}
                  />
                  {selectedLine1Id === line.id && (
                    <Chip label="선택됨" size="small" color="primary" />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Line 2 Selection */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            선분 2:
          </Typography>
          <List dense>
            {lines.map((line) => (
              <ListItem key={line.id} disablePadding>
                <ListItemButton
                  selected={selectedLine2Id === line.id}
                  onClick={() => onSelectLine2(line.id)}
                  disabled={selectedLine1Id === line.id}
                >
                  <ListItemText
                    primary={line.label || `Line ${line.id}`}
                    secondary={`${Math.round(line.length)} px`}
                  />
                  {selectedLine2Id === line.id && (
                    <Chip label="선택됨" size="small" color="secondary" />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Calculate Button */}
        <Button
          variant="contained"
          fullWidth
          disabled={!canCalculate}
          onClick={onCalculate}
        >
          비율 계산하기
        </Button>
      </CardContent>
    </Card>
  );
};

export default LineSelector;
