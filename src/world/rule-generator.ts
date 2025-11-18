/**
 * Rule Generator
 *
 * Analyzes input and dynamically creates teaching rules
 * to govern the learning experience.
 */

import { Rule } from '../types/index.js';

export interface RuleTemplate {
  id: string;
  category: 'pedagogical' | 'content' | 'behavioral' | 'adaptive';
  pattern: string;
  generator: (context: any) => Rule;
}

export interface InputAnalysis {
  domain: string;
  concepts: string[];
  relationships: Array<{ from: string; to: string; type: string }>;
  constraints: string[];
  objectives: string[];
  complexity: number;
}

export class RuleGenerator {
  private templates: Map<string, RuleTemplate>;
  private generatedRules: Map<string, Rule>;

  constructor() {
    this.templates = new Map();
    this.generatedRules = new Map();
    this.initializeTemplates();
  }

  /**
   * Initializes rule templates
   */
  private initializeTemplates(): void {
    // Pedagogical rules
    this.addTemplate({
      id: 'prerequisite-enforcement',
      category: 'pedagogical',
      pattern: 'concept-dependency',
      generator: (context) => ({
        id: `rule_prereq_${Date.now()}`,
        name: 'Prerequisite Enforcement',
        condition: (ctx: any) => {
          const { concept, learnerProfile } = ctx;
          const prereqs = context.prerequisites || [];
          return prereqs.every((p: string) =>
            learnerProfile.knowledgeGraph.some(
              (node: any) => node.concept === p && node.masteryLevel >= 0.7
            )
          );
        },
        action: (ctx: any) => {
          if (!this.condition(ctx)) {
            return {
              type: 'redirect',
              message: 'You need to master prerequisites first',
              prerequisites: context.prerequisites
            };
          }
          return { type: 'proceed' };
        },
        priority: 10,
        enabled: true,
        metadata: new Map([['concept', context.concept]])
      })
    });

    this.addTemplate({
      id: 'difficulty-adaptation',
      category: 'adaptive',
      pattern: 'performance-based',
      generator: (context) => ({
        id: `rule_difficulty_${Date.now()}`,
        name: 'Difficulty Adaptation',
        condition: (ctx: any) => {
          return ctx.recentPerformance && ctx.recentPerformance.length >= 3;
        },
        action: (ctx: any) => {
          const { recentPerformance } = ctx;
          const avgPerformance =
            recentPerformance.reduce((sum: number, p: any) => sum + p.performance, 0) /
            recentPerformance.length;

          if (avgPerformance > 0.85) {
            return { type: 'increase-difficulty', amount: 0.1 };
          } else if (avgPerformance < 0.5) {
            return { type: 'decrease-difficulty', amount: 0.15 };
          }
          return { type: 'maintain' };
        },
        priority: 8,
        enabled: true,
        metadata: new Map([['adaptive', true]])
      })
    });

    this.addTemplate({
      id: 'engagement-maintenance',
      category: 'behavioral',
      pattern: 'emotional-response',
      generator: (context) => ({
        id: `rule_engage_${Date.now()}`,
        name: 'Engagement Maintenance',
        condition: (ctx: any) => {
          return ctx.emotionalState && ctx.emotionalState.engagement < 0.6;
        },
        action: (ctx: any) => {
          const { emotionalState } = ctx;

          if (emotionalState.frustration > 0.7) {
            return { type: 'provide-encouragement', variant: 'reassuring' };
          } else if (emotionalState.curiosity < 0.4) {
            return { type: 'introduce-novelty', variant: 'surprising-fact' };
          }
          return { type: 'vary-activity', variant: 'interactive' };
        },
        priority: 9,
        enabled: true,
        metadata: new Map([['emotional', true]])
      })
    });

    this.addTemplate({
      id: 'spaced-repetition',
      category: 'pedagogical',
      pattern: 'memory-consolidation',
      generator: (context) => ({
        id: `rule_spaced_${Date.now()}`,
        name: 'Spaced Repetition',
        condition: (ctx: any) => {
          const { concept, knowledgeGraph } = ctx;
          const node = knowledgeGraph.find((n: any) => n.concept === concept);

          if (!node) return false;

          const timeSinceReview = Date.now() - node.lastReviewed;
          const interval = this.calculateInterval(node.masteryLevel);

          return timeSinceReview >= interval;
        },
        action: (ctx: any) => {
          return {
            type: 'review',
            method: 'active-recall',
            message: `Let's revisit ${ctx.concept}`
          };
        },
        priority: 7,
        enabled: true,
        metadata: new Map([
          ['concept', context.concept],
          ['type', 'spaced-repetition']
        ])
      })
    });

    this.addTemplate({
      id: 'misconception-detection',
      category: 'content',
      pattern: 'error-analysis',
      generator: (context) => ({
        id: `rule_misconception_${Date.now()}`,
        name: 'Misconception Detection',
        condition: (ctx: any) => {
          return ctx.response && this.detectMisconception(ctx.response, context.domain);
        },
        action: (ctx: any) => {
          const misconception = this.identifyMisconception(ctx.response);
          return {
            type: 'correct-misconception',
            misconception,
            correction: this.generateCorrection(misconception),
            explanation: this.generateExplanation(misconception)
          };
        },
        priority: 10,
        enabled: true,
        metadata: new Map([['domain', context.domain]])
      })
    });
  }

