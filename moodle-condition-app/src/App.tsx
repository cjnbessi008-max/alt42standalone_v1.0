import { useState, useEffect } from 'react';
import { SmartphoneFrame } from './components/SmartphoneFrame';
import { QuestionList } from './components/QuestionList';
import type { MoodleQuestion } from './types/moodle';
import { getMoodleQuestions } from './services/moodleService';
import './App.css';

function App() {
  const [questions, setQuestions] = useState<MoodleQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<MoodleQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load questions from Moodle on mount
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMoodleQuestions();
      setQuestions(data);
    } catch (err) {
      setError('문제를 불러오는데 실패했습니다.');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = (question: MoodleQuestion) => {
    setSelectedQuestion(question);
    console.log('Selected question:', question);
    // 여기에 문제 상세 보기 로직 추가 가능
  };

  return (
    <div className="app-container">
      {/* Background */}
      <div className="app-background">
        <div className="background-gradient"></div>
        <div className="background-pattern"></div>
      </div>

      {/* Main Content */}
      <div className="app-content">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">
              <span className="title-icon">📚</span>
              Moodle LMS 문제 관리
            </h1>
            <p className="app-subtitle">Condition Color Bar로 문제 조건을 한눈에 파악하세요</p>
          </div>
        </header>

        <main className="app-main">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
              <button onClick={loadQuestions} className="retry-button">
                다시 시도
              </button>
            </div>
          )}

          {!error && (
            <div className="info-panel">
              <div className="info-card">
                <h3>💡 Condition Color Bar란?</h3>
                <p>각 문제의 난이도, 상태, 유형을 색상으로 시각화하여 직관적으로 파악할 수 있습니다.</p>
                <div className="legend">
                  <div className="legend-section">
                    <strong>난이도:</strong>
                    <span className="legend-item" style={{ background: '#4CAF50' }}>쉬움</span>
                    <span className="legend-item" style={{ background: '#FF9800' }}>보통</span>
                    <span className="legend-item" style={{ background: '#F44336' }}>어려움</span>
                  </div>
                  <div className="legend-section">
                    <strong>상태:</strong>
                    <span className="legend-item" style={{ background: '#9E9E9E' }}>미완료</span>
                    <span className="legend-item" style={{ background: '#2196F3' }}>진행중</span>
                    <span className="legend-item" style={{ background: '#4CAF50' }}>완료</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Smartphone Frame with Question List */}
      <SmartphoneFrame position="bottom-right">
        <QuestionList
          questions={questions}
          onQuestionClick={handleQuestionClick}
          loading={loading}
        />
      </SmartphoneFrame>

      {/* Selected Question Detail (optional overlay) */}
      {selectedQuestion && (
        <div className="question-detail-overlay" onClick={() => setSelectedQuestion(null)}>
          <div className="question-detail-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedQuestion(null)}>
              ✕
            </button>
            <h2>{selectedQuestion.name}</h2>
            <p className="detail-category">{selectedQuestion.category}</p>
            <div className="detail-question">{selectedQuestion.questionText}</div>
            <div className="detail-stats">
              <div>
                <strong>점수:</strong> {selectedQuestion.currentScore ?? 0} / {selectedQuestion.maxScore}
              </div>
              <div>
                <strong>시도:</strong> {selectedQuestion.attempts} / {selectedQuestion.maxAttempts}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
