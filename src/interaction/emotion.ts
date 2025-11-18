/**
 * Emotion Recognition System
 *
 * Detects, tracks, and responds to learner's emotional state
 * with empathy and appropriate interventions.
 */

import { EmotionalState, LearnerProfile, LearningEvent } from '../types/index.js';

export interface EmotionAnalysis {
  current: EmotionalState;
  trend: 'improving' | 'stable' | 'declining';
  dominant: keyof Omit<EmotionalState, 'timestamp'>;
  interventionNeeded: boolean;
  suggestedAction: string | null;
}

export interface EmotionalPattern {
  trigger: string;
  response: EmotionalState;
  frequency: number;
  lastOccurrence: number;
}

export class EmotionRecognitionSystem {
  private emotionHistory: EmotionalState[] = [];
  private patterns: Map<string, EmotionalPattern> = new Map();
  private baselineEmotion: EmotionalState;

  constructor() {
    this.baselineEmotion = this.getDefaultEmotion();
  }

  /**
   * Gets default neutral emotional state
   */
  private getDefaultEmotion(): EmotionalState {
    return {
      curiosity: 0.5,
      frustration: 0.2,
      confidence: 0.6,
      engagement: 0.6,
      anxiety: 0.3,
      satisfaction: 0.5,
      timestamp: Date.now()
    };
  }

  /**
   * Analyzes current emotional state
   */
  analyzeEmotion(current: EmotionalState, recent: LearningEvent[] = []): EmotionAnalysis {
    // Store in history
    this.emotionHistory.push(current);

    // Keep only recent history
    if (this.emotionHistory.length > 100) {
      this.emotionHistory.shift();
    }

    // Calculate trend
    const trend = this.calculateTrend();

    // Identify dominant emotion
    const dominant = this.identifyDominantEmotion(current);

    // Check if intervention needed
    const interventionNeeded = this.needsIntervention(current, dominant);

    // Suggest action
    const suggestedAction = interventionNeeded
      ? this.suggestIntervention(current, dominant)
      : null;

    return {
      current,
      trend,
      dominant,
      interventionNeeded,
      suggestedAction
    };
  }

  /**
   * Calculates emotional trend
   */
  private calculateTrend(): 'improving' | 'stable' | 'declining' {
    if (this.emotionHistory.length < 5) return 'stable';

    const recent = this.emotionHistory.slice(-5);
    const older = this.emotionHistory.slice(-10, -5);

    if (older.length === 0) return 'stable';

    // Calculate average positive emotions
    const recentPositive = this.calculatePositivity(recent);
    const olderPositive = this.calculatePositivity(older);

    if (recentPositive > olderPositive * 1.1) {
      return 'improving';
    } else if (recentPositive < olderPositive * 0.9) {
      return 'declining';
    }

    return 'stable';
  }

  /**
   * Calculates overall positivity
   */
  private calculatePositivity(states: EmotionalState[]): number {
    const avgPositive =
      states.reduce(
        (sum, s) => sum + s.curiosity + s.confidence + s.engagement + s.satisfaction,
        0
      ) / (states.length * 4);

    const avgNegative =
      states.reduce((sum, s) => sum + s.frustration + s.anxiety, 0) / (states.length * 2);

    return avgPositive - avgNegative;
  }

  /**
   * Identifies dominant emotion
   */
  private identifyDominantEmotion(
    state: EmotionalState
  ): keyof Omit<EmotionalState, 'timestamp'> {
    const emotions: Array<{
      name: keyof Omit<EmotionalState, 'timestamp'>;
      value: number;
    }> = [
      { name: 'curiosity', value: state.curiosity },
      { name: 'frustration', value: state.frustration },
      { name: 'confidence', value: state.confidence },
      { name: 'engagement', value: state.engagement },
      { name: 'anxiety', value: state.anxiety },
      { name: 'satisfaction', value: state.satisfaction }
    ];

    emotions.sort((a, b) => b.value - a.value);

    return emotions[0].name;
  }

