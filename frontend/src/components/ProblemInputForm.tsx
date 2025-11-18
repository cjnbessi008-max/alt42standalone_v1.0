import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import type { Language } from '../types';

interface ProblemInputFormProps {
  onSubmit: (problemText: string, language: Language) => Promise<void>;
  loading?: boolean;
  error?: string;
}

const ProblemInputForm: React.FC<ProblemInputFormProps> = ({
  onSubmit,
  loading = false,
  error,
}) => {
  const [problemText, setProblemText] = useState('');
  const [language, setLanguage] = useState<Language>('ko');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (problemText.trim()) {
      await onSubmit(problemText, language);
    }
  };

  const handleClear = () => {
    setProblemText('');
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          문제 입력
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="문제 내용"
              multiline
              rows={8}
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="요약할 문제를 입력하세요..."
              fullWidth
              required
              disabled={loading}
              variant="outlined"
            />

            <FormControl fullWidth disabled={loading}>
              <InputLabel>언어</InputLabel>
              <Select
                value={language}
                label="언어"
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                <MenuItem value="ko">한국어</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>

            {error && (
              <Alert severity="error" onClose={() => {}}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                type="submit"
                variant="contained"
                endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                disabled={loading || !problemText.trim()}
                fullWidth
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #63408b 100%)',
                  },
                }}
              >
                {loading ? '요약 중...' : '요약하기'}
              </Button>

              <Button
                variant="outlined"
                onClick={handleClear}
                disabled={loading || !problemText}
              >
                초기화
              </Button>
            </Box>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProblemInputForm;
