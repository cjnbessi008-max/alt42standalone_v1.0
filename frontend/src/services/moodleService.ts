import axios from 'axios';
import { MoodleProblem, StudentProgress } from '../types/similarity';

/**
 * Moodle LMS API 연동 서비스
 * MySQL 5.7, PHP 7.1.9, Moodle 3.7과 연동
 */

const API_BASE_URL = '/api/moodle';

// Moodle API 클라이언트
const moodleClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 인증 토큰 추가
moodleClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('moodle_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
moodleClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 처리
      localStorage.removeItem('moodle_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Moodle에서 문제 정보 가져오기
 */
export const fetchProblems = async (courseId?: number): Promise<MoodleProblem[]> => {
  try {
    const response = await moodleClient.get('/problems', {
      params: { courseId },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch problems from Moodle:', error);
    // 개발 중 임시 데이터 반환
    return getMockProblems();
  }
};

/**
 * 특정 문제 정보 가져오기
 */
export const fetchProblemById = async (problemId: number): Promise<MoodleProblem> => {
  try {
    const response = await moodleClient.get(`/problems/${problemId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch problem ${problemId}:`, error);
    throw error;
  }
};

/**
 * 학생 진행 상황 저장
 */
export const saveProgress = async (progress: StudentProgress): Promise<void> => {
  try {
    await moodleClient.post('/progress', progress);
  } catch (error) {
    console.error('Failed to save progress:', error);
    throw error;
  }
};

/**
 * 학생 진행 상황 조회
 */
export const fetchProgress = async (studentId: number): Promise<StudentProgress[]> => {
  try {
    const response = await moodleClient.get(`/progress/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch progress:', error);
    return [];
  }
};

/**
 * Moodle 인증
 */
export const authenticateMoodle = async (
  username: string,
  password: string
): Promise<string> => {
  try {
    const response = await moodleClient.post('/auth', { username, password });
    const token = response.data.token;
    localStorage.setItem('moodle_token', token);
    return token;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
};

/**
 * 개발용 Mock 데이터
 */
function getMockProblems(): MoodleProblem[] {
  return [
    {
      id: 1,
      questionId: 101,
      title: '삼각형 닮음 - AAA 조건',
      content: '두 삼각형의 세 각이 각각 60°, 70°, 50°입니다. 이 두 삼각형은 닮음입니까?',
      similarityType: 'AAA',
      difficulty: 'easy',
      triangleData: {
        triangle1: { angles: [60, 70, 50] },
        triangle2: { angles: [60, 70, 50] },
      },
    },
    {
      id: 2,
      questionId: 102,
      title: '삼각형 닮음 - SAS 조건',
      content: '삼각형 ABC와 DEF에서 AB=6cm, AC=8cm, DE=3cm, DF=4cm이고 ∠A=∠D=60°일 때 닮음입니까?',
      similarityType: 'SAS',
      difficulty: 'medium',
      triangleData: {
        triangle1: { sides: [6, 8], angles: [60] },
        triangle2: { sides: [3, 4], angles: [60] },
      },
    },
    {
      id: 3,
      questionId: 103,
      title: '삼각형 닮음 - SSS 조건',
      content: '삼각형 ABC의 세 변이 6cm, 8cm, 10cm이고 삼각형 DEF의 세 변이 3cm, 4cm, 5cm일 때 닮음입니까?',
      similarityType: 'SSS',
      difficulty: 'hard',
      triangleData: {
        triangle1: { sides: [6, 8, 10] },
        triangle2: { sides: [3, 4, 5] },
      },
    },
  ];
}

export default {
  fetchProblems,
  fetchProblemById,
  saveProgress,
  fetchProgress,
  authenticateMoodle,
};
