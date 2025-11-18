import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TreeNode } from '../../types';

interface DynamicTreeProps {
  nodes: TreeNode[];
  config?: {
    width?: number;
    height?: number;
    showProbabilities?: boolean;
    animated?: boolean;
    onNodeClick?: (node: TreeNode) => void;
  };
}

interface D3TreeNode extends d3.HierarchyPointNode<TreeNode> {
  _children?: D3TreeNode[];
}

const DynamicTree: React.FC<DynamicTreeProps> = ({ nodes, config = {} }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 350, height: 600 });

  const {
    width = dimensions.width,
    height = dimensions.height,
    showProbabilities = true,
    animated = true,
    onNodeClick
  } = config;

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Build hierarchy
    const root = buildHierarchy(nodes);
    if (!root) return;

    // Create tree layout
    const treeLayout = d3.tree<TreeNode>()
      .size([width - 60, height - 100]);

    const treeData = treeLayout(root as d3.HierarchyNode<TreeNode>);

    // Create SVG group
    const svg = d3.select(svgRef.current);
    const g = svg.append('g')
      .attr('transform', `translate(30, 50)`);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Draw links
    const links = g.selectAll('.tree-link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'tree-link')
      .attr('d', d3.linkVertical<any, any>()
        .x(d => d.x)
        .y(d => d.y)
      )
      .style('opacity', animated ? 0 : 1);

    if (animated) {
      links.transition()
        .duration(500)
        .style('opacity', 1);
    }

    // Draw nodes
    const nodeGroups = g.selectAll('.tree-node-group')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'tree-node-group')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('opacity', animated ? 0 : 1)
      .on('click', (event, d) => {
        if (onNodeClick) {
          onNodeClick(d.data);
        }
      });

    if (animated) {
      nodeGroups.transition()
        .duration(500)
        .delay((d, i) => i * 50)
        .style('opacity', 1);
    }

    // Node circles
    nodeGroups.append('circle')
      .attr('class', 'tree-node')
      .attr('r', 20)
      .style('fill', d => {
        const level = d.data.level;
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
        return colors[level % colors.length];
      })
      .style('stroke', '#fff')
      .style('stroke-width', 3);

    // Node labels
    nodeGroups.append('text')
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .style('fill', '#fff')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => d.data.label.substring(0, 3));

    // Probability labels
    if (showProbabilities) {
      nodeGroups.append('text')
        .attr('dy', '35px')
        .attr('text-anchor', 'middle')
        .style('fill', '#64748b')
        .style('font-size', '10px')
        .style('pointer-events', 'none')
        .text(d => d.data.probability ? `${(d.data.probability * 100).toFixed(1)}%` : '');
    }

  }, [nodes, width, height, showProbabilities, animated, onNodeClick]);

  // Build hierarchy from flat node list
  const buildHierarchy = (flatNodes: TreeNode[]): d3.HierarchyNode<TreeNode> | null => {
    if (flatNodes.length === 0) return null;

    // Find root
    const root = flatNodes.find(n => !n.parent_key);
    if (!root) return null;

    // Build tree recursively
    const buildNode = (node: TreeNode): TreeNode & { children?: TreeNode[] } => {
      const children = flatNodes.filter(n => n.parent_key === node.node_key);
      return {
        ...node,
        children: children.length > 0 ? children.map(buildNode) : undefined
      };
    };

    const treeData = buildNode(root);
    return d3.hierarchy(treeData);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full"
      />
    </div>
  );
};

export default DynamicTree;
