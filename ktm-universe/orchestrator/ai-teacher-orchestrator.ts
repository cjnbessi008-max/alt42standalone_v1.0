/**
 * AI Teacher Orchestrator
 *
 * The brain of the KTM Universe - integrates the AI Teacher Living System
 * with all 500+ apps to create a cohesive, adaptive learning experience.
 */

import { AITeacherLivingSystem } from '../../src/main.js';
import { AppRegistry, MathApp, AppMetadata } from '../apps/framework/app-framework.js';
import { COMPLETE_CATALOG, generateFullMetadata } from '../apps/catalog/app-catalog.js';
import { LearnerProfile, LearningEvent, EmotionalState } from '../../src/types/index.js';

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  apps: string[]; // App IDs in recommended order
  estimatedDuration: number;
  difficulty: number;
  planet: string;
}

export interface AppRecommendation {
  appId: string;
  metadata: AppMetadata;
  reason: string;
  priority: number; // 0-1, higher is more recommended
  expectedMastery: number;
}

export interface TeachingSession {
  id: string;
  learnerId: string;
  startTime: number;
  currentAppId?: string;
  completedApps: string[];
  sessionGoals: string[];
  progress: number;
  active: boolean;
}

/**
 * Main orchestrator class
 */
export class AITeacherOrchestrator {
  private aiTeacher: AITeacherLivingSystem;
  private appRegistry: AppRegistry;
  private activeSessions: Map<string, TeachingSession>;
  private learnerProfiles: Map<string, LearnerProfile>;
  private currentApps: Map<string, MathApp>;

  constructor() {
    this.aiTeacher = new AITeacherLivingSystem();
    this.appRegistry = new AppRegistry();
    this.activeSessions = new Map();
    this.learnerProfiles = new Map();
    this.currentApps = new Map();
  }

  /**
   * Initializes the orchestrator and AI Teacher
   */
  async initialize(): Promise<void> {
    console.log('🎭 Initializing AI Teacher Orchestrator...');

    // Initialize AI Teacher
    await this.aiTeacher.initialize();

    // Register all apps from catalog
    this.registerAllApps();

    console.log('✅ Orchestrator ready with', this.appRegistry.getTotalApps(), 'apps');
  }

  /**
   * Registers all apps from the catalog
   */
  private registerAllApps(): void {
    let totalRegistered = 0;

    // Register apps from each category
    Object.entries(COMPLETE_CATALOG).forEach(([category, apps]) => {
      if (Array.isArray(apps)) {
        apps.forEach(stub => {
          const metadata = generateFullMetadata(stub as Partial<AppMetadata>);
          // Note: In real implementation, we'd have actual app classes
          // For now, we're just registering metadata
          totalRegistered++;
        });
      } else if (typeof apps === 'object') {
        // Support category with subcategories
        Object.values(apps).forEach((subApps: any) => {
          subApps.forEach((stub: any) => {
            const metadata = generateFullMetadata(stub);
            totalRegistered++;
          });
        });
      }
    });

    console.log(`📱 Registered ${totalRegistered} apps`);
  }

  /**
   * Starts a new teaching session
   */
  async startSession(learnerId: string, goals: string[]): Promise<string> {
    console.log(`🎓 Starting teaching session for learner ${learnerId}`);

    // Create or get learner profile
    let profile = this.learnerProfiles.get(learnerId);
    if (!profile) {
      profile = this.createDefaultProfile(learnerId);
      this.learnerProfiles.set(learnerId, profile);
    }

    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: TeachingSession = {
      id: sessionId,
      learnerId,
      startTime: Date.now(),
      completedApps: [],
      sessionGoals: goals,
      progress: 0,
      active: true
    };

    this.activeSessions.set(sessionId, session);

    // AI Teacher greeting
    console.log('\n🤖 AI Teacher speaks:');
    console.log('━'.repeat(60));
    console.log('Hello! I\'m so excited to guide you through the KTM Math Universe!');
    console.log('Together, we\'ll explore', this.appRegistry.getTotalApps(), 'amazing mathematical apps.');
    console.log('\nYour goals for this session:');
    goals.forEach((goal, i) => console.log(`  ${i + 1}. ${goal}`));
    console.log('━'.repeat(60) + '\n');

    return sessionId;
  }

  /**
   * Recommends next apps based on learner state
   */
  async recommendNextApps(
    sessionId: string,
    count: number = 5
  ): Promise<AppRecommendation[]> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const profile = this.learnerProfiles.get(session.learnerId);
    if (!profile) throw new Error('Profile not found');

    console.log('\n🧠 AI Teacher is thinking...');

    const recommendations: AppRecommendation[] = [];

    // Get all apps that haven't been completed
    const availableApps = this.getAvailableApps(session);

    // Score each app based on multiple factors
    for (const appMeta of availableApps) {
      const score = this.scoreApp(appMeta, profile, session);

      if (score > 0.3) {
        // Only recommend apps with decent scores
        recommendations.push({
          appId: appMeta.id,
          metadata: appMeta,
          reason: this.generateRecommendationReason(appMeta, profile, score),
          priority: score,
          expectedMastery: this.predictMastery(appMeta, profile)
        });
      }
    }

