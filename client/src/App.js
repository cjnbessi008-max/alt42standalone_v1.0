import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SmartphoneFrame from './components/SmartphoneFrame';
import MatchingGame from './components/MatchingGame';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <SmartphoneFrame>
              <MatchingGame problemId={1} studentId={2} />
            </SmartphoneFrame>
          } />
          <Route path="/problem/:problemId" element={
            <SmartphoneFrame>
              <MatchingGame />
            </SmartphoneFrame>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
