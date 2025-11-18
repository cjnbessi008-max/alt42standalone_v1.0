import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import StudentDashboard from './pages/StudentDashboard'
import VisualizationPage from './pages/VisualizationPage'
import Navbar from './components/Navbar'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/student/:id" element={<StudentDashboard />} />
        <Route path="/visualization" element={<VisualizationPage />} />
      </Routes>
    </div>
  )
}

export default App
