/**
 * Moodle LMS Integration Service
 * Handles communication with Moodle 3.7 API
 */

import axios, { AxiosInstance } from 'axios';
import { Problem, Submission, Progress, MoodleResponse, MoodleSession } from '../types';

class MoodleService {
  private api: AxiosInstance;
  private session: MoodleSession | null = null;

  constructor() {
    // Initialize axios with Moodle base URL
    this.api = axios.create({
      baseURL: process.env.MOODLE_URL || 'http://localhost/moodle',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize session from URL parameters or localStorage
    this.initializeSession();
  }

  /**
   * Initialize Moodle session from URL parameters
   */
  private initializeSession(): void {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || localStorage.getItem('moodle_token');
    const userId = params.get('userid') || localStorage.getItem('moodle_userid');
    const courseId = params.get('courseid') || localStorage.getItem('moodle_courseid');
    const activityId = params.get('activityid') || localStorage.getItem('moodle_activityid');

    if (token && userId && courseId && activityId) {
      this.session = { token, userId, courseId, activityId };
      // Store in localStorage for persistence
      localStorage.setItem('moodle_token', token);
      localStorage.setItem('moodle_userid', userId);
      localStorage.setItem('moodle_courseid', courseId);
      localStorage.setItem('moodle_activityid', activityId);
    }
  }

  /**
   * Check if session is valid
   */
  isAuthenticated(): boolean {
    return this.session !== null;
  }

  /**
   * Get current session
   */
  getSession(): MoodleSession | null {
    return this.session;
  }

  /**
   * Fetch problem from Moodle
   */
  async fetchProblem(problemId?: string): Promise<MoodleResponse<Problem>> {
    if (!this.session) {
      return { success: false, error: 'No active Moodle session' };
    }

    try {
      const response = await this.api.post('/webservice/rest/server.php', null, {
        params: {
          wstoken: this.session.token,
          wsfunction: 'mod_unitcompass_get_problem',
          moodlewsrestformat: 'json',
          courseid: this.session.courseId,
          activityid: this.session.activityId,
          problemid: problemId || '',
        },
      });

      if (response.data.exception) {
        return { success: false, error: response.data.message };
      }

      return { success: true, data: this.parseProblem(response.data) };
    } catch (error) {
      console.error('Error fetching problem from Moodle:', error);
      return { success: false, error: 'Failed to fetch problem' };
    }
  }

  /**
   * Submit answer to Moodle
   */
  async submitAnswer(submission: Submission): Promise<MoodleResponse<{ isCorrect: boolean; feedback: string }>> {
    if (!this.session) {
      return { success: false, error: 'No active Moodle session' };
    }

    try {
      const response = await this.api.post('/webservice/rest/server.php', null, {
        params: {
          wstoken: this.session.token,
          wsfunction: 'mod_unitcompass_submit_answer',
          moodlewsrestformat: 'json',
          problemid: submission.problemId,
          userid: this.session.userId,
          answerx: submission.answer.x,
          answery: submission.answer.y,
          attempt: submission.attemptNumber,
        },
      });

      if (response.data.exception) {
        return { success: false, error: response.data.message };
      }

      return {
        success: true,
        data: {
          isCorrect: response.data.iscorrect,
          feedback: response.data.feedback,
        },
      };
    } catch (error) {
      console.error('Error submitting answer to Moodle:', error);
      return { success: false, error: 'Failed to submit answer' };
    }
  }

  /**
   * Get student progress
   */
  async getProgress(): Promise<MoodleResponse<Progress>> {
    if (!this.session) {
      return { success: false, error: 'No active Moodle session' };
    }

    try {
      const response = await this.api.post('/webservice/rest/server.php', null, {
        params: {
          wstoken: this.session.token,
          wsfunction: 'mod_unitcompass_get_progress',
          moodlewsrestformat: 'json',
          userid: this.session.userId,
          courseid: this.session.courseId,
        },
      });

      if (response.data.exception) {
        return { success: false, error: response.data.message };
      }

      return { success: true, data: this.parseProgress(response.data) };
    } catch (error) {
      console.error('Error fetching progress from Moodle:', error);
      return { success: false, error: 'Failed to fetch progress' };
    }
  }

  /**
   * Parse Moodle problem response
   */
  private parseProblem(data: any): Problem {
    return {
      id: data.id || data.problemid,
      title: data.title || data.name,
      description: data.description || data.questiontext,
      type: data.type || 'direction',
      targetAngle: data.targetangle ? parseFloat(data.targetangle) : undefined,
      targetVector: data.targetvector
        ? {
            x: parseFloat(data.targetvector.x),
            y: parseFloat(data.targetvector.y),
            magnitude: parseFloat(data.targetvector.magnitude),
            angle: parseFloat(data.targetvector.angle),
          }
        : undefined,
      difficulty: data.difficulty || 'medium',
      hints: data.hints ? JSON.parse(data.hints) : [],
      maxAttempts: data.maxattempts ? parseInt(data.maxattempts) : 3,
    };
  }

  /**
   * Parse Moodle progress response
   */
  private parseProgress(data: any): Progress {
    return {
      studentId: data.userid,
      problemsSolved: parseInt(data.problemssolved || '0'),
      totalProblems: parseInt(data.totalproblems || '0'),
      accuracy: parseFloat(data.accuracy || '0'),
      lastActivity: new Date(data.lastactivity * 1000),
    };
  }
}

// Export singleton instance
export default new MoodleService();
