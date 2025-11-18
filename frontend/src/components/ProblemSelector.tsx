import { useState, useEffect } from 'react';
import type { ProblemData } from '../types';
import { fetchProblems } from '../services/moodleApi';
import './ProblemSelector.css';

interface ProblemSelectorProps {
  onSelectProblem: (problem: ProblemData) => void;
}

/**
 * 문제 선택 컴포넌트
 * Moodle에서 가져온 문제 목록을 표시하고 선택
 */
export default function ProblemSelector({ onSelectProblem }: ProblemSelectorProps) {
  const [problems, setProblems] = useState<ProblemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const data = await fetchProblems();
      setProblems(data);
      if (data.length > 0) {
        // 첫 번째 문제를 기본 선택
        setSelectedId(data[0].id);
        onSelectProblem(data[0]);
      }
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProblem = (problem: ProblemData) => {
    setSelectedId(problem.id);
    onSelectProblem(problem);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#27ae60';
      case 'medium':
        return '#f39c12';
      case 'hard':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
      default:
        return difficulty;
    }
  };

  if (loading) {
    return (
      <div className="problem-selector loading">
        <div className="loading-spinner">⏳</div>
        <p>문제를 불러오는 중...</p>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="problem-selector empty">
        <p>😕 문제가 없습니다</p>
        <button onClick={loadProblems} className="reload-btn">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="problem-selector">
      <div className="selector-header">
        <h3>문제 선택</h3>
        <button onClick={loadProblems} className="refresh-btn" title="새로고침">
          🔄
        </button>
      </div>

      <div className="problem-list">
        {problems.map((problem) => (
          <div
            key={problem.id}
            className={`problem-item ${selectedId === problem.id ? 'selected' : ''}`}
            onClick={() => handleSelectProblem(problem)}
          >
            <div className="problem-header">
              <span className="problem-number">#{problem.id}</span>
              <span
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
              >
                {getDifficultyLabel(problem.difficulty)}
              </span>
            </div>
            <div className="problem-question">{problem.question}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
