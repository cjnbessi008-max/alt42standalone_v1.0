import { TreeNode, TreeConfig, TreeCalculationResult, TreePath, ProblemType } from '../types';

class TreeService {
  /**
   * Generate tree nodes based on configuration
   */
  generateTreeNodes(config: TreeConfig, problemId: number): TreeNode[] {
    switch (config.type) {
      case ProblemType.PROBABILITY_TREE:
        return this.generateProbabilityTree(config, problemId);
      case ProblemType.COMBINATION_TREE:
        return this.generateCombinationTree(config, problemId);
      case ProblemType.FACTORIZATION_TREE:
        return this.generateFactorizationTree(config, problemId);
      default:
        return [];
    }
  }

  /**
   * Generate probability tree nodes
   */
  private generateProbabilityTree(config: TreeConfig, problemId: number): TreeNode[] {
    const nodes: TreeNode[] = [];
    const levels = config.levels || 3;
    const branchLabels = config.branchLabels || ['A', 'B'];
    const branchProbs = config.branchProbabilities || branchLabels.map(() => 1 / branchLabels.length);

    // Root node
    nodes.push({
      problem_id: problemId,
      node_key: 'root',
      label: config.rootLabel || 'Start',
      level: 0,
      probability: 1.0,
      position_x: 400,
      position_y: 50
    });

    // Generate tree recursively
    this.generateProbabilityLevel(nodes, 'root', 1, levels, branchLabels, branchProbs, problemId, 1.0);

    return nodes;
  }

  private generateProbabilityLevel(
    nodes: TreeNode[],
    parentKey: string,
    currentLevel: number,
    maxLevels: number,
    branchLabels: string[],
    branchProbs: number[],
    problemId: number,
    parentProb: number
  ): void {
    if (currentLevel > maxLevels) return;

    const parent = nodes.find(n => n.node_key === parentKey);
    if (!parent) return;

    const branchCount = branchLabels.length;
    const baseX = parent.position_x || 400;
    const y = 50 + currentLevel * 100;
    const spread = Math.max(600, 200 * Math.pow(branchCount, maxLevels - currentLevel));

    branchLabels.forEach((label, index) => {
      const prob = parentProb * branchProbs[index];
      const offset = (index - (branchCount - 1) / 2) * (spread / branchCount);
      const x = baseX + offset;
      const nodeKey = `${parentKey}_${label}_${currentLevel}_${index}`;

      const node: TreeNode = {
        problem_id: problemId,
        node_key: nodeKey,
        label: label,
        parent_key: parentKey,
        level: currentLevel,
        probability: prob,
        position_x: x,
        position_y: y,
        metadata: {
          index: index,
          branch: label
        }
      };

      nodes.push(node);

      // Recurse to next level
      if (currentLevel < maxLevels) {
        this.generateProbabilityLevel(
          nodes,
          nodeKey,
          currentLevel + 1,
          maxLevels,
          branchLabels,
          branchProbs,
          problemId,
          prob
        );
      }
    });
  }

  /**
   * Generate combination tree nodes
   */
  private generateCombinationTree(config: TreeConfig, problemId: number): TreeNode[] {
    const nodes: TreeNode[] = [];
    const branches = config.branches || [];

    // Root node
    nodes.push({
      problem_id: problemId,
      node_key: 'root',
      label: config.rootLabel || 'Start',
      level: 0,
      position_x: 400,
      position_y: 50
    });

    this.generateCombinationLevel(nodes, 'root', 0, branches, problemId);

    return nodes;
  }

  private generateCombinationLevel(
    nodes: TreeNode[],
    parentKey: string,
    levelIndex: number,
    branches: any[],
    problemId: number
  ): void {
    if (levelIndex >= branches.length) return;

    const parent = nodes.find(n => n.node_key === parentKey);
    if (!parent) return;

    const branch = branches[levelIndex];
    const options = branch.options || [];
    const baseX = parent.position_x || 400;
    const y = 50 + (levelIndex + 1) * 100;
    const spread = 600 / Math.max(1, options.length - 1);

    options.forEach((option: string, index: number) => {
      const x = baseX - 300 + index * spread;
      const nodeKey = `${parentKey}_${option}_${levelIndex}_${index}`;

      const node: TreeNode = {
        problem_id: problemId,
        node_key: nodeKey,
        label: option,
        parent_key: parentKey,
        level: levelIndex + 1,
        position_x: x,
        position_y: y,
        metadata: {
          branchLabel: branch.label,
          option: option
        }
      };

      nodes.push(node);

      // Recurse to next level
      this.generateCombinationLevel(nodes, nodeKey, levelIndex + 1, branches, problemId);
    });
  }

  /**
   * Generate factorization tree (for prime factorization)
   */
  private generateFactorizationTree(config: TreeConfig, problemId: number): TreeNode[] {
    const nodes: TreeNode[] = [];
    const rootValue = config.rootValue || 1;

    nodes.push({
      problem_id: problemId,
      node_key: 'root',
      label: rootValue.toString(),
      value: rootValue.toString(),
      level: 0,
      position_x: 400,
      position_y: 50
    });

    // This would be expanded based on actual factorization logic
    // For now, return root only
    return nodes;
  }

  /**
   * Calculate all possible outcomes and their probabilities
   */
  calculateOutcomes(nodes: TreeNode[]): TreeCalculationResult {
    const leaves = nodes.filter(n => !nodes.some(child => child.parent_key === n.node_key));
    const paths: TreePath[] = [];

    leaves.forEach(leaf => {
      const path = this.getPathToRoot(leaf, nodes);
      paths.push({
        path: path.map(n => n.label),
        probability: leaf.probability || 0,
        outcome: path.map(n => n.label).join(' → ')
      });
    });

    return {
      totalOutcomes: paths.length,
      paths: paths,
      metadata: {
        maxDepth: Math.max(...nodes.map(n => n.level)),
        totalNodes: nodes.length
      }
    };
  }

  /**
   * Get path from node to root
   */
  private getPathToRoot(node: TreeNode, allNodes: TreeNode[]): TreeNode[] {
    const path: TreeNode[] = [node];
    let current = node;

    while (current.parent_key) {
      const parent = allNodes.find(n => n.node_key === current.parent_key);
      if (!parent) break;
      path.unshift(parent);
      current = parent;
    }

    return path;
  }

  /**
   * Calculate positions for tree layout (force-directed or hierarchical)
   */
  calculateLayout(nodes: TreeNode[], width: number = 800, height: number = 600): TreeNode[] {
    // Simple hierarchical layout
    const levels = new Map<number, TreeNode[]>();

    // Group nodes by level
    nodes.forEach(node => {
      if (!levels.has(node.level)) {
        levels.set(node.level, []);
      }
      levels.get(node.level)!.push(node);
    });

    // Calculate positions
    const maxLevel = Math.max(...Array.from(levels.keys()));
    const verticalSpacing = height / (maxLevel + 1);

    levels.forEach((levelNodes, level) => {
      const horizontalSpacing = width / (levelNodes.length + 1);
      levelNodes.forEach((node, index) => {
        node.position_x = horizontalSpacing * (index + 1);
        node.position_y = verticalSpacing * (level + 0.5);
      });
    });

    return nodes;
  }
}

export default new TreeService();
