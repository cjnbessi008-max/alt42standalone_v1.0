import axios from 'axios';

// Moodle API 연동 서비스
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Moodle에서 수학 문제 목록 가져오기
 */
export async function getMoodleProblems() {
  try {
    const response = await axios.get(`${API_BASE_URL}/moodle-connector.php`, {
      params: {
        action: 'getProblems'
      }
    });

    if (response.data.success) {
      return response.data.problems;
    } else {
      throw new Error(response.data.message || 'Failed to fetch problems');
    }
  } catch (error) {
    console.error('Moodle API 오류:', error);
    throw error;
  }
}

/**
 * 특정 문제 상세 정보 가져오기
 */
export async function getProblemDetail(problemId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/moodle-connector.php`, {
      params: {
        action: 'getProblemDetail',
        problemId: problemId
      }
    });

    if (response.data.success) {
      return response.data.problem;
    } else {
      throw new Error(response.data.message || 'Failed to fetch problem detail');
    }
  } catch (error) {
    console.error('Moodle API 오류:', error);
    throw error;
  }
}

/**
 * 학생의 문제 풀이 기록 저장
 */
export async function submitProblemAttempt(problemId, studentId, data) {
  try {
    const response = await axios.post(`${API_BASE_URL}/moodle-connector.php`, {
      action: 'submitAttempt',
      problemId: problemId,
      studentId: studentId,
      attemptData: data,
      timestamp: new Date().toISOString()
    });

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to submit attempt');
    }
  } catch (error) {
    console.error('Moodle API 오류:', error);
    throw error;
  }
}

/**
 * Property Shake 이벤트 로깅
 */
export async function logPropertyShakeEvent(problemId, studentId, eventData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/moodle-connector.php`, {
      action: 'logEvent',
      problemId: problemId,
      studentId: studentId,
      eventType: 'property_shake',
      eventData: eventData,
      timestamp: new Date().toISOString()
    });

    return response.data;
  } catch (error) {
    console.error('이벤트 로깅 오류:', error);
    // 로깅 실패는 치명적이지 않으므로 에러를 던지지 않음
    return { success: false };
  }
}
