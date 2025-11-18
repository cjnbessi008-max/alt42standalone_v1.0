import { Routes, Route } from 'react-router-dom'
import { Container, Box } from '@mui/material'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ModuleCreatePage from './pages/ModuleCreatePage'

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/modules/create" element={<ModuleCreatePage />} />
        </Routes>
      </Container>
    </Box>
  )
}

export default App
