import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Slider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { ExtractionRequest } from '../types/keyword';

interface KeywordExtractorFormProps {
  onExtract: (request: ExtractionRequest) => Promise<void>;
  loading?: boolean;
}

export const KeywordExtractorForm: React.FC<KeywordExtractorFormProps> = ({
  onExtract,
  loading = false,
}) => {
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [minImportance, setMinImportance] = useState(0.3);
  const [maxKeywords, setMaxKeywords] = useState(20);
  const [includeRelationships, setIncludeRelationships] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    try {
      await onExtract({
        content,
        language,
        extractionOptions: {
          minImportance,
          maxKeywords,
          includeRelationships,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '키워드 추출 중 오류가 발생했습니다.');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        LMS 문제 키워드 추출
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={8}
          label="문제 내용"
          placeholder="LMS 문제 내용을 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>언어</InputLabel>
            <Select
              value={language}
              label="언어"
              onChange={(e) => setLanguage(e.target.value as 'ko' | 'en')}
              disabled={loading}
            >
              <MenuItem value="ko">한국어</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ width: 200 }}>
            <Typography variant="caption" gutterBottom>
              최소 중요도: {minImportance.toFixed(2)}
            </Typography>
            <Slider
              value={minImportance}
              onChange={(_, value) => setMinImportance(value as number)}
              min={0}
              max={1}
              step={0.05}
              disabled={loading}
            />
          </Box>

          <Box sx={{ width: 200 }}>
            <Typography variant="caption" gutterBottom>
              최대 키워드 수: {maxKeywords}
            </Typography>
            <Slider
              value={maxKeywords}
              onChange={(_, value) => setMaxKeywords(value as number)}
              min={5}
              max={50}
              step={5}
              disabled={loading}
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
          disabled={loading || !content.trim()}
          fullWidth
        >
          {loading ? '키워드 추출 중...' : '키워드 추출'}
        </Button>
      </Box>
    </Paper>
  );
};
