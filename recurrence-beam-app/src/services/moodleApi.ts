import axios, { type AxiosInstance } from 'axios';
import type { MoodleConfig, MoodleProblemResponse, RecurrenceProblem } from '../types';

/**
 * Moodle REST API Integration Service
 * Connects to Moodle 3.7 with MySQL 5.7 backend
 */
class MoodleApiService {
  private api: AxiosInstance;
  private config: MoodleConfig;

  constructor(config: MoodleConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch problems from Moodle using web service API
   */
  async fetchProblems(courseId?: string): Promise<RecurrenceProblem[]> {
    try {
      const response = await this.api.get('/webservice/rest/server.php', {
        params: {
          wstoken: this.config.token,
          wsfunction: 'mod_quiz_get_quizzes_by_courses',
          moodlewsrestformat: 'json',
          courseids: courseId ? [courseId] : [],
        },
      });

      return this.transformMoodleProblems(response.data.quizzes || []);
    } catch (error) {
      console.error('Failed to fetch Moodle problems:', error);
      // Return sample problems for demo purposes
      return this.getSampleProblems();
    }
  }

  /**
   * Transform Moodle quiz data to RecurrenceProblem format
   */
  private transformMoodleProblems(moodleData: MoodleProblemResponse[]): RecurrenceProblem[] {
    return moodleData.map((quiz) => {
      let customData;
      try {
        customData = quiz.custom_data ? JSON.parse(quiz.custom_data) : {};
      } catch {
        customData = {};
      }

      return {
        id: String(quiz.id),
        title: quiz.name,
        description: quiz.intro || '',
        formula: customData.formula || 'f(n) = f(n-1) + f(n-2)',
        initialConditions: customData.initialConditions || { 'f(0)': 0, 'f(1)': 1 },
        maxSteps: customData.maxSteps || 10,
      };
    });
  }

  /**
   * Sample problems for testing without Moodle connection
   */
  getSampleProblems(): RecurrenceProblem[] {
    return [
      {
        id: 'fibonacci',
        title: '피보나치 수열 (Fibonacci Sequence)',
        description: '각 항이 앞의 두 항의 합인 수열입니다.',
        formula: 'f(n) = f(n-1) + f(n-2)',
        initialConditions: { 'f(0)': 0, 'f(1)': 1 },
        maxSteps: 10,
      },
      {
        id: 'factorial',
        title: '계승 수열 (Factorial Sequence)',
        description: '각 항이 이전 항에 n을 곱한 수열입니다.',
        formula: 'f(n) = n × f(n-1)',
        initialConditions: { 'f(0)': 1 },
        maxSteps: 8,
      },
      {
        id: 'arithmetic',
        title: '등차수열 (Arithmetic Sequence)',
        description: '공차가 2인 등차수열입니다.',
        formula: 'f(n) = f(n-1) + 2',
        initialConditions: { 'f(0)': 1 },
        maxSteps: 10,
      },
      {
        id: 'geometric',
        title: '등비수열 (Geometric Sequence)',
        description: '공비가 2인 등비수열입니다.',
        formula: 'f(n) = 2 × f(n-1)',
        initialConditions: { 'f(0)': 1 },
        maxSteps: 8,
      },
      {
        id: 'lucas',
        title: '루카스 수열 (Lucas Numbers)',
        description: '피보나치와 유사하지만 초기값이 다른 수열입니다.',
        formula: 'f(n) = f(n-1) + f(n-2)',
        initialConditions: { 'f(0)': 2, 'f(1)': 1 },
        maxSteps: 10,
      },
    ];
  }
}

export default MoodleApiService;
