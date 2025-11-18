/**
 * Teacher Controller
 * Handles teacher dashboard and monitoring endpoints
 */

import { Request, Response } from 'express';
import { StudentModel } from '../models/studentModel';
import { ProblemModel } from '../models/problemModel';
import { TeacherDashboardData, StudentProgress, DifficultyLevel } from '../../../shared/types';

export class TeacherController {
  /**
   * GET /api/teacher/dashboard
   * Get comprehensive dashboard data
   */
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      // Get all students
      const students = await StudentModel.findAll();

      // Get progress for each student
      const studentProgressPromises = students.map(async (student) => {
        const metrics = await StudentModel.getPerformanceMetrics(student.id);
        const recentAttempts = await StudentModel.getRecentAttempts(student.id, 5);
        const difficultyHistory = await StudentModel.getDifficultyHistory(student.id, 5);

        return {
          studentId: student.id,
          student,
          performanceMetrics: metrics!,
          recentAttempts,
          difficultyHistory,
        } as StudentProgress;
      });

      const studentProgress = await Promise.all(studentProgressPromises);

      // Calculate aggregate statistics
      const totalStudents = students.length;
      const activeStudents = students.filter(
        s => s.totalProblemsAttempted > 0
      ).length;

      const averagePerformance =
        students.reduce((sum, s) => sum + s.performanceScore, 0) / totalStudents || 0;

      // Difficulty distribution
      const difficultyDistribution: Record<DifficultyLevel, number> = {
        [DifficultyLevel.VERY_EASY]: 0,
        [DifficultyLevel.EASY]: 0,
        [DifficultyLevel.MEDIUM]: 0,
        [DifficultyLevel.HARD]: 0,
        [DifficultyLevel.VERY_HARD]: 0,
      };

      students.forEach(student => {
        difficultyDistribution[student.currentDifficulty]++;
      });

      const dashboardData: TeacherDashboardData = {
        totalStudents,
        activeStudents,
        averagePerformance,
        students: studentProgress,
        difficultyDistribution,
      };

      res.json(dashboardData);
    } catch (error) {
      console.error('Error getting dashboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/teacher/students
   * Get list of all students with summary info
   */
  static async getAllStudents(req: Request, res: Response): Promise<void> {
    try {
      const students = await StudentModel.findAll();

      const studentsWithMetrics = await Promise.all(
        students.map(async (student) => {
          const metrics = await StudentModel.getPerformanceMetrics(student.id);
          return {
            ...student,
            metrics,
          };
        })
      );

      res.json(studentsWithMetrics);
    } catch (error) {
      console.error('Error getting students:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/teacher/students/:id
   * Get detailed information for a specific student
   */
  static async getStudentDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await StudentModel.findById(id);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const metrics = await StudentModel.getPerformanceMetrics(id);
      const recentAttempts = await StudentModel.getRecentAttempts(id, 20);
      const allAttempts = await StudentModel.getAllAttempts(id);
      const difficultyHistory = await StudentModel.getDifficultyHistory(id);

      res.json({
        student,
        metrics,
        recentAttempts,
        allAttempts,
        difficultyHistory,
      });
    } catch (error) {
      console.error('Error getting student detail:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/teacher/analytics
   * Get system-wide analytics
   */
  static async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const students = await StudentModel.findAll();
      const problems = await ProblemModel.findAll();
      const problemCounts = await ProblemModel.countByDifficulty();

      // Calculate statistics
      const totalAttempts = students.reduce(
        (sum, s) => sum + s.totalProblemsAttempted,
        0
      );

      const totalCorrect = students.reduce(
        (sum, s) => sum + s.totalCorrect,
        0
      );

      const overallAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

      const averageSolveTime =
        students.reduce((sum, s) => sum + s.averageSolveTime, 0) / students.length || 0;

      // Performance by difficulty
      const performanceByDifficulty: Record<DifficultyLevel, {
        studentCount: number;
        averagePerformance: number;
      }> = {
        [DifficultyLevel.VERY_EASY]: { studentCount: 0, averagePerformance: 0 },
        [DifficultyLevel.EASY]: { studentCount: 0, averagePerformance: 0 },
        [DifficultyLevel.MEDIUM]: { studentCount: 0, averagePerformance: 0 },
        [DifficultyLevel.HARD]: { studentCount: 0, averagePerformance: 0 },
        [DifficultyLevel.VERY_HARD]: { studentCount: 0, averagePerformance: 0 },
      };

      students.forEach(student => {
        const diff = student.currentDifficulty;
        performanceByDifficulty[diff].studentCount++;
        performanceByDifficulty[diff].averagePerformance += student.performanceScore;
      });

      // Calculate averages
      Object.keys(performanceByDifficulty).forEach(key => {
        const diff = parseInt(key) as DifficultyLevel;
        const data = performanceByDifficulty[diff];
        if (data.studentCount > 0) {
          data.averagePerformance /= data.studentCount;
        }
      });

      res.json({
        totalStudents: students.length,
        totalProblems: problems.length,
        totalAttempts,
        totalCorrect,
        overallAccuracy,
        averageSolveTime,
        problemCounts,
        performanceByDifficulty,
      });
    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default TeacherController;
