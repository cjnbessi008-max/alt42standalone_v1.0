import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import LearningSession from './pages/LearningSession';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/learning/:sessionId" element={<LearningSession />} />
      </Routes>
    </Container>
  );
}

export default App;
