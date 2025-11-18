import type { ProblemData, MoodleApiResponse } from '../types';

/**
 * Moodle LMS API 연동 서비스
 *
 * 실제 환경에서는 PHP 7.1.9 + MySQL 5.7 + Moodle 3.7과 연동
 */

// Moodle API 엔드포인트 (환경 변수에서 가져오거나 기본값 사용)
const MOODLE_API_URL = import.meta.env.VITE_MOODLE_API_URL || 'http://localhost:8080/api';

/**
 * Moodle에서 문제 데이터 가져오기
 */
export async function fetchProblems(): Promise<ProblemData[]> {
  try {
    const response = await fetch(`${MOODLE_API_URL}/problems`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MoodleApiResponse = await response.json();

    if (data.success && data.data) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch problems');
    }
  } catch (error) {
    console.error('Error fetching problems from Moodle:', error);
    // 개발 중에는 샘플 데이터 반환
    return getSampleProblems();
  }
}

/**
 * 특정 문제 ID로 문제 가져오기
 */
export async function fetchProblemById(id: string): Promise<ProblemData | null> {
  try {
    const response = await fetch(`${MOODLE_API_URL}/problems/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MoodleApiResponse = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      return data.data[0];
    } else {
      throw new Error(data.error || 'Problem not found');
    }
  } catch (error) {
    console.error('Error fetching problem by ID:', error);
    return null;
  }
}

/**
 * 학생 답안 제출
 */
export async function submitAnswer(
  problemId: string,
  studentId: string,
  answer: string
): Promise<boolean> {
  try {
    const response = await fetch(`${MOODLE_API_URL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problemId,
        studentId,
        answer,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MoodleApiResponse = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error submitting answer:', error);
    return false;
  }
}

/**
 * 샘플 문제 데이터 (개발/테스트용)
 */
export function getSampleProblems(): ProblemData[] {
  return [
    {
      id: '1',
      question: '2진수 1010을 10진수로 변환하세요.',
      sourceValue: '1010',
      sourceBase: 2,
      targetBase: 10,
      difficulty: 'easy',
    },
    {
      id: '2',
      question: '10진수 255를 16진수로 변환하세요.',
      sourceValue: '255',
      sourceBase: 10,
      targetBase: 16,
      difficulty: 'medium',
    },
    {
      id: '3',
      question: '16진수 FF를 2진수로 변환하세요.',
      sourceValue: 'FF',
      sourceBase: 16,
      targetBase: 2,
      difficulty: 'medium',
    },
    {
      id: '4',
      question: '2진수 11111111을 10진수로 변환하세요.',
      sourceValue: '11111111',
      sourceBase: 2,
      targetBase: 10,
      difficulty: 'easy',
    },
    {
      id: '5',
      question: '10진수 1024를 2진수로 변환하세요.',
      sourceValue: '1024',
      sourceBase: 10,
      targetBase: 2,
      difficulty: 'hard',
    },
  ];
}
