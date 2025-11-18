/**
 * Feedback Loop System
 *
 * Provides real-time adaptive feedback and reinforcement
 * to optimize learning outcomes.
 */

import { LearningEvent, EmotionalState, LearnerProfile } from '../types/index.js';

export interface FeedbackMessage {
  id: string;
  type: 'praise' | 'encouragement' | 'correction' | 'hint' | 'explanation' | 'celebration';
  content: string;
  timing: 'immediate' | 'delayed';
  emotionalTone: EmotionalState;
  actionable: boolean;
  nextSteps?: string[];
}

export interface PerformanceAnalysis {
  score: number; //0-1
  trend: 'improving' | 'stable' | 'declining';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface ReinforcementStrategy {
  positiveReinforcement: number; // 0-1, how much to emphasize success
  errorTolerance: number; // 0-1, how much error is acceptable
  hintProgression: 'immediate' | 'graduated' | 'minimal';
  celebrationThreshold: number; // 0-1, when to celebrate
}

export class FeedbackLoopSystem {
  private feedbackHistory: FeedbackMessage[] = [];
  private performanceWindow: LearningEvent[] = [];
  private strategy: ReinforcementStrategy;

  constructor() {
    this.strategy = this.getDefaultStrategy();
  }

  /**
   * Gets default reinforcement strategy
   */
  private getDefaultStrategy(): ReinforcementStrategy {
    return {
      positiveReinforcement: 0.7,
      errorTolerance: 0.3,
      hintProgression: 'graduated',
      celebrationThreshold: 0.85
    };
  }

  /**
   * Adapts strategy based on learner profile
   */
  adaptStrategy(profile: LearnerProfile): void {
    const { emotionalState, learningHistory } = profile;

    // High anxiety → more tolerance, more encouragement
    if (emotionalState.anxiety > 0.7) {
      this.strategy.errorTolerance = 0.5;
      this.strategy.positiveReinforcement = 0.9;
      this.strategy.hintProgression = 'immediate';
    }

    // Low confidence → more celebration, graduated hints
    else if (emotionalState.confidence < 0.4) {
      this.strategy.celebrationThreshold = 0.7;
      this.strategy.positiveReinforcement = 0.8;
      this.strategy.hintProgression = 'graduated';
    }

    // High confidence → challenge more, minimal hints
    else if (emotionalState.confidence > 0.8) {
      this.strategy.errorTolerance = 0.2;
      this.strategy.celebrationThreshold = 0.9;
      this.strategy.hintProgression = 'minimal';
    }

    // Frustrated → immediate hints, high encouragement
    else if (emotionalState.frustration > 0.7) {
      this.strategy.hintProgression = 'immediate';
      this.strategy.positiveReinforcement = 0.9;
      this.strategy.errorTolerance = 0.6;
    }
  }

  /**
   * Provides feedback on a learning event
   */
  provideFeedback(event: LearningEvent, profile: LearnerProfile): FeedbackMessage {
    this.performanceWindow.push(event);

    // Keep only recent events
    if (this.performanceWindow.length > 20) {
      this.performanceWindow.shift();
    }

    // Adapt strategy
    this.adaptStrategy(profile);

    // Generate appropriate feedback
    const message = this.generateFeedback(event, profile);

    // Store feedback
    this.feedbackHistory.push(message);

    return message;
  }

  /**
   * Generates feedback message
   */
  private generateFeedback(event: LearningEvent, profile: LearnerProfile): FeedbackMessage {
    const { performance, emotionalResponse } = event;

    // Excellent performance
    if (performance >= this.strategy.celebrationThreshold) {
      return this.createCelebration(event, profile);
    }

    // Good performance
    if (performance >= 0.7) {
      return this.createPraise(event, profile);
    }

    // Moderate performance
    if (performance >= 0.5) {
      return this.createEncouragement(event, profile);
    }

    // Poor performance
    if (performance >= 0.3) {
      return this.createCorrection(event, profile);
    }

    // Very poor performance
    return this.createHint(event, profile);
  }

  /**
   * Creates celebration message
   */
  private createCelebration(event: LearningEvent, profile: LearnerProfile): FeedbackMessage {
    const messages = [
      'Outstanding! You absolutely nailed this! 🎉',
      'Perfect! Your understanding is crystal clear! ⭐',
      'Brilliant work! You\'re mastering this beautifully! 🌟',
      'Excellent! That\'s exactly right! Keep this momentum! 🚀'
    ];

    return {
      id: `feedback_${Date.now()}`,
      type: 'celebration',
      content: messages[Math.floor(Math.random() * messages.length)],
      timing: 'immediate',
      emotionalTone: {
        curiosity: 0.8,
        confidence: 0.95,
        engagement: 1.0,
        satisfaction: 1.0,
        frustration: 0.0,
        anxiety: 0.0,
        timestamp: Date.now()
      },
      actionable: false
    };
  }

