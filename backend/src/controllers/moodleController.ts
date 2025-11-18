import { Request, Response } from 'express';
import { getMoodleService } from '../services/moodle';
import logger from '../config/logger';

export const getMoodleProblems = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID is required',
      });
    }

    const moodleService = getMoodleService();
    const contents = await moodleService.getCourseContents(parseInt(courseId as string));

    // Transform Moodle data to our Problem format
    // This is a simplified example - adjust based on your Moodle structure
    const problems = contents.map((section: any) => ({
      id: `moodle_${section.id}`,
      number: section.id,
      divisors: [], // Extract from Moodle content
      difficulty: 'medium',
      timeLimit: 120,
    }));

    res.json({
      success: true,
      data: problems,
    });
  } catch (error) {
    logger.error('Error getting Moodle problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Moodle problems',
    });
  }
};

export const syncProgressToMoodle = async (req: Request, res: Response) => {
  try {
    const { studentId, problemId, score, timeSpent } = req.body;

    if (!studentId || !problemId || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const moodleService = getMoodleService();

    // Submit grade to Moodle
    // Adjust based on your Moodle setup
    const result = await moodleService.submitGrade({
      assignmentId: parseInt(problemId),
      userId: parseInt(studentId),
      grade: score,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error syncing to Moodle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync progress to Moodle',
    });
  }
};

export const getCourseInfo = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const moodleService = getMoodleService();
    const course = await moodleService.getCourse(parseInt(courseId));

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    logger.error('Error getting course info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course information',
    });
  }
};
