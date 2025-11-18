import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  TextField,
  SelectChangeEvent
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import PartialSumFlowCurve from './components/PartialSumFlowCurve';
import VirtualSmartphone from './components/VirtualSmartphone';
import { moodleService, MoodleProblem } from './services/MoodleService';

// KAIST Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f8f9fa',
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
      '"Noto Sans KR"',
    ].join(','),
  },
});

/**
 * Main Application Component
 *
 * Integrates with Moodle LMS to display Partial Sum Flow visualizations
 * in a virtual smartphone interface.
 */
function App() {
  const [problems, setProblems] = useState<MoodleProblem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<MoodleProblem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSmartphone, setShowSmartphone] = useState<boolean>(true);

  // Mock data for demo purposes (when Moodle is not available)
  const mockProblems: MoodleProblem[] = [
    {
      id: 1,
      questionId: 101,
      title: '부분합 문제 1 - 양수 배열',
      description: '다음 배열의 부분합을 계산하세요: [1, 2, 3, 4, 5]',
      dataArray: [1, 2, 3, 4, 5],
      expectedAnswer: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      questionId: 102,
      title: '부분합 문제 2 - 혼합 배열',
      description: '다음 배열의 부분합을 계산하세요: [5, -2, 3, -1, 4]',
      dataArray: [5, -2, 3, -1, 4],
      expectedAnswer: 9,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      questionId: 103,
      title: '부분합 문제 3 - 큰 숫자',
      description: '다음 배열의 부분합을 계산하세요: [10, 20, 30, 40, 50]',
      dataArray: [10, 20, 30, 40, 50],
      expectedAnswer: 150,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 4,
      questionId: 104,
      title: '부분합 문제 4 - 피보나치 수열',
      description: '다음 피보나치 배열의 부분합을 계산하세요: [1, 1, 2, 3, 5, 8]',
      dataArray: [1, 1, 2, 3, 5, 8],
      expectedAnswer: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    loadProblems();
  }, []);

  /**
   * Load problems from Moodle or use mock data
   */
  const loadProblems = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch from Moodle API
      const data = await moodleService.getAllProblems();
      setProblems(data);

      if (data.length > 0) {
        setSelectedProblem(data[0]);
      }
    } catch (err) {
      console.warn('Moodle API not available, using mock data:', err);
      // Fallback to mock data
      setProblems(mockProblems);
      setSelectedProblem(mockProblems[0]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle problem selection change
   */
  const handleProblemChange = (event: SelectChangeEvent<number>) => {
    const problemId = event.target.value as number;
    const problem = problems.find(p => p.id === problemId);
    if (problem) {
      setSelectedProblem(problem);
      setStudentAnswer('');
      setSubmitResult(null);
    }
  };

  /**
   * Handle answer submission
   */
  const handleSubmitAnswer = async () => {
    if (!selectedProblem || !studentAnswer) {
      return;
    }

    const answer = parseInt(studentAnswer, 10);
    if (isNaN(answer)) {
      setSubmitResult({
        success: false,
        message: '올바른 숫자를 입력해주세요.'
      });
      return;
    }

    try {
      await moodleService.submitAnswer(selectedProblem.id, answer);

      const isCorrect = selectedProblem.expectedAnswer === answer;
      setSubmitResult({
        success: isCorrect,
        message: isCorrect
          ? '정답입니다! 🎉'
          : `오답입니다. 정답은 ${selectedProblem.expectedAnswer}입니다.`
      });
    } catch (err) {
      // Mock submission result for demo
      const isCorrect = selectedProblem.expectedAnswer === answer;
      setSubmitResult({
        success: isCorrect,
        message: isCorrect
          ? '정답입니다! 🎉 (데모 모드)'
          : `오답입니다. 정답은 ${selectedProblem.expectedAnswer}입니다. (데모 모드)`
      });
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh'
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
            부분합 흐름 시각화 시스템
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" gutterBottom>
            Partial Sum Flow Visualization System
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Moodle 3.7 LMS 연동 | MySQL 5.7 | PHP 7.1.9
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="problem-select-label">문제 선택</InputLabel>
            <Select
              labelId="problem-select-label"
              id="problem-select"
              value={selectedProblem?.id || ''}
              label="문제 선택"
              onChange={handleProblemChange}
            >
              {problems.map((problem) => (
                <MenuItem key={problem.id} value={problem.id}>
                  {problem.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedProblem && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {selectedProblem.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {selectedProblem.description}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                배열: [{selectedProblem.dataArray.join(', ')}]
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  label="답안 입력"
                  type="number"
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  sx={{ flexGrow: 1 }}
                  placeholder="부분합의 최종 값을 입력하세요"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmitAnswer}
                  disabled={!studentAnswer}
                  sx={{ height: '56px' }}
                >
                  제출
                </Button>
              </Box>

              {submitResult && (
                <Alert severity={submitResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
                  {submitResult.message}
                </Alert>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setShowSmartphone(!showSmartphone)}
            >
              {showSmartphone ? '스마트폰 뷰 숨기기' : '스마트폰 뷰 표시'}
            </Button>
          </Box>

          {/* Desktop View */}
          {!showSmartphone && selectedProblem && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <PartialSumFlowCurve
                data={selectedProblem.dataArray}
                title={selectedProblem.title}
                width={700}
                height={500}
                curveType="smooth"
              />
            </Box>
          )}
        </Box>

        {/* Virtual Smartphone Display (Bottom Right) */}
        {showSmartphone && selectedProblem && (
          <VirtualSmartphone position="bottom-right" scale={0.85}>
            <PartialSumFlowCurve
              data={selectedProblem.dataArray}
              title="부분합 그래프"
              width={335}
              height={450}
              curveType="smooth"
            />
          </VirtualSmartphone>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
