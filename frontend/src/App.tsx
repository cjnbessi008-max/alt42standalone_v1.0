import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ProblemList } from './pages/ProblemList'
import { ProblemDetail } from './pages/ProblemDetail'
import { ComparisonPage } from './pages/ComparisonPage'
import { MySolutions } from './pages/MySolutions'
import { TeacherProblems } from './pages/TeacherProblems'
import { CreateProblem } from './pages/CreateProblem'
import { useAuthStore } from './services/authStore'
import { UserRole } from './types'

const queryClient = new QueryClient()

const ProtectedRoute: React.FC<{ children: React.ReactNode; teacherOnly?: boolean }> = ({
  children,
  teacherOnly = false,
}) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (teacherOnly && user?.role !== UserRole.TEACHER && user?.role !== UserRole.ADMIN) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />

          <Route
            path="/problems"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProblemList />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/problems/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProblemDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/solutions/:solutionId/compare"
            element={
              <ProtectedRoute>
                <Layout>
                  <ComparisonPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-solutions"
            element={
              <ProtectedRoute>
                <Layout>
                  <MySolutions />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/problems"
            element={
              <ProtectedRoute teacherOnly>
                <Layout>
                  <TeacherProblems />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/problems/new"
            element={
              <ProtectedRoute teacherOnly>
                <Layout>
                  <CreateProblem />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