  /**
   * Checks if intervention is needed
   */
  private needsIntervention(
    state: EmotionalState,
    dominant: keyof Omit<EmotionalState, 'timestamp'>
  ): boolean {
    // High frustration
    if (state.frustration > 0.75) return true;

    // High anxiety
    if (state.anxiety > 0.75) return true;

    // Low engagement
    if (state.engagement < 0.3) return true;

    // Low confidence and high anxiety
    if (state.confidence < 0.3 && state.anxiety > 0.6) return true;

    // Declining trend for too long
    const trend = this.calculateTrend();
    if (trend === 'declining' && this.emotionHistory.length > 10) {
      const last10 = this.emotionHistory.slice(-10);
      const allDeclining = last10.every((s, i) => {
        if (i === 0) return true;
        const prev = last10[i - 1];
        return this.calculatePositivity([s]) < this.calculatePositivity([prev]);
      });

      if (allDeclining) return true;
    }

    return false;
  }

  /**
   * Suggests appropriate intervention
   */
  private suggestIntervention(
    state: EmotionalState,
    dominant: keyof Omit<EmotionalState, 'timestamp'>
  ): string {
    // High frustration
    if (state.frustration > 0.75) {
      return 'provide-break-and-encouragement';
    }

    // High anxiety
    if (state.anxiety > 0.75) {
      return 'reduce-difficulty-and-reassure';
    }

    // Low engagement
    if (state.engagement < 0.3) {
      return 'introduce-novelty-or-game';
    }

    // Low confidence
    if (state.confidence < 0.3) {
      return 'provide-easy-wins';
    }

    // General declining trend
    return 'vary-teaching-method';
  }

  /**
   * Tracks emotional patterns
   */
  trackPattern(trigger: string, response: EmotionalState): void {
    const existing = this.patterns.get(trigger);

    if (existing) {
      existing.frequency++;
      existing.lastOccurrence = Date.now();
      // Update average response
      Object.keys(response).forEach(key => {
        if (key !== 'timestamp') {
          (existing.response as any)[key] =
            ((existing.response as any)[key] * (existing.frequency - 1) +
              (response as any)[key]) /
            existing.frequency;
        }
      });
    } else {
      this.patterns.set(trigger, {
        trigger,
        response: { ...response },
        frequency: 1,
        lastOccurrence: Date.now()
      });
    }
  }

  /**
   * Predicts emotional response to a trigger
   */
  predictResponse(trigger: string): EmotionalState | null {
    const pattern = this.patterns.get(trigger);

    if (!pattern || pattern.frequency < 3) {
      return null; // Not enough data
    }

    return { ...pattern.response, timestamp: Date.now() };
  }

