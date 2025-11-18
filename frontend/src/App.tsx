import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Student pages
import StudentStories from './pages/student/Stories';
import StoryPlayer from './pages/student/StoryPlayer';

// Teacher pages
import TeacherDashboard from './pages/teacher/Dashboard';

function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { initAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                {user?.role === 'TEACHER' ? (
                  <Navigate to="/teacher/dashboard" replace />
                ) : (
                  <Navigate to="/student/stories" replace />
                )}
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Student routes */}
        <Route
          path="/student/stories"
          element={
            <PrivateRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <Layout>
                <StudentStories />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/student/story/:id"
          element={
            <PrivateRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <Layout>
                <StoryPlayer />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Teacher routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <PrivateRoute allowedRoles={['TEACHER', 'ADMIN']}>
              <Layout>
                <TeacherDashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
