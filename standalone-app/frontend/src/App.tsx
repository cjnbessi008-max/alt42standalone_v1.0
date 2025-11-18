import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProblemsPage from './pages/ProblemsPage';
import ProblemSolvePage from './pages/ProblemSolvePage';
import CreateProblemPage from './pages/CreateProblemPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';

// Components
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/common/Layout';

// Store
import { useAuthStore } from './store/authStore';

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8b9aee',
      dark: '#4d5fd1',
    },
    secondary: {
      main: '#764ba2',
      light: '#9466bd',
      dark: '#5a3a7a',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
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
    ].join(','),
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/register"
            element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />}
          />

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/problems" element={<ProblemsPage />} />
              <Route path="/problems/:id" element={<ProblemSolvePage />} />
              <Route path="/create-problem" element={<CreateProblemPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
