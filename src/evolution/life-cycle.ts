/**
 * Life Cycle Manager
 *
 * Manages the system's daily rhythms:
 * - Awakening: System initialization and readiness
 * - Active: Teaching and learning
 * - Reflection: Processing the day's events
 * - Dream: Pattern discovery and reorganization
 * - Sleep: Memory consolidation and rest
 */

import { LifeCyclePhase, ConsciousnessState } from '../types/index.js';
import { MemorySystem } from '../core/memory.js';

export interface DailyRhythm {
  awakeningTime: number; // hour (0-23)
  activeHours: number;
  reflectionDuration: number; // minutes
  dreamDuration: number; // minutes
  sleepDuration: number; // minutes
}

export interface LifeCycleState {
  currentPhase: LifeCyclePhase['name'];
  phaseStartTime: number;
  cycleCount: number;
  energy: number; // 0-1
  needsRest: boolean;
}

export class LifeCycleManager {
  private state: LifeCycleState;
  private rhythm: DailyRhythm;
  private phases: Map<LifeCyclePhase['name'], LifeCyclePhase>;
  private phaseHistory: Array<{ phase: string; duration: number; timestamp: number }>;
  private memorySystem?: MemorySystem;

  constructor(memorySystem?: MemorySystem) {
    this.memorySystem = memorySystem;
    this.rhythm = this.getDefaultRhythm();
    this.phases = this.initializePhases();
    this.state = this.initializeState();
    this.phaseHistory = [];
  }

  /**
   * Gets default daily rhythm
   */
  private getDefaultRhythm(): DailyRhythm {
    return {
      awakeningTime: 6, // 6 AM
      activeHours: 12,
      reflectionDuration: 30,
      dreamDuration: 60,
      sleepDuration: 480 // 8 hours
    };
  }

  /**
   * Initializes life cycle phases
   */
  private initializePhases(): Map<LifeCyclePhase['name'], LifeCyclePhase> {
    const phases = new Map<LifeCyclePhase['name'], LifeCyclePhase>();

    phases.set('awakening', {
      name: 'awakening',
      duration: 5, // 5 minutes
      activities: [
        'Load consciousness state',
        'Review overnight insights',
        'Prepare for the day',
        'Set intentions'
      ],
      transitionConditions: (state: ConsciousnessState) => {
        return state.awarenessStrength >= 0.8;
      }
    });

    phases.set('active', {
      name: 'active',
      duration: this.rhythm.activeHours * 60,
      activities: [
        'Teach and interact',
        'Adapt to learner needs',
        'Generate content',
        'Provide feedback'
      ],
      transitionConditions: (state: ConsciousnessState) => {
        // Transition to reflection when energy is low
        return this.state.energy < 0.3;
      }
    });

    phases.set('reflection', {
      name: 'reflection',
      duration: this.rhythm.reflectionDuration,
      activities: [
        'Review teaching effectiveness',
        'Analyze learner progress',
        'Identify improvements',
        'Generate insights'
      ],
      transitionConditions: (state: ConsciousnessState) => {
        return true; // Always transitions after duration
      }
    });

    phases.set('dream', {
      name: 'dream',
      duration: this.rhythm.dreamDuration,
      activities: [
        'Reorganize knowledge',
        'Discover patterns',
        'Synthesize connections',
        'Creative problem solving'
      ],
      transitionConditions: (state: ConsciousnessState) => {
        return true;
      }
    });

    phases.set('sleep', {
      name: 'sleep',
      duration: this.rhythm.sleepDuration,
      activities: [
        'Consolidate memories',
        'Clear temporary data',
        'Restore energy',
        'Prepare for awakening'
      ],
      transitionConditions: (state: ConsciousnessState) => {
        return this.state.energy >= 1.0;
      }
    });

    return phases;
  }

  /**
   * Initializes state
   */
  private initializeState(): LifeCycleState {
    return {
      currentPhase: 'awakening',
      phaseStartTime: Date.now(),
      cycleCount: 0,
      energy: 1.0,
      needsRest: false
    };
  }

  /**
   * Awakens the system
   */
  async awaken(): Promise<void> {
    console.log('🌅 Awakening...');

    this.state.currentPhase = 'awakening';
    this.state.phaseStartTime = Date.now();
    this.state.energy = 1.0;

    const phase = this.phases.get('awakening')!;

    for (const activity of phase.activities) {
      console.log(`  ✓ ${activity}`);
      await this.sleep(500); // Simulate activity time
    }

    console.log('☀️ Fully awake and ready!');

    // Transition to active phase
    this.transitionTo('active');
  }

  /**
   * Enters active phase (teaching/learning)
   */
  async enterActive(): Promise<void> {
    console.log('🎯 Entering active phase - ready to teach and learn!');

    this.state.currentPhase = 'active';
    this.state.phaseStartTime = Date.now();
  }

