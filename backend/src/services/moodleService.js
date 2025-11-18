const axios = require('axios');
require('dotenv').config();

const MOODLE_URL = process.env.MOODLE_URL || '';
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || '';

/**
 * Moodle Web Service API Client
 * Compatible with Moodle 3.7
 */
class MoodleService {
  constructor() {
    this.baseURL = `${MOODLE_URL}/webservice/rest/server.php`;
    this.token = MOODLE_TOKEN;
  }

  /**
   * Make API request to Moodle
   */
  async request(functionName, params = {}) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          wstoken: this.token,
          wsfunction: functionName,
          moodlewsrestformat: 'json',
          ...params
        }
      });

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle API error');
      }

      return response.data;
    } catch (error) {
      console.error('Moodle API request failed:', error.message);
      throw error;
    }
  }

  /**
   * Get course information
   */
  async getCourse(courseId) {
    return await this.request('core_course_get_courses', {
      'options[ids][0]': courseId
    });
  }

  /**
   * Get quiz information
   */
  async getQuiz(quizId) {
    return await this.request('mod_quiz_get_quizzes_by_courses', {
      'courseids[0]': quizId
    });
  }

  /**
   * Get quiz questions
   */
  async getQuizQuestions(quizId) {
    return await this.request('mod_quiz_get_quiz_questions', {
      quizid: quizId
    });
  }

  /**
   * Get question details
   */
  async getQuestion(questionId) {
    return await this.request('core_question_get_question_data', {
      questionid: questionId
    });
  }

  /**
   * Parse Moodle question to our problem format
   */
  parseMoodleQuestion(moodleQuestion) {
    // Extract function expression from question text
    // This is a simplified parser - customize based on your question format
    const questionText = moodleQuestion.questiontext || '';

    // Look for function expression patterns like f(x) = ... or y = ...
    const functionMatch = questionText.match(/f\(x\)\s*=\s*([^<\n]+)/i) ||
                         questionText.match(/y\s*=\s*([^<\n]+)/i);

    const functionExpression = functionMatch ? functionMatch[1].trim() : '';

    // Extract domain if specified
    const domainMatch = questionText.match(/(-?\d+\.?\d*)\s*[≤<]\s*x\s*[≤<]\s*(-?\d+\.?\d*)/);

    return {
      moodle_problem_id: moodleQuestion.id?.toString() || '',
      title: moodleQuestion.name || 'Untitled Problem',
      description: this.stripHTML(questionText),
      function_expression: functionExpression || 'x',
      domain_start: domainMatch ? parseFloat(domainMatch[1]) : -10,
      domain_end: domainMatch ? parseFloat(domainMatch[2]) : 10,
      difficulty_level: this.assessDifficulty(questionText)
    };
  }

  /**
   * Strip HTML tags from text
   */
  stripHTML(html) {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Assess difficulty based on question complexity
   */
  assessDifficulty(questionText) {
    const text = questionText.toLowerCase();

    // Simple heuristic based on mathematical complexity
    if (text.includes('abs') || text.includes('절댓값') || text.includes('|')) {
      return 'medium';
    }
    if (text.includes('sin') || text.includes('cos') || text.includes('tan') ||
        text.includes('삼각함수')) {
      return 'hard';
    }
    if (text.includes('polynomial') || text.includes('다항식') ||
        text.includes('x^2') || text.includes('x²')) {
      return 'easy';
    }

    return 'medium';
  }

  /**
   * Sync problem from Moodle
   */
  async syncProblem(moodleQuestionId) {
    try {
      const moodleQuestion = await this.getQuestion(moodleQuestionId);
      const problemData = this.parseMoodleQuestion(moodleQuestion);

      return problemData;
    } catch (error) {
      console.error('Failed to sync problem from Moodle:', error.message);
      throw error;
    }
  }
}

module.exports = new MoodleService();
