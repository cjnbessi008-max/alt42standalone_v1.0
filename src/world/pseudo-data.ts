/**
 * Pseudo Data Creator
 *
 * Generates synthetic data to fill gaps in the learning experience.
 * Creates examples, exercises, and scenarios when real data is missing.
 */

import { ContentItem, TeachingContext } from '../types/index.js';

export interface DataGap {
  type: 'example' | 'exercise' | 'explanation' | 'analogy';
  concept: string;
  difficulty: number;
  priority: number;
}

export interface PseudoDataConfig {
  domain: string;
  difficulty: number;
  quantity: number;
  variety: number; // 0.0 to 1.0
  creativity: number; // 0.0 to 1.0
}

export class PseudoDataCreator {
  private generatedData: Map<string, any>;
  private templates: Map<string, DataTemplate>;
  private evolutionHistory: Array<{ data: any; fitness: number; timestamp: number }>;

  constructor() {
    this.generatedData = new Map();
    this.templates = new Map();
    this.evolutionHistory = [];
    this.initializeTemplates();
  }

  /**
   * Initializes data generation templates
   */
  private initializeTemplates(): void {
    // Mathematics templates
    this.templates.set('math-equation', {
      type: 'exercise',
      domain: 'mathematics',
      generate: (config: PseudoDataConfig) => {
        const difficulty = config.difficulty;

        if (difficulty < 0.3) {
          // Simple arithmetic
          const a = Math.floor(Math.random() * 20) + 1;
          const b = Math.floor(Math.random() * 20) + 1;
          const ops = ['+', '-', '×', '÷'];
          const op = ops[Math.floor(Math.random() * ops.length)];

          return {
            problem: `${a} ${op} ${b} = ?`,
            solution: this.evaluate(a, op, b),
            steps: this.generateSteps(a, op, b),
            difficulty: 0.2
          };
        } else if (difficulty < 0.7) {
          // Algebraic equations
          const x = Math.floor(Math.random() * 10) + 1;
          const a = Math.floor(Math.random() * 10) + 1;
          const b = Math.floor(Math.random() * 20) + 1;

          return {
            problem: `${a}x + ${b} = ${a * x + b}. Find x.`,
            solution: x,
            steps: [
              `${a}x + ${b} = ${a * x + b}`,
              `${a}x = ${a * x + b} - ${b}`,
              `${a}x = ${a * x}`,
              `x = ${x}`
            ],
            difficulty: 0.5
          };
        } else {
          // Quadratic equations
          const a = Math.floor(Math.random() * 5) + 1;
          const b = Math.floor(Math.random() * 10) - 5;
          const c = Math.floor(Math.random() * 10) - 5;

          return {
            problem: `${a}x² + ${b}x + ${c} = 0`,
            solution: this.solveQuadratic(a, b, c),
            steps: this.quadraticSteps(a, b, c),
            difficulty: 0.8
          };
        }
      }
    });

    // Programming templates
    this.templates.set('code-exercise', {
      type: 'exercise',
      domain: 'programming',
      generate: (config: PseudoDataConfig) => {
        const exercises = [
          {
            problem: 'Write a function that returns the sum of two numbers',
            solution: 'function sum(a, b) { return a + b; }',
            difficulty: 0.2
          },
          {
            problem: 'Write a function that reverses a string',
            solution: 'function reverse(str) { return str.split("").reverse().join(""); }',
            difficulty: 0.4
          },
          {
            problem: 'Write a function that finds the maximum number in an array',
            solution: 'function max(arr) { return Math.max(...arr); }',
            difficulty: 0.5
          },
          {
            problem: 'Implement a function to check if a string is a palindrome',
            solution:
              'function isPalindrome(str) { return str === str.split("").reverse().join(""); }',
            difficulty: 0.6
          }
        ];

        const index = Math.floor(config.difficulty * exercises.length);
        return exercises[Math.min(index, exercises.length - 1)];
      }
    });

    // Analogy templates
    this.templates.set('analogy', {
      type: 'explanation',
      domain: 'general',
      generate: (config: PseudoDataConfig) => {
        const analogies = {
          variable: 'A variable is like a labeled box where you can store things',
          function: 'A function is like a recipe - you give it ingredients (inputs) and it produces a dish (output)',
          loop: 'A loop is like doing laps around a track - you repeat the same path multiple times',
          array: 'An array is like a row of mailboxes, each with its own number',
          class: 'A class is like a blueprint for building houses - you can create many houses from one blueprint'
        };

        return analogies;
      }
    });
  }