  /**
   * Adds a rule template
   */
  private addTemplate(template: RuleTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Analyzes input to understand the learning domain
   */
  analyzeInput(input: string | any): InputAnalysis {
    // If input is already structured
    if (typeof input === 'object') {
      return input as InputAnalysis;
    }

    // Parse natural language input
    const text = input.toLowerCase();

    // Extract domain
    const domain = this.extractDomain(text);

    // Extract concepts
    const concepts = this.extractConcepts(text);

    // Infer relationships
    const relationships = this.inferRelationships(concepts, text);

    // Extract constraints
    const constraints = this.extractConstraints(text);

    // Extract objectives
    const objectives = this.extractObjectives(text);

    // Calculate complexity
    const complexity = this.estimateComplexity(concepts, relationships);

    return {
      domain,
      concepts,
      relationships,
      constraints,
      objectives,
      complexity
    };
  }

  /**
   * Extracts domain from input
   */
  private extractDomain(text: string): string {
    const domainKeywords = {
      mathematics: ['math', 'algebra', 'calculus', 'geometry', 'equation'],
      programming: ['code', 'programming', 'function', 'algorithm', 'variable'],
      science: ['physics', 'chemistry', 'biology', 'experiment', 'theory'],
      language: ['grammar', 'vocabulary', 'writing', 'reading', 'literature'],
      music: ['note', 'chord', 'rhythm', 'melody', 'harmony']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        return domain;
      }
    }

    return 'general';
  }

  /**
   * Extracts concepts from input
   */
  private extractConcepts(text: string): string[] {
    // Simple noun extraction (in real implementation, use NLP)
    const words = text.split(/\s+/);
    const concepts: string[] = [];

    // Look for capitalized words and important terms
    words.forEach((word, i) => {
      if (word.length > 3 && (word[0] === word[0].toUpperCase() || this.isImportantTerm(word))) {
        concepts.push(word.toLowerCase());
      }
    });

    return [...new Set(concepts)]; // Remove duplicates
  }

  /**
   * Checks if a word is an important term
   */
  private isImportantTerm(word: string): boolean {
    const importantTerms = [
      'function',
      'variable',
      'equation',
      'algorithm',
      'theory',
      'principle',
      'concept',
      'method'
    ];
    return importantTerms.includes(word.toLowerCase());
  }

