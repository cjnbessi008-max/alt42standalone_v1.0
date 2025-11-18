/**
 * Progress Service
 * Handles student progress tracking and updates
 */

import { Progress, Submission } from '../models/index.js';
import { logger } from '../config/logger.js';
import { Op } from 'sequelize';

/**
 * Update student progress after a submission
 */
export const updateStudentProgress = async (studentId, submissionData) => {
  try {
    const { problemId, isCorrect, score, timeSpent, quantifierType } = submissionData;

    // Find or create progress record
    let progress = await Progress.findOne({ where: { studentId } });

    if (!progress) {
      progress = await Progress.create({ studentId });
    }

    // Get all submissions for this student
    const allSubmissions = await Submission.findAll({
      where: { studentId },
      include: ['problem']
    });

    // Calculate overall statistics
    const totalAttempted = allSubmissions.length;
    const totalCorrect = allSubmissions.filter(s => s.isCorrect).length;
    const overallAccuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

    // Calculate quantifier-specific scores
    const universalSubmissions = allSubmissions.filter(
      s => s.problem?.quantifierType === 'universal'
    );
    const existentialSubmissions = allSubmissions.filter(
      s => s.problem?.quantifierType === 'existential'
    );

    const universalScore = calculateAverageScore(universalSubmissions);
    const existentialScore = calculateAverageScore(existentialSubmissions);

    // Calculate average time per problem
    const timesSpent = allSubmissions
      .filter(s => s.timeSpent)
      .map(s => s.timeSpent);
    const avgTime = timesSpent.length > 0
      ? timesSpent.reduce((a, b) => a + b, 0) / timesSpent.length
      : null;

    // Update streak
    const { currentStreak, longestStreak } = calculateStreaks(allSubmissions, isCorrect);

    // Calculate level and XP
    const xpGained = calculateXP(score, timeSpent, isCorrect);
    const newXP = progress.experiencePoints + xpGained;
    const newLevel = calculateLevel(newXP);

    // Identify weak areas
    const weakAreas = identifyWeakAreas(allSubmissions);

    // Check for new achievements
    const newAchievements = checkAchievements(progress, {
      totalAttempted,
      totalCorrect,
      currentStreak,
      newLevel
    });

    // Update progress
    await progress.update({
      totalProblemsAttempted: totalAttempted,
      totalProblemsCorrect: totalCorrect,
      overallAccuracy,
      universalQuantifierScore: universalScore,
      existentialQuantifierScore: existentialScore,
      averageTimePerProblem: avgTime,
      currentStreak,
      longestStreak: Math.max(longestStreak, progress.longestStreak),
      experiencePoints: newXP,
      level: newLevel,
      weakAreas,
      achievements: [...new Set([...progress.achievements, ...newAchievements])],
      lastActivityAt: new Date()
    });

    logger.info(`Progress updated for student ${studentId}: Level ${newLevel}, XP ${newXP}`);

    return progress;
  } catch (error) {
    logger.error('Error updating student progress:', error);
    throw error;
  }
};

/**
 * Calculate average score from submissions
 */
const calculateAverageScore = (submissions) => {
  if (submissions.length === 0) return 0;

  const scores = submissions.map(s => s.score || 0);
  return scores.reduce((a, b) => a + b, 0) / scores.length;
};

/**
 * Calculate current and longest streaks
 */
const calculateStreaks = (submissions, latestIsCorrect) => {
  if (submissions.length === 0) {
    return { currentStreak: latestIsCorrect ? 1 : 0, longestStreak: latestIsCorrect ? 1 : 0 };
  }

  // Sort by date (most recent first)
  const sorted = [...submissions].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Calculate current streak
  let currentStreak = 0;
  for (const submission of sorted) {
    if (submission.isCorrect) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  for (const submission of sorted.reverse()) {
    if (submission.isCorrect) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return { currentStreak, longestStreak };
};

/**
 * Calculate XP gained from a submission
 */
const calculateXP = (score, timeSpent, isCorrect) => {
  let xp = score; // Base XP from score

  // Bonus for correct answer
  if (isCorrect) {
    xp += 20;
  }

  // Time bonus (faster completion = more XP)
  if (timeSpent) {
    if (timeSpent < 30) xp += 15; // Very fast
    else if (timeSpent < 60) xp += 10; // Fast
    else if (timeSpent < 120) xp += 5; // Normal
  }

  return Math.floor(xp);
};

/**
 * Calculate level from total XP
 */
const calculateLevel = (totalXP) => {
  // Level formula: level = floor(sqrt(XP / 100))
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
};

/**
 * Identify weak areas based on performance
 */
const identifyWeakAreas = (submissions) => {
  const weakAreas = [];

  // Group by problem tags or types
  const byType = submissions.reduce((acc, sub) => {
    const type = sub.problem?.quantifierType || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(sub);
    return acc;
  }, {});

  // Check each type
  for (const [type, subs] of Object.entries(byType)) {
    if (subs.length >= 3) {
      const accuracy = (subs.filter(s => s.isCorrect).length / subs.length) * 100;
      if (accuracy < 60) {
        weakAreas.push({
          type,
          accuracy: accuracy.toFixed(1),
          attempts: subs.length
        });
      }
    }
  }

  return weakAreas;
};

/**
 * Check for new achievements
 */
const checkAchievements = (progress, stats) => {
  const achievements = [];

  // First problem
  if (stats.totalAttempted === 1) {
    achievements.push('first_problem');
  }

  // Perfect score on 5 problems
  if (stats.totalCorrect >= 5 && stats.totalCorrect % 5 === 0) {
    achievements.push(`${stats.totalCorrect}_correct`);
  }

  // Streak achievements
  if (stats.currentStreak === 3) achievements.push('streak_3');
  if (stats.currentStreak === 5) achievements.push('streak_5');
  if (stats.currentStreak === 10) achievements.push('streak_10');

  // Level achievements
  if (stats.newLevel === 5) achievements.push('level_5');
  if (stats.newLevel === 10) achievements.push('level_10');
  if (stats.newLevel === 20) achievements.push('level_20');

  return achievements.filter(a => !progress.achievements.includes(a));
};

export default {
  updateStudentProgress
};
