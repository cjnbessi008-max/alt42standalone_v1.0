/**
 * Content Strategy Engine
 *
 * Orchestrates learning content delivery with intelligent
 * sequencing, difficulty adaptation, and personalization.
 */

import {
  ContentItem,
  LearnerProfile,
  TeachingContext,
  TeachingAction,
  LearningGoal
} from '../types/index.js';

export interface LearningPath {
  id: string;
  goal: LearningGoal;
  steps: LearningStep[];
  currentStep: number;
  estimatedDuration: number;
  progress: number;
}

export interface LearningStep {
  id: string;
  concept: string;
  content: ContentItem[];
  activities: TeachingAction[];
  estimatedTime: number;
  completed: boolean;
  mastery: number;
}

export interface ContentStrategy {
  sequenceType: 'linear' | 'adaptive' | 'spiral' | 'discovery';
  difficultyProgression: 'gradual' | 'stepped' | 'dynamic';
  repetitionStrategy: 'spaced' | 'massed' | 'interleaved';
  feedbackFrequency: 'immediate' | 'delayed' | 'summary';
}

export class ContentOrchestrator {
  private activePaths: Map<string, LearningPath>;
  private contentPool: Map<string, ContentItem[]>;
  private strategies: Map<string, ContentStrategy>;

  constructor() {
    this.activePaths = new Map();
    this.contentPool = new Map();
    this.strategies = new Map();
  }

  /**
   * Creates a personalized learning path
   */
  createLearningPath(goal: LearningGoal, profile: LearnerProfile): LearningPath {
    console.log(`🎯 Creating learning path for: ${goal.description}`);

    // Determine optimal strategy
    const strategy = this.selectStrategy(profile);

    // Break down goal into steps
    const steps = this.decompose Goal(goal, profile, strategy);

    // Estimate duration
    const estimatedDuration = steps.reduce((sum, step) => sum + step.estimatedTime, 0);

    const path: LearningPath = {
      id: `path_${Date.now()}`,
      goal,
      steps,
      currentStep: 0,
      estimatedDuration,
      progress: 0
    };

    this.activePaths.set(path.id, path);

    console.log(`✨ Learning path created with ${steps.length} steps`);

    return path;
  }

  /**
   * Selects optimal content strategy
   */
  private selectStrategy(profile: LearnerProfile): ContentStrategy {
    const { cognitiveStyle, preferences } = profile;

    // Sequential learners prefer linear
    const sequenceType: ContentStrategy['sequenceType'] =
      cognitiveStyle.sequentialVsRandom < -0.5
        ? 'linear'
        : cognitiveStyle.sequentialVsRandom > 0.5
          ? 'discovery'
          : 'adaptive';

    // Analytical learners prefer gradual progression
    const difficultyProgression: ContentStrategy['difficultyProgression'] =
      cognitiveStyle.analyticalVsIntuitive < -0.3 ? 'gradual' : 'dynamic';

    // Determine repetition strategy
    const repetitionStrategy: ContentStrategy['repetitionStrategy'] =
      preferences.sessionLength > 30 ? 'spaced' : 'massed';

    return {
      sequenceType,
      difficultyProgression,
      repetitionStrategy,
      feedbackFrequency: preferences.feedbackFrequency
    };
  }

  /**
   * Decomposes goal into learning steps
   */
  private decomposeGoal(
    goal: LearningGoal,
    profile: LearnerProfile,
    strategy: ContentStrategy
  ): LearningStep[] {
    const steps: LearningStep[] = [];

    // For each target concept
    goal.targetConcepts.forEach((concept, index) => {
      // Check prerequisites
      const prerequisites = this.findPrerequisites(concept, profile);

      // Add prerequisite steps if needed
      prerequisites.forEach(prereq => {
        if (!this.hasStep(steps, prereq)) {
          steps.push(this.createStep(prereq, profile, 'prerequisite'));
        }
      });

      // Add main concept step
      steps.push(this.createStep(concept, profile, 'main'));

      // Add practice step
      steps.push(this.createStep(concept, profile, 'practice'));
    });

    // Order steps based on strategy
    return this.orderSteps(steps, strategy);
  }

