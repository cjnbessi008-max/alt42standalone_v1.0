import axios from 'axios'
import type { Problem, MoodleWebServiceRequest, MoodleQuestion } from '../types'

export class MoodleService {
  private moodleUrl: string
  private wsToken: string

  constructor() {
    this.moodleUrl = process.env.MOODLE_URL || 'http://localhost/moodle'
    this.wsToken = process.env.MOODLE_WS_TOKEN || ''
  }

  private async callMoodleWS(functionName: string, params: any = {}): Promise<any> {
    const requestParams: MoodleWebServiceRequest = {
      wstoken: this.wsToken,
      wsfunction: functionName,
      moodlewsrestformat: 'json',
      ...params
    }

    try {
      const response = await axios.post(
        `${this.moodleUrl}/webservice/rest/server.php`,
        null,
        { params: requestParams }
      )

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle API error')
      }

      return response.data
    } catch (error) {
      console.error('Moodle API call failed:', error)
      throw new Error('Failed to communicate with Moodle')
    }
  }

  async fetchProblems(courseId: number, token: string): Promise<Problem[]> {
    try {
      // Use custom token if provided
      const originalToken = this.wsToken
      if (token) this.wsToken = token

      // Fetch quiz questions from Moodle
      const quizzes = await this.callMoodleWS('mod_quiz_get_quizzes_by_courses', {
        courseids: [courseId]
      })

      // Transform Moodle questions to our Problem format
      const problems: Problem[] = []

      // This is a simplified example - actual implementation would need
      // to parse custom question data from Moodle
      for (const quiz of quizzes.quizzes || []) {
        // Extract triangle data from quiz questiontext or custom fields
        // For now, return demo data
        console.log('Fetched quiz from Moodle:', quiz.name)
      }

      // Restore original token
      this.wsToken = originalToken

      return problems
    } catch (error) {
      console.error('Failed to fetch problems from Moodle:', error)
      throw error
    }
  }

  async submitGrade(attemptId: string, grade: number, token: string): Promise<void> {
    try {
      const originalToken = this.wsToken
      if (token) this.wsToken = token

      // Submit grade to Moodle gradebook
      await this.callMoodleWS('core_grades_update_grades', {
        source: 'triangle_similarity',
        courseid: 0, // Should be provided
        component: 'mod_quiz',
        activityid: 0, // Should be provided
        itemnumber: 0,
        grades: [
          {
            studentid: 0, // Should be provided
            grade: grade
          }
        ]
      })

      this.wsToken = originalToken
    } catch (error) {
      console.error('Failed to submit grade to Moodle:', error)
      throw error
    }
  }

  async getUserCourses(token: string): Promise<any[]> {
    try {
      const originalToken = this.wsToken
      if (token) this.wsToken = token

      const courses = await this.callMoodleWS('core_enrol_get_users_courses', {
        userid: 0 // Should be extracted from token
      })

      this.wsToken = originalToken
      return courses
    } catch (error) {
      console.error('Failed to fetch user courses:', error)
      throw error
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const originalToken = this.wsToken
      this.wsToken = token

      const result = await this.callMoodleWS('core_webservice_get_site_info')

      this.wsToken = originalToken
      return !!result.userid
    } catch (error) {
      return false
    }
  }
}
