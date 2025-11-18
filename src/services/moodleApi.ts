import axios, { AxiosInstance } from 'axios'
import { MoodleApiConfig, ProblemData } from '../types'

/**
 * Moodle LMS API 연동 서비스
 * Moodle 3.7 REST API와 통신
 *
 * 환경 요구사항:
 * - MySQL 5.7
 * - PHP 7.1.9
 * - Moodle 3.7
 */
class MoodleApiService {
  private client: AxiosInstance
  private config: MoodleApiConfig

  constructor(config: MoodleApiConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Moodle REST API 공통 요청 메서드
   */
  private async moodleRequest<T>(
    wsfunction: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    try {
      const response = await this.client.get('/webservice/rest/server.php', {
        params: {
          wstoken: this.config.token,
          wsfunction,
          moodlewsrestformat: 'json',
          ...params,
        },
      })

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle API Error')
      }

      return response.data
    } catch (error) {
      console.error(`Moodle API Error (${wsfunction}):`, error)
      throw error
    }
  }

  /**
   * 퀴즈 시도 데이터 가져오기
   * @param attemptId 퀴즈 시도 ID
   */
  async getQuizAttemptData(attemptId: number): Promise<any> {
    return this.moodleRequest('mod_quiz_get_attempt_data', {
      attemptid: attemptId,
    })
  }

  /**
   * 학생 진행 상황 가져오기
   * @param userId 사용자 ID
   * @param courseId 코스 ID
   */
  async getStudentProgress(userId: number, courseId: number): Promise<any> {
    return this.moodleRequest('core_completion_get_activities_completion_status', {
      userid: userId,
      courseid: courseId,
    })
  }

  /**
   * 퀴즈 성적 가져오기
   * @param quizId 퀴즈 ID
   * @param userId 사용자 ID (선택)
   */
  async getQuizGrades(quizId: number, userId?: number): Promise<any> {
    const params: any = { quizid: quizId }
    if (userId) params.userid = userId

    return this.moodleRequest('mod_quiz_get_user_attempts', params)
  }

  /**
   * Moodle 데이터를 ProblemData 형식으로 변환
   * @param attemptData Moodle 시도 데이터
   */
  convertToProblemData(attemptData: any): ProblemData {
    // 실제 Moodle 응답 구조에 맞게 변환
    const attempt = attemptData.attempt || attemptData
    const quiz = attemptData.quiz || {}

    // 현재 점수 계산 (0-100 범위)
    const currentScore = attempt.sumgrades || 0
    const maxScore = quiz.sumgrades || 100
    const percentage = (currentScore / maxScore) * 100

    return {
      id: attempt.id?.toString() || '0',
      title: quiz.name || '퀴즈',
      currentValue: Math.round(percentage),
      minValue: 0,
      maxValue: 100,
      targetValue: quiz.gradetopass ? (quiz.gradetopass / maxScore) * 100 : undefined,
      type: 'score',
    }
  }

  /**
   * 실시간 학생 데이터 폴링
   * @param attemptId 시도 ID
   * @param callback 콜백 함수
   * @param interval 폴링 간격 (ms)
   */
  startPolling(
    attemptId: number,
    callback: (data: ProblemData) => void,
    interval: number = 5000
  ): () => void {
    const pollData = async () => {
      try {
        const attemptData = await this.getQuizAttemptData(attemptId)
        const problemData = this.convertToProblemData(attemptData)
        callback(problemData)
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    // 초기 데이터 로드
    pollData()

    // 주기적 폴링
    const intervalId = setInterval(pollData, interval)

    // 폴링 중지 함수 반환
    return () => clearInterval(intervalId)
  }
}

/**
 * Moodle API 인스턴스 생성 헬퍼
 */
export function createMoodleApi(config: MoodleApiConfig): MoodleApiService {
  return new MoodleApiService(config)
}

/**
 * 데모 모드: 실제 Moodle 없이 테스트
 */
export class MockMoodleApiService {
  async getQuizAttemptData(attemptId: number): Promise<any> {
    // 시뮬레이션 데이터
    return {
      attempt: {
        id: attemptId,
        sumgrades: Math.random() * 100,
      },
      quiz: {
        name: '분수 덧셈 테스트',
        sumgrades: 100,
        gradetopass: 60,
      },
    }
  }

  convertToProblemData(attemptData: any): ProblemData {
    const service = new MoodleApiService({
      baseUrl: '',
      token: '',
      courseId: '',
    })
    return service.convertToProblemData(attemptData)
  }

  startPolling(
    attemptId: number,
    callback: (data: ProblemData) => void,
    interval: number = 3000
  ): () => void {
    const pollData = async () => {
      const attemptData = await this.getQuizAttemptData(attemptId)
      const problemData = this.convertToProblemData(attemptData)
      callback(problemData)
    }

    pollData()
    const intervalId = setInterval(pollData, interval)
    return () => clearInterval(intervalId)
  }
}

export default MoodleApiService
