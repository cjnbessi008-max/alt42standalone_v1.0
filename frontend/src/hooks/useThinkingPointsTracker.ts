/**
 * useThinkingPointsTracker Hook
 *
 * Tracks student interaction patterns and thinking points automatically
 * Records granular time-tracking data for learning analytics
 *
 * @example
 * ```tsx
 * const FractionProblem = () => {
 *   const tracker = useThinkingPointsTracker({
 *     problemId: problem.id,
 *     moduleId: module.id,
 *     sections: ['numerator', 'denominator', 'visualizer']
 *   });
 *
 *   return (
 *     <div>
 *       <input
 *         {...tracker.trackSection('numerator')}
 *         type="number"
 *       />
 *     </div>
 *   );
 * };
 * ```
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth'; // Assumes auth hook exists
import { thinkingPointsAPI } from '../api/thinkingPoints';

// ============================================================================
// TYPES
// ============================================================================

export type SectionType = 'problem_level' | 'step_level' | 'concept_level' | 'interaction_level';

export type ThinkingPattern = 'productive' | 'struggle' | 'confusion' | 'mastery';

export interface InteractionEvent {
  type: 'focus' | 'blur' | 'input' | 'click' | 'pause_start' | 'pause_end' | 'help' | 'hint';
  section: string;
  timestamp: number;
  data?: any;
}

export interface SectionMetrics {
  sectionIdentifier: string;
  sectionType: SectionType;
  timeSpentSeconds: number;
  activeTimeSeconds: number;
  passiveTimeSeconds: number;
  interactionCount: number;
  focusCount: number;
  blurCount: number;
  pauseCount: number;
  longestPauseSeconds: number;
  backtrackCount: number;
  helpRequestedCount: number;
  hintUsedCount: number;
  events: InteractionEvent[];
  firstInteractionAt: number | null;
  lastInteractionAt: number | null;
}

export interface ThinkingPointsTrackerConfig {
  problemId: string;
  moduleId: string;
  sections: string[]; // Section identifiers to track
  autoSubmit?: boolean; // Auto-submit data on unmount (default: true)
  submitInterval?: number; // Auto-submit interval in ms (default: 30000 = 30s)
  pauseThreshold?: number; // Seconds of inactivity to consider a pause (default: 5)
}

export interface ThinkingPointsTracker {
  trackSection: (sectionId: string) => SectionTrackingProps;
  recordEvent: (event: Omit<InteractionEvent, 'timestamp'>) => void;
  recordHelp: (sectionId: string) => void;
  recordHint: (sectionId: string) => void;
  recordBacktrack: (fromSection: string, toSection: string) => void;
  submitData: () => Promise<void>;
  getMetrics: (sectionId?: string) => SectionMetrics | SectionMetrics[];
  resetTracking: () => void;
}

export interface SectionTrackingProps {
  'data-thinking-section': string;
  onFocus: (e: React.FocusEvent) => void;
  onBlur: (e: React.FocusEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onInput: (e: React.FormEvent) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useThinkingPointsTracker = (
  config: ThinkingPointsTrackerConfig
): ThinkingPointsTracker => {
  const { user } = useAuth();
  const {
    problemId,
    moduleId,
    sections,
    autoSubmit = true,
    submitInterval = 30000,
    pauseThreshold = 5
  } = config;

  // State
  const [metrics, setMetrics] = useState<Map<string, SectionMetrics>>(new Map());
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [lastSection, setLastSection] = useState<string | null>(null);

  // Refs for timing
  const sectionStartTime = useRef<number>(0);
  const lastActivityTime = useRef<number>(Date.now());
  const pauseStartTime = useRef<number | null>(null);
  const problemStartTime = useRef<number>(Date.now());
  const submitIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    // Initialize metrics for all sections
    const initialMetrics = new Map<string, SectionMetrics>();

    // Add problem-level tracking
    initialMetrics.set('__problem_overall__', createEmptyMetrics('__problem_overall__', 'problem_level'));

    // Add section-level tracking
    sections.forEach(section => {
      initialMetrics.set(section, createEmptyMetrics(section, 'concept_level'));
    });

    setMetrics(initialMetrics);

    // Set up auto-submit interval
    if (autoSubmit && submitInterval > 0) {
      submitIntervalRef.current = setInterval(() => {
        submitDataInternal();
      }, submitInterval);
    }

    // Track overall problem time
    problemStartTime.current = Date.now();

    // Cleanup
    return () => {
      if (submitIntervalRef.current) {
        clearInterval(submitIntervalRef.current);
      }
      if (autoSubmit) {
        submitDataInternal();
      }
    };
  }, [problemId, moduleId, sections.join(',')]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const createEmptyMetrics = (sectionId: string, type: SectionType): SectionMetrics => ({
    sectionIdentifier: sectionId,
    sectionType: type,
    timeSpentSeconds: 0,
    activeTimeSeconds: 0,
    passiveTimeSeconds: 0,
    interactionCount: 0,
    focusCount: 0,
    blurCount: 0,
    pauseCount: 0,
    longestPauseSeconds: 0,
    backtrackCount: 0,
    helpRequestedCount: 0,
    hintUsedCount: 0,
    events: [],
    firstInteractionAt: null,
    lastInteractionAt: null
  });

  const updateMetrics = useCallback((
    sectionId: string,
    updater: (metrics: SectionMetrics) => Partial<SectionMetrics>
  ) => {
    setMetrics(prev => {
      const newMetrics = new Map(prev);
      const current = newMetrics.get(sectionId) || createEmptyMetrics(sectionId, 'interaction_level');
      const updates = updater(current);

      newMetrics.set(sectionId, {
        ...current,
        ...updates,
        lastInteractionAt: Date.now()
      });

      return newMetrics;
    });
  }, []);

  const recordEventInternal = useCallback((event: InteractionEvent) => {
    updateMetrics(event.section, (m) => ({
      events: [...m.events, event],
      interactionCount: m.interactionCount + 1
    }));

    // Also record at problem level
    updateMetrics('__problem_overall__', (m) => ({
      events: [...m.events, event],
      interactionCount: m.interactionCount + 1
    }));

    lastActivityTime.current = Date.now();
  }, [updateMetrics]);

  const checkForPause = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = (now - lastActivityTime.current) / 1000;

    if (timeSinceActivity >= pauseThreshold && pauseStartTime.current === null) {
      // Pause started
      pauseStartTime.current = lastActivityTime.current;
      if (currentSection) {
        recordEventInternal({
          type: 'pause_start',
          section: currentSection,
          timestamp: lastActivityTime.current
        });
      }
    }
  }, [currentSection, pauseThreshold, recordEventInternal]);

  const endPause = useCallback((sectionId: string) => {
    if (pauseStartTime.current !== null) {
      const now = Date.now();
      const pauseDuration = (now - pauseStartTime.current) / 1000;

      updateMetrics(sectionId, (m) => ({
        pauseCount: m.pauseCount + 1,
        longestPauseSeconds: Math.max(m.longestPauseSeconds, pauseDuration),
        passiveTimeSeconds: m.passiveTimeSeconds + pauseDuration
      }));

      recordEventInternal({
        type: 'pause_end',
        section: sectionId,
        timestamp: now,
        data: { duration: pauseDuration }
      });

      pauseStartTime.current = null;
    }
  }, [updateMetrics, recordEventInternal]);

  // ============================================================================
  // TRACKING FUNCTIONS
  // ============================================================================

  const handleFocus = useCallback((sectionId: string) => {
    checkForPause();
    endPause(sectionId);

    const now = Date.now();
    sectionStartTime.current = now;
    lastActivityTime.current = now;

    // Track section switch for backtracking
    if (lastSection && lastSection !== sectionId) {
      const sectionOrder = sections.indexOf(sectionId);
      const lastSectionOrder = sections.indexOf(lastSection);

      if (sectionOrder < lastSectionOrder) {
        // User went back to a previous section
        updateMetrics(sectionId, (m) => ({
          backtrackCount: m.backtrackCount + 1
        }));
      }
    }

    setLastSection(currentSection);
    setCurrentSection(sectionId);

    updateMetrics(sectionId, (m) => ({
      focusCount: m.focusCount + 1,
      firstInteractionAt: m.firstInteractionAt || now
    }));

    recordEventInternal({
      type: 'focus',
      section: sectionId,
      timestamp: now
    });
  }, [currentSection, lastSection, sections, checkForPause, endPause, updateMetrics, recordEventInternal]);

  const handleBlur = useCallback((sectionId: string) => {
    const now = Date.now();
    const timeSpent = (now - sectionStartTime.current) / 1000;

    updateMetrics(sectionId, (m) => ({
      blurCount: m.blurCount + 1,
      timeSpentSeconds: m.timeSpentSeconds + timeSpent,
      activeTimeSeconds: m.activeTimeSeconds + timeSpent
    }));

    recordEventInternal({
      type: 'blur',
      section: sectionId,
      timestamp: now,
      data: { duration: timeSpent }
    });

    lastActivityTime.current = now;
  }, [updateMetrics, recordEventInternal]);

  const handleClick = useCallback((sectionId: string, event: React.MouseEvent) => {
    endPause(sectionId);
    lastActivityTime.current = Date.now();

    recordEventInternal({
      type: 'click',
      section: sectionId,
      timestamp: Date.now(),
      data: {
        x: event.clientX,
        y: event.clientY,
        target: (event.target as HTMLElement).tagName
      }
    });
  }, [endPause, recordEventInternal]);

  const handleInput = useCallback((sectionId: string) => {
    endPause(sectionId);
    lastActivityTime.current = Date.now();

    recordEventInternal({
      type: 'input',
      section: sectionId,
      timestamp: Date.now()
    });
  }, [endPause, recordEventInternal]);

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  const trackSection = useCallback((sectionId: string): SectionTrackingProps => {
    return {
      'data-thinking-section': sectionId,
      onFocus: () => handleFocus(sectionId),
      onBlur: () => handleBlur(sectionId),
      onClick: (e) => handleClick(sectionId, e),
      onInput: () => handleInput(sectionId)
    };
  }, [handleFocus, handleBlur, handleClick, handleInput]);

  const recordEvent = useCallback((event: Omit<InteractionEvent, 'timestamp'>) => {
    recordEventInternal({
      ...event,
      timestamp: Date.now()
    });
  }, [recordEventInternal]);

  const recordHelp = useCallback((sectionId: string) => {
    updateMetrics(sectionId, (m) => ({
      helpRequestedCount: m.helpRequestedCount + 1
    }));

    recordEventInternal({
      type: 'help',
      section: sectionId,
      timestamp: Date.now()
    });
  }, [updateMetrics, recordEventInternal]);

  const recordHint = useCallback((sectionId: string) => {
    updateMetrics(sectionId, (m) => ({
      hintUsedCount: m.hintUsedCount + 1
    }));

    recordEventInternal({
      type: 'hint',
      section: sectionId,
      timestamp: Date.now()
    });
  }, [updateMetrics, recordEventInternal]);

  const recordBacktrack = useCallback((fromSection: string, toSection: string) => {
    updateMetrics(toSection, (m) => ({
      backtrackCount: m.backtrackCount + 1
    }));
  }, [updateMetrics]);

  const submitDataInternal = async () => {
    if (!user?.id) return;

    const thinkingPoints = Array.from(metrics.values()).map(m => ({
      studentId: user.id,
      problemId,
      moduleId,
      sectionIdentifier: m.sectionIdentifier,
      sectionType: m.sectionType,
      timeSpentSeconds: m.timeSpentSeconds,
      activeTimeSeconds: m.activeTimeSeconds,
      passiveTimeSeconds: m.passiveTimeSeconds,
      interactionCount: m.interactionCount,
      focusCount: m.focusCount,
      blurCount: m.blurCount,
      pauseCount: m.pauseCount,
      longestPauseSeconds: m.longestPauseSeconds,
      backtrackCount: m.backtrackCount,
      helpRequestedCount: m.helpRequestedCount,
      hintUsedCount: m.hintUsedCount,
      events: m.events,
      firstInteractionAt: m.firstInteractionAt ? new Date(m.firstInteractionAt) : null,
      lastInteractionAt: m.lastInteractionAt ? new Date(m.lastInteractionAt) : null
    }));

    try {
      await thinkingPointsAPI.submit(moduleId, thinkingPoints);
    } catch (error) {
      console.error('Failed to submit thinking points:', error);
    }
  };

  const submitData = useCallback(async () => {
    await submitDataInternal();
  }, [user?.id, problemId, moduleId, metrics]);

  const getMetrics = useCallback((sectionId?: string) => {
    if (sectionId) {
      return metrics.get(sectionId) || createEmptyMetrics(sectionId, 'interaction_level');
    }
    return Array.from(metrics.values());
  }, [metrics]);

  const resetTracking = useCallback(() => {
    const freshMetrics = new Map<string, SectionMetrics>();
    freshMetrics.set('__problem_overall__', createEmptyMetrics('__problem_overall__', 'problem_level'));
    sections.forEach(section => {
      freshMetrics.set(section, createEmptyMetrics(section, 'concept_level'));
    });
    setMetrics(freshMetrics);
    setCurrentSection(null);
    setLastSection(null);
    problemStartTime.current = Date.now();
    lastActivityTime.current = Date.now();
    pauseStartTime.current = null;
  }, [sections]);

  // Periodic pause check
  useEffect(() => {
    const pauseCheckInterval = setInterval(checkForPause, 1000);
    return () => clearInterval(pauseCheckInterval);
  }, [checkForPause]);

  return {
    trackSection,
    recordEvent,
    recordHelp,
    recordHint,
    recordBacktrack,
    submitData,
    getMetrics,
    resetTracking
  };
};
