import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { userAPI } from '../services/api';
import { setUser } from '../store/slices/userSlice';
import SelfCareIcon from '@mui/icons-material/SelfImprovement';

const HomePage: React.FC = () => {
  const [moodleUserId, setMoodleUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!moodleUserId || isNaN(Number(moodleUserId))) {
      setError('올바른 Moodle 사용자 ID를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Sync user from Moodle
      const response = await userAPI.syncUser(Number(moodleUserId));
      const user = response.data.data;

      // Store user in Redux
      dispatch(setUser(user));

      // Store user ID in localStorage
      localStorage.setItem('userId', user.id);
      localStorage.setItem('moodleUserId', moodleUserId);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || '사용자 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={8}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <SelfCareIcon
                sx={{
                  fontSize: 80,
                  color: 'primary.main',
                  mb: 2,
                }}
              />
              <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
                🧘 정신 완화 루틴
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                학습 후 건강한 휴식을 위한 맞춤형 완화 루틴을 경험하세요
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <TextField
                fullWidth
                label="Moodle 사용자 ID"
                variant="outlined"
                value={moodleUserId}
                onChange={(e) => setMoodleUserId(e.target.value)}
                placeholder="예: 12345"
                sx={{ mb: 3 }}
                disabled={loading}
                autoFocus
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleLogin}
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : '시작하기'}
              </Button>
            </Box>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                💡 Moodle 퀴즈에서 정답을 맞추면 자동으로 완화 루틴이 제공됩니다
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
            KAIST Touch Math Academy
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
