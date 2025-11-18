import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  Panel,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import type { TreeNode, NodeType } from '../../types';
import './TreeMap.css';

interface CountingTreeMapProps {
  problemId: string;
  sessionId?: string;
  nodes: TreeNode[];
  onNodeClick?: (nodeId: string, node: TreeNode) => void;
  isInteractive?: boolean;
  showMiniMap?: boolean;
  highlightedPath?: string[];
}

const nodeTypes = {
  custom: CustomNode
};

/**
 * Counting Tree Map Component
 * Visualizes thought flow as an interactive tree structure
 */
const CountingTreeMap: React.FC<CountingTreeMapProps> = ({
  problemId,
  sessionId,
  nodes,
  onNodeClick,
  isInteractive = true,
  showMiniMap = true,
  highlightedPath = []
}) => {
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Convert tree nodes to React Flow format
  useEffect(() => {
    const flowNodes: Node[] = nodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: {
        x: node.position_x || 0,
        y: node.position_y || 0
      },
      data: {
        label: node.label,
        description: node.description,
        nodeType: node.node_type,
        isCorrect: node.is_correct,
        isHighlighted: highlightedPath.includes(node.id),
        isSelected: selectedNode === node.id,
        onNodeClick: () => handleNodeClick(node)
      }
    }));

    const flowEdges: Edge[] = nodes
      .filter((node) => node.parent_id)
      .map((node) => ({
        id: `edge-${node.parent_id}-${node.id}`,
        source: node.parent_id!,
        target: node.id,
        type: 'smoothstep',
        animated: highlightedPath.includes(node.id) && highlightedPath.includes(node.parent_id!),
        style: {
          stroke: highlightedPath.includes(node.id) ? '#ff6b6b' : '#b1b1b7',
          strokeWidth: highlightedPath.includes(node.id) ? 3 : 2
        }
      }));

    setReactFlowNodes(flowNodes);
    setReactFlowEdges(flowEdges);
  }, [nodes, highlightedPath, selectedNode]);

  const handleNodeClick = useCallback(
    (node: TreeNode) => {
      if (!isInteractive) return;

      setSelectedNode(node.id);
      onNodeClick?.(node.id, node);
    },
    [isInteractive, onNodeClick]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isInteractive) {
        setReactFlowEdges((eds) => addEdge(connection, eds));
      }
    },
    [isInteractive]
  );

  const getNodeColor = (nodeType: NodeType): string => {
    const colors = {
      problem: '#4ecdc4',
      approach: '#95e1d3',
      step: '#f38181',
      answer: '#ffd93d'
    };
    return colors[nodeType] || '#ddd';
  };

  return (
    <div className="counting-tree-map" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />

        {showMiniMap && (
          <MiniMap
            nodeColor={(node) => getNodeColor(node.data.nodeType)}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
        )}

        <Panel position="top-left" className="tree-map-info">
          <div style={{
            background: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '14px'
          }}>
            <div><strong>문제 ID:</strong> {problemId}</div>
            {sessionId && <div><strong>세션 ID:</strong> {sessionId}</div>}
            <div><strong>노드 수:</strong> {nodes.length}</div>
          </div>
        </Panel>

        <Panel position="top-right" className="tree-map-legend">
          <div style={{
            background: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>노드 유형</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: 16, height: 16, background: '#4ecdc4', borderRadius: '4px' }} />
              <span>문제</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: 16, height: 16, background: '#95e1d3', borderRadius: '4px' }} />
              <span>접근법</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: 16, height: 16, background: '#f38181', borderRadius: '4px' }} />
              <span>단계</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 16, height: 16, background: '#ffd93d', borderRadius: '4px' }} />
              <span>정답</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default CountingTreeMap;
