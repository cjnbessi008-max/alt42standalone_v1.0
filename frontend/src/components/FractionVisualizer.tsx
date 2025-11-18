import { Box, Typography, Paper } from '@mui/material';
import { Fraction } from '../types';

interface FractionVisualizerProps {
  fraction: Fraction;
  visualType?: 'pizza' | 'bar' | 'circle';
  size?: number;
}

const FractionVisualizer = ({ fraction, visualType = 'pizza', size = 200 }: FractionVisualizerProps) => {
  const { numerator, denominator } = fraction;

  const renderPizza = () => {
    const slices = [];
    const anglePerSlice = 360 / denominator;

    for (let i = 0; i < denominator; i++) {
      const startAngle = i * anglePerSlice - 90;
      const endAngle = (i + 1) * anglePerSlice - 90;
      const isFilled = i < numerator;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 10;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArcFlag = anglePerSlice > 180 ? 1 : 0;

      const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      slices.push(
        <path
          key={i}
          d={pathData}
          fill={isFilled ? '#ff9800' : '#e0e0e0'}
          stroke="#333"
          strokeWidth="2"
        />
      );
    }

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices}
      </svg>
    );
  };

  const renderBar = () => {
    const bars = [];
    const barWidth = size / denominator;

    for (let i = 0; i < denominator; i++) {
      const isFilled = i < numerator;
      bars.push(
        <rect
          key={i}
          x={i * barWidth}
          y={0}
          width={barWidth - 2}
          height={size / 3}
          fill={isFilled ? '#4caf50' : '#e0e0e0'}
          stroke="#333"
          strokeWidth="1"
        />
      );
    }

    return (
      <svg width={size} height={size / 3} viewBox={`0 0 ${size} ${size / 3}`}>
        {bars}
      </svg>
    );
  };

  const renderCircle = () => {
    const circles = [];
    const circlesPerRow = Math.ceil(Math.sqrt(denominator));
    const circleSize = size / (circlesPerRow + 1);

    for (let i = 0; i < denominator; i++) {
      const row = Math.floor(i / circlesPerRow);
      const col = i % circlesPerRow;
      const cx = (col + 1) * (size / (circlesPerRow + 1));
      const cy = (row + 1) * (size / (Math.ceil(denominator / circlesPerRow) + 1));
      const isFilled = i < numerator;

      circles.push(
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={circleSize / 3}
          fill={isFilled ? '#2196f3' : '#e0e0e0'}
          stroke="#333"
          strokeWidth="1"
        />
      );
    }

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {circles}
      </svg>
    );
  };

  const getVisualization = () => {
    switch (visualType) {
      case 'pizza':
        return renderPizza();
      case 'bar':
        return renderBar();
      case 'circle':
        return renderCircle();
      default:
        return renderPizza();
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        {numerator}/{denominator}
      </Typography>
      <Box display="flex" justifyContent="center" alignItems="center">
        {getVisualization()}
      </Box>
    </Paper>
  );
};

export default FractionVisualizer;