  /**
   * Generates empathetic response message
   */
  generateEmpatheticResponse(state: EmotionalState): string {
    const dominant = this.identifyDominantEmotion(state);

    const responses: Record<string, string[]> = {
      frustration: [
        "I can see this is challenging. Let's take a different approach.",
        "It's okay to feel frustrated. That means you're pushing your boundaries.",
        "I understand this is difficult. We'll work through it together, one step at a time."
      ],
      anxiety: [
        "Take a deep breath. You're doing better than you think.",
        "There's no pressure here. We'll go at your pace.",
        "It's normal to feel uncertain. I'm here to support you."
      ],
      curiosity: [
        "I love your curiosity! Let's explore this deeper.",
        "That's a fascinating question. Your curiosity will take you far.",
        "Your enthusiasm is wonderful! Let's dive into this."
      ],
      confidence: [
        "You're absolutely right to feel confident. You're doing great!",
        "Yes! That confidence is well-deserved. Keep it up!",
        "Your growing confidence shows how much you're learning."
      ],
      engagement: [
        "I can see you're really engaged. This is when the best learning happens!",
        "Your focus is impressive. Let's make the most of this energy!",
        "You're in the zone! This is fantastic."
      ],
      satisfaction: [
        "It feels good when things click, doesn't it?",
        "Your satisfaction is well-earned. You've worked hard for this!",
        "That sense of accomplishment is what learning is all about!"
      ]
    };

    const variants = responses[dominant] || ["I'm here to help you succeed."];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  /**
   * Adjusts teaching based on emotion
   */
  getTeachingAdjustments(state: EmotionalState): {
    pace: 'slower' | 'maintain' | 'faster';
    difficulty: 'decrease' | 'maintain' | 'increase';
    interactivity: 'more' | 'maintain' | 'less';
    encouragement: 'high' | 'moderate' | 'low';
  } {
    let pace: 'slower' | 'maintain' | 'faster' = 'maintain';
    let difficulty: 'decrease' | 'maintain' | 'increase' = 'maintain';
    let interactivity: 'more' | 'maintain' | 'less' = 'maintain';
    let encouragement: 'high' | 'moderate' | 'low' = 'moderate';

    // Adjust pace
    if (state.frustration > 0.7 || state.anxiety > 0.7) {
      pace = 'slower';
    } else if (state.engagement > 0.8 && state.confidence > 0.7) {
      pace = 'faster';
    }

    // Adjust difficulty
    if (state.frustration > 0.7) {
      difficulty = 'decrease';
    } else if (state.confidence > 0.8 && state.satisfaction > 0.7) {
      difficulty = 'increase';
    }

    // Adjust interactivity
    if (state.engagement < 0.4) {
      interactivity = 'more';
    } else if (state.anxiety > 0.7) {
      interactivity = 'less'; // Give space to think
    }

    // Adjust encouragement
    if (state.confidence < 0.4 || state.frustration > 0.6) {
      encouragement = 'high';
    } else if (state.confidence > 0.8) {
      encouragement = 'moderate'; // Don't over-praise
    }

    return { pace, difficulty, interactivity, encouragement };
  }

  /**
   * Calculates emotional wellness score
   */
  calculateWellness(state: EmotionalState): number {
    // Ideal state weights
    const ideal = {
      curiosity: 0.8,
      confidence: 0.7,
      engagement: 0.8,
      satisfaction: 0.7,
      frustration: 0.2,
      anxiety: 0.2
    };

    // Calculate distance from ideal
    let distance = 0;
    distance += Math.abs(state.curiosity - ideal.curiosity);
    distance += Math.abs(state.confidence - ideal.confidence);
    distance += Math.abs(state.engagement - ideal.engagement);
    distance += Math.abs(state.satisfaction - ideal.satisfaction);
    distance += Math.abs(state.frustration - ideal.frustration);
    distance += Math.abs(state.anxiety - ideal.anxiety);

    // Convert to wellness score (0 to 1)
    const maxDistance = 6; // Maximum possible distance
    const wellness = 1 - distance / maxDistance;

    return Math.max(0, Math.min(1, wellness));
  }

  /**
   * Gets emotion statistics
   */
  getStatistics(): {
    averageWellness: number;
    mostCommonDominant: string;
    interventionRate: number;
    patternCount: number;
  } {
    const avgWellness =
      this.emotionHistory.length > 0
        ? this.emotionHistory.reduce((sum, s) => sum + this.calculateWellness(s), 0) /
          this.emotionHistory.length
        : 0;

    const dominantCounts = new Map<string, number>();
    this.emotionHistory.forEach(state => {
      const dominant = this.identifyDominantEmotion(state);
      dominantCounts.set(dominant, (dominantCounts.get(dominant) || 0) + 1);
    });

    const mostCommon = Array.from(dominantCounts.entries()).reduce(
      (max, current) => (current[1] > max[1] ? current : max),
      ['none', 0]
    );

    const interventionsNeeded = this.emotionHistory.filter(state => {
      const dominant = this.identifyDominantEmotion(state);
      return this.needsIntervention(state, dominant);
    }).length;

    const interventionRate =
      this.emotionHistory.length > 0 ? interventionsNeeded / this.emotionHistory.length : 0;

    return {
      averageWellness: avgWellness,
      mostCommonDominant: mostCommon[0],
      interventionRate,
      patternCount: this.patterns.size
    };
  }

  /**
   * Exports emotion data
   */
  exportData(): any {
    return {
      history: this.emotionHistory,
      patterns: Array.from(this.patterns.values()),
      statistics: this.getStatistics(),
      exportedAt: Date.now()
    };
  }
}