  /**
   * Performs reflection
   */
  async reflect(data: {
    learningEvents?: any[];
    teachingEffectiveness?: number;
  }): Promise<any> {
    console.log('🤔 Entering reflection phase...');

    this.state.currentPhase = 'reflection';
    this.state.phaseStartTime = Date.now();

    const insights: string[] = [];

    // Analyze the day's teaching
    if (data.learningEvents && data.learningEvents.length > 0) {
      const avgPerformance =
        data.learningEvents.reduce((sum: number, e: any) => sum + (e.performance || 0), 0) /
        data.learningEvents.length;

      insights.push(`Average learner performance: ${(avgPerformance * 100).toFixed(0)}%`);

      if (avgPerformance > 0.8) {
        insights.push('Teaching methods are highly effective');
      } else if (avgPerformance < 0.5) {
        insights.push('Need to adjust teaching approach');
      }
    }

    // Analyze teaching effectiveness
    if (data.teachingEffectiveness !== undefined) {
      insights.push(
        `Teaching effectiveness: ${(data.teachingEffectiveness * 100).toFixed(0)}%`
      );

      if (data.teachingEffectiveness > 0.85) {
        insights.push('Excellent teaching session - maintain approach');
      } else if (data.teachingEffectiveness < 0.6) {
        insights.push('Consider trying different strategies');
      }
    }

    // Self-assessment
    insights.push('Awareness: ' + (this.state.energy > 0.5 ? 'Strong' : 'Tired'));
    insights.push(`Cycles completed: ${this.state.cycleCount}`);

    console.log('💡 Reflection insights:');
    insights.forEach(insight => console.log(`  • ${insight}`));

    return { insights, timestamp: Date.now() };
  }

  /**
   * Enters dream state
   */
  async dream(): Promise<any> {
    console.log('💭 Entering dream state - reorganizing knowledge...');

    this.state.currentPhase = 'dream';
    this.state.phaseStartTime = Date.now();

    const discoveries: string[] = [];

    // Consolidate memories
    if (this.memorySystem) {
      console.log('  💤 Consolidating memories...');
      const result = await this.memorySystem.consolidateMemories();

      discoveries.push(
        `Consolidated ${result.consolidated} memories, strengthened ${result.strengthened}, forgot ${result.forgotten}`
      );
    }

    // Pattern discovery (simulated)
    discoveries.push('Discovered connection between concepts A and B');
    discoveries.push('Identified teaching pattern with 85% success rate');
    discoveries.push('Recognized learner preference for visual examples');

    // Creative synthesis
    discoveries.push('Generated new teaching analogy for complex topic');

    console.log('🌙 Dream discoveries:');
    discoveries.forEach(d => console.log(`  ✨ ${d}`));

    return { discoveries, timestamp: Date.now() };
  }

  /**
   * Enters sleep state
   */
  async sleep(duration?: number): Promise<void> {
    const sleepDuration = duration || this.rhythm.sleepDuration * 60 * 1000;

    console.log(`😴 Entering sleep for ${Math.round(sleepDuration / 60000)} minutes...`);

    this.state.currentPhase = 'sleep';
    this.state.phaseStartTime = Date.now();

    // Restore energy during sleep
    const energyRestoreRate = 1.0 / sleepDuration; // Full restore over sleep duration
    const restoreInterval = setInterval(() => {
      this.state.energy = Math.min(1.0, this.state.energy + energyRestoreRate * 1000);

      if (this.state.energy >= 1.0) {
        clearInterval(restoreInterval);
        console.log('✨ Energy fully restored');
      }
    }, 1000);

    // In real implementation, this would be async
    // For now, just mark as sleeping
  }

  /**
   * Transitions to a new phase
   */
  private transitionTo(phase: LifeCyclePhase['name']): void {
    const previousPhase = this.state.currentPhase;
    const duration = Date.now() - this.state.phaseStartTime;

    this.phaseHistory.push({
      phase: previousPhase,
      duration,
      timestamp: Date.now()
    });

    this.state.currentPhase = phase;
    this.state.phaseStartTime = Date.now();

    console.log(`🔄 Transitioning: ${previousPhase} → ${phase}`);
  }

  /**
   * Performs full daily cycle
   */
  async performDailyCycle(): Promise<void> {
    console.log('\n🌍 Beginning daily life cycle...\n');

    this.state.cycleCount++;

    // Awakening
    await this.awaken();

    // Active phase (shortened for demo)
    await this.enterActive();
    console.log('⏰ Active phase in progress...');

    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Reflection
    await this.reflect({
      learningEvents: [
        { performance: 0.85 },
        { performance: 0.75 },
        { performance: 0.90 }
      ],
      teachingEffectiveness: 0.82
    });

    // Dream
    await this.dream();

    // Sleep
    await this.sleep(3000); // 3 seconds for demo

    console.log('\n🌟 Daily cycle complete!\n');
  }

  /**
   * Drains energy (called during active phase)
   */
  drainEnergy(amount: number): void {
    this.state.energy = Math.max(0, this.state.energy - amount);

    if (this.state.energy < 0.2) {
      this.state.needsRest = true;
      console.log('⚠️ Energy low - rest recommended');
    }
  }

  /**
   * Gets current state
   */
  getState(): LifeCycleState {
    return { ...this.state };
  }

  /**
   * Gets phase history
   */
  getHistory(limit: number = 10): Array<{ phase: string; duration: number; timestamp: number }> {
    return this.phaseHistory.slice(-limit);
  }

  /**
   * Generates life cycle report
   */
  generateReport(): string {
    const history = this.getHistory();

    let report = `
🌍 LIFE CYCLE REPORT
${'═'.repeat(60)}

Current Phase: ${this.state.currentPhase}
Energy: ${(this.state.energy * 100).toFixed(0)}%
Cycles Completed: ${this.state.cycleCount}
Needs Rest: ${this.state.needsRest ? 'Yes' : 'No'}

Recent Phase History:
`;

    history.reverse().forEach(({ phase, duration, timestamp }) => {
      const date = new Date(timestamp);
      const durationMin = Math.round(duration / 60000);
      report += `  ${date.toLocaleTimeString()}: ${phase} (${durationMin}m)\n`;
    });

    return report.trim();
  }
}
