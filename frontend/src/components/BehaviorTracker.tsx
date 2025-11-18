/**
 * BehaviorTracker Component
 *
 * This component wraps children and automatically tracks their behavior
 * for emotion detection. It's transparent and doesn't render any UI.
 */
import React, { ReactNode } from 'react';
import { useBehaviorTracker } from '../hooks/useBehaviorTracker';

interface BehaviorTrackerProps {
  studentId: string;
  sessionId: string;
  moduleId: string;
  enabled?: boolean;
  children: ReactNode;
}

export const BehaviorTracker: React.FC<BehaviorTrackerProps> = ({
  studentId,
  sessionId,
  moduleId,
  enabled = true,
  children,
}) => {
  useBehaviorTracker({
    studentId,
    sessionId,
    moduleId,
    enabled,
    trackClicks: true,
    trackKeypress: true,
    trackMouseMovement: true,
    trackScrolling: true,
  });

  return <>{children}</>;
};
