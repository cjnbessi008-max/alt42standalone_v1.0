import { Progress, Submission } from '../models/index.js';
import { logger } from '../config/logger.js';
import { Op } from 'sequelize';

// Get student progress
export const getProgress = async (req, res) => {
  try {
    const { studentId } = req.params;

    let progress = await Progress.findOne({
      where: { studentId }
    });

    // If no progress record exists, create one
    if (!progress) {
      progress = await Progress.create({ studentId });
    }

    // Get recent submissions for detailed analysis
    const recentSubmissions = await Submission.findAll({
      where: { studentId },
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: ['problem']
    });

    res.json({
      progress,
      recentActivity: recentSubmissions
    });
  } catch (error) {
    logger.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
};

// Update student progress (usually called internally)
export const updateProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const updateData = req.body;

    let progress = await Progress.findOne({
      where: { studentId }
    });

    if (!progress) {
      progress = await Progress.create({
        studentId,
        ...updateData
      });
    } else {
      await progress.update(updateData);
    }

    logger.info(`Progress updated for student: ${studentId}`);
    res.json(progress);
  } catch (error) {
    logger.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
};

// Get leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = await Progress.findAll({
      order: [
        ['experiencePoints', 'DESC'],
        ['overallAccuracy', 'DESC']
      ],
      limit: parseInt(limit)
    });

    res.json({ leaderboard });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