  /**
   * Creates praise message
   */
  private createPraise(event: LearningEvent, profile: LearnerProfile): FeedbackMessage {
    const messages = [
      'Great job! You\'re really getting the hang of this! 👏',
      'Well done! Your hard work is paying off! ✨',
      'Nice work! You\'re making excellent progress! 📈',
      'Fantastic! You understood that perfectly! 💯'
    ];

    return {
      id: `feedback_${Date.now()}`,
      type: 'praise',
      content: messages[Math.floor(Math.random() * messages.length)],
      timing: 'immediate',
      emotionalTone: {
        curiosity: 0.7,
        confidence: 0.8,
        engagement: 0.9,
        satisfaction: 0.9,
        frustration: 0.1,
        anxiety: 0.1,
        timestamp: Date.now()
      },
      actionable: false
    };
  }

  /**
   * Creates encouragement message
   */
  private createEncouragement(
    event: LearningEvent,
    profile: LearnerProfile
  ): FeedbackMessage {
    const messages = [
      'You\'re on the right track! Let\'s refine this a bit more.',
      'Good effort! You\'re making progress. Let\'s keep going!',
      'You\'re thinking well! Just need a small adjustment here.',
      'Nice try! You\'re learning - that\'s what matters most!'
    ];

    return {
      id: `feedback_${Date.now()}`,
      type: 'encouragement',
      content: messages[Math.floor(Math.random() * messages.length)],
      timing: 'immediate',
      emotionalTone: {
        curiosity: 0.7,
        confidence: 0.6,
        engagement: 0.7,
        satisfaction: 0.6,
        frustration: 0.3,
        anxiety: 0.3,
        timestamp: Date.now()
      },
      actionable: true,
      nextSteps: ['Review the concept again', 'Try a similar problem', 'Ask for clarification']
    };
  }

  /**
   * Creates correction message
   */
  private createCorrection(event: LearningEvent, profile: LearnerProfile): FeedbackMessage {
    const messages = [
      'Not quite right, but I can see your reasoning. Let\'s look at this together.',
      'That\'s a common mistake! Here\'s how to think about it differently...',
      'Good attempt! Let me show you where the approach needs adjustment.',
      'I see what you\'re thinking, but there\'s a key point we need to revisit.'
    ];

    return {
      id: `feedback_${Date.now()}`,
      type: 'correction',
      content: messages[Math.floor(Math.random() * messages.length)],
      timing: this.strategy.hintProgression === 'immediate' ? 'immediate' : 'delayed',
      emotionalTone: {
        curiosity: 0.6,
        confidence: 0.5,
        engagement: 0.6,
        satisfaction: 0.4,
        frustration: 0.4,
        anxiety: 0.5,
        timestamp: Date.now()
      },
      actionable: true,
      nextSteps: [
        'Review the foundational concept',
        'Work through a guided example',
        'Break the problem into smaller steps'
      ]
    };
  }

  /**
   * Creates hint message
   */
  private createHint(event: LearningEvent, profile: LearnerProfile): FeedbackMessage {
    let content = '';
    let nextSteps: string[] = [];

    if (this.strategy.hintProgression === 'immediate') {
      content =
        'Let me help you with this. Here\'s a direct hint: [specific guidance for the problem]';
      nextSteps = ['Apply this hint', 'Try again'];
    } else if (this.strategy.hintProgression === 'graduated') {
      const attemptCount = this.performanceWindow.filter(
        e => e.topic === event.topic && e.performance < 0.3
      ).length;

      if (attemptCount === 1) {
        content = 'Think about what you know about this topic. What\'s the first step?';
      } else if (attemptCount === 2) {
        content = 'Let me give you a hint: focus on [key concept].';
      } else {
        content = 'Let\'s work through this together step by step.';
      }

      nextSteps = ['Think about the hint', 'Make another attempt', 'Ask for more help if needed'];
    } else {
      // minimal
      content = 'Take a moment to think about this. You have the knowledge you need.';
      nextSteps = ['Review your notes', 'Try a different approach'];
    }

    return {
      id: `feedback_${Date.now()}`,
      type: 'hint',
      content,
      timing: this.strategy.hintProgression === 'immediate' ? 'immediate' : 'delayed',
      emotionalTone: {
        curiosity: 0.6,
        confidence: 0.4,
        engagement: 0.5,
        satisfaction: 0.3,
        frustration: 0.6,
        anxiety: 0.6,
        timestamp: Date.now()
      },
      actionable: true,
      nextSteps
    };
  }

