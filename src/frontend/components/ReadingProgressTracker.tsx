/**
 * ReadingProgressTracker Component
 *
 * Tracks student reading behavior in real-time and sends analytics to backend
 *
 * Features:
 * - Tracks time spent reading
 * - Calculates reading speed (WPM)
 * - Detects re-reading behavior
 * - Monitors active vs inactive time
 * - Sends data to backend API
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, LinearProgress, Typography, Alert } from '@mui/material';
import axios from 'axios';

interface ReadingProgressTrackerProps {
  studentId: string;
  problemId: string;
  moduleId: string;
  problemText: string;
  gradeLevel: number;
  onReadingComplete?: (data: ReadingAnalyticsData) => void;
  showRealTimeFeedback?: boolean;
}

interface ReadingAnalyticsData {
  student_id: string;
  problem_id: string;
  module_id: string;
  reading_start_time: string;
  reading_end_time: string;
  reading_time_seconds: number;
  active_reading_time_seconds: number;
  problem_word_count: number;
  reading_speed_wpm: number;
  re_reading_count: number;
  device_type: 'desktop' | 'mobile' | 'tablet';
  language: string;
  grade_level: number;
}

export const ReadingProgressTracker: React.FC<ReadingProgressTrackerProps> = ({
  studentId,
  problemId,
  moduleId,
  problemText,
  gradeLevel,
  onReadingComplete,
  showRealTimeFeedback = false,
}) => {
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [activeTime, setActiveTime] = useState<number>(0);
  const [reReadingCount, setReReadingCount] = useState<number>(0);
  const [readingSpeed, setReadingSpeed] = useState<number>(0);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const problemRef = useRef<HTMLDivElement>(null);
  const lastScrollPosition = useRef<number>(0);
  const isActiveRef = useRef<boolean>(true);
  const activeTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Count words in problem text
  const wordCount = useCallback(() => {
    // Handle Korean and English text
    const koreanWords = problemText.match(/[\u3131-\uD79D]+/g)?.length || 0;
    const englishWords = problemText.match(/[a-zA-Z]+/g)?.length || 0;
    return koreanWords + englishWords;
  }, [problemText]);

  // Detect device type
  const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  // Start tracking when component mounts
  useEffect(() => {
    const startTime = new Date();
    setReadingStartTime(startTime);
    setIsReading(true);

    // Track active time
    activeTimeIntervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        setActiveTime(prev => prev + 1);
      }
    }, 1000);

    return () => {
      if (activeTimeIntervalRef.current) {
        clearInterval(activeTimeIntervalRef.current);
      }
    };
  }, []);

  // Track elapsed time
  useEffect(() => {
    if (!isReading) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isReading]);

  // Calculate reading speed
  useEffect(() => {
    if (elapsedTime > 0) {
      const words = wordCount();
      const minutes = elapsedTime / 60;
      const wpm = words / minutes;
      setReadingSpeed(Math.round(wpm));
    }
  }, [elapsedTime, wordCount]);

  // Track scroll behavior (re-reading detection)
  useEffect(() => {
    const handleScroll = () => {
      if (!problemRef.current) return;

      const currentScroll = problemRef.current.scrollTop;

      // If scrolling up significantly, count as re-reading
      if (currentScroll < lastScrollPosition.current - 50) {
        setReReadingCount(prev => prev + 1);
      }

      lastScrollPosition.current = currentScroll;
    };

    const element = problemRef.current;
    element?.addEventListener('scroll', handleScroll);

    return () => {
      element?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Track focus/blur (active vs inactive time)
  useEffect(() => {
    const handleFocus = () => {
      isActiveRef.current = true;
    };

    const handleBlur = () => {
      isActiveRef.current = false;
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Real-time feedback based on reading speed
  useEffect(() => {
    if (!showRealTimeFeedback || elapsedTime < 10) return;

    const baselineWpm = gradeLevel <= 4 ? 100 : gradeLevel <= 6 ? 130 : 160;

    if (readingSpeed > baselineWpm * 2) {
      setFeedbackMessage('너무 빠르게 읽고 있어요. 천천히 읽어보세요.');
    } else if (readingSpeed < baselineWpm * 0.5 && readingSpeed > 0) {
      setFeedbackMessage('천천히 읽고 있네요. 어려운 부분이 있나요?');
    } else if (readingSpeed >= baselineWpm * 0.8 && readingSpeed <= baselineWpm * 1.2) {
      setFeedbackMessage('좋은 속도로 읽고 있어요!');
    } else {
      setFeedbackMessage('');
    }
  }, [readingSpeed, gradeLevel, elapsedTime, showRealTimeFeedback]);

  // Send analytics to backend
  const sendAnalytics = async (attemptData?: {
    first_attempt_correct: boolean;
    total_attempts: number;
    final_answer_correct: boolean;
    time_to_first_attempt: number;
  }) => {
    if (!readingStartTime) return;

    const endTime = new Date();
    const analyticsData: ReadingAnalyticsData = {
      student_id: studentId,
      problem_id: problemId,
      module_id: moduleId,
      reading_start_time: readingStartTime.toISOString(),
      reading_end_time: endTime.toISOString(),
      reading_time_seconds: elapsedTime,
      active_reading_time_seconds: activeTime,
      problem_word_count: wordCount(),
      reading_speed_wpm: readingSpeed,
      re_reading_count: reReadingCount,
      device_type: getDeviceType(),
      language: /[\u3131-\uD79D]/.test(problemText) ? 'ko' : 'en',
      grade_level: gradeLevel,
      ...attemptData,
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/reading-analytics`,
        analyticsData
      );

      console.log('Reading analytics sent:', response.data);

      if (onReadingComplete) {
        onReadingComplete(analyticsData);
      }

      // Check if intervention is needed
      if (response.data.intervention_flag === 'immediate') {
        alert('선생님께 도움을 요청하는 것이 좋겠어요.');
      }
    } catch (error) {
      console.error('Failed to send reading analytics:', error);
    }
  };

  // Public method to record answer attempt
  const recordAttempt = useCallback((
    isCorrect: boolean,
    attemptNumber: number,
    isFinal: boolean
  ) => {
    sendAnalytics({
      first_attempt_correct: attemptNumber === 1 && isCorrect,
      total_attempts: attemptNumber,
      final_answer_correct: isFinal && isCorrect,
      time_to_first_attempt: attemptNumber === 1 ? elapsedTime : 0,
    });

    if (isFinal) {
      setIsReading(false);
    }
  }, [elapsedTime]);

  // Expose method to parent component
  useEffect(() => {
    // Store reference for parent to call
    (window as any).recordReadingAttempt = recordAttempt;
  }, [recordAttempt]);

  return (
    <Box sx={{ mb: 2 }}>
      {/* Reading content */}
      <Box
        ref={problemRef}
        sx={{
          p: 2,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          maxHeight: '400px',
          overflowY: 'auto',
          mb: 2,
        }}
      >
        <Typography variant="body1">{problemText}</Typography>
      </Box>

      {/* Reading progress indicator */}
      {showRealTimeFeedback && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              읽기 시간: {Math.floor(elapsedTime / 60)}분 {elapsedTime % 60}초
            </Typography>
            <Typography variant="caption" color="text.secondary">
              읽기 속도: {readingSpeed} WPM
            </Typography>
          </Box>

          {feedbackMessage && (
            <Alert severity="info" sx={{ mt: 1 }}>
              {feedbackMessage}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ReadingProgressTracker;
