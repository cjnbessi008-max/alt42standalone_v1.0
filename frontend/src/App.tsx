import { Routes, Route } from 'react-router-dom'
import { Container } from '@mui/material'
import Layout from './components/common/Layout'
import Dashboard from './pages/Dashboard'
import CorrelationAnalysis from './pages/CorrelationAnalysis'
import MoodleConnection from './pages/MoodleConnection'

function App() {
  return (
    <Layout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/moodle" element={<MoodleConnection />} />
          <Route path="/correlation" element={<CorrelationAnalysis />} />
        </Routes>
      </Container>
    </Layout>
  )
}

export default App
