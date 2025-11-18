/**
 * Interval Legend Component
 * Displays a legend of all intervals with their properties
 */
import React from 'react';
import { Box, Chip, Typography, Paper } from '@mui/material';
import type { Interval } from '../../types';

interface IntervalLegendProps {
  intervals: Interval[];
}

export const IntervalLegend: React.FC<IntervalLegendProps> = ({ intervals }) => {
  // Group intervals by property
  const groupedIntervals = intervals.reduce((acc, interval) => {
    if (!acc[interval.property]) {
      acc[interval.property] = [];
    }
    acc[interval.property].push(interval);
    return acc;
  }, {} as Record<string, Interval[]>);

  return (
    <Paper
      elevation={2}
      sx={{
        padding: 2,
        marginTop: 2,
        backgroundColor: '#fafafa',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
        구간 정보 (Interval Information)
      </Typography>

      {Object.entries(groupedIntervals).map(([property, propertyIntervals]) => (
        <Box key={property} sx={{ marginBottom: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
            {propertyIntervals[0].description}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {propertyIntervals.map((interval, index) => (
              <Chip
                key={`${property}-${index}`}
                label={`[${interval.start.toFixed(2)}, ${interval.end.toFixed(2)}]`}
                sx={{
                  backgroundColor: interval.color,
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                }}
                size="small"
              />
            ))}
          </Box>
        </Box>
      ))}

      {intervals.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          분석된 구간이 없습니다. (No intervals found)
        </Typography>
      )}
    </Paper>
  );
};

export default IntervalLegend;
