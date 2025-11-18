import axios from 'axios';
import { Problem, MoodleApiResponse } from '../types';

// Moodle API 설정
const MOODLE_BASE_URL = process.env.VITE_MOODLE_URL || 'http://localhost/moodle';
const MOODLE_TOKEN = process.env.VITE_MOODLE_TOKEN || '';

const moodleClient = axios.create({
  baseURL: MOODLE_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Moodle에서 문제 정보를 가져옵니다
 */
export const fetchProblemFromMoodle = async (
  problemId: string
): Promise<Problem> => {
  try {
    const response = await moodleClient.get<MoodleApiResponse>(
      '/webservice/rest/server.php',
      {
        params: {
          wstoken: MOODLE_TOKEN,
          wsfunction: 'local_setdance_get_problem',
          moodlewsrestformat: 'json',
          problemid: problemId,
        },
      }
    );

    if (response.data.success && response.data.problem) {
      return response.data.problem;
    } else {
      throw new Error(response.data.error || 'Failed to fetch problem');
    }
  } catch (error) {
    console.error('Moodle API Error:', error);
    throw error;
  }
};

/**
 * 학생의 답안을 Moodle에 제출합니다
 */
export const submitAnswerToMoodle = async (
  problemId: string,
  studentId: string,
  answer: string[]
): Promise<boolean> => {
  try {
    const response = await moodleClient.post('/webservice/rest/server.php', null, {
      params: {
        wstoken: MOODLE_TOKEN,
        wsfunction: 'local_setdance_submit_answer',
        moodlewsrestformat: 'json',
        problemid: problemId,
        studentid: studentId,
        answer: JSON.stringify(answer),
      },
    });

    return response.data.success || false;
  } catch (error) {
    console.error('Submit Answer Error:', error);
    return false;
  }
};

/**
 * 데모용 Mock 데이터 생성
 */
export const getMockProblem = (): Problem => {
  return {
    id: 'demo-1',
    title: 'Set Dance 데모',
    description: '1부터 20까지의 숫자 중에서 짝수를 찾아보세요!',
    elements: Array.from({ length: 20 }, (_, i) => ({
      id: `elem-${i + 1}`,
      value: i + 1,
      color: undefined,
    })),
    conditions: [
      {
        type: 'even',
      },
    ],
    correctAnswer: ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20'],
  };
};

/**
 * 다양한 데모 문제들
 */
export const getDemoProblems = (): Problem[] => {
  return [
    {
      id: 'demo-even',
      title: '짝수 찾기',
      description: '1부터 20까지의 숫자 중에서 짝수를 찾아보세요!',
      elements: Array.from({ length: 20 }, (_, i) => ({
        id: `elem-${i + 1}`,
        value: i + 1,
      })),
      conditions: [{ type: 'even' }],
      correctAnswer: ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20'],
    },
    {
      id: 'demo-odd',
      title: '홀수 찾기',
      description: '1부터 15까지의 숫자 중에서 홀수를 찾아보세요!',
      elements: Array.from({ length: 15 }, (_, i) => ({
        id: `elem-${i + 1}`,
        value: i + 1,
      })),
      conditions: [{ type: 'odd' }],
      correctAnswer: ['1', '3', '5', '7', '9', '11', '13', '15'],
    },
    {
      id: 'demo-greater',
      title: '10보다 큰 수',
      description: '1부터 20까지의 숫자 중에서 10보다 큰 수를 찾아보세요!',
      elements: Array.from({ length: 20 }, (_, i) => ({
        id: `elem-${i + 1}`,
        value: i + 1,
      })),
      conditions: [{ type: 'greater', value: 10 }],
      correctAnswer: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
    },
    {
      id: 'demo-range',
      title: '5에서 15 사이의 수',
      description: '1부터 20까지의 숫자 중에서 5 이상 15 이하인 수를 찾아보세요!',
      elements: Array.from({ length: 20 }, (_, i) => ({
        id: `elem-${i + 1}`,
        value: i + 1,
      })),
      conditions: [{ type: 'range', min: 5, max: 15 }],
      correctAnswer: ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'],
    },
  ];
};
