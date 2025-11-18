import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import { useGraphStore } from '../../store/graphStore';
import { extractConcepts } from '../../services/conceptExtraction';

export const TextInputPanel: React.FC = () => {
  const { inputText, setInputText, setGraph, setLoading, setError, isLoading, error } = useGraphStore();
  const [localText, setLocalText] = useState(inputText);

  const handleGenerate = async () => {
    if (!localText.trim()) {
      setError('텍스트를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setInputText(localText);

    try {
      const result = await extractConcepts(localText);
      setGraph({
        nodes: result.concepts,
        relationships: result.relationships,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '그래프 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSample = () => {
    const sampleText = `분수는 전체를 여러 부분으로 나눈 것을 나타냅니다.
분수는 분자와 분모로 구성됩니다.
피자를 예로 들면, 한 판의 피자를 8조각으로 나누고 그 중 3조각을 먹었다면 3/8이 됩니다.
학생들은 분수의 덧셈, 뺄셈, 곱셈, 나눗셈을 배우며, 약분을 통해 분수를 간단히 만드는 방법도 학습합니다.`;
    setLocalText(sampleText);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoGraphIcon color="primary" />
        <Typography variant="h6" component="h2">
          교육 내용 입력
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        교육하고 싶은 내용을 자유롭게 입력하세요. AI가 자동으로 개념과 관계를 추출하여 그래프로 시각화합니다.
      </Typography>

      <TextField
        multiline
        rows={12}
        fullWidth
        variant="outlined"
        placeholder="예: 분수는 전체를 여러 부분으로 나눈 것입니다. 분수는 분자와 분모로 구성되며..."
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        disabled={isLoading}
        sx={{ mb: 2, flexGrow: 1 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleGenerate}
          disabled={isLoading || !localText.trim()}
          startIcon={isLoading ? <CircularProgress size={20} /> : <AutoGraphIcon />}
        >
          {isLoading ? '생성 중...' : '그래프 자동 생성'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleUseSample}
          disabled={isLoading}
        >
          샘플 사용
        </Button>
      </Box>
    </Paper>
  );
};
