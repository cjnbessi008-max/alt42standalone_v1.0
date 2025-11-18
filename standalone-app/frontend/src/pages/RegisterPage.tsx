import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Card, CardContent, TextField, Button, Typography, Link, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.register(formData);
      const { user, token } = response.data;
      login(user, token);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container maxWidth="sm">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card elevation={8}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" align="center" gutterBottom fontWeight="bold">Register</Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <form onSubmit={handleSubmit}>
                <TextField fullWidth label="Name" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} margin="normal" required />
                <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} margin="normal" required />
                <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} margin="normal" required />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role</InputLabel>
                  <Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="teacher">Teacher</MenuItem>
                  </Select>
                </FormControl>
                <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 3, mb: 2 }}>
                  {loading ? 'Registering...' : 'Register'}
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <Link component={RouterLink} to="/login" variant="body2">Already have an account? Login</Link>
                </Box>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