  /**
   * Finds prerequisites for a concept
   */
  private findPrerequisites(concept: string, profile: LearnerProfile): string[] {
    // Check knowledge graph for prerequisites
    const node = profile.knowledgeGraph.find(n => n.concept === concept);

    if (!node) return [];

    // Return prerequisites that aren't mastered yet
    return node.prerequisites.filter(prereq => {
      const prereqNode = profile.knowledgeGraph.find(n => n.concept === prereq);
      return !prereqNode || prereqNode.masteryLevel < 0.7;
    });
  }

  /**
   * Checks if steps already contains concept
   */
  private hasStep(steps: LearningStep[], concept: string): boolean {
    return steps.some(step => step.concept === concept);
  }

  /**
   * Creates a learning step
   */
  private createStep(
    concept: string,
    profile: LearnerProfile,
    type: 'prerequisite' | 'main' | 'practice'
  ): LearningStep {
    const content = this.selectContent(concept, type, profile);
    const activities = this.generateActivities(concept, type, profile);

    return {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      concept,
      content,
      activities,
      estimatedTime: this.estimateStepTime(content, activities),
      completed: false,
      mastery: 0
    };
  }

  /**
   * Selects appropriate content for a step
   */
  private selectContent(
    concept: string,
    type: string,
    profile: LearnerProfile
  ): ContentItem[] {
    // Get content from pool
    const available = this.contentPool.get(concept) || [];

    // Filter by type and difficulty
    const suitable = available.filter(item => {
      // Match difficulty to learner level
      const targetDifficulty = this.getTargetDifficulty(concept, type, profile);
      return Math.abs(item.difficulty - targetDifficulty) < 0.2;
    });

    // Select based on learning style
    return this.rankByLearningStyle(suitable, profile.cognitiveStyle).slice(0, 3);
  }

  /**
   * Gets target difficulty for content
   */
  private getTargetDifficulty(concept: string, type: string, profile: LearnerProfile): number {
    const baseNODE = profile.knowledgeGraph.find(n => n.concept === concept);
    const baseMastery = baseNODE?.masteryLevel || 0;

    // Prerequisites: slightly easier
    if (type === 'prerequisite') return Math.max(0.2, baseMastery - 0.1);

    // Main: at level
    if (type === 'main') return baseMastery + 0.1;

    // Practice: slightly harder
    return Math.min(1.0, baseMastery + 0.2);
  }

  /**
   * Ranks content by learning style preference
   */
  private rankByLearningStyle(content: ContentItem[], style: any): ContentItem[] {
    return content.sort((a, b) => {
      const scoreA = this.scoreContentForStyle(a, style);
      const scoreB = this.scoreContentForStyle(b, style);
      return scoreB - scoreA;
    });
  }

  /**
   * Scores content item for learning style
   */
  private scoreContentForStyle(item: ContentItem, style: any): number {
    let score = 0;

    // Visual learners prefer videos and diagrams
    if (style.visualPreference > 0.6) {
      if (item.type === 'video') score += 0.3;
      if (item.type === 'interactive') score += 0.2;
    }

    // Kinesthetic learners prefer interactive content
    if (style.kinestheticPreference > 0.6) {
      if (item.type === 'interactive') score += 0.4;
      if (item.type === 'game') score += 0.3;
    }

    // Analytical learners prefer text
    if (style.analyticalVsIntuitive < -0.3) {
      if (item.type === 'text') score += 0.3;
    }

    return score;
  }

  /**
   * Generates learning activities
   */
  private generateActivities(
    concept: string,
    type: string,
    profile: LearnerProfile
  ): TeachingAction[] {
    const activities: TeachingAction[] = [];

    if (type === 'main') {
      // Explanation
      activities.push({
        type: 'explain',
        content: { concept, depth: profile.preferences.explanationDepth },
        expectedDuration: 5,
        challengeLevel: 0.3
      });

      // Examples
      activities.push({
        type: 'example',
        content: { concept, count: Math.ceil(profile.preferences.exampleDensity * 3) },
        expectedDuration: 3,
        challengeLevel: 0.4
      });
    }

    if (type === 'practice') {
      // Practice exercises
      activities.push({
        type: 'practice',
        content: { concept, difficulty: this.getTargetDifficulty(concept, type, profile) },
        expectedDuration: 10,
        challengeLevel: 0.6
      });

      // Quiz
      activities.push({
        type: 'question',
        content: { concept, format: 'multiple-choice' },
        expectedDuration: 2,
        challengeLevel: 0.5
      });
    }

    return activities;
  }

