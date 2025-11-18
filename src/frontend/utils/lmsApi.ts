/**
 * Moodle LMS API 연동 유틸리티
 */

import type {
  MoodleSession,
  MoodleApiResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  LoadProblemRequest,
} from '../types/lms.types';
import type { ProblemData } from '../types/histogram.types';

/**
 * LMS API 기본 URL (환경변수 또는 기본값)
 */
const LMS_API_BASE_URL = import.meta.env.VITE_LMS_API_URL || '/mod/histogram_beat/api.php';

/**
 * URL 파라미터에서 Moodle 세션 정보 추출
 */
export function getMoodleSessionFromUrl(): MoodleSession | null {
  const params = new URLSearchParams(window.location.search);

  const sessionKey = params.get('sesskey');
  const userId = params.get('userid');
  const courseId = params.get('courseid');
  const activityId = params.get('cmid');

  if (!sessionKey || !userId || !courseId || !activityId) {
    return null;
  }

  return {
    sessionKey,
    userId: parseInt(userId, 10),
    courseId: parseInt(courseId, 10),
    activityId: parseInt(activityId, 10),
  };
}

/**
 * Moodle API 호출 헬퍼
 */
async function callMoodleApi<T>(
  endpoint: string,
  data: Record<string, any>
): Promise<MoodleApiResponse<T>> {
  try {
    const response = await fetch(`${LMS_API_BASE_URL}?action=${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Moodle API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 문제 데이터 불러오기
 */
export async function loadProblem(
  request: LoadProblemRequest
): Promise<MoodleApiResponse<ProblemData>> {
  return callMoodleApi<ProblemData>('load_problem', request);
}

/**
 * 답안 제출
 */
export async function submitAnswer(
  request: SubmitAnswerRequest
): Promise<MoodleApiResponse<SubmitAnswerResponse>> {
  return callMoodleApi<SubmitAnswerResponse>('submit_answer', request);
}

/**
 * 학습 진행 상황 저장
 */
export async function saveProgress(
  sessionKey: string,
  progressData: Record<string, any>
): Promise<MoodleApiResponse<void>> {
  return callMoodleApi<void>('save_progress', {
    sessionKey,
    ...progressData,
  });
}

/**
 * Mock 데이터 (개발/테스트용)
 */
export function getMockProblemData(): ProblemData {
  return {
    id: 1,
    questionText: '다음 데이터의 분포를 히스토그램으로 나타낸 것입니다. 가장 빈도가 높은 구간은?',
    histogramData: [
      { label: '0-10', value: 5, color: '#FF6B6B' },
      { label: '10-20', value: 12, color: '#4ECDC4' },
      { label: '20-30', value: 18, color: '#45B7D1' },
      { label: '30-40', value: 15, color: '#FFA07A' },
      { label: '40-50', value: 8, color: '#98D8C8' },
    ],
    options: ['0-10', '10-20', '20-30', '30-40', '40-50'],
    correctAnswer: '20-30',
  };
}
