import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { ProblemsListPage } from './pages/ProblemsListPage';
import { ProblemPage } from './pages/ProblemPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { loadUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/problems" replace /> : <LoginPage />}
        />
        <Route
          path="/problems"
          element={
            <ProtectedRoute>
              <ProblemsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/problem/:problemId"
          element={
            <ProtectedRoute>
              <ProblemPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/problems" replace />} />
        <Route path="*" element={<Navigate to="/problems" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
