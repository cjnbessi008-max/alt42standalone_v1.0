/**
 * KTM Math Universe - Unified App Framework
 *
 * A standardized framework for all 500+ mathematical learning apps
 * in the KTM Universe. Ensures consistency, AI integration, and
 * easy development of new apps.
 */

export type PlanetType = 'history' | 'numbers' | 'algebra' | 'geometry' | 'calculus' | 'statistics';
export type AppCategory = 'history' | 'domain' | 'support';

export interface MathConcept {
  id: string;
  name: string;
  planet: PlanetType;
  prerequisites: string[];
  relatedConcepts: string[];
}

export interface AppMetadata {
  id: string;
  name: string;
  description: string;
  planet: PlanetType;
  category: AppCategory;
  version: string;
  author: string;

  // Learning attributes
  difficulty: number; // 0.0 to 1.0
  estimatedTime: number; // minutes
  concepts: MathConcept[];
  learningObjectives: string[];
  prerequisites: string[];

  // AI Teacher integration
  adaptiveDifficulty: boolean;
  emotionalAwareness: boolean;
  progressTracking: boolean;

  // UI configuration
  fullscreen: boolean;
  responsive: boolean;
  theme: 'light' | 'dark' | 'planet-themed';

  // Gamification
  hasAchievements: boolean;
  hasLeaderboard: boolean;
  pointsAwarded: number;

  tags: string[];
  keywords: string[];
}

export interface AppState {
  currentLevel: number;
  score: number;
  timeSpent: number; // seconds
  attemptsCount: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
  completed: boolean;
  masteryLevel: number; // 0.0 to 1.0
  customData: Record<string, any>;
}

export interface AppConfig {
  difficulty: number;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  hintsEnabled: boolean;
  timeLimit?: number;
  practiceMode: boolean;
  language: string;
}

export interface AppEvent {
  type: 'start' | 'progress' | 'complete' | 'error' | 'hint' | 'achievement';
  timestamp: number;
  data: any;
}

/**
 * Base class for all KTM Math Apps
 */
export abstract class MathApp {
  protected metadata: AppMetadata;
  protected state: AppState;
  protected config: AppConfig;
  protected eventHandlers: Map<string, ((event: AppEvent) => void)[]>;
  protected container: HTMLElement | null = null;

  constructor(metadata: AppMetadata, config?: Partial<AppConfig>) {
    this.metadata = metadata;
    this.state = this.initializeState();
    this.config = this.initializeConfig(config);
    this.eventHandlers = new Map();
  }

  // ===================================================================
  // LIFECYCLE METHODS (must be implemented by child classes)
  // ===================================================================

  /**
   * Initialize the app - called once when app is created
   */
  abstract initialize(): Promise<void>;

  /**
   * Render the app UI into the container
   */
  abstract render(container: HTMLElement): void;

  /**
   * Start the app - called when user begins interaction
   */
  abstract start(): void;

  /**
   * Pause the app
   */
  abstract pause(): void;

  /**
   * Resume the app
   */
  abstract resume(): void;

  /**
   * Reset the app to initial state
   */
  abstract reset(): void;

  /**
   * Cleanup when app is destroyed
   */
  abstract destroy(): void;

  /**
   * Process user input/interaction
   */
  abstract processInput(input: any): void;

  /**
   * Check if user's answer/action is correct
   */
  abstract checkAnswer(answer: any): boolean;

  /**
   * Provide a hint to the user
   */
  abstract provideHint(): string;

  // ===================================================================
  // COMMON FUNCTIONALITY
  // ===================================================================

  /**
   * Initializes default app state
   */
  private initializeState(): AppState {
    return {
      currentLevel: 1,
      score: 0,
      timeSpent: 0,
      attemptsCount: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      hintsUsed: 0,
      completed: false,
      masteryLevel: 0,
      customData: {}
    };
  }

  /**
   * Initializes app configuration
   */
  private initializeConfig(config?: Partial<AppConfig>): AppConfig {
    return {
      difficulty: this.metadata.difficulty,
      soundEnabled: true,
      animationsEnabled: true,
      hintsEnabled: true,
      practiceMode: false,
      language: 'en',
      ...config
    };
  }

  /**
   * Launch the app
   */
  async launch(container: HTMLElement): Promise<void> {
    this.container = container;

    await this.initialize();
    this.render(container);

    this.emitEvent({
      type: 'start',
      timestamp: Date.now(),
      data: { appId: this.metadata.id }
    });

    this.start();
  }

  /**
   * Updates app state
   */
  protected updateState(updates: Partial<AppState>): void {
    this.state = { ...this.state, ...updates };

    // Recalculate mastery level
    if (this.state.attemptsCount > 0) {
      this.state.masteryLevel =
        this.state.correctAnswers / this.state.attemptsCount;
    }

    this.emitEvent({
      type: 'progress',
      timestamp: Date.now(),
      data: { state: this.state }
    });
  }

