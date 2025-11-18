/**
 * Self-Modification Engine
 *
 * Allows the system to modify its own code, rules, and behavior
 * based on performance feedback and learning outcomes.
 */

import { SelfModification, Rule, TeachingStrategy } from '../types/index.js';

export interface ModificationProposal {
  id: string;
  type: 'code' | 'rule' | 'strategy' | 'parameter';
  target: string;
  current: any;
  proposed: any;
  reasoning: string;
  expectedImpact: number;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
}

export interface EvolutionMetrics {
  totalModifications: number;
  successfulModifications: number;
  failedModifications: number;
  rolledBackModifications: number;
  averageImpact: number;
  evolutionRate: number; // modifications per day
}

export class SelfModificationEngine {
  private modifications: Map<string, SelfModification>;
  private proposals: ModificationProposal[];
  private modifiableComponents: Map<string, any>;
  private safetyThreshold: number = 0.7; // Minimum confidence to apply
  private rollbackStack: Array<{ id: string; state: any }>;

  constructor() {
    this.modifications = new Map();
    this.proposals = [];
    this.modifiableComponents = new Map();
    this.rollbackStack = [];
  }

  /**
   * Registers a component as modifiable
   */
  registerComponent(name: string, component: any): void {
    this.modifiableComponents.set(name, component);
    console.log(`🔧 Component registered for modification: ${name}`);
  }

  /**
   * Analyzes system performance and proposes modifications
   */
  async analyzeAndPropose(performanceData: any): Promise<ModificationProposal[]> {
    console.log('🔍 Analyzing system performance for evolution opportunities...');

    const proposals: ModificationProposal[] = [];

    // Analyze teaching strategies
    if (performanceData.strategies) {
      const strategyProposals = this.analyzeStrategies(performanceData.strategies);
      proposals.push(...strategyProposals);
    }

    // Analyze rules
    if (performanceData.rules) {
      const ruleProposals = this.analyzeRules(performanceData.rules);
      proposals.push(...ruleProposals);
    }

    // Analyze parameters
    if (performanceData.parameters) {
      const paramProposals = this.analyzeParameters(performanceData.parameters);
      proposals.push(...paramProposals);
    }

    this.proposals.push(...proposals);

    console.log(`💡 Generated ${proposals.length} modification proposals`);

    return proposals;
  }

  /**
   * Analyzes teaching strategies for improvements
   */
  private analyzeStrategies(strategyData: any[]): ModificationProposal[] {
    const proposals: ModificationProposal[] = [];

    strategyData.forEach(data => {
      const { strategy, effectiveness, usageCount } = data;

      // Low effectiveness but high usage - needs improvement
      if (effectiveness < 0.5 && usageCount > 10) {
        proposals.push({
          id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'strategy',
          target: strategy.id,
          current: strategy,
          proposed: this.improveStrategy(strategy, effectiveness),
          reasoning: `Strategy "${strategy.name}" has low effectiveness (${effectiveness.toFixed(2)}) despite frequent use`,
          expectedImpact: 0.3,
          confidence: 0.7,
          risk: 'medium'
        });
      }

      // High effectiveness but low usage - should use more
      if (effectiveness > 0.8 && usageCount < 5) {
        proposals.push({
          id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'parameter',
          target: 'strategy-selection-weights',
          current: {},
          proposed: { [strategy.id]: 1.5 }, // Increase weight
          reasoning: `Strategy "${strategy.name}" is highly effective (${effectiveness.toFixed(2)}) but underutilized`,
          expectedImpact: 0.2,
          confidence: 0.8,
          risk: 'low'
        });
      }
    });

    return proposals;
  }

  /**
   * Improves a teaching strategy
   */
  private improveStrategy(strategy: TeachingStrategy, currentEffectiveness: number): any {
    // Create evolved version of strategy
    return {
      ...strategy,
      name: `${strategy.name} (Evolved)`,
      // In real implementation, this would use ML or genetic algorithms
      // to actually modify the strategy logic
      effectiveness: currentEffectiveness * 1.2,
      metadata: {
        ...strategy,
        evolved: true,
        previousVersion: strategy.id,
        evolutionReason: 'low effectiveness improvement'
      }
    };
  }

