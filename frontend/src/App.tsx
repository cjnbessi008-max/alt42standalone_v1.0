/**
 * Main Application Component
 * LMS Problem Viewer with Compressed Display
 */

import React, { useState } from 'react';
import CompressedProblemList from './components/ProblemDisplay/CompressedProblemList';
import './App.css';

function App() {
  const [moduleId, setModuleId] = useState<string>('demo-module-001');

  return (
    <div className="app">
      <header className="app-header">
        <h1>LMS Problem Viewer</h1>
        <p>Compressed Single-Line Display</p>
      </header>

      <main className="app-main">
        <div className="module-selector">
          <label htmlFor="module-select">Select Module:</label>
          <input
            id="module-select"
            type="text"
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            placeholder="Enter Module ID"
          />
        </div>

        <CompressedProblemList moduleId={moduleId} limit={100} />
      </main>

      <footer className="app-footer">
        <p>AI Education System Pipeline • Problem Display v1.0</p>
      </footer>
    </div>
  );
}

export default App;
