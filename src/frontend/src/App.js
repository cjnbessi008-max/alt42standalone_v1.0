import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import VisualizationPage from './components/VisualizationPage';
import Leaderboard from './components/Leaderboard';
import { isAuthenticated, getCurrentUser } from './utils/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (isAuthenticated()) {
        const userData = await getCurrentUser();
        setUser(userData.user);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login onLogin={loadUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <Register onRegister={loadUser} />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} onUserUpdate={loadUser} /> : <Navigate to="/login" />}
        />
        <Route
          path="/visualize/:sequenceId"
          element={user ? <VisualizationPage user={user} /> : <Navigate to="/login" />}
        />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
