/**
 * Praise Rules Configuration
 * Define conditions that trigger automatic praise
 */

module.exports = [
  {
    type: 'first_success',
    messageCategory: 'firstSuccess',
    condition: (history, progressData) => {
      return history.correctAnswers === 1 && progressData.isCorrect;
    }
  },
  {
    type: 'consecutive_correct',
    messageCategory: 'consecutive',
    condition: (history, progressData) => {
      return history.consecutiveCorrect >= 3 && progressData.isCorrect;
    }
  },
  {
    type: 'streak_achievement',
    messageCategory: 'streak',
    condition: (history, progressData) => {
      return history.consecutiveCorrect >= 5 && progressData.isCorrect;
    }
  },
  {
    type: 'improvement',
    messageCategory: 'improvement',
    condition: (history, progressData) => {
      // Improved accuracy after struggling
      const accuracy = history.correctAnswers / history.totalAttempts;
      return accuracy > 0.7 && history.totalAttempts >= 5 && progressData.isCorrect;
    }
  },
  {
    type: 'persistence',
    messageCategory: 'persistence',
    condition: (history, progressData) => {
      // Correct answer after multiple attempts
      return history.totalAttempts >= 3 &&
             history.consecutiveCorrect === 1 &&
             progressData.isCorrect;
    }
  },
  {
    type: 'difficult_problem',
    messageCategory: 'difficult',
    condition: (history, progressData) => {
      return progressData.isCorrect &&
             progressData.difficulty >= 4; // difficulty scale 1-5
    }
  },
  {
    type: 'milestone',
    messageCategory: 'milestone',
    condition: (history, progressData) => {
      // Every 10th correct answer
      return history.correctAnswers % 10 === 0 &&
             history.correctAnswers > 0 &&
             progressData.isCorrect;
    }
  },
  {
    type: 'fast_learner',
    messageCategory: 'fast',
    condition: (history, progressData) => {
      // High accuracy with few attempts
      const accuracy = history.correctAnswers / history.totalAttempts;
      return accuracy >= 0.8 &&
             history.totalAttempts >= 5 &&
             progressData.isCorrect;
    }
  }
];
