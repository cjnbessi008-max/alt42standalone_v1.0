import React, { useState } from 'react';
import './FilterShrinkUI.css';
import apiService from '../services/apiService';

/**
 * Filter Shrink 메인 UI 컴포넌트
 */
function FilterShrinkUI({ session, onSessionUpdate, onReset }) {
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState(null);

  const handleFilterApply = async (filterKey, filterValue) => {
    setLoading(true);
    try {
      const result = await apiService.applyFilter(
        session.session_token,
        filterKey,
        filterValue
      );

      if (result.success) {
        // Update session state
        const updatedState = await apiService.getFilterState(session.session_token);
        onSessionUpdate({ ...session, ...updatedState.state });
      }
    } catch (err) {
      alert('필터 적용 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    setLoading(true);
    try {
      const result = await apiService.removeLastFilter(session.session_token);
      if (result.success) {
        const updatedState = await apiService.getFilterState(session.session_token);
        onSessionUpdate({ ...session, ...updatedState.state });
      }
    } catch (err) {
      alert('되돌리기 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProblems = async () => {
    setLoading(true);
    try {
      const result = await apiService.selectProblems(session.session_token, 5);
      if (result.success) {
        setSelectedProblems(result.selected_problems);
      }
    } catch (err) {
      alert('문제 선택 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const appliedFilters = session.applied_filters || [];
  const availableFilters = session.available_filters || [];
  const shrinkHistory = session.shrink_history || [];
  const currentCount = session.remaining_count || 0;

  if (selectedProblems) {
    return (
      <div className="filter-shrink-ui">
        <div className="header">
          <h1>선택된 문제</h1>
          <button onClick={onReset} className="reset-btn">새로 시작</button>
        </div>

        <div className="selected-problems">
          {selectedProblems.map((problem, index) => (
            <div key={problem.id} className="problem-card">
              <div className="problem-number">문제 {index + 1}</div>
              <h3>{problem.title}</h3>
              <div className="problem-text" dangerouslySetInnerHTML={{ __html: problem.question_text }} />
              <div className="problem-meta">
                <span className="badge">{problem.difficulty_level}</span>
                <span className="badge">{problem.question_type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="filter-shrink-ui">
      <div className="header">
        <h1>Filter Shrink</h1>
        <button onClick={() => setShowHistory(!showHistory)} className="history-toggle">
          {showHistory ? '필터 보기' : '히스토리 보기'}
        </button>
      </div>

      {!showHistory ? (
        <>
          {/* Progress Bar */}
          <div className="progress-section">
            <div className="count-display">
              <div className="count-number">{currentCount}</div>
              <div className="count-label">남은 문제 수</div>
            </div>

            {appliedFilters.length > 0 && (
              <div className="reduction-info">
                {shrinkHistory.length > 1 && (
                  <div className="reduction-arrow">
                    {shrinkHistory[shrinkHistory.length - 2].count} → {currentCount}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Applied Filters */}
          {appliedFilters.length > 0 && (
            <div className="applied-filters">
              <h3>적용된 필터</h3>
              <div className="filter-chips">
                {appliedFilters.map((filter, index) => (
                  <div key={index} className="filter-chip">
                    {filter.key}: {filter.value}
                  </div>
                ))}
                <button onClick={handleUndo} className="undo-btn" disabled={loading}>
                  ← 되돌리기
                </button>
              </div>
            </div>
          )}

          {/* Available Filters */}
          <div className="available-filters">
            <h3>필터 선택</h3>
            {availableFilters.length === 0 && (
              <p className="no-filters">모든 필터가 적용되었습니다!</p>
            )}

            {availableFilters.map((filter) => (
              <div key={filter.id} className="filter-group">
                <h4>{filter.filter_name}</h4>
                <div className="filter-options">
                  {filter.options && filter.options.map((option) => (
                    <button
                      key={option.option_value}
                      onClick={() => handleFilterApply(filter.filter_key, option.option_value)}
                      disabled={loading}
                      className="filter-option-btn"
                    >
                      <span className="option-label">{option.option_label}</span>
                      {option.problem_count !== undefined && (
                        <span className="option-count">{option.problem_count}개</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="actions">
            {currentCount > 0 && (
              <button onClick={handleSelectProblems} className="select-btn" disabled={loading}>
                문제 선택하기
              </button>
            )}
            <button onClick={onReset} className="reset-btn" disabled={loading}>
              처음부터 다시
            </button>
          </div>
        </>
      ) : (
        <ShrinkHistory history={shrinkHistory} />
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

/**
 * Shrink History Component
 */
function ShrinkHistory({ history }) {
  return (
    <div className="shrink-history">
      <h3>Filter Shrink 진행 과정</h3>
      <div className="history-timeline">
        {history.map((step, index) => (
          <div key={index} className="history-step">
            <div className="step-number">{step.step}</div>
            <div className="step-content">
              {step.filter ? (
                <>
                  <div className="step-filter">
                    {step.filter.key}: {step.filter.value}
                  </div>
                  <div className="step-count">{step.count}개 남음</div>
                </>
              ) : (
                <>
                  <div className="step-filter">초기 상태</div>
                  <div className="step-count">{step.count}개</div>
                </>
              )}
            </div>
            {index < history.length - 1 && (
              <div className="step-arrow">↓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FilterShrinkUI;
