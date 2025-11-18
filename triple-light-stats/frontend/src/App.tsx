import { useState, useEffect } from 'react';
import './App.css';
import SmartphoneFrame from './components/SmartphoneFrame';
import TripleLight from './components/TripleLight';
import StatsDisplay from './components/StatsDisplay';
import QuizSelector from './components/QuizSelector';
import apiService from './services/api';
import type { Quiz, QuizStats } from './types';

function App() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiHealthy, setApiHealthy] = useState(false);

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await apiService.healthCheck();
      setApiHealthy(healthy);
    };
    checkHealth();
  }, []);

  // Fetch quizzes on mount
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const data = await apiService.getQuizzes();
        setQuizzes(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch quizzes:', err);
        setError('퀴즈 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (apiHealthy) {
      fetchQuizzes();
    }
  }, [apiHealthy]);

  // Fetch stats when quiz is selected
  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedQuizId) {
        setStats(null);
        return;
      }

      try {
        setLoading(true);
        const data = await apiService.getQuizStats(selectedQuizId);
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('통계를 불러오는데 실패했습니다.');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedQuizId]);

  const handleQuizSelect = (quizId: number) => {
    setSelectedQuizId(quizId);
  };

  return (
    <div className="app">
      <div className="main-content">
        <header className="app-header">
          <h1>Triple Light 통계 표시 시스템</h1>
          <p className="subtitle">Moodle LMS 통합 실시간 통계 시각화</p>
          {!apiHealthy && (
            <div className="api-warning">
              ⚠️ API 서버에 연결할 수 없습니다. 백엔드 서버를 시작해주세요.
            </div>
          )}
        </header>

        <QuizSelector
          quizzes={quizzes}
          selectedQuizId={selectedQuizId}
          onSelect={handleQuizSelect}
          loading={loading}
        />

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {stats && (
          <div className="stats-summary">
            <h2>{stats.quizName}</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">🔴 평균 (Mean)</span>
                <span className="summary-value">{stats.statistics.mean.toFixed(1)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">🟢 중앙값 (Median)</span>
                <span className="summary-value">{stats.statistics.median.toFixed(1)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">🔵 최빈값 (Mode)</span>
                <span className="summary-value">{stats.statistics.mode.toFixed(1)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">👥 응시자 수</span>
                <span className="summary-value">{stats.statistics.count}명</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <SmartphoneFrame>
        {stats ? (
          <>
            <TripleLight
              mean={stats.statistics.mean}
              median={stats.statistics.median}
              mode={stats.statistics.mode}
              meanBrightness={stats.statistics.normalized.mean}
              medianBrightness={stats.statistics.normalized.median}
              modeBrightness={stats.statistics.normalized.mode}
            />
            <StatsDisplay
              statistics={stats.statistics}
              quizName={stats.quizName}
              loading={loading}
            />
          </>
        ) : (
          <StatsDisplay
            statistics={null}
            quizName=""
            loading={loading}
          />
        )}
      </SmartphoneFrame>
    </div>
  );
}

export default App;
