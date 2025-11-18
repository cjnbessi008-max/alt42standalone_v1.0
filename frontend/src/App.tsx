/**
 * Main App component
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GamePage } from './pages/GamePage';
import './styles/index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GamePage />} />
      </Routes>
    </Router>
  );
}

export default App;
