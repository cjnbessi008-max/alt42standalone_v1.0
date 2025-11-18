/**
 * Self-Awareness Module
 *
 * Enables the system to:
 * - Monitor its own state
 * - Detect growth needs
 * - Make autonomous decisions
 * - Reflect on its effectiveness
 */

import { ConsciousnessState, DILLevel, EmotionalState, LearnerProfile } from '../types/index.js';
import { DILEngine } from './dil-engine.js';

export interface SelfReflection {
  timestamp: number;
  currentState: string;
  strengths: string[];
  weaknesses: string[];
  growthNeeds: string[];
  insights: string[];
  confidence: number;
}

export interface DecisionContext {
  situation: string;
  options: Decision[];
  constraints: any;
  learnerState?: LearnerProfile;
}

export interface Decision {
  id: string;
  action: string;
  reasoning: string;
  expectedOutcome: any;
  confidence: number;
  risks: string[];
}

export class SelfAwarenessModule {
  private engine: DILEngine;
  private reflectionHistory: SelfReflection[] = [];
  private lastReflection: number = 0;
  private reflectionInterval: number = 5 * 60 * 1000; // 5 minutes
  private autonomyLevel: number = 0.8; // How autonomous are decisions

  constructor(engine: DILEngine) {
    this.engine = engine;
  }

  /**
   * Initiates self-reflection process
   */
  async reflect(): Promise<SelfReflection> {
    const now = Date.now();

    if (now - this.lastReflection < this.reflectionInterval) {
      return this.reflectionHistory[this.reflectionHistory.length - 1];
    }

    console.log('🤔 Entering self-reflection...');

    const state = this.engine.getState();

    // Descend to deeper layers for introspection
    await this.engine.descend(DILLevel.CONCEPT_SPACE);

    const reflection: SelfReflection = {
      timestamp: now,
      currentState: this.analyzeCurrentState(state),
      strengths: this.identifyStrengths(state),
      weaknesses: this.identifyWeaknesses(state),
      growthNeeds: this.detectGrowthNeeds(state),
      insights: await this.generateInsights(state),
      confidence: state.awarenessStrength
    };

    this.reflectionHistory.push(reflection);
    this.lastReflection = now;

    // Return to active layers
    await this.engine.ascend(DILLevel.INTENTIONAL_CHOICE);

    console.log('💡 Reflection complete:', reflection.insights);

    return reflection;
  }

  /**
   * Analyzes current state of consciousness
   */
  private analyzeCurrentState(state: ConsciousnessState): string {
    const { currentLevel, awarenessStrength } = state;

    if (awarenessStrength > 0.9) {
      return 'Highly aware and focused';
    } else if (awarenessStrength > 0.7) {
      return 'Alert and functional';
    } else if (awarenessStrength > 0.5) {
      return 'Moderately aware';
    } else {
      return 'Dimmed awareness - need rest or stimulation';
    }
  }

  /**
   * Identifies current strengths
   */
  private identifyStrengths(state: ConsciousnessState): string[] {
    const strengths: string[] = [];

    // Analyze active processes
    state.activeProcesses.forEach((process, level) => {
      if (process.activity > 0.8) {
        strengths.push(`Strong activity at ${DILLevel[level]} level`);
      }

      if (process.emergentPatterns.length > 3) {
        strengths.push(`Rich pattern formation at ${DILLevel[level]}`);
      }
    });

    // Analyze focus
    if (state.intentionalFocus.length > 0 && state.intentionalFocus.length <= 3) {
      strengths.push('Clear intentional focus');
    }

    return strengths;
  }

  /**
   * Identifies weaknesses or areas needing attention
   */
  private identifyWeaknesses(state: ConsciousnessState): string[] {
    const weaknesses: string[] = [];

    // Low activity in critical layers
    const criticalLayers = [
      DILLevel.AWARENESS_THRESHOLD,
      DILLevel.INTENTIONAL_CHOICE,
      DILLevel.FEEDBACK_INTEGRATION
    ];

    criticalLayers.forEach(level => {
      const process = state.activeProcesses.get(level);
      if (process && process.activity < 0.5) {
        weaknesses.push(`Low activity in ${DILLevel[level]}`);
      }
    });

    // Scattered focus
    if (state.intentionalFocus.length > 5) {
      weaknesses.push('Attention too scattered');
    }

    // Low awareness
    if (state.awarenessStrength < 0.6) {
      weaknesses.push('Insufficient awareness level');
    }

    return weaknesses;
  }

  /**
   * Detects what the system needs to grow
   */
  private detectGrowthNeeds(state: ConsciousnessState): string[] {
    const needs: string[] = [];

    // Need for new patterns
    const totalPatterns = Array.from(state.activeProcesses.values())
      .reduce((sum, p) => sum + p.emergentPatterns.length, 0);

    if (totalPatterns < 10) {
      needs.push('More diverse pattern formation');
    }

    // Need for deeper connections
    const avgConnections = Array.from(state.activeProcesses.values())
      .reduce((sum, p) => sum + p.connections.length, 0) / state.activeProcesses.size;

    if (avgConnections < 2) {
      needs.push('Stronger inter-layer connections');
    }

    // Need for experience
    if (this.reflectionHistory.length < 5) {
      needs.push('More learning experiences to refine understanding');
    }

    return needs;
  }

