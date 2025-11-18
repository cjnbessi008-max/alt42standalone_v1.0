/**
 * LMS Integration Service
 * Handles communication with Moodle LMS (MySQL 5.7 + PHP 7.1.9 + Moodle 3.7)
 */

import {
  Problem,
  LMSProblemResponse,
  AnswerSubmission,
  DiscontinuityType,
  RippleBehavior
} from '@/types';

/**
 * LMS API Configuration
 */
interface LMSConfig {
  baseUrl: string;
  apiToken?: string;
  wsToken?: string; // Moodle web service token
}

class LMSService {
  private config: LMSConfig;

  constructor(config: LMSConfig) {
    this.config = config;
  }

  /**
   * Fetch problem from Moodle LMS
   * @param problemId - Problem ID from Moodle
   * @returns Problem data with math function and discontinuity information
   */
  async fetchProblem(problemId: string): Promise<LMSProblemResponse> {
    try {
      // In production, this would make an actual API call to Moodle
      // Example: POST to /webservice/rest/server.php
      // with wstoken, wsfunction=local_breakripple_get_problem, problemid

      const response = await fetch(
        `${this.config.baseUrl}/webservice/rest/server.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            wstoken: this.config.wsToken || '',
            wsfunction: 'local_breakripple_get_problem',
            moodlewsrestformat: 'json',
            problemid: problemId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`LMS API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform Moodle response to our Problem format
      const problem = this.transformMoodleResponse(data);

      return {
        success: true,
        problem,
        sessionId: this.generateSessionId(),
      };
    } catch (error) {
      console.error('Failed to fetch problem from LMS:', error);

      // Return mock data for development
      return this.getMockProblem(problemId);
    }
  }

  /**
   * Submit student answer to Moodle LMS
   * @param submission - Student answer submission
   * @returns Success status and feedback
   */
  async submitAnswer(submission: AnswerSubmission): Promise<{
    success: boolean;
    correct: boolean;
    feedback?: string;
    score?: number;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/webservice/rest/server.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            wstoken: this.config.wsToken || '',
            wsfunction: 'local_breakripple_submit_answer',
            moodlewsrestformat: 'json',
            problemid: submission.problemId,
            studentid: submission.studentId,
            answer: submission.answer,
            timespent: submission.timeSpent.toString(),
            attempts: submission.attempts.toString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`LMS API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        correct: data.correct,
        feedback: data.feedback,
        score: data.score,
      };
    } catch (error) {
      console.error('Failed to submit answer to LMS:', error);

      return {
        success: false,
        correct: false,
        feedback: 'Failed to submit answer. Please try again.',
      };
    }
  }

  /**
   * Transform Moodle API response to internal Problem format
   */
  private transformMoodleResponse(moodleData: any): Problem {
    // Parse Moodle's custom fields and transform to our format
    return {
      id: moodleData.id,
      title: moodleData.title || moodleData.name,
      description: moodleData.description,
      difficulty: moodleData.difficulty || 'medium',
      mathFunction: {
        id: moodleData.functionId,
        expression: moodleData.functionExpression,
        domain: [
          parseFloat(moodleData.domainMin),
          parseFloat(moodleData.domainMax),
        ],
        range: [
          parseFloat(moodleData.rangeMin),
          parseFloat(moodleData.rangeMax),
        ],
        discontinuityPoints: (moodleData.discontinuities || []).map((d: any) => ({
          x: parseFloat(d.x),
          leftLimit: d.leftLimit !== null ? parseFloat(d.leftLimit) : null,
          rightLimit: d.rightLimit !== null ? parseFloat(d.rightLimit) : null,
          functionValue: d.functionValue !== null ? parseFloat(d.functionValue) : null,
          type: d.type as DiscontinuityType,
          rippleBehavior: d.rippleBehavior as RippleBehavior,
        })),
      },
      instructions: moodleData.instructions,
      expectedAnswer: moodleData.expectedAnswer,
      hints: moodleData.hints ? JSON.parse(moodleData.hints) : [],
      metadata: {
        subject: moodleData.subject || 'Mathematics',
        gradeLevel: moodleData.gradeLevel || '9-12',
        topic: moodleData.topic || 'Continuity',
        tags: moodleData.tags ? moodleData.tags.split(',') : [],
      },
    };
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get mock problem data for development/testing
   */
  getMockProblem(problemId: string): LMSProblemResponse {
    const mockProblems: { [key: string]: Problem } = {
      '1': {
        id: '1',
        title: '점프 불연속 (Jump Discontinuity)',
        description: '함수가 특정 지점에서 급격하게 값이 변하는 점프 불연속을 관찰하세요.',
        difficulty: 'easy',
        mathFunction: {
          id: 'func_1',
          expression: 'x < 2 ? x^2 : x + 3',
          domain: [-1, 5],
          range: [-1, 10],
          discontinuityPoints: [
            {
              x: 2,
              leftLimit: 4,  // lim(x→2-) f(x) = 2^2 = 4
              rightLimit: 5, // lim(x→2+) f(x) = 2 + 3 = 5
              functionValue: null, // Function not defined at x=2
              type: DiscontinuityType.JUMP,
              rippleBehavior: RippleBehavior.BREAK,
            },
          ],
        },
        instructions: '물결이 x=2에서 어떻게 동작하는지 관찰하세요. 불연속점에서 물결이 끊어집니다.',
        expectedAnswer: 'jump',
        hints: [
          '좌극한과 우극한이 서로 다릅니다.',
          '물결이 불연속점에 도달하면 산산조각 납니다.',
        ],
        metadata: {
          subject: 'Mathematics',
          gradeLevel: '10-11',
          topic: 'Limits and Continuity',
          tags: ['discontinuity', 'jump', 'limits'],
        },
      },
      '2': {
        id: '2',
        title: '제거 가능한 불연속 (Removable Discontinuity)',
        description: '함수에 구멍이 있지만, 적절한 값으로 정의하면 연속이 될 수 있는 경우를 관찰하세요.',
        difficulty: 'medium',
        mathFunction: {
          id: 'func_2',
          expression: '(x^2 - 4) / (x - 2)',
          domain: [-1, 5],
          range: [-1, 10],
          discontinuityPoints: [
            {
              x: 2,
              leftLimit: 4,  // lim(x→2-) (x^2-4)/(x-2) = lim(x+2) = 4
              rightLimit: 4, // lim(x→2+) (x^2-4)/(x-2) = lim(x+2) = 4
              functionValue: null, // 0/0 at x=2
              type: DiscontinuityType.REMOVABLE,
              rippleBehavior: RippleBehavior.DAMPEN,
            },
          ],
        },
        instructions: 'x=2에서 함수가 정의되지 않지만, 극한값은 존재합니다. 물결이 약해집니다.',
        expectedAnswer: 'removable',
        hints: [
          '좌극한과 우극한이 같습니다.',
          '함수를 적절히 정의하면 연속이 될 수 있습니다.',
        ],
        metadata: {
          subject: 'Mathematics',
          gradeLevel: '11-12',
          topic: 'Limits and Continuity',
          tags: ['discontinuity', 'removable', 'limits', 'hole'],
        },
      },
      '3': {
        id: '3',
        title: '무한 불연속 (Infinite Discontinuity)',
        description: '함수값이 무한대로 발산하는 수직 점근선을 관찰하세요.',
        difficulty: 'hard',
        mathFunction: {
          id: 'func_3',
          expression: '1 / (x - 2)',
          domain: [-1, 5],
          range: [-10, 10],
          discontinuityPoints: [
            {
              x: 2,
              leftLimit: -Infinity, // lim(x→2-) 1/(x-2) = -∞
              rightLimit: Infinity,  // lim(x→2+) 1/(x-2) = +∞
              functionValue: null,
              type: DiscontinuityType.INFINITE,
              rippleBehavior: RippleBehavior.REFLECT,
            },
          ],
        },
        instructions: '물결이 수직 점근선에서 반사됩니다. 함수값이 무한대로 발산합니다.',
        expectedAnswer: 'infinite',
        hints: [
          '분모가 0이 되어 함수값이 정의되지 않습니다.',
          '좌극한과 우극한이 모두 무한대입니다.',
        ],
        metadata: {
          subject: 'Mathematics',
          gradeLevel: '11-12',
          topic: 'Limits and Continuity',
          tags: ['discontinuity', 'infinite', 'asymptote', 'limits'],
        },
      },
    };

    const problem = mockProblems[problemId] || mockProblems['1'];

    return {
      success: true,
      problem,
      sessionId: this.generateSessionId(),
    };
  }
}

// Create singleton instance
let lmsServiceInstance: LMSService | null = null;

/**
 * Initialize LMS service with configuration
 */
export const initLMSService = (config: LMSConfig): LMSService => {
  lmsServiceInstance = new LMSService(config);
  return lmsServiceInstance;
};

/**
 * Get LMS service instance
 */
export const getLMSService = (): LMSService => {
  if (!lmsServiceInstance) {
    // Default configuration for development
    lmsServiceInstance = new LMSService({
      baseUrl: process.env.REACT_APP_MOODLE_URL || 'http://localhost/moodle',
      wsToken: process.env.REACT_APP_MOODLE_WS_TOKEN,
    });
  }
  return lmsServiceInstance;
};

export default LMSService;
