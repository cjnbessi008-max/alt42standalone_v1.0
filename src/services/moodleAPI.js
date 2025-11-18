import axios from 'axios';

/**
 * Moodle LMS API Service
 * Compatible with Moodle 3.7, PHP 7.1.9, MySQL 5.7
 *
 * This service handles:
 * - Connection to Moodle LMS
 * - Fetching problem/quiz data
 * - Answer validation with partial correctness scoring
 */

class MoodleService {
  constructor() {
    // Moodle configuration
    // In production, these should be in environment variables
    this.config = {
      baseURL: process.env.REACT_APP_MOODLE_URL || 'http://localhost/moodle',
      wsToken: process.env.REACT_APP_MOODLE_TOKEN || 'demo_token',
      wsFunction: 'webservice/rest/server.php',
      format: 'json'
    };

    // Initialize axios instance
    this.api = axios.create({
      baseURL: this.config.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Demo problems for testing when Moodle is not available
    this.demoProblems = [
      {
        id: 'demo-1',
        title: '분수 덧셈',
        question: '1/2 + 1/4 = ?',
        correctAnswer: '3/4',
        type: 'fraction',
        hints: ['분모를 같게 만드세요', '공통분모는 4입니다']
      },
      {
        id: 'demo-2',
        title: '간단한 곱셈',
        question: '7 × 8 = ?',
        correctAnswer: '56',
        type: 'multiplication',
        hints: ['7을 8번 더하면?', '50보다 크고 60보다 작습니다']
      },
      {
        id: 'demo-3',
        title: '분수 나눗셈',
        question: '2/3 ÷ 1/6 = ?',
        correctAnswer: '4',
        type: 'fraction',
        hints: ['나눗셈은 역수를 곱하는 것과 같습니다', '2/3 × 6/1 = ?']
      }
    ];

    this.currentProblemIndex = 0;
  }

  /**
   * Check connection to Moodle LMS
   * @returns {Promise<boolean>}
   */
  async checkConnection() {
    try {
      const response = await this.api.get(this.config.wsFunction, {
        params: {
          wstoken: this.config.wsToken,
          wsfunction: 'core_webservice_get_site_info',
          moodlewsrestformat: this.config.format
        }
      });

      if (response.data && !response.data.exception) {
        console.log('Moodle connection successful:', response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Moodle connection failed, using demo mode:', error.message);
      return false;
    }
  }

  /**
   * Get a problem from Moodle or demo data
   * @returns {Promise<Object>}
   */
  async getProblem() {
    try {
      // Try to fetch from Moodle
      const response = await this.fetchMoodleQuiz();

      if (response && response.data && !response.data.exception) {
        return this.parseMoodleQuestion(response.data);
      }
    } catch (error) {
      console.warn('Failed to fetch from Moodle, using demo problem:', error.message);
    }

    // Fallback to demo problems
    return this.getDemoProblem();
  }

  /**
   * Fetch quiz/question from Moodle
   * @returns {Promise<Object>}
   */
  async fetchMoodleQuiz() {
    return await this.api.get(this.config.wsFunction, {
      params: {
        wstoken: this.config.wsToken,
        wsfunction: 'mod_quiz_get_quiz_by_courses',
        moodlewsrestformat: this.config.format
      }
    });
  }

  /**
   * Parse Moodle question data
   * @param {Object} data - Moodle response data
   * @returns {Object}
   */
  parseMoodleQuestion(data) {
    // Parse Moodle question format
    // This is a simplified parser - adjust based on actual Moodle response
    if (data.quizzes && data.quizzes.length > 0) {
      const quiz = data.quizzes[0];
      return {
        id: quiz.id,
        title: quiz.name,
        question: quiz.intro || 'Question from Moodle',
        correctAnswer: '', // Extract from quiz data
        type: 'moodle',
        moodleData: quiz
      };
    }

    return this.getDemoProblem();
  }

  /**
   * Get a demo problem for testing
   * @returns {Object}
   */
  getDemoProblem() {
    const problem = this.demoProblems[this.currentProblemIndex];
    this.currentProblemIndex = (this.currentProblemIndex + 1) % this.demoProblems.length;
    return problem;
  }

  /**
   * Check answer correctness with partial scoring
   * Returns warmth level (0-100)
   *
   * @param {Object} problem - Problem object
   * @param {string} answer - User's answer
   * @returns {number} - Warmth level (0-100)
   */
  checkAnswer(problem, answer) {
    if (!problem || !answer) return 0;

    const userAnswer = this.normalizeAnswer(answer);
    const correctAnswer = this.normalizeAnswer(problem.correctAnswer);

    // Exact match = 100%
    if (userAnswer === correctAnswer) {
      return 100;
    }

    // Calculate partial correctness based on problem type
    switch (problem.type) {
      case 'fraction':
        return this.checkFractionAnswer(userAnswer, correctAnswer);

      case 'multiplication':
      case 'number':
        return this.checkNumericAnswer(userAnswer, correctAnswer);

      default:
        return this.checkGenericAnswer(userAnswer, correctAnswer);
    }
  }

  /**
   * Normalize answer string
   * @param {string} answer
   * @returns {string}
   */
  normalizeAnswer(answer) {
    return answer.toString().trim().toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Check fraction answer with partial correctness
   * @param {string} userAnswer
   * @param {string} correctAnswer
   * @returns {number}
   */
  checkFractionAnswer(userAnswer, correctAnswer) {
    const parseFraction = (str) => {
      const parts = str.split('/');
      if (parts.length !== 2) return null;
      const numerator = parseInt(parts[0]);
      const denominator = parseInt(parts[1]);
      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return null;
      return { numerator, denominator, value: numerator / denominator };
    };

    const userFrac = parseFraction(userAnswer);
    const correctFrac = parseFraction(correctAnswer);

    if (!userFrac || !correctFrac) return 0;

    // Check if equivalent fractions
    if (Math.abs(userFrac.value - correctFrac.value) < 0.001) {
      return 100;
    }

    // Check if denominator is correct (50%)
    if (userFrac.denominator === correctFrac.denominator) {
      // Check how close numerator is
      const diff = Math.abs(userFrac.numerator - correctFrac.numerator);
      if (diff === 0) return 100;
      if (diff === 1) return 70;
      if (diff === 2) return 50;
      return 30;
    }

    // Check if numerator is correct (40%)
    if (userFrac.numerator === correctFrac.numerator) {
      return 40;
    }

    // Check if value is close (partial credit)
    const valueDiff = Math.abs(userFrac.value - correctFrac.value);
    if (valueDiff < 0.1) return 60;
    if (valueDiff < 0.25) return 40;
    if (valueDiff < 0.5) return 20;

    return 10; // At least trying
  }

  /**
   * Check numeric answer
   * @param {string} userAnswer
   * @param {string} correctAnswer
   * @returns {number}
   */
  checkNumericAnswer(userAnswer, correctAnswer) {
    const userNum = parseFloat(userAnswer);
    const correctNum = parseFloat(correctAnswer);

    if (isNaN(userNum) || isNaN(correctNum)) return 0;

    if (userNum === correctNum) return 100;

    const diff = Math.abs(userNum - correctNum);
    const percentDiff = (diff / correctNum) * 100;

    // Tolerance-based scoring
    if (percentDiff < 1) return 95;
    if (percentDiff < 5) return 80;
    if (percentDiff < 10) return 60;
    if (percentDiff < 20) return 40;
    if (percentDiff < 50) return 20;

    return 10;
  }

  /**
   * Check generic answer (string comparison)
   * @param {string} userAnswer
   * @param {string} correctAnswer
   * @returns {number}
   */
  checkGenericAnswer(userAnswer, correctAnswer) {
    if (userAnswer === correctAnswer) return 100;

    // Calculate string similarity (Levenshtein distance based)
    const similarity = this.calculateStringSimilarity(userAnswer, correctAnswer);

    if (similarity > 0.9) return 90;
    if (similarity > 0.8) return 70;
    if (similarity > 0.6) return 50;
    if (similarity > 0.4) return 30;
    if (similarity > 0.2) return 15;

    return 5;
  }

  /**
   * Calculate string similarity (0-1)
   * @param {string} str1
   * @param {string} str2
   * @returns {number}
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   * @param {string} str1
   * @param {string} str2
   * @returns {number}
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Submit answer to Moodle (for grade recording)
   * @param {string} quizId
   * @param {string} answer
   * @returns {Promise<Object>}
   */
  async submitAnswerToMoodle(quizId, answer) {
    try {
      const response = await this.api.post(this.config.wsFunction, null, {
        params: {
          wstoken: this.config.wsToken,
          wsfunction: 'mod_quiz_process_attempt',
          moodlewsrestformat: this.config.format,
          attemptid: quizId,
          data: JSON.stringify({ answer })
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to submit answer to Moodle:', error);
      throw error;
    }
  }
}

// Export singleton instance
const moodleService = new MoodleService();
export default moodleService;