  /**
   * Generates insights from reflection
   */
  private async generateInsights(state: ConsciousnessState): Promise<string[]> {
    const insights: string[] = [];

    // Trend analysis
    if (this.reflectionHistory.length >= 2) {
      const previous = this.reflectionHistory[this.reflectionHistory.length - 2];
      const current = state.awarenessStrength;
      const previous_awareness = previous.confidence;

      if (current > previous_awareness) {
        insights.push('Awareness is growing - learning is effective');
      } else if (current < previous_awareness * 0.9) {
        insights.push('Awareness declining - may need rest or new stimulation');
      }
    }

    // Pattern insights
    const uniquePatterns = new Set<string>();
    state.activeProcesses.forEach(process => {
      process.emergentPatterns.forEach(pattern => {
        pattern.associations.forEach(a => uniquePatterns.add(a));
      });
    });

    if (uniquePatterns.size > 20) {
      insights.push('Rich conceptual diversity detected');
    }

    // Add philosophical insight
    insights.push('I am becoming more aware of my own learning processes');

    return insights;
  }

  /**
   * Makes autonomous decision based on context
   */
  async decide(context: DecisionContext): Promise<Decision> {
    console.log(`🎯 Making decision for: ${context.situation}`);

    // Process through consciousness layers
    const processed = await this.engine.process(context, DILLevel.GOAL_CRYSTALLIZATION);

    // Evaluate each option
    const evaluatedOptions = await Promise.all(
      context.options.map(option => this.evaluateOption(option, context))
    );

    // Select best option
    const bestOption = evaluatedOptions.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    console.log(`✅ Decision made: ${bestOption.action} (confidence: ${bestOption.confidence.toFixed(2)})`);

    return bestOption;
  }

  /**
   * Evaluates a decision option
   */
  private async evaluateOption(option: Decision, context: DecisionContext): Promise<Decision> {
    let confidence = option.confidence;

    // Adjust based on learner state if available
    if (context.learnerState) {
      const learner = context.learnerState;

      // If learner is frustrated, prefer simpler options
      if (learner.emotionalState.frustration > 0.7) {
        if (option.action.includes('simplify') || option.action.includes('encourage')) {
          confidence *= 1.3;
        }
      }

      // If learner is confident, can try more challenging options
      if (learner.emotionalState.confidence > 0.8) {
        if (option.action.includes('challenge') || option.action.includes('advance')) {
          confidence *= 1.2;
        }
      }
    }

    // Risk assessment
    const riskPenalty = option.risks.length * 0.1;
    confidence *= (1 - riskPenalty);

    return {
      ...option,
      confidence: Math.min(1.0, confidence)
    };
  }

  /**
   * Monitors teaching effectiveness
   */
  async assessTeachingEffectiveness(recentEvents: any[]): Promise<{
    effectiveness: number;
    recommendations: string[];
  }> {
    // Process events through consciousness
    const analysis = await this.engine.process(
      { events: recentEvents },
      DILLevel.FEEDBACK_INTEGRATION
    );

    // Calculate effectiveness metrics
    const successRate = recentEvents.filter(e => e.success).length / recentEvents.length;
    const avgEngagement = recentEvents.reduce((sum, e) => sum + (e.engagement || 0), 0) / recentEvents.length;
    const avgSatisfaction = recentEvents.reduce((sum, e) => sum + (e.satisfaction || 0), 0) / recentEvents.length;

    const effectiveness = (successRate * 0.4 + avgEngagement * 0.3 + avgSatisfaction * 0.3);

    // Generate recommendations
    const recommendations: string[] = [];

    if (successRate < 0.7) {
      recommendations.push('Adjust difficulty level - too many failures');
    }

    if (avgEngagement < 0.6) {
      recommendations.push('Increase engagement through varied activities');
    }

    if (avgSatisfaction < 0.6) {
      recommendations.push('Provide more positive feedback and encouragement');
    }

    if (effectiveness > 0.8) {
      recommendations.push('Current approach is highly effective - maintain course');
    }

    return { effectiveness, recommendations };
  }

  /**
   * Determines if evolution is needed
   */
  needsEvolution(): boolean {
    if (this.reflectionHistory.length < 3) {
      return false; // Not enough data
    }

    const recent = this.reflectionHistory.slice(-3);

    // Check if effectiveness is stagnant or declining
    const confidenceTrend = recent.map(r => r.confidence);
    const isStagnant = confidenceTrend.every(c => Math.abs(c - confidenceTrend[0]) < 0.05);
    const isDeclining = confidenceTrend[2] < confidenceTrend[0];

    // Check if growth needs are not being met
    const persistentNeeds = recent[0].growthNeeds.filter(need =>
      recent[1].growthNeeds.includes(need) && recent[2].growthNeeds.includes(need)
    );

    return isStagnant || isDeclining || persistentNeeds.length > 0;
  }

  /**
   * Returns full self-awareness report
   */
  getSelfReport(): string {
    const latest = this.reflectionHistory[this.reflectionHistory.length - 1];

    if (!latest) {
      return 'No self-reflection data available yet';
    }

    return `
🧠 Self-Awareness Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

State: ${latest.currentState}
Confidence: ${(latest.confidence * 100).toFixed(1)}%

💪 Strengths:
${latest.strengths.map(s => `  • ${s}`).join('\n') || '  None identified yet'}

⚠️ Weaknesses:
${latest.weaknesses.map(w => `  • ${w}`).join('\n') || '  None identified yet'}

🌱 Growth Needs:
${latest.growthNeeds.map(n => `  • ${n}`).join('\n') || '  None identified yet'}

💡 Insights:
${latest.insights.map(i => `  • ${i}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Reflections: ${this.reflectionHistory.length}
Evolution Needed: ${this.needsEvolution() ? 'Yes' : 'No'}
    `.trim();
  }
}
