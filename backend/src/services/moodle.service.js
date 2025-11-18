import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MOODLE_URL = process.env.MOODLE_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;
const MOODLE_SERVICE = process.env.MOODLE_SERVICE || 'moodlemobile';

/**
 * Moodle Web Services API 클라이언트
 */
class MoodleService {
  constructor() {
    this.baseUrl = `${MOODLE_URL}/webservice/rest/server.php`;
    this.token = MOODLE_TOKEN;
    this.format = 'json';
  }

  /**
   * Moodle API 호출
   * @param {string} wsfunction - Web service function name
   * @param {object} params - Additional parameters
   * @returns {Promise<any>}
   */
  async call(wsfunction, params = {}) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          wstoken: this.token,
          wsfunction,
          moodlewsrestformat: this.format,
          ...params
        },
        timeout: 30000
      });

      if (response.data.exception) {
        throw new Error(`Moodle API Error: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      console.error(`Moodle API call failed (${wsfunction}):`, error.message);
      throw error;
    }
  }

  /**
   * 사용자 정보 조회
   * @param {number} userId - Moodle user ID
   * @returns {Promise<object>}
   */
  async getUserById(userId) {
    const result = await this.call('core_user_get_users_by_field', {
      field: 'id',
      'values[0]': userId
    });
    return result[0] || null;
  }

  /**
   * 코스 목록 조회
   * @returns {Promise<Array>}
   */
  async getCourses() {
    return await this.call('core_course_get_courses');
  }

  /**
   * 특정 코스의 퀴즈 목록 조회
   * @param {number} courseId - Course ID
   * @returns {Promise<Array>}
   */
  async getQuizzesByCourse(courseId) {
    const result = await this.call('mod_quiz_get_quizzes_by_courses', {
      'courseids[0]': courseId
    });
    return result.quizzes || [];
  }

  /**
   * 사용자의 퀴즈 시도 기록 조회
   * @param {number} quizId - Quiz ID
   * @param {number} userId - User ID
   * @returns {Promise<Array>}
   */
  async getUserAttempts(quizId, userId = null) {
    const params = { quizid: quizId };
    if (userId) {
      params.userid = userId;
    }

    const result = await this.call('mod_quiz_get_user_attempts', params);
    return result.attempts || [];
  }

  /**
   * 특정 시도의 상세 정보 조회
   * @param {number} attemptId - Attempt ID
   * @returns {Promise<object>}
   */
  async getAttemptData(attemptId) {
    const result = await this.call('mod_quiz_get_attempt_data', {
      attemptid: attemptId,
      page: -1 // All pages
    });
    return result;
  }

  /**
   * 오늘 푼 문제들 조회 (모든 코스에서)
   * @param {number} userId - Moodle user ID
   * @returns {Promise<Array>} - Array of problem attempts with reasoning structure
   */
  async getTodayProblems(userId) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayTimestamp = Math.floor(todayStart.getTime() / 1000);

      // 1. 사용자가 등록된 모든 코스 조회
      const enrolledCourses = await this.call('core_enrol_get_users_courses', {
        userid: userId
      });

      const allProblems = [];

      // 2. 각 코스의 퀴즈 조회
      for (const course of enrolledCourses) {
        const quizzes = await this.getQuizzesByCourse(course.id);

        // 3. 각 퀴즈의 오늘 시도 기록 조회
        for (const quiz of quizzes) {
          const attempts = await this.getUserAttempts(quiz.id, userId);

          // 오늘 시도한 것만 필터링
          const todayAttempts = attempts.filter(
            attempt => attempt.timestart >= todayTimestamp
          );

          // 4. 각 시도의 상세 문제 데이터 조회
          for (const attempt of todayAttempts) {
            try {
              const attemptData = await this.getAttemptData(attempt.id);

              if (attemptData.questions) {
                for (const question of attemptData.questions) {
                  allProblems.push({
                    attemptId: attempt.id,
                    quizId: quiz.id,
                    quizName: quiz.name,
                    courseId: course.id,
                    courseName: course.fullname,
                    questionId: question.slot,
                    moodleQuestionId: question.number,
                    type: question.type,
                    question: this.stripHtml(question.html || ''),
                    questionHtml: question.html,
                    studentAnswer: this.extractStudentAnswer(question),
                    correctAnswer: this.extractCorrectAnswer(question),
                    isCorrect: question.state === 'gradedright',
                    points: question.mark || 0,
                    maxPoints: question.maxmark || 0,
                    attemptedAt: new Date(attempt.timestart * 1000),
                    timeSpent: attempt.timefinish
                      ? attempt.timefinish - attempt.timestart
                      : null
                  });
                }
              }
            } catch (error) {
              console.error(`Failed to get attempt data for attempt ${attempt.id}:`, error.message);
            }
          }
        }
      }

      return allProblems;
    } catch (error) {
      console.error('Failed to get today problems:', error);
      throw error;
    }
  }

  /**
   * HTML 태그 제거
   * @param {string} html
   * @returns {string}
   */
  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
  }

  /**
   * 학생 답안 추출
   * @param {object} question
   * @returns {string}
   */
  extractStudentAnswer(question) {
    // Moodle 질문 타입에 따라 답안 추출 방식이 다름
    if (question.responsefilesarea) {
      // File upload type
      return '[File uploaded]';
    }

    if (question.response) {
      return this.stripHtml(question.response);
    }

    // HTML에서 답안 추출 시도
    const answerMatch = question.html?.match(/Your answer:.*?<\/div>/s);
    if (answerMatch) {
      return this.stripHtml(answerMatch[0]);
    }

    return '';
  }

  /**
   * 정답 추출
   * @param {object} question
   * @returns {string}
   */
  extractCorrectAnswer(question) {
    if (question.rightanswer) {
      return this.stripHtml(question.rightanswer);
    }

    const correctMatch = question.html?.match(/Correct answer:.*?<\/div>/s);
    if (correctMatch) {
      return this.stripHtml(correctMatch[0]);
    }

    return '';
  }

  /**
   * 특정 날짜의 문제들 조회
   * @param {number} userId
   * @param {Date} date
   * @returns {Promise<Array>}
   */
  async getProblemsByDate(userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
    const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

    const enrolledCourses = await this.call('core_enrol_get_users_courses', {
      userid: userId
    });

    const allProblems = [];

    for (const course of enrolledCourses) {
      const quizzes = await this.getQuizzesByCourse(course.id);

      for (const quiz of quizzes) {
        const attempts = await this.getUserAttempts(quiz.id, userId);

        const dateAttempts = attempts.filter(
          attempt =>
            attempt.timestart >= startTimestamp &&
            attempt.timestart <= endTimestamp
        );

        for (const attempt of dateAttempts) {
          try {
            const attemptData = await this.getAttemptData(attempt.id);

            if (attemptData.questions) {
              for (const question of attemptData.questions) {
                allProblems.push({
                  attemptId: attempt.id,
                  quizId: quiz.id,
                  quizName: quiz.name,
                  courseId: course.id,
                  courseName: course.fullname,
                  questionId: question.slot,
                  moodleQuestionId: question.number,
                  type: question.type,
                  question: this.stripHtml(question.html || ''),
                  questionHtml: question.html,
                  studentAnswer: this.extractStudentAnswer(question),
                  correctAnswer: this.extractCorrectAnswer(question),
                  isCorrect: question.state === 'gradedright',
                  points: question.mark || 0,
                  maxPoints: question.maxmark || 0,
                  attemptedAt: new Date(attempt.timestart * 1000),
                  timeSpent: attempt.timefinish
                    ? attempt.timefinish - attempt.timestart
                    : null
                });
              }
            }
          } catch (error) {
            console.error(`Failed to get attempt data:`, error.message);
          }
        }
      }
    }

    return allProblems;
  }
}

export default new MoodleService();
