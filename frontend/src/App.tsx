import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProblemPage from './pages/ProblemPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/problem/:problemId" element={<ProblemPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
