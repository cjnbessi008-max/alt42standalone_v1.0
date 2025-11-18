import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  BackgroundVariant,
} from 'reactflow';
import type { Node, Edge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { Paper, Typography, Box } from '@mui/material';
import { useGraphStore } from '../../store/graphStore';
import type { ConceptNode as CustomConceptNode } from '../../types/graph';
import { CustomNode } from './CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

// Helper function to calculate automatic layout using force-directed algorithm
const calculateLayout = (
  concepts: CustomConceptNode[]
): { x: number; y: number }[] => {
  const positions: { x: number; y: number }[] = [];
  const nodeCount = concepts.length;

  if (nodeCount === 0) return positions;

  // Simple circular layout for better visualization
  const radius = Math.max(200, nodeCount * 30);
  const centerX = 400;
  const centerY = 300;

  concepts.forEach((_, index) => {
    const angle = (2 * Math.PI * index) / nodeCount;
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

  return positions;
};

export const GraphCanvas = () => {
  const { graph, removeNode } = useGraphStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert graph data to React Flow format
  useEffect(() => {
    if (!graph) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const positions = calculateLayout(graph.nodes);

    const flowNodes: Node[] = graph.nodes.map((node, index) => ({
      id: node.id,
      type: 'custom',
      position: positions[index] || { x: 100 + index * 150, y: 100 },
      data: {
        label: node.label,
        description: node.description,
        nodeType: node.type,
        onDelete: () => removeNode(node.id),
      },
    }));

    const flowEdges: Edge[] = graph.relationships.map((rel) => ({
      id: rel.id,
      source: rel.source,
      target: rel.target,
      label: rel.label,
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: { stroke: '#888', strokeWidth: 2 },
      labelStyle: { fill: '#555', fontWeight: 600 },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [graph, setNodes, setEdges, removeNode]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (!graph) {
    return (
      <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box textAlign="center">
          <Typography variant="h6" color="text.secondary" gutterBottom>
            그래프 미리보기
          </Typography>
          <Typography variant="body2" color="text.secondary">
            왼쪽에서 교육 내용을 입력하고 '그래프 자동 생성' 버튼을 클릭하세요.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">
          개념 그래프
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {graph.nodes.length}개 개념, {graph.relationships.length}개 관계
        </Typography>
      </Box>
      <Box sx={{ height: 'calc(100% - 80px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
        </ReactFlow>
      </Box>
    </Paper>
  );
};
