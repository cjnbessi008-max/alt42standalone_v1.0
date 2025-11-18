const axios = require('axios');

class MoodleService {
  constructor() {
    this.baseURL = process.env.MOODLE_URL;
    this.token = process.env.MOODLE_TOKEN;

    if (!this.baseURL || !this.token) {
      console.warn('⚠️  Moodle credentials not configured. Using mock data.');
      this.useMockData = true;
    } else {
      this.useMockData = false;
    }
  }

  /**
   * Make API call to Moodle web services
   */
  async callMoodleAPI(wsfunction, params = {}) {
    if (this.useMockData) {
      return this.getMockData(wsfunction, params);
    }

    try {
      const response = await axios.get(`${this.baseURL}/webservice/rest/server.php`, {
        params: {
          wstoken: this.token,
          wsfunction: wsfunction,
          moodlewsrestformat: 'json',
          ...params
        },
        timeout: 10000
      });

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle API Error');
      }

      return response.data;
    } catch (error) {
      console.error('Moodle API Error:', error.message);
      throw new Error(`Failed to fetch from Moodle: ${error.message}`);
    }
  }

  /**
   * Get quiz questions
   */
  async getQuizQuestions(quizId) {
    return await this.callMoodleAPI('mod_quiz_get_quiz_questions', { quizid: quizId });
  }

  /**
   * Get question details
   */
  async getQuestionDetails(questionId) {
    return await this.callMoodleAPI('core_question_get_question_data', { questionid: questionId });
  }

  /**
   * Submit answer
   */
  async submitAnswer(questionId, answer, userId) {
    return await this.callMoodleAPI('mod_quiz_process_attempt', {
      attemptid: questionId,
      data: JSON.stringify({ answer }),
      userid: userId
    });
  }

  /**
   * Get user progress
   */
  async getUserProgress(userId, quizId) {
    return await this.callMoodleAPI('mod_quiz_get_user_attempts', {
      quizid: quizId,
      userid: userId
    });
  }

  /**
   * Test connection to Moodle
   */
  async testConnection() {
    if (this.useMockData) {
      return {
        status: 'mock',
        message: 'Using mock data - Moodle not configured'
      };
    }

    try {
      const response = await this.callMoodleAPI('core_webservice_get_site_info');
      return {
        status: 'connected',
        sitename: response.sitename,
        version: response.version
      };
    } catch (error) {
      throw new Error(`Moodle connection failed: ${error.message}`);
    }
  }

  /**
   * Mock data for development/testing
   */
  getMockData(wsfunction, params) {
    console.log(`📝 Returning mock data for: ${wsfunction}`);

    switch (wsfunction) {
      case 'mod_quiz_get_quiz_questions':
        return {
          questions: [
            {
              id: 1,
              name: '분수 덧셈 문제 1',
              questiontext: '1/4 + 1/4 = ?',
              type: 'numerical',
              difficulty: 'easy'
            },
            {
              id: 2,
              name: '분수 덧셈 문제 2',
              questiontext: '2/5 + 1/5 = ?',
              type: 'numerical',
              difficulty: 'easy'
            },
            {
              id: 3,
              name: '분수 덧셈 문제 3',
              questiontext: '1/2 + 1/3 = ?',
              type: 'numerical',
              difficulty: 'medium'
            },
            {
              id: 4,
              name: '분수 곱셈 문제',
              questiontext: '2/3 × 3/4 = ?',
              type: 'numerical',
              difficulty: 'medium'
            },
            {
              id: 5,
              name: '분수 나눗셈 문제',
              questiontext: '3/4 ÷ 1/2 = ?',
              type: 'numerical',
              difficulty: 'hard'
            }
          ]
        };

      case 'core_question_get_question_data':
        return {
          id: params.questionid,
          name: `문제 ${params.questionid}`,
          questiontext: `이것은 문제 ${params.questionid}의 내용입니다.`,
          type: 'numerical',
          correctanswer: '0.5'
        };

      case 'mod_quiz_process_attempt':
        return {
          success: true,
          correct: Math.random() > 0.5,
          feedback: '좋은 시도입니다!'
        };

      case 'mod_quiz_get_user_attempts':
        return {
          attempts: [
            {
              id: 1,
              quiz: params.quizid,
              userid: params.userid,
              attempt: 1,
              state: 'inprogress',
              timestart: Date.now() - 300000,
              timefinish: 0,
              progress: 40
            }
          ]
        };

      case 'core_webservice_get_site_info':
        return {
          sitename: 'Mock Moodle Site',
          version: '3.7.0',
          status: 'mock'
        };

      default:
        return { error: 'Unknown mock function' };
    }
  }
}

module.exports = new MoodleService();