  /**
   * Analyzes context to identify data gaps
   */
  analyzeGaps(context: TeachingContext): DataGap[] {
    const gaps: DataGap[] = [];
    const { currentTopic, availableContent, learner } = context;

    // Check for missing examples
    const examples = availableContent.filter(c => c.type === 'text' || c.type === 'interactive');
    if (examples.length < 3) {
      gaps.push({
        type: 'example',
        concept: currentTopic,
        difficulty: learner.cognitiveStyle.abstractionLevel,
        priority: 0.8
      });
    }

    // Check for missing exercises
    const exercises = availableContent.filter(c => c.type === 'quiz');
    if (exercises.length < 5) {
      gaps.push({
        type: 'exercise',
        concept: currentTopic,
        difficulty: this.estimateDifficulty(learner),
        priority: 0.9
      });
    }

    // Check for missing explanations
    const explanations = availableContent.filter(c => c.type === 'text');
    if (explanations.length < 2) {
      gaps.push({
        type: 'explanation',
        concept: currentTopic,
        difficulty: 0.5,
        priority: 0.7
      });
    }

    // Check for analogies
    if (learner.preferences.explanationDepth !== 'brief') {
      gaps.push({
        type: 'analogy',
        concept: currentTopic,
        difficulty: 0.3,
        priority: 0.6
      });
    }

    console.log(`🔍 Identified ${gaps.length} data gaps`);

    return gaps;
  }

  /**
   * Fills data gaps with pseudo-generated content
   */
  fillGaps(gaps: DataGap[], config: Partial<PseudoDataConfig> = {}): ContentItem[] {
    const defaultConfig: PseudoDataConfig = {
      domain: 'general',
      difficulty: 0.5,
      quantity: gaps.length,
      variety: 0.7,
      creativity: 0.6,
      ...config
    };

    const generated: ContentItem[] = [];

    gaps.forEach((gap, index) => {
      const item = this.generateContent(gap, {
        ...defaultConfig,
        difficulty: gap.difficulty
      });

      if (item) {
        generated.push(item);
        this.generatedData.set(item.id, item);
      }
    });

    console.log(`✨ Generated ${generated.length} pseudo-data items`);

    return generated;
  }

