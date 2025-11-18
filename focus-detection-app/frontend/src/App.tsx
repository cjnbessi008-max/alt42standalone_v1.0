import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StudentSession } from './components/StudentSession';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentSession />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