    // Sort by priority and take top N
    recommendations.sort((a, b) => b.priority - a.priority);
    const topRecommendations = recommendations.slice(0, count);

    // AI Teacher explains recommendations
    console.log('\n💡 AI Teacher recommends:');
    console.log('━'.repeat(60));
    topRecommendations.forEach((rec, i) => {
      console.log(`\n${i + 1}. ${rec.metadata.name}`);
      console.log(`   📍 Planet: ${rec.metadata.planet}`);
      console.log(`   ⏱️  Time: ~${rec.metadata.estimatedTime} minutes`);
      console.log(`   📊 Difficulty: ${(rec.metadata.difficulty * 100).toFixed(0)}%`);
      console.log(`   💭 Why: ${rec.reason}`);
      console.log(`   🎯 Expected mastery: ${(rec.expectedMastery * 100).toFixed(0)}%`);
    });
    console.log('━'.repeat(60) + '\n');

    return topRecommendations;
  }

  /**
   * Scores an app for recommendation
   */
  private scoreApp(
    app: AppMetadata,
    profile: LearnerProfile,
    session: TeachingSession
  ): number {
    let score = 0.5; // Base score

    // 1. Difficulty matching (±0.2)
    const targetDifficulty = this.estimateTargetDifficulty(profile);
    const difficultyMatch = 1 - Math.abs(app.difficulty - targetDifficulty);
    score += (difficultyMatch - 0.5) * 0.4;

    // 2. Emotional state consideration (±0.2)
    const emotionalBoost = this.getEmotionalBoost(app, profile.emotionalState);
    score += emotionalBoost;

    // 3. Learning style match (±0.15)
    const styleMatch = this.getStyleMatch(app, profile);
    score += styleMatch * 0.15;

    // 4. Goal alignment (±0.15)
    const goalAlignment = this.getGoalAlignment(app, session.sessionGoals);
    score += goalAlignment * 0.15;

    // 5. Prerequisite readiness (+0.1 if ready, -0.5 if not)
    const prereqReady = this.checkPrerequisites(app, profile);
    score += prereqReady ? 0.1 : -0.5;

    // 6. Variety bonus (slight boost for different planets)
    if (session.completedApps.length > 0) {
      const lastApp = session.completedApps[session.completedApps.length - 1];
      // Would check if different planet, give small boost
      score += 0.05;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Estimates target difficulty for learner
   */
  private estimateTargetDifficulty(profile: LearnerProfile): number {
    if (profile.learningHistory.length === 0) return 0.3; // Start easy

    const recentEvents = profile.learningHistory.slice(-10);
    const avgPerformance =
      recentEvents.reduce((sum, e) => sum + e.performance, 0) / recentEvents.length;

    // Target slightly above current performance (zone of proximal development)
    return Math.min(1.0, avgPerformance + 0.1);
  }

  /**
   * Gets emotional boost for app selection
   */
  private getEmotionalBoost(app: AppMetadata, emotion: EmotionalState): number {
    let boost = 0;

    // High frustration → easier, more encouraging apps
    if (emotion.frustration > 0.7) {
      boost -= (app.difficulty - 0.3) * 0.3;
    }

    // Low engagement → more interactive/game-like apps
    if (emotion.engagement < 0.4) {
      if (app.tags.includes('game') || app.tags.includes('interactive')) {
        boost += 0.15;
      }
    }

    // High confidence → can handle more challenge
    if (emotion.confidence > 0.8) {
      boost += (app.difficulty - 0.5) * 0.2;
    }

    return boost;
  }

  /**
   * Gets learning style match score
   */
  private getStyleMatch(app: AppMetadata, profile: LearnerProfile): number {
    const style = profile.cognitiveStyle;
    let match = 0.5;

    // Visual learners prefer visualization apps
    if (style.visualPreference > 0.7 && app.tags.includes('visualization')) {
      match += 0.3;
    }

    // Kinesthetic learners prefer interactive apps
    if (style.kinestheticPreference > 0.7 && app.tags.includes('interactive')) {
      match += 0.3;
    }

    return match;
  }

  /**
   * Gets goal alignment score
   */
  private getGoalAlignment(app: AppMetadata, goals: string[]): number {
    if (goals.length === 0) return 0.5;

    // Check if app relates to any goals
    const goalKeywords = goals.join(' ').toLowerCase();
    const appKeywords = [...app.tags, app.name, app.description].join(' ').toLowerCase();

    let matches = 0;
    goals.forEach(goal => {
      if (appKeywords.includes(goal.toLowerCase())) {
        matches++;
      }
    });

    return matches / goals.length;
  }

  /**
   * Checks if prerequisites are met
   */
  private checkPrerequisites(app: AppMetadata, profile: LearnerProfile): boolean {
    if (app.prerequisites.length === 0) return true;

    return app.prerequisites.every(prereq => {
      const node = profile.knowledgeGraph.find(n => n.concept === prereq);
      return node && node.masteryLevel >= 0.7;
    });
  }

  /**
   * Predicts mastery level for an app
   */
  private predictMastery(app: AppMetadata, profile: LearnerProfile): number {
    const targetDiff = this.estimateTargetDifficulty(profile);

    if (app.difficulty < targetDiff - 0.2) {
      return 0.9; // Too easy, high predicted mastery
    } else if (app.difficulty > targetDiff + 0.3) {
      return 0.4; // Too hard, lower predicted mastery
    } else {
      return 0.7; // Just right
    }
  }

  /**
   * Generates recommendation reason
   */
  private generateRecommendationReason(
    app: AppMetadata,
    profile: LearnerProfile,
    score: number
  ): string {
    const reasons = [];

    const targetDiff = this.estimateTargetDifficulty(profile);
    if (Math.abs(app.difficulty - targetDiff) < 0.1) {
      reasons.push('Perfect difficulty level for you');
    }

    if (profile.emotionalState.frustration > 0.7 && app.difficulty < 0.4) {
      reasons.push('A gentler pace to rebuild confidence');
    }

    if (profile.emotionalState.engagement < 0.4 && app.tags.includes('game')) {
      reasons.push('Fun and engaging to boost motivation');
    }

    if (app.tags.includes('visualization') && profile.cognitiveStyle.visualPreference > 0.7) {
      reasons.push('Matches your visual learning style');
    }

    if (reasons.length === 0) {
      reasons.push('Continues your learning journey naturally');
    }

    return reasons.join('; ');
  }

  /**
   * Gets available apps (not completed)
   */
  private getAvailableApps(session: TeachingSession): AppMetadata[] {
    // In real implementation, would filter from app registry
    // For now, return mock data
    const allApps: AppMetadata[] = [];

    // Would get from registry and filter out completed
    return allApps;
  }

  /**
   * Records app completion
   */
  async recordCompletion(
    sessionId: string,
    appId: string,
    performance: number,
    timeSpent: number
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const profile = this.learnerProfiles.get(session.learnerId);
    if (!profile) return;

    // Add to completed apps
    session.completedApps.push(appId);
    session.progress = session.completedApps.length / 10; // Assuming 10 apps per session

    // Create learning event
    const event: LearningEvent = {
      timestamp: Date.now(),
      topic: appId,
      performance,
      timeSpent,
      challengeLevel: 0.5, // Would get from app metadata
      emotionalResponse: profile.emotionalState,
      masteryGain: performance * 0.1
    };

    profile.learningHistory.push(event);

    // AI Teacher provides feedback
    console.log('\n🤖 AI Teacher responds:');
    console.log('━'.repeat(60));

    if (performance > 0.85) {
      console.log('🌟 Excellent work! You\'re really mastering this!');
    } else if (performance > 0.7) {
      console.log('👏 Great job! You\'re making solid progress!');
    } else if (performance > 0.5) {
      console.log('💪 Good effort! You\'re learning and growing!');
    } else {
      console.log('🌱 That\'s okay! Every attempt is a step forward. Want to try something different?');
    }

    console.log('━'.repeat(60) + '\n');
  }

  /**
   * Creates a learning path through multiple apps
   */
  createLearningPath(
    topic: string,
    difficulty: number,
    duration: number
  ): LearningPath {
    console.log(`🗺️ Creating learning path for: ${topic}`);

    // Would use AI to create optimal path
    // For now, return mock path

    return {
      id: `path_${Date.now()}`,
      name: `${topic} Learning Journey`,
      description: `A curated path through ${topic}`,
      apps: [],
      estimatedDuration: duration,
      difficulty,
      planet: 'numbers'
    };
  }

  /**
   * Gets orchestrator statistics
   */
  getStatistics(): {
    totalApps: number;
    activeSessions: number;
    totalLearners: number;
    appsCompleted: number;
  } {
    let appsCompleted = 0;
    this.activeSessions.forEach(session => {
      appsCompleted += session.completedApps.length;
    });

    return {
      totalApps: this.appRegistry.getTotalApps(),
      activeSessions: this.activeSessions.size,
      totalLearners: this.learnerProfiles.size,
      appsCompleted
    };
  }

  /**
   * Creates default learner profile
   */
  private createDefaultProfile(learnerId: string): LearnerProfile {
    return {
      id: learnerId,
      cognitiveStyle: {
        processingSpeed: 0.5,
        abstractionLevel: 0.5,
        visualPreference: 0.6,
        auditoryPreference: 0.3,
        kinestheticPreference: 0.4,
        analyticalVsIntuitive: 0.0,
        sequentialVsRandom: -0.2
      },
      knowledgeGraph: [],
      emotionalState: {
        curiosity: 0.7,
        frustration: 0.2,
        confidence: 0.6,
        engagement: 0.7,
        anxiety: 0.3,
        satisfaction: 0.6,
        timestamp: Date.now()
      },
      learningHistory: [],
      preferences: {
        sessionLength: 30,
        challengeLevel: 0.6,
        feedbackFrequency: 'immediate',
        explanationDepth: 'moderate',
        exampleDensity: 0.7
      },
      goals: []
    };
  }
}

/**
 * Global orchestrator instance
 */
export const orchestrator = new AITeacherOrchestrator();