  /**
   * Analyzes rules for improvements
   */
  private analyzeRules(ruleData: any[]): ModificationProposal[] {
    const proposals: ModificationProposal[] = [];

    ruleData.forEach(data => {
      const { rule, triggerCount, successRate } = data;

      // Rule triggers often but low success - modify condition
      if (triggerCount > 20 && successRate < 0.4) {
        proposals.push({
          id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'rule',
          target: rule.id,
          current: rule,
          proposed: this.modifyRuleCondition(rule, successRate),
          reasoning: `Rule "${rule.name}" triggers frequently but has low success rate (${successRate.toFixed(2)})`,
          expectedImpact: 0.25,
          confidence: 0.65,
          risk: 'medium'
        });
      }

      // Rule never triggers - might need adjustment or removal
      if (triggerCount === 0 && rule.enabled) {
        proposals.push({
          id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'rule',
          target: rule.id,
          current: rule,
          proposed: { ...rule, enabled: false },
          reasoning: `Rule "${rule.name}" never triggers - consider disabling`,
          expectedImpact: 0.05,
          confidence: 0.9,
          risk: 'low'
        });
      }
    });

    return proposals;
  }

  /**
   * Modifies rule condition to improve success rate
   */
  private modifyRuleCondition(rule: Rule, currentSuccessRate: number): Rule {
    return {
      ...rule,
      // In real implementation, this would analyze failures and adjust logic
      priority: rule.priority + 1, // Increase priority as a simple modification
      metadata: new Map([
        ...Array.from(rule.metadata.entries()),
        ['modified', true],
        ['reason', 'low success rate'],
        ['previousSuccessRate', currentSuccessRate]
      ])
    };
  }

  /**
   * Analyzes parameters for tuning
   */
  private analyzeParameters(paramData: any): ModificationProposal[] {
    const proposals: ModificationProposal[] = [];

    // Example: difficulty adjustment
    if (paramData.averagePerformance) {
      const { averagePerformance } = paramData;

      if (averagePerformance > 0.9) {
        proposals.push({
          id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'parameter',
          target: 'difficulty-baseline',
          current: paramData.currentDifficulty,
          proposed: paramData.currentDifficulty * 1.1,
          reasoning: 'Performance too high - increase challenge',
          expectedImpact: 0.15,
          confidence: 0.85,
          risk: 'low'
        });
      } else if (averagePerformance < 0.4) {
        proposals.push({
          id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'parameter',
          target: 'difficulty-baseline',
          current: paramData.currentDifficulty,
          proposed: paramData.currentDifficulty * 0.9,
          reasoning: 'Performance too low - decrease difficulty',
          expectedImpact: 0.2,
          confidence: 0.8,
          risk: 'low'
        });
      }
    }

    return proposals;
  }

  /**
   * Applies a modification proposal
   */
  async applyModification(proposalId: string): Promise<SelfModification> {
    const proposal = this.proposals.find(p => p.id === proposalId);

    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    // Safety check
    if (proposal.confidence < this.safetyThreshold) {
      throw new Error(
        `Modification confidence (${proposal.confidence}) below safety threshold (${this.safetyThreshold})`
      );
    }

    console.log(`🔧 Applying modification: ${proposal.reasoning}`);

    // Save current state for rollback
    const component = this.modifiableComponents.get(proposal.target);
    if (component) {
      this.rollbackStack.push({
        id: proposalId,
        state: JSON.parse(JSON.stringify(component))
      });
    }

    // Apply modification
    const modification: SelfModification = {
      id: `mod_${Date.now()}`,
      timestamp: Date.now(),
      targetComponent: proposal.target,
      modificationType: proposal.type,
      reasoning: proposal.reasoning,
      implementation: JSON.stringify(proposal.proposed),
      expectedImpact: proposal.expectedImpact,
      rollbackPlan: JSON.stringify(proposal.current)
    };

    // Actually modify the component
    if (component) {
      Object.assign(component, proposal.proposed);
    }

    this.modifications.set(modification.id, modification);

    console.log(`✅ Modification applied: ${modification.id}`);

    return modification;
  }

