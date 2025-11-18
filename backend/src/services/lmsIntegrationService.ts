/**
 * LMS Integration Service
 * Provides interface for integrating with external Learning Management Systems
 */

import axios from 'axios';
import { logger } from '../utils/logger.js';

interface LMSConfig {
  apiUrl: string;
  apiKey: string;
}

export class LMSIntegrationService {
  private config: LMSConfig;

  constructor() {
    this.config = {
      apiUrl: process.env.LMS_API_URL || 'http://localhost:3000',
      apiKey: process.env.LMS_API_KEY || ''
    };
  }

  /**
   * Fetch student data from LMS
   */
  async getStudentFromLMS(studentId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/students/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Fetched student data from LMS for ${studentId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch student from LMS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch module/course data from LMS
   */
  async getModuleFromLMS(moduleId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/courses/${moduleId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Fetched module data from LMS for ${moduleId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch module from LMS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync student progress to LMS
   */
  async syncProgressToLMS(studentId: string, moduleId: string, progress: any): Promise<void> {
    try {
      await axios.post(
        `${this.config.apiUrl}/api/progress`,
        {
          studentId,
          moduleId,
          progress
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Synced progress to LMS for student ${studentId}, module ${moduleId}`);
    } catch (error: any) {
      logger.error(`Failed to sync progress to LMS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Report metacognition insights to LMS
   */
  async reportMetacognitionToLMS(studentId: string, insights: any): Promise<void> {
    try {
      await axios.post(
        `${this.config.apiUrl}/api/analytics/metacognition`,
        {
          studentId,
          insights,
          timestamp: new Date()
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Reported metacognition insights to LMS for student ${studentId}`);
    } catch (error: any) {
      logger.error(`Failed to report metacognition to LMS: ${error.message}`);
      // Don't throw - this is not critical
    }
  }

  /**
   * Get enrolled modules for a student from LMS
   */
  async getStudentEnrollments(studentId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.config.apiUrl}/api/students/${studentId}/enrollments`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Fetched enrollments from LMS for student ${studentId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch enrollments from LMS: ${error.message}`);
      return [];
    }
  }

  /**
   * Webhook handler for LMS events
   */
  async handleLMSWebhook(event: any): Promise<void> {
    logger.info(`Received LMS webhook: ${event.type}`);

    switch (event.type) {
      case 'student.enrolled':
        // Handle new student enrollment
        logger.info(`Student enrolled: ${event.data.studentId} in module ${event.data.moduleId}`);
        break;

      case 'student.unenrolled':
        // Handle student unenrollment
        logger.info(`Student unenrolled: ${event.data.studentId} from module ${event.data.moduleId}`);
        break;

      case 'module.updated':
        // Handle module updates
        logger.info(`Module updated: ${event.data.moduleId}`);
        break;

      default:
        logger.warn(`Unknown webhook event type: ${event.type}`);
    }
  }

  /**
   * Validate LMS connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/health`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        timeout: 5000
      });

      return response.status === 200;
    } catch (error: any) {
      logger.error(`LMS connection validation failed: ${error.message}`);
      return false;
    }
  }
}
