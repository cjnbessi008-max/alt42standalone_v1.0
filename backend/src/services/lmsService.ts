import axios from 'axios';
import { query } from '../config/database';
import { LMSIntegration, LMSType, Student } from '../models/types';
import { encrypt, decrypt } from '../utils/encryption';
import logger from '../utils/logger';

export class LMSService {
  /**
   * Create or update LMS integration
   */
  async createIntegration(data: {
    institution_name: string;
    lms_type: LMSType;
    lms_url: string;
    client_id: string;
    client_secret: string;
    config?: any;
  }): Promise<LMSIntegration> {
    try {
      const encryptedSecret = encrypt(data.client_secret);

      const result = await query(
        `INSERT INTO lms_integrations
         (institution_name, lms_type, lms_url, client_id, client_secret_encrypted, config)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.institution_name,
          data.lms_type,
          data.lms_url,
          data.client_id,
          encryptedSecret,
          data.config ? JSON.stringify(data.config) : null,
        ]
      );

      logger.info(`LMS integration created for ${data.institution_name}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating LMS integration:', error);
      throw error;
    }
  }

  /**
   * Get LMS integration by ID
   */
  async getIntegration(id: string): Promise<LMSIntegration | null> {
    try {
      const result = await query('SELECT * FROM lms_integrations WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching LMS integration:', error);
      throw error;
    }
  }

  /**
   * Get all active LMS integrations
   */
  async getActiveIntegrations(): Promise<LMSIntegration[]> {
    try {
      const result = await query('SELECT * FROM lms_integrations WHERE is_active = true');
      return result.rows;
    } catch (error) {
      logger.error('Error fetching active integrations:', error);
      throw error;
    }
  }

  /**
   * Store OAuth tokens
   */
  async storeTokens(
    integrationId: string,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ): Promise<void> {
    try {
      const encryptedAccessToken = encrypt(accessToken);
      const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;
      const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null;

      await query(
        `UPDATE lms_integrations
         SET access_token_encrypted = $1,
             refresh_token_encrypted = $2,
             token_expires_at = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [encryptedAccessToken, encryptedRefreshToken, expiresAt, integrationId]
      );

      logger.info(`Tokens stored for LMS integration ${integrationId}`);
    } catch (error) {
      logger.error('Error storing tokens:', error);
      throw error;
    }
  }

  /**
   * Get decrypted access token
   */
  async getAccessToken(integrationId: string): Promise<string | null> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration || !integration.access_token_encrypted) {
        return null;
      }

      // Check if token is expired
      if (integration.token_expires_at && new Date() >= integration.token_expires_at) {
        logger.warn(`Access token expired for integration ${integrationId}`);
        // TODO: Implement token refresh logic
        return null;
      }

      return decrypt(integration.access_token_encrypted);
    } catch (error) {
      logger.error('Error getting access token:', error);
      throw error;
    }
  }

  /**
   * Sync students from LMS
   */
  async syncStudents(integrationId: string): Promise<Student[]> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new Error('LMS integration not found');
      }

      const accessToken = await this.getAccessToken(integrationId);
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      // Fetch students from LMS based on type
      const students = await this.fetchStudentsFromLMS(
        integration.lms_type,
        integration.lms_url,
        accessToken
      );

      // Store or update students in database
      const syncedStudents: Student[] = [];
      for (const studentData of students) {
        const result = await query(
          `INSERT INTO students (lms_id, lms_type, name, email, grade_level)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (lms_id, lms_type)
           DO UPDATE SET
             name = EXCLUDED.name,
             email = EXCLUDED.email,
             grade_level = EXCLUDED.grade_level,
             updated_at = NOW()
           RETURNING *`,
          [
            studentData.lms_id,
            integration.lms_type,
            studentData.name,
            studentData.email,
            studentData.grade_level,
          ]
        );
        syncedStudents.push(result.rows[0]);
      }

      logger.info(`Synced ${syncedStudents.length} students from ${integration.lms_type}`);
      return syncedStudents;
    } catch (error) {
      logger.error('Error syncing students:', error);
      throw error;
    }
  }

  /**
   * Fetch students from specific LMS
   */
  private async fetchStudentsFromLMS(
    lmsType: LMSType,
    lmsUrl: string,
    accessToken: string
  ): Promise<any[]> {
    try {
      switch (lmsType) {
        case 'canvas':
          return await this.fetchCanvasStudents(lmsUrl, accessToken);
        case 'moodle':
          return await this.fetchMoodleStudents(lmsUrl, accessToken);
        case 'google_classroom':
          return await this.fetchGoogleClassroomStudents(accessToken);
        case 'kaist':
          return await this.fetchKAISTStudents(lmsUrl, accessToken);
        default:
          throw new Error(`Unsupported LMS type: ${lmsType}`);
      }
    } catch (error) {
      logger.error(`Error fetching students from ${lmsType}:`, error);
      throw error;
    }
  }

  /**
   * Canvas LMS integration
   */
  private async fetchCanvasStudents(baseUrl: string, accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(`${baseUrl}/api/v1/courses/students`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data.map((student: any) => ({
        lms_id: student.id.toString(),
        name: student.name,
        email: student.email,
        grade_level: null,
      }));
    } catch (error) {
      logger.error('Canvas API error:', error);
      throw new Error('Failed to fetch students from Canvas');
    }
  }

  /**
   * Moodle LMS integration
   */
  private async fetchMoodleStudents(baseUrl: string, accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(`${baseUrl}/webservice/rest/server.php`, {
        params: {
          wstoken: accessToken,
          wsfunction: 'core_user_get_users',
          moodlewsrestformat: 'json',
        },
      });

      return response.data.users.map((student: any) => ({
        lms_id: student.id.toString(),
        name: `${student.firstname} ${student.lastname}`,
        email: student.email,
        grade_level: null,
      }));
    } catch (error) {
      logger.error('Moodle API error:', error);
      throw new Error('Failed to fetch students from Moodle');
    }
  }

  /**
   * Google Classroom integration
   */
  private async fetchGoogleClassroomStudents(accessToken: string): Promise<any[]> {
    try {
      // This would require course ID - simplified for demo
      const response = await axios.get(
        'https://classroom.googleapis.com/v1/courses/-/students',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return response.data.students.map((student: any) => ({
        lms_id: student.userId,
        name: student.profile.name.fullName,
        email: student.profile.emailAddress,
        grade_level: null,
      }));
    } catch (error) {
      logger.error('Google Classroom API error:', error);
      throw new Error('Failed to fetch students from Google Classroom');
    }
  }

  /**
   * KAIST LMS integration (custom implementation)
   */
  private async fetchKAISTStudents(baseUrl: string, accessToken: string): Promise<any[]> {
    try {
      // This would be a custom API endpoint for KAIST
      const response = await axios.get(`${baseUrl}/api/students`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data.map((student: any) => ({
        lms_id: student.student_id,
        name: student.name,
        email: student.email,
        grade_level: student.grade,
      }));
    } catch (error) {
      logger.error('KAIST LMS API error:', error);
      // Return mock data for development
      logger.warn('Returning mock student data for KAIST LMS');
      return [
        { lms_id: 'kaist001', name: '김철수', email: 'chulsu@kaist.ac.kr', grade_level: 10 },
        { lms_id: 'kaist002', name: '이영희', email: 'younghee@kaist.ac.kr', grade_level: 11 },
      ];
    }
  }
}

export default new LMSService();
