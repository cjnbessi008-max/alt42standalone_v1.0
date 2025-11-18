/**
 * Ontology Weaver
 *
 * Builds rich conceptual networks from minimal input,
 * creating a living web of knowledge relationships.
 */

import { OntologyNode, OntologyRelationship } from '../types/index.js';
import { InputAnalysis } from './rule-generator.js';

export interface ConceptGraph {
  nodes: Map<string, OntologyNode>;
  edges: Map<string, OntologyRelationship[]>;
  clusters: ConceptCluster[];
  depth: number;
  density: number;
}

export interface ConceptCluster {
  id: string;
  name: string;
  concepts: string[];
  centralConcept: string;
  cohesion: number;
}

export class OntologyWeaver {
  private ontology: Map<string, OntologyNode>;
  private relationshipIndex: Map<string, OntologyRelationship[]>;
  private conceptCounter: number = 0;

  constructor() {
    this.ontology = new Map();
    this.relationshipIndex = new Map();
  }

  /**
   * Weaves an ontology from input analysis
   */
  weaveFromAnalysis(analysis: InputAnalysis): ConceptGraph {
    console.log(`🕸️ Weaving ontology for ${analysis.domain}...`);

    // Create nodes for each concept
    analysis.concepts.forEach(concept => {
      this.createNode(concept, 'concept', {
        domain: analysis.domain,
        source: 'input'
      });
    });

    // Create relationships from analysis
    analysis.relationships.forEach(rel => {
      this.createRelationship(rel.from, rel.to, rel.type, 0.8);
    });

    // Expand ontology with inferred concepts
    this.expandOntology(analysis);

    // Identify clusters
    const clusters = this.identifyClusters();

    // Calculate graph metrics
    const depth = this.calculateDepth();
    const density = this.calculateDensity();

    console.log(`✨ Ontology woven: ${this.ontology.size} concepts, ${clusters.length} clusters`);

    return {
      nodes: new Map(this.ontology),
      edges: new Map(this.relationshipIndex),
      clusters,
      depth,
      density
    };
  }

  /**
   * Creates an ontology node
   */
  private createNode(
    name: string,
    type: OntologyNode['type'],
    properties: Record<string, any> = {}
  ): OntologyNode {
    const id = `node_${this.conceptCounter++}`;

    const node: OntologyNode = {
      id,
      name,
      type,
      properties: new Map(Object.entries(properties)),
      relationships: [],
      depth: 0,
      complexity: this.estimateConceptComplexity(name)
    };

    this.ontology.set(id, node);
    return node;
  }

  /**
   * Creates a relationship between two nodes
   */
  private createRelationship(
    fromName: string,
    toName: string,
    type: string,
    strength: number = 0.7,
    bidirectional: boolean = false
  ): void {
    // Find or create nodes
    const fromNode = this.findNodeByName(fromName) || this.createNode(fromName, 'concept');
    const toNode = this.findNodeByName(toName) || this.createNode(toName, 'concept');

    // Create relationship
    const relationship: OntologyRelationship = {
      type,
      targetId: toNode.id,
      strength,
      bidirectional,
      properties: new Map()
    };

    // Add to source node
    fromNode.relationships.push(relationship);

    // Index for quick lookup
    const existing = this.relationshipIndex.get(fromNode.id) || [];
    existing.push(relationship);
    this.relationshipIndex.set(fromNode.id, existing);

    // If bidirectional, create reverse relationship
    if (bidirectional) {
      const reverseRel: OntologyRelationship = {
        type: `inverse-${type}`,
        targetId: fromNode.id,
        strength,
        bidirectional: true,
        properties: new Map()
      };

      toNode.relationships.push(reverseRel);

      const existingReverse = this.relationshipIndex.get(toNode.id) || [];
      existingReverse.push(reverseRel);
      this.relationshipIndex.set(toNode.id, existingReverse);
    }
  }

