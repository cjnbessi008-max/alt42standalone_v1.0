/**
 * Knowledge Graph Builder
 *
 * Creates and maintains a living graph of concepts,
 * relationships, and mastery levels.
 */

import { KnowledgeNode, KnowledgeConnection, LearningEvent } from '../types/index.js';

export interface GraphAnalytics {
  totalConcepts: number;
  masteredConcepts: number;
  inProgressConcepts: number;
  notStartedConcepts: number;
  averageMastery: number;
  strongestConnections: KnowledgeConnection[];
  weakestAreas: KnowledgeNode[];
  readyToLearn: KnowledgeNode[];
}

export class KnowledgeGraphBuilder {
  private graph: Map<string, KnowledgeNode>;
  private connectionIndex: Map<string, Set<string>>;

  constructor() {
    this.graph = new Map();
    this.connectionIndex = new Map();
  }

  /**
   * Adds a concept to the knowledge graph
   */
  addConcept(
    concept: string,
    prerequisites: string[] = [],
    initialMastery: number = 0
  ): KnowledgeNode {
    const existing = this.findNode(concept);

    if (existing) {
      return existing;
    }

    const node: KnowledgeNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      concept,
      masteryLevel: initialMastery,
      lastReviewed: Date.now(),
      prerequisites,
      connections: [],
      misconceptions: []
    };

    this.graph.set(node.id, node);

    // Create prerequisite connections
    prerequisites.forEach(prereq => {
      const prereqNode = this.findNode(prereq);
      if (prereqNode) {
        this.addConnection(prereqNode.id, node.id, 'prerequisite', 1.0);
      }
    });

    console.log(`📚 Concept added to knowledge graph: ${concept}`);

