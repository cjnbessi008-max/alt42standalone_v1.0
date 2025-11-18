/**
 * FocusCard Component
 *
 * Displays a "focus card" before complex problems to help students
 * mentally prepare and approach the problem systematically.
 *
 * Based on PRD FR-2.2 complexity assessment thresholds
 */

import React, { useState, useEffect } from 'react';
import { FocusCardProps, ComplexityLevel } from '../../types/complexity';
import './FocusCard.css';

const FocusCard: React.FC<FocusCardProps> = ({
  assessment,
  onContinue,
  onRequestHelp,
  language = 'ko',
}) => {
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [countdown, setCountdown] = useState(5);
  const [showContent, setShowContent] = useState(false);

  // Breathing animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathingPhase((prev) => (prev === 'inhale' ? 'exhale' : 'inhale'));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowContent(true);
    }
  }, [countdown]);

  const getComplexityColor = (level: ComplexityLevel): string => {
    switch (level) {
      case ComplexityLevel.VERY_COMPLEX:
        return '#d32f2f'; // Red
      case ComplexityLevel.COMPLEX:
        return '#f57c00'; // Orange
      case ComplexityLevel.MODERATE:
        return '#fbc02d'; // Yellow
      default:
        return '#388e3c'; // Green
    }
  };

  const getComplexityIcon = (level: ComplexityLevel): string => {
    switch (level) {
      case ComplexityLevel.VERY_COMPLEX:
        return '🧠';
      case ComplexityLevel.COMPLEX:
        return '🎯';
      case ComplexityLevel.MODERATE:
        return '📚';
      default:
        return '✅';
    }
  };

  const translations = {
    ko: {
      title: '문제 시작 전 준비',
      breatheIn: '숨을 들이마시세요...',
      breatheOut: '천천히 내쉬세요...',
      complexity: '문제 복잡도',
      metrics: '세부 지표',
      conditions: '조건 수',
      nesting: '중첩 깊이',
      entities: '관련 개념',
      cyclical: '순환 관계',
      yes: '있음',
      no: '없음',
      recommendations: '추천 학습 전략',
      continue: '문제 풀러 가기',
      help: '도움 요청',
      ready: '준비 완료! 집중해서 풀어봅시다.',
    },
    en: {
      title: 'Prepare Before Problem',
      breatheIn: 'Breathe in...',
      breatheOut: 'Breathe out...',
      complexity: 'Problem Complexity',
      metrics: 'Metrics',
      conditions: 'Conditions',
      nesting: 'Nesting Depth',
      entities: 'Entities',
      cyclical: 'Cyclical',
      yes: 'Yes',
      no: 'No',
      recommendations: 'Recommended Strategies',
      continue: 'Start Problem',
      help: 'Request Help',
      ready: 'Ready! Let\'s focus and solve it.',
    },
  };

  const t = translations[language];

  return (
    <div className="focus-card-overlay" role="dialog" aria-labelledby="focus-card-title">
      <div className="focus-card" style={{ borderColor: getComplexityColor(assessment.level) }}>
        {/* Header */}
        <div className="focus-card-header">
          <h2 id="focus-card-title" className="focus-card-title">
            {getComplexityIcon(assessment.level)} {t.title}
          </h2>
        </div>

        {/* Breathing Exercise (first 5 seconds) */}
        {!showContent && (
          <div className="breathing-section">
            <div className={`breathing-circle ${breathingPhase}`}>
              <div className="breathing-text">
                {breathingPhase === 'inhale' ? t.breatheIn : t.breatheOut}
              </div>
            </div>
            <div className="countdown">{countdown}</div>
          </div>
        )}

        {/* Main Content (after breathing) */}
        {showContent && (
          <>
            {/* Focus Message */}
            {assessment.focus_message && (
              <div className="focus-message">
                <p>{assessment.focus_message}</p>
              </div>
            )}

            {/* Complexity Level */}
            <div className="complexity-section">
              <h3 className="section-title">{t.complexity}</h3>
              <div
                className="complexity-badge"
                style={{ backgroundColor: getComplexityColor(assessment.level) }}
              >
                {assessment.level.toUpperCase().replace('_', ' ')}
              </div>
            </div>

            {/* Metrics */}
            <div className="metrics-section">
              <h3 className="section-title">{t.metrics}</h3>
              <div className="metrics-grid">
                <div className="metric-item">
                  <span className="metric-label">{t.conditions}:</span>
                  <span className="metric-value">{assessment.metrics.condition_count}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">{t.nesting}:</span>
                  <span className="metric-value">{assessment.metrics.nesting_depth}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">{t.entities}:</span>
                  <span className="metric-value">{assessment.metrics.entity_count}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">{t.cyclical}:</span>
                  <span className="metric-value">
                    {assessment.metrics.has_cyclical_dependencies ? t.yes : t.no}
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {assessment.recommendations.length > 0 && (
              <div className="recommendations-section">
                <h3 className="section-title">{t.recommendations}</h3>
                <ul className="recommendations-list">
                  {assessment.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ready Message */}
            <div className="ready-message">
              <p>✨ {t.ready}</p>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                className="btn-primary"
                onClick={onContinue}
                aria-label={t.continue}
              >
                {t.continue}
              </button>
              {onRequestHelp && (
                <button
                  className="btn-secondary"
                  onClick={onRequestHelp}
                  aria-label={t.help}
                >
                  {t.help}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FocusCard;