  /**
   * Analyzes performance trends
   */
  analyzePerformance(): PerformanceAnalysis {
    if (this.performanceWindow.length === 0) {
      return {
        score: 0.5,
        trend: 'stable',
        strengths: [],
        weaknesses: [],
        recommendations: ['Start practicing to build performance data']
      };
    }

    // Calculate average score
    const score =
      this.performanceWindow.reduce((sum, e) => sum + e.performance, 0) /
      this.performanceWindow.length;

    // Calculate trend
    const trend = this.calculateTrend();

    // Identify strengths and weaknesses by topic
    const topicPerformance = this.groupByTopic();
    const strengths = Object.entries(topicPerformance)
      .filter(([_, avg]) => avg >= 0.8)
      .map(([topic, _]) => topic);

    const weaknesses = Object.entries(topicPerformance)
      .filter(([_, avg]) => avg < 0.5)
      .map(([topic, _]) => topic);

    // Generate recommendations
    const recommendations = this.generateRecommendations(score, trend, weaknesses);

    return {
      score,
      trend,
      strengths,
      weaknesses,
      recommendations
    };
  }

  /**
   * Calculates performance trend
   */
  private calculateTrend(): 'improving' | 'stable' | 'declining' {
    if (this.performanceWindow.length < 5) return 'stable';

    const recent = this.performanceWindow.slice(-5);
    const older = this.performanceWindow.slice(-10, -5);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, e) => sum + e.performance, 0) / recent.length;
    const olderAvg = older.reduce((sum, e) => sum + e.performance, 0) / older.length;

    if (recentAvg > olderAvg * 1.1) return 'improving';
    if (recentAvg < olderAvg * 0.9) return 'declining';

    return 'stable';
  }

  /**
   * Groups performance by topic
   */
  private groupByTopic(): Record<string, number> {
    const byTopic: Record<string, number[]> = {};

    this.performanceWindow.forEach(event => {
      if (!byTopic[event.topic]) {
        byTopic[event.topic] = [];
      }
      byTopic[event.topic].push(event.performance);
    });

    const averages: Record<string, number> = {};
    Object.entries(byTopic).forEach(([topic, scores]) => {
      averages[topic] = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    });

    return averages;
  }

  /**
   * Generates recommendations
   */
  private generateRecommendations(
    score: number,
    trend: string,
    weaknesses: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Based on overall score
    if (score < 0.5) {
      recommendations.push('Consider slowing down and reviewing fundamentals');
      recommendations.push('Request more examples and explanations');
    } else if (score > 0.85) {
      recommendations.push('You\'re ready for more challenging material');
      recommendations.push('Consider exploring advanced topics');
    }

    // Based on trend
    if (trend === 'declining') {
      recommendations.push('Take a break to avoid burnout');
      recommendations.push('Review recent topics to consolidate understanding');
    } else if (trend === 'improving') {
      recommendations.push('Keep up the excellent momentum!');
      recommendations.push('Maintain your current study approach');
    }

    // Based on weaknesses
    if (weaknesses.length > 0) {
      recommendations.push(`Focus on strengthening: ${weaknesses.join(', ')}`);
      recommendations.push('Practice targeted exercises for weak areas');
    }

    return recommendations;
  }

  /**
   * Gets motivational message based on performance
   */
  getMotivation(analysis: PerformanceAnalysis): string {
    if (analysis.trend === 'improving') {
      return '🚀 You\'re on fire! Your progress is accelerating beautifully!';
    }

    if (analysis.trend === 'declining') {
      return '💪 Every expert was once a beginner. Let\'s rebuild that momentum together!';
    }

    if (analysis.score > 0.8) {
      return '⭐ You\'re performing excellently! Your dedication is inspiring!';
    }

    if (analysis.score < 0.4) {
      return '🌱 Growth happens in small steps. You\'re doing great just by showing up!';
    }

    return '✨ Steady progress is the key to mastery. You\'re doing well!';
  }

  /**
   * Exports feedback data
   */
  exportData(): any {
    return {
      history: this.feedbackHistory,
      performance: this.performanceWindow,
      strategy: this.strategy,
      analysis: this.analyzePerformance(),
      exportedAt: Date.now()
    };
  }
}