  /**
   * Generates a content item for a specific gap
   */
  private generateContent(gap: DataGap, config: PseudoDataConfig): ContentItem | null {
    const template = this.selectTemplate(gap, config);

    if (!template) return null;

    const content = template.generate(config);

    return {
      id: `pseudo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.mapGapTypeToContentType(gap.type),
      topic: gap.concept,
      difficulty: gap.difficulty,
      estimatedTime: this.estimateTime(gap.type, gap.difficulty),
      prerequisites: [],
      content
    };
  }

  /**
   * Selects appropriate template for a gap
   */
  private selectTemplate(gap: DataGap, config: PseudoDataConfig): DataTemplate | undefined {
    // Find matching templates
    const candidates: DataTemplate[] = [];

    this.templates.forEach(template => {
      if (
        (template.domain === config.domain || template.domain === 'general') &&
        template.type === gap.type
      ) {
        candidates.push(template);
      }
    });

    if (candidates.length === 0) return undefined;

    // Select with some randomness for variety
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  }

  /**
   * Maps gap type to content type
   */
  private mapGapTypeToContentType(gapType: DataGap['type']): ContentItem['type'] {
    const mapping: Record<DataGap['type'], ContentItem['type']> = {
      example: 'interactive',
      exercise: 'quiz',
      explanation: 'text',
      analogy: 'text'
    };

    return mapping[gapType];
  }

  /**
   * Estimates time needed for content
   */
  private estimateTime(type: DataGap['type'], difficulty: number): number {
    const baseTime = {
      example: 3,
      exercise: 5,
      explanation: 4,
      analogy: 2
    };

    return Math.ceil(baseTime[type] * (1 + difficulty));
  }

  /**
   * Estimates appropriate difficulty for learner
   */
  private estimateDifficulty(learner: any): number {
    // Simple heuristic based on recent performance
    if (learner.learningHistory && learner.learningHistory.length > 0) {
      const recent = learner.learningHistory.slice(-5);
      const avgPerformance =
        recent.reduce((sum: number, e: any) => sum + e.performance, 0) / recent.length;

      // Target slightly above current performance
      return Math.min(1.0, avgPerformance + 0.1);
    }

    return 0.5; // Default medium difficulty
  }

  /**
   * Tracks evolution of generated data
   */
  trackEvolution(dataId: string, fitness: number): void {
    const data = this.generatedData.get(dataId);

    if (data) {
      this.evolutionHistory.push({
        data,
        fitness,
        timestamp: Date.now()
      });

      // Keep only recent history
      if (this.evolutionHistory.length > 100) {
        this.evolutionHistory.shift();
      }
    }
  }

  /**
   * Evolves data generation based on fitness
   */
  evolveTemplates(): void {
    if (this.evolutionHistory.length < 10) return;

    // Analyze which types of content perform best
    const typePerformance = new Map<string, { total: number; count: number }>();

    this.evolutionHistory.forEach(({ data, fitness }) => {
      const type = data.type;
      const existing = typePerformance.get(type) || { total: 0, count: 0 };

      existing.total += fitness;
      existing.count += 1;

      typePerformance.set(type, existing);
    });

    // Adjust template weights based on performance
    console.log('🧬 Evolving data generation templates...');

    typePerformance.forEach((perf, type) => {
      const avgFitness = perf.total / perf.count;
      console.log(`  ${type}: avg fitness = ${avgFitness.toFixed(2)}`);
    });
  }

  /**
   * Helper methods for math template
   */
  private evaluate(a: number, op: string, b: number): number {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return Math.floor(a / b);
      default:
        return 0;
    }
  }

  private generateSteps(a: number, op: string, b: number): string[] {
    return [`${a} ${op} ${b} = ${this.evaluate(a, op, b)}`];
  }

  private solveQuadratic(a: number, b: number, c: number): any {
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return { type: 'no-real-solutions' };
    } else if (discriminant === 0) {
      return { x: -b / (2 * a) };
    } else {
      return {
        x1: (-b + Math.sqrt(discriminant)) / (2 * a),
        x2: (-b - Math.sqrt(discriminant)) / (2 * a)
      };
    }
  }

  private quadraticSteps(a: number, b: number, c: number): string[] {
    return [
      `Using quadratic formula: x = (-b ± √(b²-4ac)) / 2a`,
      `a = ${a}, b = ${b}, c = ${c}`,
      `Discriminant = ${b}² - 4(${a})(${c}) = ${b * b - 4 * a * c}`
    ];
  }

  /**
   * Gets generation statistics
   */
  getStatistics(): {
    totalGenerated: number;
    byType: Map<string, number>;
    avgFitness: number;
  } {
    const byType = new Map<string, number>();

    this.generatedData.forEach(data => {
      byType.set(data.type, (byType.get(data.type) || 0) + 1);
    });

    const avgFitness =
      this.evolutionHistory.length > 0
        ? this.evolutionHistory.reduce((sum, e) => sum + e.fitness, 0) /
          this.evolutionHistory.length
        : 0;

    return {
      totalGenerated: this.generatedData.size,
      byType,
      avgFitness
    };
  }
}

interface DataTemplate {
  type: string;
  domain: string;
  generate: (config: PseudoDataConfig) => any;
}
