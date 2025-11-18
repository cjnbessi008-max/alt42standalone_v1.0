/**
 * ProblemWithCalmingMessage Component
 * Wrapper component that integrates calming message with problem display
 * This demonstrates how to integrate the calming message feature
 */

import React, { useState, useEffect } from 'react';
import { CalmingMessageOverlay } from './CalmingMessageOverlay';
import { useCalmingMessage } from '../../hooks/useCalmingMessage';

interface ProblemWithCalmingMessageProps {
  moduleId: string;
  problemId: string;
  studentId: string;
  children: React.ReactNode;
}

export const ProblemWithCalmingMessage: React.FC<ProblemWithCalmingMessageProps> = ({
  moduleId,
  problemId,
  studentId,
  children
}) => {
  const [showCalming, setShowCalming] = useState(true);
  const [hasShownCalming, setHasShownCalming] = useState(false);

  const {
    config,
    problemMetadata,
    loading,
    shouldShowCalmingMessage
  } = useCalmingMessage({
    moduleId,
    problemId
  });

  // Check localStorage to prevent showing the same message multiple times
  useEffect(() => {
    const key = `calming_shown_${moduleId}_${problemId}`;
    const lastShown = localStorage.getItem(key);
    const now = Date.now();
    const THROTTLE_TIME = 30000; // 30 seconds

    if (lastShown && now - parseInt(lastShown) < THROTTLE_TIME) {
      setShowCalming(false);
      setHasShownCalming(true);
    }
  }, [moduleId, problemId]);

  const handleCalmingComplete = () => {
    // Save to localStorage to prevent spam
    const key = `calming_shown_${moduleId}_${problemId}`;
    localStorage.setItem(key, Date.now().toString());

    setShowCalming(false);
    setHasShownCalming(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>문제를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <>
      {/* Show calming message if conditions are met */}
      {shouldShowCalmingMessage && showCalming && !hasShownCalming && config && problemMetadata && (
        <CalmingMessageOverlay
          problemId={problemId}
          studentId={studentId}
          moduleId={moduleId}
          difficultyLevel={problemMetadata.difficulty_level}
          onComplete={handleCalmingComplete}
          config={config}
        />
      )}

      {/* Render the actual problem content */}
      {children}
    </>
  );
};
