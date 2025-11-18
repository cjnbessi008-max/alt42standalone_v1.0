import React from 'react';
import PhoneSimulator from './components/PhoneSimulator';
import DivisorGame from './components/DivisorGame';

function App() {
  const handleGameComplete = (score: number, timeSpent: number) => {
    console.log('Game completed!', { score, timeSpent });
    // Here you can send data to backend or Moodle
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <PhoneSimulator>
        <DivisorGame onComplete={handleGameComplete} />
      </PhoneSimulator>
    </div>
  );
}

export default App;