    return node;
  }

  /**
   * Adds a connection between concepts
   */
  addConnection(
    fromId: string,
    toId: string,
    type: KnowledgeConnection['type'],
    strength: number = 0.5
  ): void {
    const fromNode = this.graph.get(fromId);
    const toNode = this.graph.get(toId);

    if (!fromNode || !toNode) return;

    // Check if connection already exists
    const existing = fromNode.connections.find(c => c.targetId === toId && c.type === type);

    if (existing) {
      // Strengthen existing connection
      existing.strength = Math.min(1.0, existing.strength + 0.1);
    } else {
      // Create new connection
      fromNode.connections.push({
        targetId: toId,
        strength,
        type
      });

      // Update connection index
      const connections = this.connectionIndex.get(fromId) || new Set();
      connections.add(toId);
      this.connectionIndex.set(fromId, connections);
    }
  }

  /**
   * Finds a node by concept name
   */
  findNode(concept: string): KnowledgeNode | undefined {
    for (const node of this.graph.values()) {
      if (node.concept.toLowerCase() === concept.toLowerCase()) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Updates mastery level based on learning event
   */
  updateMastery(concept: string, event: LearningEvent): void {
    const node = this.findNode(concept);

    if (!node) return;

    // Calculate new mastery using weighted average
    const eventWeight = 0.3; // Weight of this single event
    const historyWeight = 1 - eventWeight;

    const newMastery =
      node.masteryLevel * historyWeight + event.performance * eventWeight;

    node.masteryLevel = Math.max(0, Math.min(1, newMastery + event.masteryGain));
    node.lastReviewed = event.timestamp;

    console.log(
      `📈 Mastery updated: ${concept} → ${(node.masteryLevel * 100).toFixed(0)}%`
    );

    // Update connected concepts (knowledge transfer)
    this.propagateMastery(node);
  }

  /**
   * Propagates mastery gains to related concepts
   */
  private propagateMastery(node: KnowledgeNode): void {
    node.connections.forEach(conn => {
      if (conn.type === 'application' || conn.type === 'analogy') {
        const targetNode = this.graph.get(conn.targetId);

        if (targetNode && node.masteryLevel > targetNode.masteryLevel) {
          // Slight mastery boost from related concept
          const boost = (node.masteryLevel - targetNode.masteryLevel) * conn.strength * 0.1;
          targetNode.masteryLevel = Math.min(1.0, targetNode.masteryLevel + boost);
        }
      }
    });
  }

  /**
   * Identifies concepts ready to learn
   */
  getReadyToLearn(): KnowledgeNode[] {
    const ready: KnowledgeNode[] = [];

    this.graph.forEach(node => {
      // Not already mastered
      if (node.masteryLevel >= 0.8) return;

      // All prerequisites are mastered
      const prerequisitesMet = node.prerequisites.every(prereq => {
        const prereqNode = this.findNode(prereq);
        return prereqNode && prereqNode.masteryLevel >= 0.7;
      });

      if (prerequisitesMet) {
        ready.push(node);
      }
    });

    // Sort by current mastery (continue in-progress first)
    return ready.sort((a, b) => b.masteryLevel - a.masteryLevel);
  }

  /**
   * Identifies knowledge gaps
   */
  findGaps(): KnowledgeNode[] {
    const gaps: KnowledgeNode[] = [];

    this.graph.forEach(node => {
      // Low mastery
      if (node.masteryLevel < 0.4) {
        gaps.push(node);
      }

      // Has misconceptions
      if (node.misconceptions.length > 0) {
        gaps.push(node);
      }

      // Not reviewed recently (over 7 days for mastered concepts)
      const daysSinceReview = (Date.now() - node.lastReviewed) / (1000 * 60 * 60 * 24);
      if (node.masteryLevel > 0.7 && daysSinceReview > 7) {
        gaps.push(node);
      }
    });

    return gaps;
  }

  /**
   * Records a misconception
   */
  addMisconception(concept: string, misconception: string): void {
    const node = this.findNode(concept);

    if (node && !node.misconceptions.includes(misconception)) {
      node.misconceptions.push(misconception);
      console.log(`⚠️ Misconception recorded: ${concept} - ${misconception}`);
    }
  }

  /**
   * Clears a misconception after correction
   */
  clearMisconception(concept: string, misconception: string): void {
    const node = this.findNode(concept);

    if (node) {
      node.misconceptions = node.misconceptions.filter(m => m !== misconception);
      console.log(`✅ Misconception cleared: ${concept}`);
    }
  }

  /**
   * Gets learning path to a target concept
   */
  getPathTo(targetConcept: string): KnowledgeNode[] {
    const target = this.findNode(targetConcept);

    if (!target) return [];

    const path: KnowledgeNode[] = [];
    const visited = new Set<string>();

    const buildPath = (node: KnowledgeNode): boolean => {
      if (visited.has(node.id)) return false;

      visited.add(node.id);

      // Add prerequisites first
      for (const prereq of node.prerequisites) {
        const prereqNode = this.findNode(prereq);

        if (prereqNode && prereqNode.masteryLevel < 0.7) {
          if (buildPath(prereqNode)) {
            path.push(prereqNode);
          }
        }
      }

      return true;
    };

    buildPath(target);
    path.push(target);

    return path;
  }

  /**
   * Suggests next concepts to learn
   */
  suggestNext(count: number = 3): KnowledgeNode[] {
    const ready = this.getReadyToLearn();

    // Prioritize by:
    // 1. Has some progress (continue what's started)
    // 2. Connected to already mastered concepts
    // 3. Foundational (many concepts depend on it)

    const scored = ready.map(node => ({
      node,
      score: this.calculatePriorityScore(node)
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, count).map(s => s.node);
  }

  /**
   * Calculates priority score for learning a concept
   */
  private calculatePriorityScore(node: KnowledgeNode): number {
    let score = 0;

    // Progress bonus (0 to 0.3)
    score += node.masteryLevel * 0.3;

    // Connection bonus (0 to 0.3)
    const masteredPrereqs = node.prerequisites.filter(prereq => {
      const prereqNode = this.findNode(prereq);
      return prereqNode && prereqNode.masteryLevel >= 0.7;
    }).length;
    score += (masteredPrereqs / Math.max(1, node.prerequisites.length)) * 0.3;

    // Foundational bonus (0 to 0.4)
    const dependents = this.getDependents(node.id);
    score += Math.min(0.4, dependents.length * 0.1);

    return score;
  }

  /**
   * Gets concepts that depend on this node
   */
  private getDependents(nodeId: string): KnowledgeNode[] {
    const dependents: KnowledgeNode[] = [];

    this.graph.forEach(node => {
      node.connections.forEach(conn => {
        if (conn.targetId === nodeId && conn.type === 'prerequisite') {
          dependents.push(node);
        }
      });
    });

    return dependents;
  }

  /**
   * Gets analytics for the knowledge graph
   */
  getAnalytics(): GraphAnalytics {
    const nodes = Array.from(this.graph.values());

    const masteredConcepts = nodes.filter(n => n.masteryLevel >= 0.8).length;
    const inProgressConcepts = nodes.filter(
      n => n.masteryLevel > 0.2 && n.masteryLevel < 0.8
    ).length;
    const notStartedConcepts = nodes.filter(n => n.masteryLevel <= 0.2).length;

    const averageMastery =
      nodes.length > 0
        ? nodes.reduce((sum, n) => sum + n.masteryLevel, 0) / nodes.length
        : 0;

    // Find strongest connections
    const allConnections: Array<KnowledgeConnection & { fromConcept: string }> = [];
    nodes.forEach(node => {
      node.connections.forEach(conn => {
        allConnections.push({ ...conn, fromConcept: node.concept });
      });
    });

    const strongestConnections = allConnections
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5);

    // Find weakest areas
    const weakestAreas = nodes
      .filter(n => n.masteryLevel < 0.4)
      .sort((a, b) => a.masteryLevel - b.masteryLevel)
      .slice(0, 5);

    // Ready to learn
    const readyToLearn = this.getReadyToLearn().slice(0, 5);

    return {
      totalConcepts: nodes.length,
      masteredConcepts,
      inProgressConcepts,
      notStartedConcepts,
      averageMastery,
      strongestConnections,
      weakestAreas,
      readyToLearn
    };
  }

  /**
   * Exports knowledge graph
   */
  exportGraph(): any {
    return {
      nodes: Array.from(this.graph.values()),
      analytics: this.getAnalytics(),
      exportedAt: Date.now()
    };
  }

  /**
   * Visualizes knowledge graph
   */
  visualize(): string {
    let output = '\n📊 KNOWLEDGE GRAPH\n';
    output += '═'.repeat(60) + '\n\n';

    const analytics = this.getAnalytics();

    output += `Total Concepts: ${analytics.totalConcepts}\n`;
    output += `Mastered: ${analytics.masteredConcepts} (${((analytics.masteredConcepts / analytics.totalConcepts) * 100).toFixed(0)}%)\n`;
    output += `In Progress: ${analytics.inProgressConcepts}\n`;
    output += `Not Started: ${analytics.notStartedConcepts}\n`;
    output += `Average Mastery: ${(analytics.averageMastery * 100).toFixed(0)}%\n\n`;

    output += 'Ready to Learn:\n';
    analytics.readyToLearn.forEach(node => {
      output += `  • ${node.concept} (${(node.masteryLevel * 100).toFixed(0)}% mastery)\n`;
    });

    output += '\nWeakest Areas:\n';
    analytics.weakestAreas.forEach(node => {
      output += `  • ${node.concept} (${(node.masteryLevel * 100).toFixed(0)}% mastery)\n`;
    });

    return output;
  }
}
