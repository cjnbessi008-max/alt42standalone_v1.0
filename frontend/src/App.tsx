import React, { useState, useEffect } from 'react';
import './styles/App.css';
import VirtualPhone from './components/VirtualPhone';
import ArtworkViewer from './components/ArtworkViewer';
import ProblemDisplay from './components/ProblemDisplay';
import { apiService } from './services/apiService';
import { Artwork, Problem } from './types';

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentArtwork, setCurrentArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load artworks on mount
  useEffect(() => {
    loadArtworks();
  }, []);

  const loadArtworks = async () => {
    try {
      setLoading(true);
      const data = await apiService.getArtworks();
      setArtworks(data);

      // Load first artwork as demo
      if (data.length > 0) {
        setCurrentArtwork(data[0]);
      }

      setError(null);
    } catch (err) {
      setError('아트워크를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProblem = async (problemId: number) => {
    try {
      const problem = await apiService.getProblem(problemId);
      setCurrentProblem(problem);

      // Load associated artwork
      if (problem.artwork_number) {
        const artwork = artworks.find(a => a.number === problem.artwork_number);
        if (artwork) {
          setCurrentArtwork(artwork);
        }
      }
    } catch (err) {
      setError('문제를 불러오는데 실패했습니다.');
      console.error(err);
    }
  };

  const handleArtworkSelect = (number: number) => {
    const artwork = artworks.find(a => a.number === number);
    if (artwork) {
      setCurrentArtwork(artwork);
    }
  };

  const handleAnswerSubmit = async (answer: string) => {
    if (!currentProblem) return;

    try {
      const isCorrect = answer === currentProblem.correct_answer;

      await apiService.submitProgress({
        student_id: 1, // TODO: Get from auth
        problem_id: currentProblem.id,
        artwork_number: currentProblem.artwork_number || 0,
        user_answer: answer,
        is_correct: isCorrect,
        time_spent_seconds: 60, // TODO: Track actual time
        score: isCorrect ? currentProblem.points : 0
      });

      alert(isCorrect ? '정답입니다! 🎉' : '다시 시도해보세요.');
    } catch (err) {
      setError('답안 제출에 실패했습니다.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="app-container loading">
        <div className="loading-spinner">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎨 Hundred Art</h1>
        <p className="subtitle">1-100 숫자를 아트워크로 배우기</p>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <main className="app-main">
        <div className="control-panel">
          <div className="artwork-selector">
            <h3>아트워크 선택</h3>
            <div className="number-grid">
              {artworks.slice(0, 20).map(artwork => (
                <button
                  key={artwork.number}
                  className={`number-button ${currentArtwork?.number === artwork.number ? 'active' : ''}`}
                  onClick={() => handleArtworkSelect(artwork.number)}
                  title={artwork.title}
                >
                  {artwork.number}
                </button>
              ))}
            </div>
          </div>

          {currentProblem && (
            <ProblemDisplay
              problem={currentProblem}
              onSubmit={handleAnswerSubmit}
            />
          )}
        </div>

        <div className="phone-container">
          <VirtualPhone>
            {currentArtwork ? (
              <ArtworkViewer artwork={currentArtwork} />
            ) : (
              <div className="empty-state">
                아트워크를 선택해주세요
              </div>
            )}
          </VirtualPhone>
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2025 KAIST Touch Math Academy - Hundred Art</p>
      </footer>
    </div>
  );
};

export default App;