  /**
   * Evaluates impact of a modification
   */
  evaluateModification(
    modificationId: string,
    actualImpact: number
  ): { success: boolean; shouldKeep: boolean } {
    const modification = this.modifications.get(modificationId);

    if (!modification) {
      return { success: false, shouldKeep: false };
    }

    modification.actualImpact = actualImpact;

    // Success if actual impact is positive
    const success = actualImpact > 0;

    // Keep if impact meets or exceeds 70% of expectation
    const shouldKeep = actualImpact >= modification.expectedImpact * 0.7;

    console.log(
      `📊 Modification evaluation: ${success ? '✅ Success' : '❌ Failed'}, ${shouldKeep ? 'Keep' : 'Rollback'}`
    );

    if (!shouldKeep) {
      this.rollback(modificationId);
    }

    return { success, shouldKeep };
  }

  /**
   * Rolls back a modification
   */
  rollback(modificationId: string): void {
    const modification = this.modifications.get(modificationId);

    if (!modification) return;

    // Find rollback state
    const rollbackState = this.rollbackStack.find(r => r.id === modificationId);

    if (rollbackState) {
      const component = this.modifiableComponents.get(modification.targetComponent);

      if (component) {
        Object.assign(component, rollbackState.state);
        console.log(`↩️ Rolled back modification: ${modificationId}`);
      }
    }

    // Remove from modifications
    this.modifications.delete(modificationId);
  }

  /**
   * Gets evolution metrics
   */
  getMetrics(): EvolutionMetrics {
    const mods = Array.from(this.modifications.values());

    const successful = mods.filter(
      m => m.actualImpact !== undefined && m.actualImpact > 0
    ).length;

    const failed = mods.filter(
      m => m.actualImpact !== undefined && m.actualImpact <= 0
    ).length;

    const rolledBack = this.rollbackStack.length;

    const avgImpact =
      mods.length > 0
        ? mods.reduce((sum, m) => sum + (m.actualImpact || 0), 0) / mods.length
        : 0;

    // Calculate evolution rate (modifications per day)
    if (mods.length < 2) return this.getDefaultMetrics();

    const first = mods[0].timestamp;
    const last = mods[mods.length - 1].timestamp;
    const daysPassed = (last - first) / (1000 * 60 * 60 * 24);
    const evolutionRate = daysPassed > 0 ? mods.length / daysPassed : 0;

    return {
      totalModifications: mods.length,
      successfulModifications: successful,
      failedModifications: failed,
      rolledBackModifications: rolledBack,
      averageImpact: avgImpact,
      evolutionRate
    };
  }

  /**
   * Gets default metrics
   */
  private getDefaultMetrics(): EvolutionMetrics {
    return {
      totalModifications: 0,
      successfulModifications: 0,
      failedModifications: 0,
      rolledBackModifications: 0,
      averageImpact: 0,
      evolutionRate: 0
    };
  }

  /**
   * Exports evolution history
   */
  exportHistory(): any {
    return {
      modifications: Array.from(this.modifications.values()),
      proposals: this.proposals,
      metrics: this.getMetrics(),
      exportedAt: Date.now()
    };
  }

  /**
   * Generates evolution report
   */
  generateReport(): string {
    const metrics = this.getMetrics();

    return `
🧬 SELF-EVOLUTION REPORT
${'═'.repeat(60)}

Total Modifications: ${metrics.totalModifications}
Successful: ${metrics.successfulModifications} (${metrics.totalModifications > 0 ? ((metrics.successfulModifications / metrics.totalModifications) * 100).toFixed(0) : 0}%)
Failed: ${metrics.failedModifications}
Rolled Back: ${metrics.rolledBackModifications}

Average Impact: ${(metrics.averageImpact * 100).toFixed(1)}%
Evolution Rate: ${metrics.evolutionRate.toFixed(2)} modifications/day

Active Proposals: ${this.proposals.length}

${
  metrics.totalModifications > 0
    ? '🎉 The system is actively evolving and improving!'
    : '💤 No evolution yet - awaiting performance data.'
}
    `.trim();
  }
}
