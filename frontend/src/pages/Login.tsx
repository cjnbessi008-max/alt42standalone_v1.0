import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
} from '@mui/material'
import { login, register } from '../services/api'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const Login = () => {
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)

  // Login state
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register state
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    grade_level: '',
    is_teacher: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    setError(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await login(loginUsername, loginPassword)
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))

      if (response.user.is_teacher) {
        navigate('/teacher/dashboard')
      } else {
        navigate('/student/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (registerData.password !== registerData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    try {
      await register(registerData)
      setError(null)
      setTabValue(0) // Switch to login tab
      alert('회원가입이 완료되었습니다. 로그인해주세요.')
    } catch (err: any) {
      setError(err.response?.data?.detail || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card elevation={4}>
          <CardContent>
            <Typography variant="h4" component="h1" align="center" gutterBottom>
              AI 교육 시스템
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" paragraph>
              개인화된 학습 추천과 시각적 흐름도로 학습 효과를 극대화하세요
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} centered>
                <Tab label="로그인" />
                <Tab label="회원가입" />
              </Tabs>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {/* Login Tab */}
            <TabPanel value={tabValue} index={0}>
              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="사용자명"
                  margin="normal"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="비밀번호"
                  type="password"
                  margin="normal"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3 }}
                >
                  {loading ? <CircularProgress size={24} /> : '로그인'}
                </Button>
              </form>
            </TabPanel>

            {/* Register Tab */}
            <TabPanel value={tabValue} index={1}>
              <form onSubmit={handleRegister}>
                <TextField
                  fullWidth
                  label="사용자명"
                  margin="normal"
                  value={registerData.username}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, username: e.target.value })
                  }
                  required
                  helperText="3자 이상"
                />
                <TextField
                  fullWidth
                  label="이메일"
                  type="email"
                  margin="normal"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  required
                />
                <TextField
                  fullWidth
                  label="이름"
                  margin="normal"
                  value={registerData.name}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, name: e.target.value })
                  }
                  required
                />
                <TextField
                  fullWidth
                  label="비밀번호"
                  type="password"
                  margin="normal"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, password: e.target.value })
                  }
                  required
                  helperText="6자 이상"
                />
                <TextField
                  fullWidth
                  label="비밀번호 확인"
                  type="password"
                  margin="normal"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, confirmPassword: e.target.value })
                  }
                  required
                />
                <TextField
                  fullWidth
                  label="학년 (선택사항)"
                  margin="normal"
                  value={registerData.grade_level}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, grade_level: e.target.value })
                  }
                  placeholder="예: 초등 3학년"
                />
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant={registerData.is_teacher ? 'outlined' : 'contained'}
                    onClick={() =>
                      setRegisterData({ ...registerData, is_teacher: false })
                    }
                    sx={{ mr: 1 }}
                  >
                    학생
                  </Button>
                  <Button
                    variant={registerData.is_teacher ? 'contained' : 'outlined'}
                    onClick={() =>
                      setRegisterData({ ...registerData, is_teacher: true })
                    }
                  >
                    교사
                  </Button>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3 }}
                >
                  {loading ? <CircularProgress size={24} /> : '회원가입'}
                </Button>
              </form>
            </TabPanel>
          </CardContent>
        </Card>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            데모 계정: student / password (학생) | teacher / password (교사)
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

export default Login