  /**
   * Estimates time for a step
   */
  private estimateStepTime(content: ContentItem[], activities: TeachingAction[]): number {
    const contentTime = content.reduce((sum, item) => sum + item.estimatedTime, 0);
    const activityTime = activities.reduce((sum, act) => sum + act.expectedDuration, 0);

    return contentTime + activityTime;
  }

  /**
   * Orders steps based on strategy
   */
  private orderSteps(steps: LearningStep[], strategy: ContentStrategy): LearningStep[] {
    if (strategy.sequenceType === 'linear') {
      // Keep original order
      return steps;
    }

    if (strategy.sequenceType === 'spiral') {
      // Interleave concepts
      return this.spiralOrder(steps);
    }

    if (strategy.sequenceType === 'discovery') {
      // Start with engaging, then build foundations
      return steps.sort((a, b) => b.mastery - a.mastery);
    }

    // Adaptive: order by prerequisites
    return this.topologicalSort(steps);
  }

  /**
   * Creates spiral ordering (revisit concepts)
   */
  private spiralOrder(steps: LearningStep[]): LearningStep[] {
    const ordered: LearningStep[] = [];
    const concepts = new Set<string>();

    // First pass: introduction to each concept
    steps.forEach(step => {
      if (!concepts.has(step.concept)) {
        ordered.push(step);
        concepts.add(step.concept);
      }
    });

    // Second pass: practice and deepening
    steps.forEach(step => {
      if (!ordered.includes(step)) {
        ordered.push(step);
      }
    });

    return ordered;
  }

  /**
   * Topological sort based on prerequisites
   */
  private topologicalSort(steps: LearningStep[]): LearningStep[] {
    // Simplified topological sort
    const sorted: LearningStep[] = [];
    const visited = new Set<string>();

    const visit = (step: LearningStep) => {
      if (visited.has(step.id)) return;

      visited.add(step.id);
      sorted.push(step);
    };

    steps.forEach(visit);

    return sorted;
  }

  /**
   * Gets next content to deliver
   */
  async getNextContent(pathId: string, profile: LearnerProfile): Promise<ContentItem | null> {
    const path = this.activePaths.get(pathId);

    if (!path || path.currentStep >= path.steps.length) {
      return null;
    }

    const step = path.steps[path.currentStep];

    // Select best content from step based on current performance
    const recentPerformance = this.getRecentPerformance(profile);
    const difficulty = this.adjustDifficulty(step.content[0].difficulty, recentPerformance);

    // Find content matching adjusted difficulty
    const suitable = step.content.find(
      item => Math.abs(item.difficulty - difficulty) < 0.15
    );

    return suitable || step.content[0];
  }

  /**
   * Gets recent performance average
   */
  private getRecentPerformance(profile: LearnerProfile): number {
    if (profile.learningHistory.length === 0) return 0.5;

    const recent = profile.learningHistory.slice(-5);
    return recent.reduce((sum, e) => sum + e.performance, 0) / recent.length;
  }

  /**
   * Adjusts difficulty based on performance
   */
  private adjustDifficulty(baseDifficulty: number, performance: number): number {
    if (performance > 0.85) {
      return Math.min(1.0, baseDifficulty + 0.1);
    } else if (performance < 0.5) {
      return Math.max(0.1, baseDifficulty - 0.15);
    }

    return baseDifficulty;
  }

  /**
   * Marks step as completed
   */
  completeStep(pathId: string, stepId: string, mastery: number): void {
    const path = this.activePaths.get(pathId);

    if (!path) return;

    const step = path.steps.find(s => s.id === stepId);

    if (step) {
      step.completed = true;
      step.mastery = mastery;

      // Move to next step
      path.currentStep++;

      // Update progress
      const completedSteps = path.steps.filter(s => s.completed).length;
      path.progress = completedSteps / path.steps.length;

      console.log(`✅ Step completed: ${step.concept} (${(path.progress * 100).toFixed(0)}%)`);
    }
  }

  /**
   * Adds content to pool
   */
  addContent(concept: string, content: ContentItem): void {
    const existing = this.contentPool.get(concept) || [];
    existing.push(content);
    this.contentPool.set(concept, existing);
  }

  /**
   * Gets learning path progress
   */
  getProgress(pathId: string): number {
    const path = this.activePaths.get(pathId);
    return path?.progress || 0;
  }
}
