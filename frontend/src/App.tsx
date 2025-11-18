import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import LearningActivity from './pages/LearningActivity'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">🧠 사고 전성기 추적 시스템</h1>
            <div className="nav-links">
              <Link to="/" className="nav-link">학생 대시보드</Link>
              <Link to="/teacher" className="nav-link">교사 대시보드</Link>
              <Link to="/activity" className="nav-link">학습 활동</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<StudentDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/activity" element={<LearningActivity />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>© 2024 KAIST Touch Math Academy - Peak Thinking Period Tracker v1.0</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