  /**
   * Finds a node by name
   */
  private findNodeByName(name: string): OntologyNode | undefined {
    for (const node of this.ontology.values()) {
      if (node.name.toLowerCase() === name.toLowerCase()) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Expands ontology by inferring related concepts
   */
  private expandOntology(analysis: InputAnalysis): void {
    const domain = analysis.domain;
    const existingConcepts = new Set(analysis.concepts);

    // Domain-specific concept expansion
    const expansions = this.getExpansionRules(domain);

    expansions.forEach(expansion => {
      if (existingConcepts.has(expansion.trigger)) {
        expansion.inferred.forEach(concept => {
          if (!existingConcepts.has(concept)) {
            this.createNode(concept, 'concept', {
              domain,
              source: 'inferred',
              from: expansion.trigger
            });

            this.createRelationship(expansion.trigger, concept, expansion.relationType, 0.6);

            existingConcepts.add(concept);
          }
        });
      }
    });

    // Add fundamental concepts for the domain
    const fundamentals = this.getFundamentalConcepts(domain);
    fundamentals.forEach(concept => {
      if (!existingConcepts.has(concept)) {
        const node = this.createNode(concept, 'concept', {
          domain,
          source: 'fundamental'
        });

        // Connect to existing concepts
        this.connectToRelatedConcepts(node, existingConcepts);
      }
    });
  }

  /**
   * Gets expansion rules for a domain
   */
  private getExpansionRules(domain: string): Array<{
    trigger: string;
    inferred: string[];
    relationType: string;
  }> {
    const rules: Record<
      string,
      Array<{ trigger: string; inferred: string[]; relationType: string }>
    > = {
      mathematics: [
        {
          trigger: 'equation',
          inferred: ['variable', 'solution', 'equality'],
          relationType: 'composed-of'
        },
        {
          trigger: 'function',
          inferred: ['input', 'output', 'domain', 'range'],
          relationType: 'has-component'
        },
        {
          trigger: 'derivative',
          inferred: ['limit', 'rate of change', 'tangent'],
          relationType: 'related-to'
        }
      ],
      programming: [
        {
          trigger: 'function',
          inferred: ['parameter', 'return value', 'scope'],
          relationType: 'has-component'
        },
        {
          trigger: 'algorithm',
          inferred: ['complexity', 'efficiency', 'steps'],
          relationType: 'has-property'
        },
        {
          trigger: 'variable',
          inferred: ['type', 'value', 'declaration'],
          relationType: 'has-aspect'
        }
      ],
      science: [
        {
          trigger: 'experiment',
          inferred: ['hypothesis', 'method', 'results', 'conclusion'],
          relationType: 'has-stage'
        },
        {
          trigger: 'theory',
          inferred: ['evidence', 'prediction', 'framework'],
          relationType: 'supported-by'
        }
      ]
    };

    return rules[domain] || [];
  }

  /**
   * Gets fundamental concepts for a domain
   */
  private getFundamentalConcepts(domain: string): string[] {
    const fundamentals: Record<string, string[]> = {
      mathematics: ['number', 'operation', 'set', 'proof', 'axiom'],
      programming: ['data', 'control flow', 'abstraction', 'iteration'],
      science: ['observation', 'measurement', 'hypothesis', 'evidence'],
      language: ['word', 'sentence', 'meaning', 'grammar'],
      music: ['pitch', 'rhythm', 'dynamics', 'timbre']
    };

    return fundamentals[domain] || ['concept', 'principle', 'application'];
  }

  /**
   * Connects a node to related existing concepts
   */
  private connectToRelatedConcepts(node: OntologyNode, existingConcepts: Set<string>): void {
    // Use semantic similarity (simplified version)
    const related = this.findSemanticallySimilar(node.name, Array.from(existingConcepts));

    related.forEach(conceptName => {
      this.createRelationship(node.name, conceptName, 'related-to', 0.5, true);
    });
  }

  /**
   * Finds semantically similar concepts (simplified)
   */
  private findSemanticallySimilar(concept: string, candidates: string[]): string[] {
    // Simplified similarity based on word overlap
    const conceptWords = new Set(concept.toLowerCase().split(/\s+/));

    return candidates
      .map(candidate => ({
        name: candidate,
        similarity: this.calculateWordOverlap(conceptWords, candidate)
      }))
      .filter(c => c.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(c => c.name);
  }

  /**
   * Calculates word overlap similarity
   */
  private calculateWordOverlap(words: Set<string>, candidate: string): number {
    const candidateWords = new Set(candidate.toLowerCase().split(/\s+/));
    const intersection = new Set([...words].filter(w => candidateWords.has(w)));

    return intersection.size / Math.max(words.size, candidateWords.size);
  }

  /**
   * Estimates concept complexity
   */
  private estimateConceptComplexity(name: string): number {
    // Simplified: based on word count and length
    const words = name.split(/\s+/);
    const wordCount = words.length;
    const avgLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;

    return Math.min(1.0, (wordCount * 0.2 + avgLength * 0.05));
  }

  /**
   * Identifies concept clusters
   */
  private identifyClusters(): ConceptCluster[] {
    const clusters: ConceptCluster[] = [];
    const visited = new Set<string>();

    this.ontology.forEach(node => {
      if (!visited.has(node.id)) {
        const cluster = this.exploreCluster(node, visited);
        if (cluster.concepts.length >= 3) {
          clusters.push(cluster);
        }
      }
    });

    return clusters;
  }

  /**
   * Explores a concept cluster using BFS
   */
  private exploreCluster(startNode: OntologyNode, visited: Set<string>): ConceptCluster {
    const concepts: string[] = [];
    const queue: OntologyNode[] = [startNode];
    const clusterNodes: OntologyNode[] = [];

    while (queue.length > 0) {
      const node = queue.shift()!;

      if (visited.has(node.id)) continue;

      visited.add(node.id);
      concepts.push(node.name);
      clusterNodes.push(node);

      // Add strongly connected neighbors
      node.relationships.forEach(rel => {
        if (rel.strength >= 0.6) {
          const neighbor = this.ontology.get(rel.targetId);
          if (neighbor && !visited.has(neighbor.id)) {
            queue.push(neighbor);
          }
        }
      });
    }

    // Find central concept (most connections)
    const centralNode = clusterNodes.reduce((max, node) =>
      node.relationships.length > max.relationships.length ? node : max
    );

    // Calculate cohesion
    const totalEdges = clusterNodes.reduce((sum, node) => sum + node.relationships.length, 0);
    const maxPossibleEdges = concepts.length * (concepts.length - 1);
    const cohesion = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;

    return {
      id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${centralNode.name} cluster`,
      concepts,
      centralConcept: centralNode.name,
      cohesion
    };
  }

  /**
   * Calculates maximum depth of the ontology
   */
  private calculateDepth(): number {
    let maxDepth = 0;

    this.ontology.forEach(node => {
      const depth = this.calculateNodeDepth(node, new Set());
      maxDepth = Math.max(maxDepth, depth);
    });

    return maxDepth;
  }

  /**
   * Calculates depth of a specific node
   */
  private calculateNodeDepth(node: OntologyNode, visited: Set<string>): number {
    if (visited.has(node.id)) return 0;

    visited.add(node.id);

    let maxChildDepth = 0;
    node.relationships.forEach(rel => {
      const childNode = this.ontology.get(rel.targetId);
      if (childNode) {
        const childDepth = this.calculateNodeDepth(childNode, new Set(visited));
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      }
    });

    return 1 + maxChildDepth;
  }

  /**
   * Calculates graph density
   */
  private calculateDensity(): number {
    const nodeCount = this.ontology.size;
    if (nodeCount < 2) return 0;

    const edgeCount = Array.from(this.ontology.values()).reduce(
      (sum, node) => sum + node.relationships.length,
      0
    );

    const maxPossibleEdges = nodeCount * (nodeCount - 1);

    return edgeCount / maxPossibleEdges;
  }

  /**
   * Exports ontology to JSON
   */
  exportOntology(): any {
    return {
      nodes: Array.from(this.ontology.values()).map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        properties: Object.fromEntries(node.properties),
        relationships: node.relationships,
        depth: node.depth,
        complexity: node.complexity
      })),
      metadata: {
        totalNodes: this.ontology.size,
        totalRelationships: Array.from(this.relationshipIndex.values()).reduce(
          (sum, rels) => sum + rels.length,
          0
        ),
        depth: this.calculateDepth(),
        density: this.calculateDensity()
      }
    };
  }

  /**
   * Visualizes ontology as ASCII graph
   */
  visualize(): string {
    let output = '\n🕸️  CONCEPT ONTOLOGY\n';
    output += '═'.repeat(50) + '\n\n';

    const clusters = this.identifyClusters();

    clusters.forEach((cluster, i) => {
      output += `Cluster ${i + 1}: ${cluster.name}\n`;
      output += `  Central: ${cluster.centralConcept}\n`;
      output += `  Cohesion: ${(cluster.cohesion * 100).toFixed(1)}%\n`;
      output += `  Concepts:\n`;

      cluster.concepts.forEach(concept => {
        output += `    • ${concept}\n`;
      });

      output += '\n';
    });

    output += `\nTotal Concepts: ${this.ontology.size}\n`;
    output += `Graph Depth: ${this.calculateDepth()}\n`;
    output += `Graph Density: ${(this.calculateDensity() * 100).toFixed(1)}%\n`;

    return output;
  }
}
