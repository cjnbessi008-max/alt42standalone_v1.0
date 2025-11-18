/**
 * API 클라이언트
 * 백엔드 API와 통신하는 함수들
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * API 요청 헬퍼
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API request failed: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// 한숨 감지 API
// ============================================

export interface SighDetectionResult {
  detected: boolean;
  intensity: string | null;
  confidence: number;
  timestamp: string;
  should_suggest_break: boolean;
  stress_level: number;
}

/**
 * 오디오 샘플 분석하여 한숨 감지
 */
export async function analyzeSighFromAudio(
  studentId: string,
  audioSamples: number[],
  sampleRate: number = 16000
): Promise<SighDetectionResult> {
  return apiRequest<SighDetectionResult>('/api/sigh/analyze', {
    method: 'POST',
    body: JSON.stringify({
      student_id: studentId,
      audio_samples: audioSamples,
      sample_rate: sampleRate
    })
  });
}

/**
 * 한숨 감지 이력 초기화
 */
export async function resetSighHistory(studentId: string): Promise<void> {
  await apiRequest(`/api/sigh/reset/${studentId}`, {
    method: 'POST'
  });
}

/**
 * 현재 스트레스 레벨 조회
 */
export async function getStressLevel(): Promise<{ stress_level: number; timestamp: string }> {
  return apiRequest('/api/sigh/stress-level', {
    method: 'GET'
  });
}

// ============================================
// 휴식 제안 API
// ============================================

export interface BreakActivity {
  activity_id: string;
  name: string;
  name_ko: string;
  description: string;
  description_ko: string;
  duration_minutes: number;
  break_type: string;
  difficulty: string;
}

export interface BreakSuggestion {
  student_id: string;
  stress_level: number;
  reason: string;
  reason_ko: string;
  recommended_activities: BreakActivity[];
  timestamp: string;
}

/**
 * 휴식 제안 받기
 */
export async function getSuggestion(
  studentId: string,
  stressLevel: number,
  learningDurationMinutes: number,
  sighCount: number
): Promise<BreakSuggestion> {
  return apiRequest<BreakSuggestion>('/api/break/suggest', {
    method: 'POST',
    body: JSON.stringify({
      student_id: studentId,
      stress_level: stressLevel,
      learning_duration_minutes: learningDurationMinutes,
      sigh_count: sighCount
    })
  });
}

/**
 * 사용 가능한 휴식 활동 목록 조회
 */
export async function getBreakActivities(): Promise<{
  activities: BreakActivity[];
  total: number;
}> {
  return apiRequest('/api/break/activities', {
    method: 'GET'
  });
}

/**
 * 휴식 제안 이력 조회
 */
export async function getBreakHistory(
  studentId: string,
  limit: number = 10
): Promise<{
  student_id: string;
  history: BreakSuggestion[];
  total: number;
}> {
  return apiRequest(`/api/break/history/${studentId}?limit=${limit}`, {
    method: 'GET'
  });
}

// ============================================
// LMS 연동 API
// ============================================

export interface StudentSession {
  student_id: string;
  course_id: string;
  session_id: string;
  start_time: string;
  end_time: string | null;
  stress_level: number;
  break_taken: boolean;
}

/**
 * LMS 등록
 */
export async function registerLMS(
  lmsId: string,
  lmsType: 'canvas' | 'moodle' | 'kaist' | 'blackboard',
  baseUrl: string,
  apiToken: string
): Promise<{ message: string; lms_type: string; timestamp: string }> {
  return apiRequest('/api/lms/register', {
    method: 'POST',
    body: JSON.stringify({
      lms_id: lmsId,
      lms_type: lmsType,
      base_url: baseUrl,
      api_token: apiToken
    })
  });
}

/**
 * 학습 세션 시작
 */
export async function startLearningSession(
  lmsId: string,
  studentId: string,
  courseId: string
): Promise<{ message: string; session: StudentSession }> {
  return apiRequest('/api/lms/session/start', {
    method: 'POST',
    body: JSON.stringify({
      lms_id: lmsId,
      student_id: studentId,
      course_id: courseId
    })
  });
}

/**
 * 학습 세션 종료
 */
export async function endLearningSession(
  lmsId: string,
  sessionId: string
): Promise<{ message: string; session_id: string; timestamp: string }> {
  return apiRequest(`/api/lms/session/end?lms_id=${lmsId}&session_id=${sessionId}`, {
    method: 'POST'
  });
}

/**
 * 세션 스트레스 레벨 업데이트
 */
export async function updateSessionStress(
  lmsId: string,
  sessionId: string,
  stressLevel: number
): Promise<{
  message: string;
  session_id: string;
  stress_level: number;
  timestamp: string;
}> {
  return apiRequest('/api/lms/session/stress', {
    method: 'PUT',
    body: JSON.stringify({
      lms_id: lmsId,
      session_id: sessionId,
      stress_level: stressLevel
    })
  });
}

/**
 * 휴식 제안 알림 전송 (LMS를 통해)
 */
export async function sendBreakNotification(
  lmsId: string,
  studentId: string,
  courseId: string,
  reason: string,
  reasonKo: string
): Promise<{ message: string; student_id: string; timestamp: string }> {
  return apiRequest('/api/lms/notification/break', {
    method: 'POST',
    body: JSON.stringify({
      lms_id: lmsId,
      student_id: studentId,
      course_id: courseId,
      reason: reason,
      reason_ko: reasonKo
    })
  });
}

// ============================================
// 통합 워크플로우 API
// ============================================

/**
 * 오디오 분석 + 휴식 제안 + LMS 알림 (통합)
 */
export async function analyzeAndSuggest(
  studentId: string,
  audioSamples: number[],
  sampleRate: number = 16000
): Promise<{
  sigh_detected: boolean;
  stress_level: number;
  break_suggested: boolean;
  suggestion?: BreakSuggestion;
  timestamp: string;
}> {
  return apiRequest('/api/workflow/analyze-and-suggest', {
    method: 'POST',
    body: JSON.stringify({
      student_id: studentId,
      audio_samples: audioSamples,
      sample_rate: sampleRate
    })
  });
}

export default {
  analyzeSighFromAudio,
  resetSighHistory,
  getStressLevel,
  getSuggestion,
  getBreakActivities,
  getBreakHistory,
  registerLMS,
  startLearningSession,
  endLearningSession,
  updateSessionStress,
  sendBreakNotification,
  analyzeAndSuggest
};
