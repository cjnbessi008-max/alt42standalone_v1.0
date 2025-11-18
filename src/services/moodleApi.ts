import axios, { AxiosInstance } from 'axios'

/**
 * Moodle LMS API Integration Service
 *
 * Compatible with:
 * - Moodle 3.7
 * - PHP 7.1.9
 * - MySQL 5.7
 *
 * This service handles communication with Moodle Web Services API
 */

export interface MoodleProblem {
  id: number
  name: string
  intro: string
  shapeType: 'triangle' | 'rectangle' | 'circle' | 'polygon'
  difficulty: number
  timemodified: number
}

export interface MoodleUser {
  id: number
  username: string
  fullname: string
  email: string
}

export interface MoodleAttempt {
  problemId: number
  userId: number
  startTime: number
  endTime?: number
  properties: {
    area: number
    perimeter: number
    vertices: number
  }
  score?: number
}

class MoodleApiService {
  private api: AxiosInstance
  private wsToken: string = ''
  private moodleUrl: string = ''

  constructor() {
    this.api = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  }

  /**
   * Initialize Moodle connection
   * @param moodleUrl - Base URL of Moodle installation (e.g., https://moodle.example.com)
   * @param wsToken - Web Service Token from Moodle
   */
  initialize(moodleUrl: string, wsToken: string) {
    this.moodleUrl = moodleUrl
    this.wsToken = wsToken
  }

  /**
   * Make a web service call to Moodle
   */
  private async callMoodleWS(
    wsFunction: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    if (!this.moodleUrl || !this.wsToken) {
      throw new Error('Moodle API not initialized. Call initialize() first.')
    }

    const url = `${this.moodleUrl}/webservice/rest/server.php`

    const formData = new URLSearchParams({
      wstoken: this.wsToken,
      wsfunction: wsFunction,
      moodlewsrestformat: 'json',
      ...params
    })

    try {
      const response = await this.api.post(url, formData)

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle API Error')
      }

      return response.data
    } catch (error) {
      console.error(`Moodle WS Error [${wsFunction}]:`, error)
      throw error
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<MoodleUser> {
    const response = await this.callMoodleWS('core_webservice_get_site_info')

    return {
      id: response.userid,
      username: response.username,
      fullname: response.fullname,
      email: response.useremail
    }
  }

  /**
   * Get problem/question from Moodle quiz or custom activity
   * This uses a custom Moodle plugin endpoint (to be implemented in Moodle)
   */
  async getProblem(problemId: number): Promise<MoodleProblem> {
    try {
      // Call custom web service function
      // This would require a custom Moodle plugin with a web service function like:
      // local_fluidgeometry_get_problem
      const response = await this.callMoodleWS('local_fluidgeometry_get_problem', {
        problemid: problemId
      })

      return {
        id: response.id,
        name: response.name,
        intro: response.intro,
        shapeType: response.shapetype || 'triangle',
        difficulty: response.difficulty || 1,
        timemodified: response.timemodified
      }
    } catch (error) {
      console.error('Failed to fetch problem from Moodle:', error)

      // Return mock data for development
      return this.getMockProblem(problemId)
    }
  }

  /**
   * Get all available problems for current user
   */
  async getAvailableProblems(): Promise<MoodleProblem[]> {
    try {
      const response = await this.callMoodleWS('local_fluidgeometry_get_problems')
      return response.problems || []
    } catch (error) {
      console.error('Failed to fetch problems from Moodle:', error)

      // Return mock data for development
      return this.getMockProblems()
    }
  }

  /**
   * Submit student attempt/answer
   */
  async submitAttempt(attempt: MoodleAttempt): Promise<{ success: boolean; score?: number }> {
    try {
      const response = await this.callMoodleWS('local_fluidgeometry_submit_attempt', {
        problemid: attempt.problemId,
        starttime: attempt.startTime,
        endtime: attempt.endTime || Date.now(),
        area: attempt.properties.area,
        perimeter: attempt.properties.perimeter,
        vertices: attempt.properties.vertices
      })

      return {
        success: true,
        score: response.score
      }
    } catch (error) {
      console.error('Failed to submit attempt to Moodle:', error)
      return { success: false }
    }
  }

  /**
   * Get student's attempt history
   */
  async getAttemptHistory(userId: number, problemId?: number): Promise<MoodleAttempt[]> {
    try {
      const params: Record<string, any> = { userid: userId }
      if (problemId) {
        params.problemid = problemId
      }

      const response = await this.callMoodleWS('local_fluidgeometry_get_attempts', params)
      return response.attempts || []
    } catch (error) {
      console.error('Failed to fetch attempt history from Moodle:', error)
      return []
    }
  }

  /**
   * Mock data for development without Moodle connection
   */
  private getMockProblem(problemId: number): MoodleProblem {
    const shapes: Array<'triangle' | 'rectangle' | 'circle' | 'polygon'> =
      ['triangle', 'rectangle', 'circle', 'polygon']

    return {
      id: problemId,
      name: `도형의 성질 이해하기 #${problemId}`,
      intro: '도형이 변형되어도 유지되는 성질을 관찰하고 학습하세요.',
      shapeType: shapes[problemId % 4],
      difficulty: (problemId % 3) + 1,
      timemodified: Date.now()
    }
  }

  /**
   * Mock problems list for development
   */
  private getMockProblems(): MoodleProblem[] {
    return [
      {
        id: 1,
        name: '삼각형의 성질',
        intro: '삼각형이 물처럼 흐를 때 면적과 둘레를 관찰하세요',
        shapeType: 'triangle',
        difficulty: 1,
        timemodified: Date.now()
      },
      {
        id: 2,
        name: '사각형의 변환',
        intro: '사각형의 기하학적 불변량을 탐구하세요',
        shapeType: 'rectangle',
        difficulty: 2,
        timemodified: Date.now()
      },
      {
        id: 3,
        name: '원의 특성',
        intro: '원이 움직일 때 성질이 어떻게 유지되는지 확인하세요',
        shapeType: 'circle',
        difficulty: 1,
        timemodified: Date.now()
      },
      {
        id: 4,
        name: '다각형 탐구',
        intro: '육각형의 대칭성과 성질을 학습하세요',
        shapeType: 'polygon',
        difficulty: 3,
        timemodified: Date.now()
      }
    ]
  }
}

// Export singleton instance
export const moodleApi = new MoodleApiService()

// Export helper function for easy initialization
export const initializeMoodle = (moodleUrl: string, wsToken: string) => {
  moodleApi.initialize(moodleUrl, wsToken)
}
