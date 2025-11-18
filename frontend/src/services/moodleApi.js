import axios from 'axios'

const API_BASE_URL = '/api'

/**
 * Moodle API 클라이언트
 * Moodle 3.7과 연동하여 문제 정보를 가져옵니다
 */

/**
 * Moodle에서 방정식 문제 정보 가져오기
 * @param {number} questionId - Moodle 문제 ID
 * @returns {Promise<Object>} 방정식 데이터
 */
export async function fetchEquationFromMoodle(questionId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/moodle/question/${questionId}`)
    return response.data
  } catch (error) {
    console.error('Moodle API 오류:', error)
    throw new Error('문제 정보를 가져올 수 없습니다')
  }
}

/**
 * Moodle 퀴즈의 모든 문제 목록 가져오기
 * @param {number} quizId - Moodle 퀴즈 ID
 * @returns {Promise<Array>} 문제 목록
 */
export async function fetchQuizQuestions(quizId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/moodle/quiz/${quizId}/questions`)
    return response.data
  } catch (error) {
    console.error('Moodle API 오류:', error)
    throw new Error('퀴즈 문제 목록을 가져올 수 없습니다')
  }
}

/**
 * 학생의 방정식 풀이 결과 제출
 * @param {number} questionId - 문제 ID
 * @param {Object} answer - 답안 데이터
 * @returns {Promise<Object>} 제출 결과
 */
export async function submitAnswer(questionId, answer) {
  try {
    const response = await axios.post(`${API_BASE_URL}/moodle/submit`, {
      questionId,
      answer
    })
    return response.data
  } catch (error) {
    console.error('답안 제출 오류:', error)
    throw new Error('답안을 제출할 수 없습니다')
  }
}

/**
 * Moodle 연결 상태 확인
 * @returns {Promise<boolean>} 연결 상태
 */
export async function checkMoodleConnection() {
  try {
    const response = await axios.get(`${API_BASE_URL}/moodle/health`)
    return response.data.status === 'ok'
  } catch (error) {
    console.error('Moodle 연결 확인 오류:', error)
    return false
  }
}

/**
 * 데모 데이터 (Moodle 연결이 없을 때 사용)
 */
export const DEMO_EQUATIONS = [
  {
    id: 1,
    expression: '2x + 5 = 3x - 7',
    type: 'linear',
    title: '일차방정식 - 기본',
    difficulty: 'easy'
  },
  {
    id: 2,
    expression: 'x^2 - 5x + 6 = 0',
    type: 'quadratic',
    title: '이차방정식 - 인수분해',
    difficulty: 'medium'
  },
  {
    id: 3,
    expression: '3(x + 2) = 2(x - 1) + 14',
    type: 'linear',
    title: '일차방정식 - 괄호',
    difficulty: 'medium'
  },
  {
    id: 4,
    expression: 'x/2 + x/3 = 5',
    type: 'linear',
    title: '일차방정식 - 분수',
    difficulty: 'hard'
  }
]
