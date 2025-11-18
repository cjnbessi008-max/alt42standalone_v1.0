import React, { useState } from 'react'
import './QuestionPanel.css'

/**
 * 문제 선택 패널 컴포넌트
 */
const QuestionPanel = ({ questions, currentQuestion, onSelectQuestion }) => {
  const [filter, setFilter] = useState('')

  const filteredQuestions = questions.filter(q =>
    q.name.toLowerCase().includes(filter.toLowerCase()) ||
    q.questiontext.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="question-panel">
      <div className="panel-header">
        <h2>문제 목록</h2>
        <div className="question-count">
          총 {filteredQuestions.length}개
        </div>
      </div>

      <div className="panel-search">
        <input
          type="text"
          placeholder="🔍 문제 검색..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="panel-content">
        {filteredQuestions.length === 0 ? (
          <div className="no-questions">
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          <ul className="question-list">
            {filteredQuestions.map((question) => (
              <li
                key={question.id}
                className={`question-item ${currentQuestion?.id === question.id ? 'active' : ''}`}
                onClick={() => onSelectQuestion(question.id)}
              >
                <div className="question-item-header">
                  <span className="question-category">
                    {question.category_name || 'General'}
                  </span>
                  <span className="question-mark">
                    {question.defaultmark || 0}점
                  </span>
                </div>

                <h3 className="question-title">{question.name}</h3>

                <p className="question-preview">
                  {question.questiontext.substring(0, 80)}
                  {question.questiontext.length > 80 ? '...' : ''}
                </p>

                <div className="question-meta">
                  <span className="question-type-badge">{question.qtype}</span>
                  <span className="question-date">
                    {new Date(question.timecreated * 1000).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default QuestionPanel
