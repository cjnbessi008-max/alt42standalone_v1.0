import { Box, Container } from '@mui/material'
import Header from './components/Header'
import ControlPanel from './components/ControlPanel'
import VirtualSmartphone from './components/VirtualSmartphone'

function App() {
  return (
    <Box sx={{ minHeight: '100vh', pb: 4 }}>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <ControlPanel />
          </Box>
        </Box>
      </Container>

      {/* Virtual Smartphone - Fixed position bottom right */}
      <VirtualSmartphone />
    </Box>
  )
}

export default App
