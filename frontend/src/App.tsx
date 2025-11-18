import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import StudentPage from './pages/StudentPage';
import TeacherDashboard from './pages/TeacherDashboard';
import NotFound from './pages/NotFound';

function App() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/student"
          element={
            isAuthenticated && user?.role === 'student' ? (
              <StudentPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            isAuthenticated && user?.role === 'teacher' ? (
              <TeacherDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/"
          element={
            isAuthenticated ? (
              user?.role === 'teacher' ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/student" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
