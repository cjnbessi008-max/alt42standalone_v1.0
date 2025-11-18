import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tab,
  Tabs,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Alert,
  Snackbar,
} from '@mui/material';
import ProblemInputForm from './components/ProblemInputForm';
import LMSProblemSearch from './components/LMSProblemSearch';
import ProblemSummaryCard from './components/ProblemSummaryCard';
import { summaryApi } from './services/api';
import type { Language, SummaryResult, LMSProblemSummaryResult } from './types';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [lmsProblemInfo, setLmsProblemInfo] = useState<LMSProblemSummaryResult['problem']>();
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // 탭 변경 시 결과 초기화
    setSummaryResult(null);
    setLmsProblemInfo(undefined);
    setError('');
  };

  const handleDirectSummarize = async (problemText: string, language: Language) => {
    setLoading(true);
    setError('');
    setSummaryResult(null);

    try {
      const result = await summaryApi.summarizeProblem({
        problemText,
        language,
      });

      if (result.success) {
        setSummaryResult(result);
        setSuccessMessage('문제가 성공적으로 요약되었습니다!');
      } else {
        setError(result.error || '요약에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '서버와의 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLMSSummarize = async (
    problemId: string,
    language: Language,
    saveSummary: boolean
  ) => {
    setLoading(true);
    setError('');
    setSummaryResult(null);
    setLmsProblemInfo(undefined);

    try {
      const result = await summaryApi.summarizeLMSProblem({
        problemId,
        language,
        saveSummary,
      });

      if (result.success) {
        setSummaryResult(result);
        setLmsProblemInfo(result.problem);
        setSuccessMessage(
          saveSummary
            ? 'LMS 문제가 요약되고 저장되었습니다!'
            : 'LMS 문제가 성공적으로 요약되었습니다!'
        );
      } else {
        setError(result.error || '요약에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '서버와의 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            align="center"
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            LMS 문제 요약기
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            AI가 문제를 핵심 3줄로 자동 요약합니다
          </Typography>

          <Paper elevation={3} sx={{ borderRadius: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="summarize tabs"
              centered
            >
              <Tab label="직접 입력" />
              <Tab label="LMS 연동" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <ProblemInputForm
                  onSubmit={handleDirectSummarize}
                  loading={loading}
                  error={error}
                />

                {summaryResult && summaryResult.success && (
                  <ProblemSummaryCard
                    summary={summaryResult.summary}
                    metadata={summaryResult.metadata}
                  />
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <LMSProblemSearch
                  onSubmit={handleLMSSummarize}
                  loading={loading}
                  error={error}
                />

                {lmsProblemInfo && (
                  <Alert severity="info">
                    <strong>{lmsProblemInfo.title}</strong>
                    {lmsProblemInfo.difficulty && ` | 난이도: ${lmsProblemInfo.difficulty}`}
                    {lmsProblemInfo.grade && ` | 학년: ${lmsProblemInfo.grade}`}
                  </Alert>
                )}

                {summaryResult && summaryResult.success && (
                  <ProblemSummaryCard
                    summary={summaryResult.summary}
                    title={lmsProblemInfo?.title ? `${lmsProblemInfo.title} - 핵심 3줄` : undefined}
                    metadata={summaryResult.metadata}
                  />
                )}
              </Box>
            </TabPanel>
          </Paper>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Powered by Claude AI | KAIST Touch Math Academy
            </Typography>
          </Box>
        </Box>

        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSuccessMessage('')}
            severity="success"
            sx={{ width: '100%' }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;
