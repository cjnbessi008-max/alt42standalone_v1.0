/**
 * Focus Timer Component
 * Displays focus session duration
 */

import React, { useEffect, useState } from 'react';
import type { FocusMetrics } from '../types/focus-mode.types';

interface FocusTimerProps {
  focusMetrics: FocusMetrics;
  className?: string;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  focusMetrics,
  className = '',
}) => {
  const { state, focusDuration } = focusMetrics;
  const [displayTime, setDisplayTime] = useState(focusDuration);

  // Update display time every second when in focus mode
  useEffect(() => {
    if (state !== 'focused') {
      setDisplayTime(0);
      return;
    }

    setDisplayTime(focusDuration);

    const interval = setInterval(() => {
      setDisplayTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [state, focusDuration]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getEncouragementMessage = (seconds: number): string => {
    if (seconds < 60) return '집중 시작!';
    if (seconds < 300) return '좋아요! 계속 집중하세요';
    if (seconds < 600) return '훌륭해요! 5분 달성';
    if (seconds < 1200) return '대단해요! 10분 돌파';
    if (seconds < 1800) return '놀라워요! 20분 집중';
    if (seconds < 3600) return '최고에요! 30분 이상';
    return '전설이에요! 1시간 달성';
  };

  if (state !== 'focused') {
    return null;
  }

  return (
    <div
      className={`focus-timer ${className}`}
      style={{
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: '#10b98115',
        border: '2px solid #10b981',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
      }}
    >
      {/* Timer icon */}
      <div style={{ fontSize: '40px', marginBottom: '8px' }}>
        ⏱️
      </div>

      {/* Time display */}
      <div
        style={{
          fontSize: '48px',
          fontWeight: 700,
          color: '#10b981',
          letterSpacing: '0.05em',
          fontFamily: 'monospace',
          marginBottom: '8px',
        }}
      >
        {formatTime(displayTime)}
      </div>

      {/* Encouragement message */}
      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#059669',
          marginBottom: '12px',
        }}
      >
        {getEncouragementMessage(displayTime)}
      </div>

      {/* Progress milestones */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '16px',
        }}
      >
        <Milestone label="5분" seconds={300} current={displayTime} />
        <Milestone label="10분" seconds={600} current={displayTime} />
        <Milestone label="20분" seconds={1200} current={displayTime} />
        <Milestone label="30분" seconds={1800} current={displayTime} />
      </div>

      {/* Subtle pulsing effect */}
      <style>{`
        .focus-timer {
          animation: gentle-pulse 3s ease-in-out infinite;
        }
        @keyframes gentle-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
};

interface MilestoneProps {
  label: string;
  seconds: number;
  current: number;
}

const Milestone: React.FC<MilestoneProps> = ({ label, seconds, current }) => {
  const achieved = current >= seconds;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: achieved ? '#10b981' : '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          transition: 'all 0.3s ease',
        }}
      >
        {achieved ? '✓' : '○'}
      </div>
      <div
        style={{
          fontSize: '10px',
          color: achieved ? '#10b981' : '#9ca3af',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  );
};
