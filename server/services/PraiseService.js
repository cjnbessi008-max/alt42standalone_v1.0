const { v4: uuidv4 } = require('uuid');
const praiseMessages = require('../data/praiseMessages');
const praiseRules = require('../config/praiseRules');

/**
 * PraiseService
 * Handles automatic praise generation and delivery based on student progress
 */
class PraiseService {
  constructor(io) {
    this.io = io;
    this.studentHistory = new Map(); // Track student achievements
  }

  /**
   * Evaluate student progress and determine if praise should be given
   * @param {string} studentId - Student identifier
   * @param {string} moduleId - Module identifier
   * @param {object} progressData - Current progress data
   * @returns {object|null} Praise event or null if no praise triggered
   */
  async evaluateProgress(studentId, moduleId, progressData) {
    const studentKey = `${studentId}-${moduleId}`;

    // Initialize or retrieve student history
    if (!this.studentHistory.has(studentKey)) {
      this.studentHistory.set(studentKey, {
        totalAttempts: 0,
        correctAnswers: 0,
        consecutiveCorrect: 0,
        lastPraiseTime: null,
        achievements: []
      });
    }

    const history = this.studentHistory.get(studentKey);

    // Update history
    history.totalAttempts++;
    if (progressData.isCorrect) {
      history.correctAnswers++;
      history.consecutiveCorrect++;
    } else {
      history.consecutiveCorrect = 0;
    }

    // Check praise rules
    const triggeredRules = this.checkRules(history, progressData);

    if (triggeredRules.length > 0) {
      // Prevent too frequent praise (cooldown: 30 seconds)
      const now = Date.now();
      if (history.lastPraiseTime && (now - history.lastPraiseTime) < 30000) {
        return null;
      }

      history.lastPraiseTime = now;

      // Select appropriate praise message
      const rule = triggeredRules[0]; // Use first triggered rule
      const praiseEvent = this.generatePraiseEvent(rule, studentId, moduleId, progressData);

      // Record achievement
      history.achievements.push({
        type: rule.type,
        timestamp: now,
        context: progressData
      });

      this.studentHistory.set(studentKey, history);

      return praiseEvent;
    }

    this.studentHistory.set(studentKey, history);
    return null;
  }

  /**
   * Check which praise rules are triggered
   * @param {object} history - Student history
   * @param {object} progressData - Current progress
   * @returns {array} Triggered rules
   */
  checkRules(history, progressData) {
    const triggered = [];

    for (const rule of praiseRules) {
      if (rule.condition(history, progressData)) {
        triggered.push(rule);
      }
    }

    return triggered;
  }

  /**
   * Generate a praise event with message and audio configuration
   * @param {object} rule - Triggered rule
   * @param {string} studentId - Student ID
   * @param {string} moduleId - Module ID
   * @param {object} progressData - Progress context
   * @returns {object} Praise event
   */
  generatePraiseEvent(rule, studentId, moduleId, progressData) {
    const messages = praiseMessages[rule.messageCategory] || praiseMessages.general;
    const message = this.selectRandomMessage(messages, progressData);

    return {
      id: uuidv4(),
      studentId,
      moduleId,
      type: rule.type,
      message,
      voiceConfig: {
        lang: process.env.PRAISE_VOICE_LANG || 'ko-KR',
        rate: parseFloat(process.env.PRAISE_VOICE_RATE || '0.9'),
        pitch: parseFloat(process.env.PRAISE_VOICE_PITCH || '1.1'),
        volume: 1.0
      },
      timestamp: new Date().toISOString(),
      context: {
        correctAnswers: progressData.correctAnswers,
        totalAttempts: progressData.totalAttempts,
        difficulty: progressData.difficulty
      }
    };
  }

  /**
   * Select a random message and apply template variables
   * @param {array} messages - Array of message templates
   * @param {object} context - Context data for template
   * @returns {string} Final message
   */
  selectRandomMessage(messages, context) {
    const template = messages[Math.floor(Math.random() * messages.length)];

    // Simple template replacement
    return template
      .replace('{{count}}', context.consecutiveCorrect || '')
      .replace('{{accuracy}}', context.accuracy || '');
  }

  /**
   * Get student praise history
   * @param {string} studentId - Student ID
   * @param {string} moduleId - Module ID
   * @returns {object} Student history
   */
  getStudentHistory(studentId, moduleId) {
    const studentKey = `${studentId}-${moduleId}`;
    return this.studentHistory.get(studentKey) || null;
  }

  /**
   * Reset student history (for testing or new module start)
   * @param {string} studentId - Student ID
   * @param {string} moduleId - Module ID
   */
  resetStudentHistory(studentId, moduleId) {
    const studentKey = `${studentId}-${moduleId}`;
    this.studentHistory.delete(studentKey);
  }
}

module.exports = PraiseService;
