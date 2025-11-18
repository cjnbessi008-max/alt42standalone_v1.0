import { useState, useEffect } from 'react';
import VirtualPhone from './components/VirtualPhone';
import QuestionSelector from './components/QuestionSelector';
import { Question } from '../../shared/types';
import './App.css';

function App() {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch questions from backend
    fetch('/api/questions')
      .then(res => res.json())
      .then(response => {
        if (response.success) {
          setQuestions(response.data);
          if (response.data.length > 0) {
            setSelectedQuestion(response.data[0]);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch questions:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="app">
      <div className="main-content">
        <header className="app-header">
          <h1>Alt42 - AI Education System</h1>
          <p>문제를 선택하면 자동으로 범위 구조를 요약합니다</p>
        </header>

        <QuestionSelector
          questions={questions}
          selectedQuestion={selectedQuestion}
          onSelectQuestion={setSelectedQuestion}
          loading={loading}
        />
      </div>

      {/* Virtual Phone - Fixed at bottom right */}
      <VirtualPhone question={selectedQuestion} />
    </div>
  );
}

export default App;
