import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import DashboardPage from './pages/DashboardPage';
import CaseRoadmapPage from './pages/CaseRoadmapPage';
import ModuleDetailPage from './pages/ModuleDetailPage';

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/modules/:id" element={<ModuleDetailPage />} />
          <Route path="/case-roadmap/:moduleId" element={<CaseRoadmapPage />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
