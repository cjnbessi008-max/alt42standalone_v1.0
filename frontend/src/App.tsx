import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import { BiasAnalysisService } from './services/api';

function App() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await BiasAnalysisService.getSessionStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📊 Concept Tool Bias Analysis System</h1>
        <p>Analyzing educational tool usage patterns and identifying biases</p>
      </header>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="container">
          {stats && (
            <div className="stats-overview">
              <div className="stat-card">
                <h3>{stats.total_sessions || 0}</h3>
                <p>Total Sessions</p>
              </div>
              <div className="stat-card">
                <h3>{stats.unique_students || 0}</h3>
                <p>Unique Students</p>
              </div>
              <div className="stat-card">
                <h3>{stats.unique_tools || 0}</h3>
                <p>Unique Tools</p>
              </div>
              <div className="stat-card">
                <h3>{Math.round(stats.average_duration_seconds / 60) || 0} min</h3>
                <p>Avg Session Duration</p>
              </div>
            </div>
          )}

          <Dashboard />
        </div>
      )}
    </div>
  );
}

export default App;
