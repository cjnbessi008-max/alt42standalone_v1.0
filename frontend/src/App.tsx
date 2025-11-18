import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import HomePage from './pages/HomePage';
import ProblemPage from './pages/ProblemPage';

function App() {
  return (
    <Box sx={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/problem/:id" element={<ProblemPage />} />
      </Routes>
    </Box>
  );
}

export default App;
