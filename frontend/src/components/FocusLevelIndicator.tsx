/**
 * Focus Level Indicator Component
 * Visual representation of current focus/concentration level
 */

import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import {
  Whatshot as WhatshotIcon,
  LocalFireDepartment as FireIcon,
  WbSunny as SunnyIcon,
  Cloud as CloudIcon,
  AcUnit as SnowIcon
} from '@mui/icons-material';
import type { FocusLevel } from '../../../shared/types';

interface FocusLevelIndicatorProps {
  focusLevel: FocusLevel;
  timestamp: Date;
}

export default function FocusLevelIndicator({ focusLevel, timestamp }: FocusLevelIndicatorProps) {
  const getFocusConfig = (level: FocusLevel) => {
    const configs = {
      highly_focused: {
        label: '매우 집중',
        color: '#4caf50',
        icon: <WhatshotIcon sx={{ fontSize: 60 }} />,
        score: 100,
        message: '완벽합니다! 계속 유지하세요!'
      },
      focused: {
        label: '집중',
        color: '#8bc34a',
        icon: <FireIcon sx={{ fontSize: 60 }} />,
        score: 80,
        message: '잘하고 있어요!'
      },
      moderately_focused: {
        label: '보통 집중',
        color: '#ff9800',
        icon: <SunnyIcon sx={{ fontSize: 60 }} />,
        score: 60,
        message: '조금 더 집중해보세요'
      },
      distracted: {
        label: '산만함',
        color: '#ff5722',
        icon: <CloudIcon sx={{ fontSize: 60 }} />,
        score: 40,
        message: '방해 요소를 제거해보세요'
      },
      highly_distracted: {
        label: '매우 산만함',
        color: '#f44336',
        icon: <SnowIcon sx={{ fontSize: 60 }} />,
        score: 20,
        message: '휴식이 필요할 수 있습니다'
      }
    };
    return configs[level];
  };

  const config = getFocusConfig(focusLevel);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          현재 집중도
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 3
          }}
        >
          {/* Circular Progress */}
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={config.score}
              size={120}
              thickness={5}
              sx={{
                color: config.color,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round'
                }
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: config.color
              }}
            >
              {config.icon}
            </Box>
          </Box>

          {/* Label */}
          <Typography
            variant="h5"
            sx={{ mt: 2, fontWeight: 'bold', color: config.color }}
          >
            {config.label}
          </Typography>

          {/* Score */}
          <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold' }}>
            {config.score}
          </Typography>

          {/* Message */}
          <Typography
            variant="body2"
            sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}
          >
            {config.message}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
