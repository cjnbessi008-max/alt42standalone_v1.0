/**
 * LMS Controller
 * Handles HTTP requests for LMS integration operations
 */

import { Request, Response } from 'express';
import lmsService from '../services/lmsService';

export class LMSController {
  /**
   * Sync student progress with external LMS
   * POST /api/lms/sync
   */
  async syncWithLMS(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, moduleId } = req.body;

      if (!studentId || !moduleId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: studentId, moduleId',
        });
        return;
      }

      await lmsService.syncStudentProgress(studentId, moduleId);

      res.status(200).json({
        success: true,
        message: 'Successfully synced with LMS',
      });
    } catch (error) {
      console.error('Error in syncWithLMS:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync with LMS',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Export grades to LMS for all students in a module
   * POST /api/lms/export/:moduleId
   */
  async exportGrades(req: Request, res: Response): Promise<void> {
    try {
      const { moduleId } = req.params;

      if (!moduleId) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: moduleId',
        });
        return;
      }

      await lmsService.exportGradesToLMS(moduleId);

      res.status(200).json({
        success: true,
        message: 'Successfully exported grades to LMS',
      });
    } catch (error) {
      console.error('Error in exportGrades:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export grades to LMS',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Import student roster from LMS
   * POST /api/lms/import/:moduleId
   */
  async importRoster(req: Request, res: Response): Promise<void> {
    try {
      const { moduleId } = req.params;

      if (!moduleId) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: moduleId',
        });
        return;
      }

      const students = await lmsService.importStudentRoster(moduleId);

      res.status(200).json({
        success: true,
        message: 'Successfully imported student roster from LMS',
        data: students,
      });
    } catch (error) {
      console.error('Error in importRoster:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import student roster from LMS',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get student information
   * GET /api/students/:studentId
   */
  async getStudent(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;

      // In real implementation, fetch from database
      const student = {
        id: studentId,
        name: 'Sample Student',
        email: 'student@kaist.ac.kr',
        studentId: '20231234',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      res.status(200).json({
        success: true,
        data: student,
      });
    } catch (error) {
      console.error('Error in getStudent:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student information',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new LMSController();
