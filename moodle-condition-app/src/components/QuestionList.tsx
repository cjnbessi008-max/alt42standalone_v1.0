import React, { useState, useEffect } from 'react';
import type { MoodleQuestion } from '../types/moodle';
import { QuestionCard } from './QuestionCard';
import './QuestionList.css';

export interface QuestionListProps {
  questions: MoodleQuestion[];
  onQuestionClick?: (question: MoodleQuestion) => void;
  loading?: boolean;
}

/**
 * QuestionList Component
 * Moodle 문제 목록을 표시
 */
export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onQuestionClick,
  loading = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [filteredQuestions, setFilteredQuestions] = useState<MoodleQuestion[]>(questions);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredQuestions(questions);
    } else {
      setFilteredQuestions(questions.filter((q) => q.status === filter));
    }
  }, [filter, questions]);

  if (loading) {
    return (
      <div className="question-list-loading">
        <div className="loading-spinner"></div>
        <p>문제를 불러오는 중...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="question-list-empty">
        <p>📚</p>
        <p>표시할 문제가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="question-list-container">
      <div className="question-list-header">
        <h2 className="list-title">문제 목록</h2>
        <span className="question-count">{filteredQuestions.length}개</span>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          전체 ({questions.length})
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          완료 ({questions.filter((q) => q.status === 'completed').length})
        </button>
        <button
          className={`filter-tab ${filter === 'in_progress' ? 'active' : ''}`}
          onClick={() => setFilter('in_progress')}
        >
          진행중 ({questions.filter((q) => q.status === 'in_progress').length})
        </button>
        <button
          className={`filter-tab ${filter === 'not_started' ? 'active' : ''}`}
          onClick={() => setFilter('not_started')}
        >
          미완료 ({questions.filter((q) => q.status === 'not_started').length})
        </button>
      </div>

      {/* Question Cards */}
      <div className="question-list">
        {filteredQuestions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            onClick={onQuestionClick}
          />
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="no-results">
          <p>해당 조건의 문제가 없습니다.</p>
        </div>
      )}
    </div>
  );
};
