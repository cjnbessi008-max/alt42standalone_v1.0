/**
 * Spaced Repetition Algorithm (SM-2)
 * Implements the SuperMemo SM-2 algorithm for optimal learning
 */

class SpacedRepetitionSystem {
  constructor() {
    // SM-2 algorithm constants
    this.EASINESS_FACTOR_MIN = 1.3;
    this.EASINESS_FACTOR_DEFAULT = 2.5;
    this.INTERVAL_FIRST = 1; // days
    this.INTERVAL_SECOND = 6; // days
  }

  /**
   * Initialize a new card for spaced repetition
   */
  initializeCard(formulaId) {
    return {
      id: formulaId,
      easinessFactor: this.EASINESS_FACTOR_DEFAULT,
      interval: 0,
      repetitions: 0,
      nextReviewDate: new Date().toISOString(),
      lastReviewDate: null,
      totalReviews: 0,
      correctCount: 0,
      incorrectCount: 0
    };
  }

  /**
   * Calculate next review based on quality of recall
   * @param {Object} card - The card data
   * @param {number} quality - Quality of recall (0-5)
   *   5: Perfect recall
   *   4: Correct with hesitation
   *   3: Correct with difficulty
   *   2: Incorrect but remembered
   *   1: Incorrect, familiar
   *   0: Complete blackout
   * @returns {Object} Updated card data
   */
  review(card, quality) {
    if (quality < 0 || quality > 5) {
      throw new Error('Quality must be between 0 and 5');
    }

    // Clone the card to avoid mutation
    const updatedCard = { ...card };

    // Update review statistics
    updatedCard.totalReviews++;
    updatedCard.lastReviewDate = new Date().toISOString();

    if (quality >= 3) {
      updatedCard.correctCount++;
    } else {
      updatedCard.incorrectCount++;
    }

    // Calculate new easiness factor
    const newEF = Math.max(
      this.EASINESS_FACTOR_MIN,
      updatedCard.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    updatedCard.easinessFactor = newEF;

    // Calculate new interval and repetitions
    if (quality < 3) {
      // Reset if quality is too low
      updatedCard.repetitions = 0;
      updatedCard.interval = this.INTERVAL_FIRST;
    } else {
      if (updatedCard.repetitions === 0) {
        updatedCard.interval = this.INTERVAL_FIRST;
        updatedCard.repetitions = 1;
      } else if (updatedCard.repetitions === 1) {
        updatedCard.interval = this.INTERVAL_SECOND;
        updatedCard.repetitions = 2;
      } else {
        updatedCard.interval = Math.round(updatedCard.interval * updatedCard.easinessFactor);
        updatedCard.repetitions++;
      }
    }

    // Calculate next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + updatedCard.interval);
    updatedCard.nextReviewDate = nextDate.toISOString();

    return updatedCard;
  }

  /**
   * Check if a card is due for review
   */
  isDue(card) {
    const now = new Date();
    const reviewDate = new Date(card.nextReviewDate);
    return now >= reviewDate;
  }

  /**
   * Get cards due for review
   */
  getDueCards(cards) {
    return cards.filter(card => this.isDue(card));
  }

  /**
   * Get statistics for a card
   */
  getCardStats(card) {
    const successRate = card.totalReviews > 0
      ? (card.correctCount / card.totalReviews * 100).toFixed(1)
      : 0;

    const masteryLevel = this.getMasteryLevel(card);

    return {
      totalReviews: card.totalReviews,
      correctCount: card.correctCount,
      incorrectCount: card.incorrectCount,
      successRate: successRate + '%',
      masteryLevel: masteryLevel,
      nextReview: this.formatDate(card.nextReviewDate),
      interval: card.interval + ' 일'
    };
  }

  /**
   * Determine mastery level based on card data
   */
  getMasteryLevel(card) {
    if (card.repetitions === 0) return '입문';
    if (card.repetitions < 3) return '초급';
    if (card.repetitions < 6) return '중급';
    if (card.repetitions < 10) return '고급';
    return '숙련';
  }

  /**
   * Format date for display
   */
  formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '복습 필요';
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays < 7) return `${diffDays}일 후`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 후`;
    return `${Math.floor(diffDays / 30)}개월 후`;
  }

  /**
   * Get recommended daily study count
   */
  getRecommendedDailyCount(totalCards) {
    // Recommend reviewing 10% of cards or at least 5 per day
    return Math.max(5, Math.ceil(totalCards * 0.1));
  }

  /**
   * Sort cards by priority (due date, then by easiness factor)
   */
  sortCardsByPriority(cards) {
    return cards.sort((a, b) => {
      // First, prioritize cards that are due
      const aDue = this.isDue(a);
      const bDue = this.isDue(b);

      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;

      // Then by next review date
      const aDate = new Date(a.nextReviewDate);
      const bDate = new Date(b.nextReviewDate);

      if (aDate < bDate) return -1;
      if (aDate > bDate) return 1;

      // Finally by easiness factor (harder cards first)
      return a.easinessFactor - b.easinessFactor;
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpacedRepetitionSystem;
}
