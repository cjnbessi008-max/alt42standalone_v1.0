/**
 * Logic Flow Layout Engine
 * Automatically positions nodes in a hierarchical layout
 */

import type { LogicNode, LogicEdge, LogicFlowGraph } from '@types/index';

interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  direction: 'TB' | 'LR'; // Top-Bottom or Left-Right
}

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeWidth: 200,
  nodeHeight: 80,
  horizontalSpacing: 100,
  verticalSpacing: 100,
  direction: 'TB',
};

/**
 * Calculate hierarchical layout for logic flow nodes
 */
export function calculateLayout(
  graph: LogicFlowGraph,
  config: Partial<LayoutConfig> = {}
): LogicFlowGraph {
  const layoutConfig = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  const { nodes, edges } = graph;

  // Build adjacency list
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach(edge => {
    adjacencyList.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // Topological sort to determine levels
  const levels: string[][] = [];
  const queue: string[] = [];

  // Find root nodes (nodes with no incoming edges)
  nodes.forEach(node => {
    if (inDegree.get(node.id) === 0) {
      queue.push(node.id);
    }
  });

  // BFS to assign levels
  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel: string[] = [];

    for (let i = 0; i < levelSize; i++) {
      const nodeId = queue.shift()!;
      currentLevel.push(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighborId => {
        const degree = inDegree.get(neighborId)! - 1;
        inDegree.set(neighborId, degree);
        if (degree === 0) {
          queue.push(neighborId);
        }
      });
    }

    levels.push(currentLevel);
  }

  // Position nodes based on levels
  const positionedNodes = nodes.map(node => {
    const levelIndex = levels.findIndex(level => level.includes(node.id));
    const positionInLevel = levels[levelIndex].indexOf(node.id);
    const levelWidth = levels[levelIndex].length;

    let x: number, y: number;

    if (layoutConfig.direction === 'TB') {
      // Top to bottom layout
      y = levelIndex * (layoutConfig.nodeHeight + layoutConfig.verticalSpacing);
      x = (positionInLevel - (levelWidth - 1) / 2) *
          (layoutConfig.nodeWidth + layoutConfig.horizontalSpacing);
    } else {
      // Left to right layout
      x = levelIndex * (layoutConfig.nodeWidth + layoutConfig.horizontalSpacing);
      y = (positionInLevel - (levelWidth - 1) / 2) *
          (layoutConfig.nodeHeight + layoutConfig.verticalSpacing);
    }

    return {
      ...node,
      position: { x, y },
    };
  });

  return {
    ...graph,
    nodes: positionedNodes,
  };
}

/**
 * Generate Bezier curve path for edge
 */
export function generateBezierPath(
  sourceNode: LogicNode,
  targetNode: LogicNode,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): string {
  const { nodeWidth, nodeHeight } = config;

  // Calculate connection points
  const sourceX = sourceNode.position.x + nodeWidth / 2;
  const sourceY = sourceNode.position.y + nodeHeight;
  const targetX = targetNode.position.x + nodeWidth / 2;
  const targetY = targetNode.position.y;

  // Calculate control points for smooth curve
  const controlPointOffset = Math.abs(targetY - sourceY) / 2;

  const controlPoint1X = sourceX;
  const controlPoint1Y = sourceY + controlPointOffset;
  const controlPoint2X = targetX;
  const controlPoint2Y = targetY - controlPointOffset;

  // Generate SVG path
  return `M ${sourceX},${sourceY} C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${targetX},${targetY}`;
}

/**
 * Calculate bounding box for entire graph
 */
export function calculateBoundingBox(
  graph: LogicFlowGraph,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): { width: number; height: number; minX: number; minY: number } {
  const { nodeWidth, nodeHeight } = config;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  graph.nodes.forEach(node => {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + nodeWidth);
    maxY = Math.max(maxY, node.position.y + nodeHeight);
  });

  return {
    width: maxX - minX,
    height: maxY - minY,
    minX,
    minY,
  };
}