  /**
   * Adjusts difficulty dynamically
   */
  adjustDifficulty(delta: number): void {
    if (!this.metadata.adaptiveDifficulty) return;

    this.config.difficulty = Math.max(0, Math.min(1, this.config.difficulty + delta));

    console.log(`📊 Difficulty adjusted to ${(this.config.difficulty * 100).toFixed(0)}%`);
  }

  /**
   * Records an attempt
   */
  protected recordAttempt(correct: boolean, timeSpent?: number): void {
    this.state.attemptsCount++;

    if (correct) {
      this.state.correctAnswers++;
      this.state.score += this.calculatePoints(timeSpent);

      // Increase difficulty after 3 correct in a row
      if (this.state.correctAnswers % 3 === 0) {
        this.adjustDifficulty(0.1);
      }
    } else {
      this.state.incorrectAnswers++;

      // Decrease difficulty after 3 incorrect in a row
      if (this.state.incorrectAnswers % 3 === 0) {
        this.adjustDifficulty(-0.1);
      }
    }

    this.updateState({});
  }

  /**
   * Calculates points awarded
   */
  private calculatePoints(timeSpent?: number): number {
    let points = this.metadata.pointsAwarded;

    // Bonus for quick answers
    if (timeSpent && timeSpent < 30) {
      points *= 1.5;
    }

    // Bonus for high difficulty
    points *= (0.5 + this.config.difficulty);

    return Math.round(points);
  }

  /**
   * Marks app as completed
   */
  protected complete(): void {
    this.state.completed = true;

    this.emitEvent({
      type: 'complete',
      timestamp: Date.now(),
      data: {
        score: this.state.score,
        masteryLevel: this.state.masteryLevel,
        timeSpent: this.state.timeSpent
      }
    });
  }

  /**
   * Event system
   */
  on(eventType: AppEvent['type'], handler: (event: AppEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  protected emitEvent(event: AppEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => handler(event));
  }

  // ===================================================================
  // GETTERS
  // ===================================================================

  getMetadata(): AppMetadata {
    return { ...this.metadata };
  }

  getState(): AppState {
    return { ...this.state };
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  getMasteryLevel(): number {
    return this.state.masteryLevel;
  }

  isCompleted(): boolean {
    return this.state.completed;
  }
}

/**
 * App Registry - manages all apps in the universe
 */
export class AppRegistry {
  private apps: Map<string, typeof MathApp>;
  private instances: Map<string, MathApp>;
  private metadata: Map<string, AppMetadata>;

  constructor() {
    this.apps = new Map();
    this.instances = new Map();
    this.metadata = new Map();
  }

  /**
   * Registers a new app
   */
  register(appClass: typeof MathApp, metadata: AppMetadata): void {
    this.apps.set(metadata.id, appClass);
    this.metadata.set(metadata.id, metadata);

    console.log(`📱 Registered app: ${metadata.name} (${metadata.id})`);
  }

  /**
   * Creates an instance of an app
   */
  instantiate(appId: string, config?: Partial<AppConfig>): MathApp | null {
    const AppClass = this.apps.get(appId);
    const metadata = this.metadata.get(appId);

    if (!AppClass || !metadata) {
      console.error(`App not found: ${appId}`);
      return null;
    }

    const instance = new AppClass(metadata, config);
    this.instances.set(appId, instance);

    return instance;
  }

  /**
   * Gets all apps for a planet
   */
  getAppsByPlanet(planet: PlanetType): AppMetadata[] {
    return Array.from(this.metadata.values())
      .filter(meta => meta.planet === planet);
  }

  /**
   * Gets all apps by category
   */
  getAppsByCategory(category: AppCategory): AppMetadata[] {
    return Array.from(this.metadata.values())
      .filter(meta => meta.category === category);
  }

  /**
   * Gets apps by difficulty range
   */
  getAppsByDifficulty(min: number, max: number): AppMetadata[] {
    return Array.from(this.metadata.values())
      .filter(meta => meta.difficulty >= min && meta.difficulty <= max);
  }

  /**
   * Searches apps by concepts
   */
  searchByConcepts(concepts: string[]): AppMetadata[] {
    return Array.from(this.metadata.values())
      .filter(meta =>
        meta.concepts.some(c => concepts.includes(c.name))
      );
  }

  /**
   * Gets total app count
   */
  getTotalApps(): number {
    return this.apps.size;
  }

  /**
   * Gets statistics
   */
  getStatistics(): {
    total: number;
    byPlanet: Map<PlanetType, number>;
    byCategory: Map<AppCategory, number>;
    avgDifficulty: number;
  } {
    const byPlanet = new Map<PlanetType, number>();
    const byCategory = new Map<AppCategory, number>();
    let totalDifficulty = 0;

    this.metadata.forEach(meta => {
      byPlanet.set(meta.planet, (byPlanet.get(meta.planet) || 0) + 1);
      byCategory.set(meta.category, (byCategory.get(meta.category) || 0) + 1);
      totalDifficulty += meta.difficulty;
    });

    return {
      total: this.apps.size,
      byPlanet,
      byCategory,
      avgDifficulty: totalDifficulty / this.apps.size
    };
  }
}

/**
 * Global app registry singleton
 */
export const appRegistry = new AppRegistry();
