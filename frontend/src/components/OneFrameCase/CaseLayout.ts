/**
 * CaseLayout Utility
 *
 * Layout algorithms for positioning cases in One-Frame visualizations
 */

import { Case, LayoutConfig, Position, Size } from '@types/oneFrameCase';

interface LayoutBounds {
  width: number;
  height: number;
}

class CaseLayoutEngine {
  /**
   * Calculate positions for all cases based on layout algorithm
   */
  calculateLayout(
    cases: Case[],
    config: LayoutConfig,
    bounds: LayoutBounds
  ): Case[] {
    switch (config.algorithm) {
      case 'tree':
        return this.treeLayout(cases, config, bounds);

      case 'grid':
        return this.gridLayout(cases, config, bounds);

      case 'radial':
        return this.radialLayout(cases, config, bounds);

      case 'flow':
        return this.flowLayout(cases, config, bounds);

      default:
        return this.gridLayout(cases, config, bounds);
    }
  }

  /**
   * Tree layout - hierarchical structure
   */
  private treeLayout(
    cases: Case[],
    config: LayoutConfig,
    bounds: LayoutBounds
  ): Case[] {
    const nodeWidth = 200;
    const nodeHeight = 150;
    const spacing = config.spacing || 80;
    const direction = config.direction || 'vertical';

    // Find root node (node with no incoming connections)
    const allConnectedIds = new Set(
      cases.flatMap(c => c.connections || [])
    );
    const rootCase = cases.find(c => !allConnectedIds.has(c.id)) || cases[0];

    // Build tree structure
    const levels: Case[][] = [];
    const visited = new Set<string>();
    const queue: { case: Case; level: number }[] = [{ case: rootCase, level: 0 }];

    while (queue.length > 0) {
      const { case: currentCase, level } = queue.shift()!;

      if (visited.has(currentCase.id)) continue;
      visited.add(currentCase.id);

      if (!levels[level]) levels[level] = [];
      levels[level].push(currentCase);

      // Add connected cases to next level
      if (currentCase.connections) {
        currentCase.connections.forEach(connId => {
          const connectedCase = cases.find(c => c.id === connId);
          if (connectedCase && !visited.has(connId)) {
            queue.push({ case: connectedCase, level: level + 1 });
          }
        });
      }
    }

    // Position nodes
    const casesWithPositions = cases.map(c => ({ ...c }));

    if (direction === 'vertical') {
      levels.forEach((levelCases, levelIndex) => {
        const levelWidth = levelCases.length * (nodeWidth + spacing);
        const startX = (bounds.width - levelWidth) / 2;

        levelCases.forEach((caseItem, index) => {
          const caseIndex = casesWithPositions.findIndex(c => c.id === caseItem.id);
          casesWithPositions[caseIndex].position = {
            x: startX + index * (nodeWidth + spacing),
            y: 80 + levelIndex * (nodeHeight + spacing),
          };
          casesWithPositions[caseIndex].size = { width: nodeWidth, height: nodeHeight };
        });
      });
    } else {
      // horizontal
      levels.forEach((levelCases, levelIndex) => {
        const levelHeight = levelCases.length * (nodeHeight + spacing);
        const startY = (bounds.height - levelHeight) / 2;

        levelCases.forEach((caseItem, index) => {
          const caseIndex = casesWithPositions.findIndex(c => c.id === caseItem.id);
          casesWithPositions[caseIndex].position = {
            x: 80 + levelIndex * (nodeWidth + spacing),
            y: startY + index * (nodeHeight + spacing),
          };
          casesWithPositions[caseIndex].size = { width: nodeWidth, height: nodeHeight };
        });
      });
    }

    return casesWithPositions;
  }

  /**
   * Grid layout - uniform grid arrangement
   */
  private gridLayout(
    cases: Case[],
    config: LayoutConfig,
    bounds: LayoutBounds
  ): Case[] {
    const nodeWidth = 180;
    const nodeHeight = 140;
    const spacing = config.spacing || 60;
    const padding = config.padding || 40;

    // Calculate grid dimensions
    const cols = Math.ceil(Math.sqrt(cases.length));
    const rows = Math.ceil(cases.length / cols);

    return cases.map((caseItem, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      return {
        ...caseItem,
        position: {
          x: padding + col * (nodeWidth + spacing),
          y: padding + row * (nodeHeight + spacing),
        },
        size: { width: nodeWidth, height: nodeHeight },
      };
    });
  }

  /**
   * Radial layout - center with radial distribution
   */
  private radialLayout(
    cases: Case[],
    config: LayoutConfig,
    bounds: LayoutBounds
  ): Case[] {
    const nodeWidth = 160;
    const nodeHeight = 120;
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const radius = Math.min(bounds.width, bounds.height) * 0.35;

    // First case at center
    const casesWithPositions = cases.map((caseItem, index) => {
      if (index === 0) {
        return {
          ...caseItem,
          position: {
            x: centerX - nodeWidth / 2,
            y: centerY - nodeHeight / 2,
          },
          size: { width: nodeWidth * 1.2, height: nodeHeight * 1.2 },
        };
      }

      // Others in circle
      const angle = ((index - 1) / (cases.length - 1)) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle) - nodeWidth / 2;
      const y = centerY + radius * Math.sin(angle) - nodeHeight / 2;

      return {
        ...caseItem,
        position: { x, y },
        size: { width: nodeWidth, height: nodeHeight },
      };
    });

    return casesWithPositions;
  }

  /**
   * Flow layout - left-to-right flow
   */
  private flowLayout(
    cases: Case[],
    config: LayoutConfig,
    bounds: LayoutBounds
  ): Case[] {
    const nodeWidth = 180;
    const nodeHeight = 120;
    const spacing = config.spacing || 60;
    const padding = config.padding || 40;

    let currentX = padding;
    let currentY = padding;
    const maxRowHeight = bounds.height - padding * 2;

    return cases.map((caseItem) => {
      // Check if need to move to next column
      if (currentY + nodeHeight > maxRowHeight && currentY > padding) {
        currentX += nodeWidth + spacing;
        currentY = padding;
      }

      const position = { x: currentX, y: currentY };
      currentY += nodeHeight + spacing;

      return {
        ...caseItem,
        position,
        size: { width: nodeWidth, height: nodeHeight },
      };
    });
  }
}

export default new CaseLayoutEngine();
