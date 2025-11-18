import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { user, token } = response.data;

      login(user, token);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card elevation={8}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
                Reflection Mode
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                y=x 대칭 시각화 학습 플랫폼
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  required
                  autoComplete="email"
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                  required
                  autoComplete="current-password"
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Link component={RouterLink} to="/register" variant="body2">
                    Don't have an account? Register
                  </Link>
                </Box>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="caption" display="block">
                    <strong>Demo Accounts:</strong>
                  </Typography>
                  <Typography variant="caption" display="block">
                    Student: student@reflection.local / password
                  </Typography>
                  <Typography variant="caption" display="block">
                    Teacher: teacher@reflection.local / password
                  </Typography>
                </Box>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
