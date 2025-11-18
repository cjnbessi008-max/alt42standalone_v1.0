import type { MoodleQuestion } from '../types/moodle';
import { fetchMoodleQuestions } from '../data/mockQuestions';

/**
 * Moodle API Service
 * Moodle LMS와의 통신을 담당
 * 현재는 Mock 데이터를 사용하지만, 실제 API로 교체 가능
 */

/**
 * Moodle API Base Configuration
 */
export const MOODLE_CONFIG = {
  // 실제 Moodle 서버 설정
  baseUrl: import.meta.env.VITE_MOODLE_BASE_URL || 'http://localhost/moodle',
  apiToken: import.meta.env.VITE_MOODLE_API_TOKEN || '',

  // API 엔드포인트
  endpoints: {
    questions: '/webservice/rest/server.php',
    submit: '/webservice/rest/server.php',
    progress: '/webservice/rest/server.php',
  },
};

/**
 * Fetch questions from Moodle
 * 실제 구현 시 아래와 같이 교체:
 *
 * const response = await fetch(`${MOODLE_CONFIG.baseUrl}${MOODLE_CONFIG.endpoints.questions}`, {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/x-www-form-urlencoded',
 *   },
 *   body: new URLSearchParams({
 *     wstoken: MOODLE_CONFIG.apiToken,
 *     wsfunction: 'mod_quiz_get_quizzes_by_courses',
 *     moodlewsrestformat: 'json',
 *   }),
 * });
 */
export const getMoodleQuestions = async (): Promise<MoodleQuestion[]> => {
  try {
    // Mock 데이터 사용 (개발용)
    const questions = await fetchMoodleQuestions();
    return questions;

    // 실제 Moodle API 호출 예제:
    // const response = await fetch(
    //   `${MOODLE_CONFIG.baseUrl}${MOODLE_CONFIG.endpoints.questions}`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //     },
    //     body: new URLSearchParams({
    //       wstoken: MOODLE_CONFIG.apiToken,
    //       wsfunction: 'mod_quiz_get_quizzes_by_courses',
    //       moodlewsrestformat: 'json',
    //     }),
    //   }
    // );
    //
    // if (!response.ok) {
    //   throw new Error(`Moodle API error: ${response.status}`);
    // }
    //
    // const data = await response.json();
    // return transformMoodleResponse(data);
  } catch (error) {
    console.error('Error fetching Moodle questions:', error);
    throw error;
  }
};

/**
 * Submit answer to Moodle
 */
export const submitAnswer = async (
  questionId: number,
  answer: string | number
): Promise<{ success: boolean; score?: number; feedback?: string }> => {
  try {
    // Mock implementation
    console.log('Submitting answer:', { questionId, answer });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      score: Math.random() > 0.5 ? 10 : 5,
      feedback: '좋습니다! 정답입니다.',
    };

    // 실제 Moodle API 호출:
    // const response = await fetch(...);
    // return await response.json();
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
};

/**
 * Get student progress from Moodle
 */
export const getStudentProgress = async (
  _studentId: number
): Promise<{ completed: number; inProgress: number; notStarted: number }> => {
  try {
    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      completed: 3,
      inProgress: 2,
      notStarted: 3,
    };

    // 실제 Moodle API 호출:
    // const response = await fetch(...);
    // return await response.json();
  } catch (error) {
    console.error('Error fetching student progress:', error);
    throw error;
  }
};

/* 실제 Moodle API 연동 시 사용할 헬퍼 함수들
 * 현재는 Mock 데이터를 사용하므로 주석 처리
 *
 * Transform Moodle API response to internal format
 * Moodle API 응답을 내부 형식으로 변환
 *
const transformMoodleResponse = (data: any): MoodleQuestion[] => {
  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    questionText: item.questiontext,
    type: mapMoodleQuestionType(item.qtype),
    difficulty: determineDifficulty(item),
    status: determineStatus(item),
    maxScore: item.maxmark,
    currentScore: item.mark,
    attempts: item.attempts || 0,
    maxAttempts: item.maxattempts || 3,
    timeSpent: item.timespent || 0,
    category: item.category || '기타',
    tags: item.tags || [],
    createdAt: item.timecreated,
    updatedAt: item.timemodified,
  }));
};

const mapMoodleQuestionType = (moodleType: string): any => {
  const typeMap: Record<string, string> = {
    multichoice: 'multichoice',
    shortanswer: 'shortanswer',
    numerical: 'numerical',
    essay: 'essay',
    truefalse: 'truefalse',
  };
  return typeMap[moodleType] || 'multichoice';
};

const determineDifficulty = (item: any): any => {
  const score = item.maxmark || 10;
  if (score <= 5) return 'easy';
  if (score <= 15) return 'medium';
  return 'hard';
};

const determineStatus = (item: any): any => {
  if (item.state === 'complete') return 'completed';
  if (item.state === 'inprogress') return 'in_progress';
  return 'not_started';
};
*/
