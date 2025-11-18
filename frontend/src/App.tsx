import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Typography, Alert } from '@mui/material';
import { KeywordExtractorForm } from './components/KeywordExtractorForm';
import { KeywordBubbleVisualization } from './components/KeywordBubbleVisualization';
import { keywordService } from './services/keywordService';
import type { ExtractionRequest, ExtractionResponse, BubbleNode } from './types/keyword';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4A90E2',
    },
    secondary: {
      main: '#7ED321',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

function App() {
  const [loading, setLoading] = useState(false);
  const [extractionData, setExtractionData] = useState<ExtractionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async (request: ExtractionRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await keywordService.extractKeywords(request);
      setExtractionData(response);
    } catch (err) {
      console.error('Extraction error:', err);
      setError(
        err instanceof Error ? err.message : '키워드 추출에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node: BubbleNode) => {
    console.log('Clicked node:', node);
    // 여기서 노드 클릭 시 상세 정보를 표시하거나 다른 동작을 수행할 수 있습니다
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            LMS 키워드 버블 시각화 시스템
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary">
            문제의 핵심 키워드를 추출하고 시각적 버블로 표현합니다
          </Typography>
        </Box>

        <KeywordExtractorForm onExtract={handleExtract} loading={loading} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {extractionData && extractionData.visualizationData.nodes.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <KeywordBubbleVisualization
              data={extractionData.visualizationData}
              onNodeClick={handleNodeClick}
            />
          </Box>
        )}

        {extractionData && extractionData.keywords.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              추출된 키워드 ({extractionData.keywords.length}개)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {extractionData.keywords
                .sort((a, b) => b.importanceScore - a.importanceScore)
                .map((keyword) => (
                  <Box
                    key={keyword.id}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                    }}
                  >
                    <Typography variant="body2" component="span" fontWeight="bold">
                      {keyword.keyword}
                    </Typography>
                    <Typography
                      variant="caption"
                      component="span"
                      sx={{ ml: 1, color: 'text.secondary' }}
                    >
                      ({keyword.importanceScore.toFixed(2)})
                    </Typography>
                  </Box>
                ))}
            </Box>
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
