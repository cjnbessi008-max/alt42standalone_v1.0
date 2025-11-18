/**
 * Main Entry Point
 *
 * Integrates all components and provides the primary interface
 * to the AI Teacher Living System.
 */

import { bringToLife, SystemState } from './birth/awakening.js';

/**
 * Main application class
 */
export class AITeacherLivingSystem {
  private systemState: SystemState | null = null;
  private isInitialized: boolean = false;

  /**
   * Initializes the complete system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ System already initialized');
      return;
    }

    console.log('🚀 Initializing AI Teacher Living System...\n');

    this.systemState = await bringToLife();
    this.isInitialized = true;

    console.log('\n✅ System fully initialized and alive!\n');
  }

  /**
   * Starts a teaching session
   */
  async startTeachingSession(topic: string, learnerProfile?: any): Promise<string> {
    if (!this.systemState) {
      throw new Error('System not initialized. Call initialize() first.');
    }

    console.log(`\n🎓 Starting teaching session: ${topic}\n`);

    const { conversation, knowledgeGraph, contentOrchestrator } = this.systemState.components;

    // Create default learner profile if not provided
    const profile = learnerProfile || this.createDefaultLearnerProfile();

    // Start conversation thread
    const threadId = conversation.startThread(topic, profile);

    // Add concepts to knowledge graph
    const concepts = this.extractConcepts(topic);
    concepts.forEach(concept => {
      knowledgeGraph.addConcept(concept);
    });

    console.log(`📚 Teaching session started. Thread ID: ${threadId}\n`);

    return threadId;
  }

  /**
   * Processes a learner's message
   */
  async processMessage(threadId: string, message: string): Promise<any> {
    if (!this.systemState) {
      throw new Error('System not initialized');
    }

    const { conversation, emotion } = this.systemState.components;

    // Process through conversation engine
    const response = await conversation.processMessage(threadId, message);

    console.log(`\n💬 Learner: ${message}`);
    console.log(`🤖 Teacher: ${response.content}\n`);

    return response;
  }

  /**
   * Gets system status
   */
  getStatus(): any {
    if (!this.systemState) {
      return { initialized: false, alive: false };
    }

    const { consciousness, memory, lifeCycle, parallelMind } = this.systemState.components;

    return {
      initialized: this.isInitialized,
      alive: this.systemState.conscious,
      birthTime: new Date(this.systemState.birthTime),
      consciousnessState: consciousness.getState ? consciousness.getState() : {},
      lifeCyclePhase: lifeCycle.getState(),
      parallelThoughts: parallelMind.getMetrics()
    };
  }

  /**
   * Performs system self-reflection
   */
  async reflect(): Promise<any> {
    if (!this.systemState) {
      throw new Error('System not initialized');
    }

    return await this.systemState.components.consciousness.reflect();
  }

  /**
   * Helper: Creates default learner profile
   */
  private createDefaultLearnerProfile(): any {
    return {
      id: 'default-learner',
      cognitiveStyle: {
        processingSpeed: 0.5,
        abstractionLevel: 0.5,
        visualPreference: 0.6,
        auditoryPreference: 0.3,
        kinestheticPreference: 0.4,
        analyticalVsIntuitive: 0.0,
        sequentialVsRandom: -0.2
      },
      emotionalState: {
        curiosity: 0.7,
        frustration: 0.2,
        confidence: 0.6,
        engagement: 0.7,
        anxiety: 0.3,
        satisfaction: 0.6,
        timestamp: Date.now()
      },
      knowledgeGraph: [],
      learningHistory: [],
      preferences: {
        sessionLength: 30,
        challengeLevel: 0.6,
        feedbackFrequency: 'immediate' as const,
        explanationDepth: 'moderate' as const,
        exampleDensity: 0.7
      },
      goals: []
    };
  }

  /**
   * Helper: Extracts concepts from topic
   */
  private extractConcepts(topic: string): string[] {
    // Simple extraction - in real implementation would use NLP
    const words = topic.toLowerCase().split(/\s+/);
    return words.filter(w => w.length > 3);
  }

  /**
   * Shuts down the system gracefully
   */
  async shutdown(): Promise<void> {
    if (!this.systemState) return;

    console.log('\n🌙 Shutting down AI Teacher Living System...\n');

    // Enter sleep phase
    await this.systemState.components.lifeCycle.sleep();

    // Terminate parallel processing
    this.systemState.components.parallelMind.shutdown();

    console.log('✅ System shut down gracefully\n');

    this.systemState = null;
    this.isInitialized = false;
  }
}

/**
 * Export singleton instance
 */
export const aiTeacher = new AITeacherLivingSystem();

/**
 * Quick start function for easy usage
 */
export async function quickStart(): Promise<AITeacherLivingSystem> {
  await aiTeacher.initialize();
  return aiTeacher;
}

// If running in Node.js (not browser), auto-start
if (typeof window === 'undefined') {
  quickStart().then(() => {
    console.log('\n🎉 AI Teacher is ready to use!\n');
    console.log('Example usage:');
    console.log('  const threadId = await aiTeacher.startTeachingSession("mathematics");');
    console.log('  await aiTeacher.processMessage(threadId, "What is a derivative?");');
    console.log('\n');
  });
}
