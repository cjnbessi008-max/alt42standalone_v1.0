/**
 * Main App Component
 */
import React from 'react';
import AnalyzerPage from './pages/AnalyzerPage';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <AnalyzerPage />
    </div>
  );
};

export default App;
