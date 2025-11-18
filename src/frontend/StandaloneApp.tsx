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
  SelectChangeEvent,
  Paper,
  Tabs,
  Tab,
  Avatar,
  Chip,
  IconButton,
  Snackbar
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import PartialSumFlowCurve from './components/PartialSumFlowCurve';
import VirtualSmartphone from './components/VirtualSmartphone';
import { standaloneService, Problem, User } from './services/StandaloneService';

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
 * Login Component
 */
function LoginForm({ onLoginSuccess }: { onLoginSuccess: (user: User) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { user } = await standaloneService.login(username, password);
        onLoginSuccess(user);
      } else {
        const { user } = await standaloneService.register(username, password, firstname, lastname, email);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 64, height: 64 }}>
          <AccountCircleIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          부분합 흐름 시각화
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Partial Sum Flow Visualization
        </Typography>

        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={isLogin ? 0 : 1} onChange={(_, v) => setIsLogin(v === 0)} centered>
              <Tab label="로그인" />
              <Tab label="회원가입" />
            </Tabs>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!isLogin && (
            <Alert severity="info" sx={{ mb: 2 }}>
              데모 계정: admin/admin123 또는 student/student123
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <TextField
                  fullWidth
                  label="성 (Last Name)"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="이름 (First Name)"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="이메일 (Email)"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
              </>
            )}

            <TextField
              fullWidth
              label="사용자명 (Username)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              sx={{ mb: 2 }}
              autoFocus={isLogin}
            />

            <TextField
              fullWidth
              label="비밀번호 (Password)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 2, height: 48 }}
            >
              {loading ? <CircularProgress size={24} /> : isLogin ? '로그인' : '회원가입'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

/**
 * Main Standalone App Component
 */
function StandaloneApp() {
  const [user, setUser] = useState<User | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSmartphone, setShowSmartphone] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const currentUser = standaloneService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadProblems();
    } else {
      setLoading(false);
    }
  };

  const loadProblems = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await standaloneService.getAllProblems();
      setProblems(data);

      if (data.length > 0) {
        setSelectedProblem(data[0]);
        setStartTime(Date.now());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    loadProblems();
  };

  const handleLogout = async () => {
    await standaloneService.logout();
    setUser(null);
    setProblems([]);
    setSelectedProblem(null);
  };

  const handleProblemChange = (event: SelectChangeEvent<number>) => {
    const problemId = event.target.value as number;
    const problem = problems.find(p => p.id === problemId);
    if (problem) {
      setSelectedProblem(problem);
      setStudentAnswer('');
      setSubmitResult(null);
      setStartTime(Date.now());
    }
  };

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

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      const result = await standaloneService.submitAnswer(selectedProblem.id, answer, timeSpent);

      setSubmitResult({
        success: result.isCorrect,
        message: result.isCorrect
          ? `정답입니다! 🎉 (소요 시간: ${timeSpent}초)`
          : `오답입니다. 정답은 ${selectedProblem.expectedAnswer}입니다.`
      });

      if (result.isCorrect) {
        setSnackbarOpen(true);
      }
    } catch (err: any) {
      setSubmitResult({
        success: false,
        message: err.message || '제출에 실패했습니다.'
      });
    }
  };

  // Show login form if not authenticated
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

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
        {/* Header with User Info */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              부분합 흐름 시각화
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Partial Sum Flow Visualization - Standalone
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<AccountCircleIcon />}
              label={`${user.firstname} ${user.lastname}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={user.role}
              color={user.role === 'admin' ? 'error' : user.role === 'teacher' ? 'warning' : 'success'}
              size="small"
            />
            <IconButton onClick={handleLogout} color="primary" title="로그아웃">
              <LogoutIcon />
            </IconButton>
          </Box>
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
                  {problem.title} ({problem.difficulty})
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmitAnswer();
                    }
                  }}
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

        {/* Success Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message="정답입니다! 🎉"
        />
      </Container>
    </ThemeProvider>
  );
}

export default StandaloneApp;
