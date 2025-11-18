import React, { useState, useEffect } from 'react';
import './App.css';
import VirtualPhone from './components/VirtualPhone';
import SpiralVisualization from './components/SpiralVisualization';
import SequenceSelector from './components/SequenceSelector';
import { getSequences, getSequence, saveProgress } from './utils/api';

function App() {
  const [sequences, setSequences] = useState([]);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    try {
      setLoading(true);
      const data = await getSequences();
      setSequences(data);
      if (data.length > 0) {
        setSelectedSequence(data[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSequenceChange = async (sequenceId) => {
    try {
      const sequence = await getSequence(sequenceId);
      setSelectedSequence(sequence);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleComplete = async () => {
    if (selectedSequence) {
      try {
        await saveProgress(selectedSequence.id, {
          status: 'completed',
          score: 100
        });
        alert('축하합니다! 시각화를 완료했습니다.');
      } catch (err) {
        console.error('Failed to save progress:', err);
      }
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

  if (error) {
    return (
      <div className="app-error">
        <h2>오류 발생</h2>
        <p>{error}</p>
        <button onClick={loadSequences}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Geo Spiral</h1>
        <p>등비수열 나선형 시각화</p>
      </header>

      <main className="app-main">
        <div className="app-controls">
          <SequenceSelector
            sequences={sequences}
            selectedSequence={selectedSequence}
            onSequenceChange={handleSequenceChange}
          />
        </div>

        <VirtualPhone position="bottom-right">
          {selectedSequence && (
            <SpiralVisualization
              sequence={selectedSequence}
              onComplete={handleComplete}
            />
          )}
        </VirtualPhone>
      </main>
    </div>
  );
}

export default App;
