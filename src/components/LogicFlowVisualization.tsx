/**
 * Logic Flow Visualization Component
 * Renders condition → conclusion structures with smooth Bezier curves
 */

import React, { useEffect, useRef, useState } from 'react';
import type { LogicFlowGraph, LogicNode, LogicEdge } from '@types/index';
import { calculateLayout, generateBezierPath, calculateBoundingBox } from '@utils/flowLayoutEngine';

interface LogicFlowVisualizationProps {
  graph: LogicFlowGraph;
  width?: number;
  height?: number;
  interactive?: boolean;
  onNodeClick?: (node: LogicNode) => void;
  className?: string;
}

export const LogicFlowVisualization: React.FC<LogicFlowVisualizationProps> = ({
  graph,
  width = 800,
  height = 600,
  interactive = true,
  onNodeClick,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [layoutedGraph, setLayoutedGraph] = useState<LogicFlowGraph>(graph);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate layout when graph changes
  useEffect(() => {
    const layouted = calculateLayout(graph, {
      nodeWidth: 180,
      nodeHeight: 70,
      horizontalSpacing: 80,
      verticalSpacing: 100,
      direction: 'TB',
    });
    setLayoutedGraph(layouted);

    // Center the graph
    const bbox = calculateBoundingBox(layouted);
    setPan({
      x: (width - bbox.width * zoom) / 2 - bbox.minX * zoom,
      y: 50,
    });
  }, [graph, width, zoom]);

  // Get node color based on type
  const getNodeColor = (type: LogicNode['type']): string => {
    switch (type) {
      case 'condition':
        return '#3B82F6'; // Blue
      case 'conclusion':
        return '#10B981'; // Green
      case 'action':
        return '#F59E0B'; // Amber
      case 'decision':
        return '#8B5CF6'; // Purple
      default:
        return '#6B7280'; // Gray
    }
  };

  // Get node shape based on type
  const renderNodeShape = (node: LogicNode, isSelected: boolean) => {
    const color = getNodeColor(node.type);
    const strokeWidth = isSelected ? 3 : 2;
    const nodeWidth = 180;
    const nodeHeight = 70;

    switch (node.type) {
      case 'decision':
        // Diamond shape for decisions
        const centerX = nodeWidth / 2;
        const centerY = nodeHeight / 2;
        return (
          <path
            d={`M ${centerX},0 L ${nodeWidth},${centerY} L ${centerX},${nodeHeight} L 0,${centerY} Z`}
            fill={color}
            fillOpacity={0.1}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );

      case 'condition':
        // Hexagon for conditions
        return (
          <path
            d={`M 30,0 L ${nodeWidth - 30},0 L ${nodeWidth},${nodeHeight / 2} L ${nodeWidth - 30},${nodeHeight} L 30,${nodeHeight} L 0,${nodeHeight / 2} Z`}
            fill={color}
            fillOpacity={0.1}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );

      default:
        // Rounded rectangle for conclusions and actions
        return (
          <rect
            width={nodeWidth}
            height={nodeHeight}
            rx={8}
            ry={8}
            fill={color}
            fillOpacity={0.1}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  // Handle node click
  const handleNodeClick = (node: LogicNode) => {
    setSelectedNode(node.id);
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  // Handle mouse wheel for zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!interactive) return;

    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, zoom * delta));
    setZoom(newZoom);
  };

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Render edges with Bezier curves
  const renderEdges = () => {
    return layoutedGraph.edges.map((edge: LogicEdge) => {
      const sourceNode = layoutedGraph.nodes.find(n => n.id === edge.source);
      const targetNode = layoutedGraph.nodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) return null;

      const path = generateBezierPath(sourceNode, targetNode);
      const isHighlighted = selectedNode === edge.source || selectedNode === edge.target;

      return (
        <g key={edge.id}>
          {/* Main path */}
          <path
            d={path}
            fill="none"
            stroke={edge.style?.strokeColor || '#94A3B8'}
            strokeWidth={isHighlighted ? 3 : edge.style?.strokeWidth || 2}
            strokeDasharray={edge.style?.strokeDasharray}
            opacity={isHighlighted ? 1 : 0.6}
            markerEnd="url(#arrowhead)"
          />

          {/* Edge label */}
          {edge.label && (
            <text
              x={(sourceNode.position.x + targetNode.position.x) / 2 + 90}
              y={(sourceNode.position.y + targetNode.position.y) / 2 + 35}
              fill="#475569"
              fontSize="12"
              fontWeight="500"
              textAnchor="middle"
            >
              {edge.label}
            </text>
          )}
        </g>
      );
    });
  };

  // Render nodes
  const renderNodes = () => {
    return layoutedGraph.nodes.map((node: LogicNode) => {
      const isSelected = selectedNode === node.id;

      return (
        <g
          key={node.id}
          transform={`translate(${node.position.x}, ${node.position.y})`}
          onClick={() => handleNodeClick(node)}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        >
          {/* Node shape */}
          {renderNodeShape(node, isSelected)}

          {/* Node label */}
          <text
            x={90}
            y={30}
            textAnchor="middle"
            fill="#1E293B"
            fontSize="14"
            fontWeight="600"
          >
            {node.label}
          </text>

          {/* Node description */}
          {node.description && (
            <text
              x={90}
              y={48}
              textAnchor="middle"
              fill="#64748B"
              fontSize="11"
            >
              {node.description.length > 25
                ? node.description.substring(0, 25) + '...'
                : node.description}
            </text>
          )}
        </g>
      );
    });
  };

  return (
    <div className={`logic-flow-visualization ${className}`} style={{ position: 'relative' }}>
      {/* Controls */}
      {interactive && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10,
            display: 'flex',
            gap: '8px',
            backgroundColor: 'white',
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <button
            onClick={() => setZoom(Math.min(3, zoom * 1.2))}
            style={{
              padding: '4px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(Math.max(0.1, zoom * 0.8))}
            style={{
              padding: '4px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            -
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 50 });
            }}
            style={{
              padding: '4px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          backgroundColor: '#F8FAFC',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#94A3B8" />
          </marker>
        </defs>

        {/* Main content group with zoom and pan */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {renderEdges()}
          {renderNodes()}
        </g>
      </svg>

      {/* Legend */}
      <div
        style={{
          marginTop: '16px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#3B82F6',
              opacity: 0.5,
              borderRadius: '2px',
            }}
          />
          <span>조건 (Condition)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#10B981',
              opacity: 0.5,
              borderRadius: '2px',
            }}
          />
          <span>결론 (Conclusion)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#F59E0B',
              opacity: 0.5,
              borderRadius: '2px',
            }}
          />
          <span>행동 (Action)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#8B5CF6',
              opacity: 0.5,
              borderRadius: '2px',
            }}
          />
          <span>결정 (Decision)</span>
        </div>
      </div>
    </div>
  );
};

export default LogicFlowVisualization;
