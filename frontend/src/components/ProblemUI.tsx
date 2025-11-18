import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface ProblemUIProps {
  sessionId: string;
  onAction: (actionType: string, actionData: any) => void;
}

export default function ProblemUI({ sessionId, onAction }: ProblemUIProps) {
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');

  const handleInputChange = (field: string, value: string) => {
    if (field === 'numerator') {
      setNumerator(value);
    } else {
      setDenominator(value);
    }

    onAction('input', {
      field,
      value,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSubmit = () => {
    onAction('submit', {
      numerator,
      denominator,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          수학 문제
        </Typography>

        <Box sx={{ my: 3, p: 3, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            다음 분수를 계산하세요:
          </Typography>
          <Typography variant="h4" sx={{ my: 2, textAlign: 'center' }}>
            2/3 + 1/4 = ?
          </Typography>
        </Box>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          답을 입력하세요:
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <TextField
            label="분자"
            type="number"
            value={numerator}
            onChange={(e) => handleInputChange('numerator', e.target.value)}
            variant="outlined"
            fullWidth
          />
          <Typography variant="h4">/</Typography>
          <TextField
            label="분모"
            type="number"
            value={denominator}
            onChange={(e) => handleInputChange('denominator', e.target.value)}
            variant="outlined"
            fullWidth
          />
        </Stack>

        <Button
          variant="contained"
          endIcon={<SendIcon />}
          onClick={handleSubmit}
          disabled={!numerator || !denominator}
          fullWidth
          sx={{ mt: 3 }}
          size="large"
        >
          답안 제출
        </Button>

        <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            💡 힌트: 분수를 더하려면 먼저 통분을 해야 합니다
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
