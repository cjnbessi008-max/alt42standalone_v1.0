/**
 * Moodle API Service
 *
 * Handles communication with backend PHP API for Moodle integration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/backend/api'

class MoodleService {
  /**
   * Get a specific problem by ID
   */
  async getProblem(problemId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/problems.php?action=get&id=${problemId}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch problem')
      }

      return data.data
    } catch (error) {
      console.error('Error fetching problem:', error)
      throw error
    }
  }

  /**
   * Get all problems for a course
   */
  async getCourseProblems(courseId = 1) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/problems.php?action=list&course_id=${courseId}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch problems')
      }

      return data.data
    } catch (error) {
      console.error('Error fetching course problems:', error)
      throw error
    }
  }

  /**
   * Get user's progress on problems
   */
  async getUserProgress(userId, courseId = 1) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/problems.php?action=progress&user_id=${userId}&course_id=${courseId}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user progress')
      }

      return data.data
    } catch (error) {
      console.error('Error fetching user progress:', error)
      throw error
    }
  }

  /**
   * Submit user's answer
   */
  async submitAnswer(userId, problemId, answer, timeTaken = 0) {
    try {
      const response = await fetch(`${API_BASE_URL}/problems.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submit_answer',
          user_id: userId,
          problem_id: problemId,
          answer: answer,
          time_taken: timeTaken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answer')
      }

      return data
    } catch (error) {
      console.error('Error submitting answer:', error)
      throw error
    }
  }

  /**
   * Mock data for demo purposes (when backend is not available)
   */
  getMockProblem() {
    return {
      id: 1,
      title: '함수 값 변화 관찰',
      description: 'f(x) = x² 함수의 값 변화를 공의 튀김으로 표현합니다.',
      function_type: 'quadratic',
      function_expression: 'x^2',
      min_value: 0,
      max_value: 30,
      difficulty: 'easy',
    }
  }

  getMockProblems() {
    return [
      {
        id: 1,
        title: '함수 값 변화 관찰 - 제곱 함수',
        description: 'f(x) = x² 함수의 값 변화를 공의 튀김으로 표현합니다.',
        function_type: 'quadratic',
        function_expression: 'x^2',
      },
      {
        id: 2,
        title: '선형 함수 이해하기',
        description: 'f(x) = 2x 함수의 값 변화를 관찰하세요.',
        function_type: 'linear',
        function_expression: '2*x',
      },
      {
        id: 3,
        title: '제곱근 함수 탐험',
        description: 'f(x) = √|x| 함수의 특성을 알아봅시다.',
        function_type: 'sqrt',
        function_expression: 'sqrt(abs(x))',
      },
    ]
  }
}

export default new MoodleService()
