import { useState, useEffect } from 'react';
import { Question, IntervalSummary } from '../../../shared/types';
import './VirtualPhone.css';

interface VirtualPhoneProps {
  question: Question | null;
}

function VirtualPhone({ question }: VirtualPhoneProps) {
  const [intervalSummary, setIntervalSummary] = useState<IntervalSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (question) {
      // Auto-extract intervals when question changes
      setLoading(true);
      fetch('/api/intervals/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          content: question.content
        })
      })
        .then(res => res.json())
        .then(response => {
          if (response.success) {
            setIntervalSummary(response.data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to extract intervals:', err);
          setLoading(false);
        });
    }
  }, [question]);

  return (
    <div className="virtual-phone">
      <div className="phone-frame">
        {/* Phone header */}
        <div className="phone-header">
          <div className="phone-notch">
            <div className="phone-camera"></div>
            <div className="phone-speaker"></div>
          </div>
          <div className="phone-status-bar">
            <span className="phone-time">9:41</span>
            <div className="phone-icons">
              <span>📶</span>
              <span>📱</span>
              <span>🔋</span>
            </div>
          </div>
        </div>

        {/* Phone screen content */}
        <div className="phone-screen">
          {!question ? (
            <div className="phone-empty">
              <p>문제를 선택해주세요</p>
            </div>
          ) : (
            <div className="phone-content">
              <div className="question-display">
                <h3 className="question-title">{question.title}</h3>
                <div className="question-meta">
                  <span className="difficulty">{question.difficulty}</span>
                  <span className="type">{question.type}</span>
                </div>
                <p className="question-text">{question.content}</p>
              </div>

              {/* Interval Summary Section */}
              <div className="interval-summary-section">
                <h4 className="summary-header">
                  📊 Interval Summary
                  {loading && <span className="loading-spinner"></span>}
                </h4>

                {intervalSummary && intervalSummary.intervals.length > 0 ? (
                  <div className="intervals-list">
                    {intervalSummary.intervals.map((interval, idx) => (
                      <div key={idx} className="interval-card">
                        <div className="interval-type-badge">
                          {interval.type.replace('_', ' ')}
                        </div>
                        <div className="interval-range">
                          <span className="range-value">
                            {interval.inclusive.start ? '[' : '('}
                            {interval.start}
                          </span>
                          <span className="range-separator">~</span>
                          <span className="range-value">
                            {interval.end}
                            {interval.inclusive.end ? ']' : ')'}
                          </span>
                          {interval.unit && (
                            <span className="range-unit">{interval.unit}</span>
                          )}
                        </div>
                        <div className="interval-context">
                          "{interval.context}"
                        </div>
                      </div>
                    ))}
                    <div className="confidence-meter">
                      <div className="confidence-label">신뢰도</div>
                      <div className="confidence-bar">
                        <div
                          className="confidence-fill"
                          style={{ width: `${intervalSummary.confidence * 100}%` }}
                        ></div>
                      </div>
                      <div className="confidence-value">
                        {Math.round(intervalSummary.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                ) : (
                  !loading && (
                    <div className="no-intervals">
                      범위 정보를 찾을 수 없습니다
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone home button */}
        <div className="phone-home-indicator"></div>
      </div>
    </div>
  );
}

export default VirtualPhone;
