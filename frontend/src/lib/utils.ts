import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}분 ${remainingSeconds}초`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'EASY':
      return 'text-green-600 bg-green-100';
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-100';
    case 'HARD':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getDifficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'EASY':
      return '쉬움';
    case 'MEDIUM':
      return '보통';
    case 'HARD':
      return '어려움';
    default:
      return difficulty;
  }
}

export function getProblemTypeLabel(type: string): string {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return '객관식';
    case 'TRUE_FALSE':
      return 'O/X';
    case 'SHORT_ANSWER':
      return '주관식';
    case 'MATH':
      return '수학';
    default:
      return type;
  }
}
