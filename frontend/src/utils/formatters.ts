import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Format a date/time string to a readable format
 */
export const formatDateTime = (dateString: string): string => {
  return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss', { locale: ko });
};

/**
 * Format a date string to just the date
 */
export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'yyyy-MM-dd', { locale: ko });
};

/**
 * Format a date string to time only
 */
export const formatTime = (dateString: string): string => {
  return format(new Date(dateString), 'HH:mm:ss', { locale: ko });
};

/**
 * Format a date string to relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko });
};

/**
 * Format seconds to a readable duration
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}초`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}분 ${remainingSeconds}초`
      : `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours}시간 ${remainingMinutes}분`
    : `${hours}시간`;
};

/**
 * Format a percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Get event type display name in Korean
 */
export const getEventTypeName = (eventType: string): string => {
  const eventTypeMap: Record<string, string> = {
    attempt: '문제 풀이',
    module_start: '모듈 시작',
    module_complete: '모듈 완료',
  };
  return eventTypeMap[eventType] || eventType;
};

/**
 * Get problem type display name in Korean
 */
export const getProblemTypeName = (problemType: string): string => {
  const problemTypeMap: Record<string, string> = {
    visualization: '시각화',
    addition: '덧셈',
    subtraction: '뺄셈',
    multiplication: '곱셈',
    division: '나눗셈',
    simplification: '약분',
    comparison: '비교',
  };
  return problemTypeMap[problemType] || problemType;
};

/**
 * Get difficulty level display
 */
export const getDifficultyDisplay = (level: number): string => {
  const stars = '★'.repeat(level) + '☆'.repeat(5 - level);
  return stars;
};