  /**
   * Infers relationships between concepts
   */
  private inferRelationships(
    concepts: string[],
    text: string
  ): Array<{ from: string; to: string; type: string }> {
    const relationships: Array<{ from: string; to: string; type: string }> = [];

    // Look for relationship indicators
    const relationshipPatterns = [
      { pattern: /(\w+)\s+(?:is a|are)\s+(\w+)/g, type: 'is-a' },
      { pattern: /(\w+)\s+(?:uses|use)\s+(\w+)/g, type: 'uses' },
      { pattern: /(\w+)\s+(?:requires|require)\s+(\w+)/g, type: 'requires' },
      { pattern: /(\w+)\s+(?:leads to|causes)\s+(\w+)/g, type: 'causes' }
    ];

    relationshipPatterns.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        relationships.push({
          from: match[1].toLowerCase(),
          to: match[2].toLowerCase(),
          type
        });
      }
    });

    return relationships;
  }

  /**
   * Extracts constraints from input
   */
  private extractConstraints(text: string): string[] {
    const constraints: string[] = [];

    if (text.includes('beginner') || text.includes('basics')) {
      constraints.push('beginner-friendly');
    }

    if (text.includes('advanced') || text.includes('expert')) {
      constraints.push('advanced-level');
    }

    if (text.includes('quick') || text.includes('short')) {
      constraints.push('time-limited');
    }

    if (text.includes('practical') || text.includes('hands-on')) {
      constraints.push('practice-focused');
    }

    return constraints;
  }

  /**
   * Extracts learning objectives from input
   */
  private extractObjectives(text: string): string[] {
    const objectives: string[] = [];

    const objectivePatterns = [
      /(?:learn|understand|master)\s+(.+?)(?:\.|,|$)/gi,
      /(?:goal|objective|aim)(?:\s+is)?\s+to\s+(.+?)(?:\.|,|$)/gi
    ];

    objectivePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        objectives.push(match[1].trim());
      }
    });

    return objectives;
  }

  /**
   * Estimates complexity of the domain
   */
  private estimateComplexity(
    concepts: string[],
    relationships: Array<{ from: string; to: string; type: string }>
  ): number {
    const conceptScore = Math.min(1.0, concepts.length / 20);
    const relationshipScore = Math.min(1.0, relationships.length / 30);

    return (conceptScore + relationshipScore) / 2;
  }

  /**
   * Generates rules from input analysis
   */
  generateRules(analysis: InputAnalysis): Rule[] {
    const rules: Rule[] = [];

    // Generate rules based on domain
    this.templates.forEach(template => {
      const rule = template.generator({
        domain: analysis.domain,
        concepts: analysis.concepts,
        complexity: analysis.complexity,
        prerequisites: this.inferPrerequisites(analysis)
      });

      rules.push(rule);
      this.generatedRules.set(rule.id, rule);
    });

    console.log(`📋 Generated ${rules.length} rules for ${analysis.domain} domain`);

    return rules;
  }

  /**
   * Infers prerequisites from concept relationships
   */
  private inferPrerequisites(analysis: InputAnalysis): string[] {
    const prereqs = new Set<string>();

    analysis.relationships.forEach(rel => {
      if (rel.type === 'requires' || rel.type === 'prerequisite') {
        prereqs.add(rel.to);
      }
    });

    return Array.from(prereqs);
  }

  /**
   * Gets a generated rule by ID
   */
  getRule(ruleId: string): Rule | undefined {
    return this.generatedRules.get(ruleId);
  }

  /**
   * Gets all rules matching a category
   */
  getRulesByCategory(category: RuleTemplate['category']): Rule[] {
    const rules: Rule[] = [];

    this.generatedRules.forEach(rule => {
      // Check if rule's metadata indicates category
      if (rule.metadata.get('category') === category) {
        rules.push(rule);
      }
    });

    return rules;
  }

  /**
   * Updates a rule's enabled status
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.generatedRules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      console.log(`🔄 Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Validates rules against context
   */
  validateRules(context: any): { valid: Rule[]; invalid: Rule[] } {
    const valid: Rule[] = [];
    const invalid: Rule[] = [];

    this.generatedRules.forEach(rule => {
      try {
        // Test if condition can be evaluated
        rule.condition(context);
        valid.push(rule);
      } catch (error) {
        invalid.push(rule);
      }
    });

    return { valid, invalid };
  }

  /**
   * Helper methods for misconception detection
   */
  private detectMisconception(response: any, domain: string): boolean {
    // Placeholder - would use ML model in real implementation
    return false;
  }

  private identifyMisconception(response: any): string {
    return 'unidentified-misconception';
  }

  private generateCorrection(misconception: string): string {
    return `Correction for ${misconception}`;
  }

  private generateExplanation(misconception: string): string {
    return `Explanation for ${misconception}`;
  }

  private calculateInterval(masteryLevel: number): number {
    // Exponential spacing based on mastery
    const baseInterval = 1000 * 60 * 60 * 24; // 1 day
    return baseInterval * Math.pow(2, masteryLevel * 5);
  }
}
