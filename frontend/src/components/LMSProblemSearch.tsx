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
  FormControlLabel,
  Switch,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { Language } from '../types';

interface LMSProblemSearchProps {
  onSubmit: (problemId: string, language: Language, saveSummary: boolean) => Promise<void>;
  loading?: boolean;
  error?: string;
}

const LMSProblemSearch: React.FC<LMSProblemSearchProps> = ({
  onSubmit,
  loading = false,
  error,
}) => {
  const [problemId, setProblemId] = useState('');
  const [language, setLanguage] = useState<Language>('ko');
  const [saveSummary, setSaveSummary] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (problemId.trim()) {
      await onSubmit(problemId, language, saveSummary);
    }
  };

  const loadSampleProblem = (sampleId: string) => {
    setProblemId(sampleId);
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          LMS 문제 검색
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="문제 ID"
              value={problemId}
              onChange={(e) => setProblemId(e.target.value)}
              placeholder="예: prob_001"
              fullWidth
              required
              disabled={loading}
              variant="outlined"
            />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => loadSampleProblem('prob_001')}
                disabled={loading}
              >
                샘플 1 (분수)
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => loadSampleProblem('prob_002')}
                disabled={loading}
              >
                샘플 2 (도형)
              </Button>
            </Box>

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

            <FormControlLabel
              control={
                <Switch
                  checked={saveSummary}
                  onChange={(e) => setSaveSummary(e.target.checked)}
                  disabled={loading}
                />
              }
              label="LMS에 요약 저장"
            />

            {error && (
              <Alert severity="error" onClose={() => {}}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              endIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              disabled={loading || !problemId.trim()}
              fullWidth
              color="secondary"
            >
              {loading ? '검색 중...' : 'LMS에서 검색'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default LMSProblemSearch;
