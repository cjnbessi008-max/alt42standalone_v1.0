import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ConceptNode from './ConceptNode';
import { ConceptTreeData, LMSData } from '../types/concept';
import { convertToFlowElements, getAncestors, getDescendants } from '../utils/treeLayout';

interface ConceptMinimapProps {
  conceptTree: ConceptTreeData;
  lmsData: LMSData;
  onConceptClick?: (conceptId: string) => void;
}

const nodeTypes: NodeTypes = {
  custom: ConceptNode,
};

export default function ConceptMinimap({
  conceptTree,
  lmsData,
  onConceptClick,
}: ConceptMinimapProps) {
  const { currentProblem, studentProgress, completedConcepts } = lmsData;

  // 현재 문제와 관련된 개념들 계산
  const currentConceptIds = useMemo(() => {
    return currentProblem.relatedConceptIds;
  }, [currentProblem]);

  // React Flow 요소 생성
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () =>
      convertToFlowElements(
        conceptTree,
        currentConceptIds,
        studentProgress,
        completedConcepts
      ),
    [conceptTree, currentConceptIds, studentProgress, completedConcepts]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 노드 클릭 핸들러
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      const conceptId = node.id;
      console.log('Clicked concept:', conceptId);

      if (onConceptClick) {
        onConceptClick(conceptId);
      }

      // 클릭한 노드와 관련된 노드들 하이라이트
      const ancestors = getAncestors(conceptId, conceptTree.concepts);
      const descendants = getDescendants(conceptId, conceptTree.concepts);
      const relatedIds = new Set([conceptId, ...ancestors, ...descendants]);

      // 노드 스타일 업데이트
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          style: {
            ...n.style,
            opacity: relatedIds.has(n.id) ? 1 : 0.3,
          },
        }))
      );

      // 엣지 스타일 업데이트
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          style: {
            ...e.style,
            opacity: relatedIds.has(e.source) && relatedIds.has(e.target) ? 1 : 0.2,
          },
        }))
      );
    },
    [onConceptClick, conceptTree.concepts, setNodes, setEdges]
  );

  // 배경 클릭 시 하이라이트 초기화
  const onPaneClick = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: 1,
        },
      }))
    );

    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: 1,
        },
      }))
    );
  }, [setNodes, setEdges]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalConcepts = Object.keys(conceptTree.concepts).length;
    const completed = completedConcepts.length;
    const locked = Object.values(conceptTree.concepts).filter((c) => c.isLocked).length;
    const avgProgress =
      Object.values(studentProgress).reduce((sum, p) => sum + p, 0) / totalConcepts;

    return {
      total: totalConcepts,
      completed,
      locked,
      avgProgress: Math.round(avgProgress),
    };
  }, [conceptTree.concepts, completedConcepts, studentProgress]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#e2e8f0" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any;
            if (data.isCurrent) return '#3b82f6';
            if (data.isCompleted) return '#22c55e';
            if (data.isLocked) return '#ef4444';
            return '#94a3b8';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />

        {/* 통계 패널 */}
        <Panel position="top-left" style={{
          background: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          fontSize: '13px',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>
            학습 현황
          </div>
          <div style={{ display: 'flex', gap: '16px', color: '#64748b' }}>
            <div>
              <span style={{ fontWeight: 500 }}>전체:</span> {stats.total}
            </div>
            <div>
              <span style={{ fontWeight: 500, color: '#22c55e' }}>완료:</span> {stats.completed}
            </div>
            <div>
              <span style={{ fontWeight: 500, color: '#ef4444' }}>잠김:</span> {stats.locked}
            </div>
            <div>
              <span style={{ fontWeight: 500 }}>평균:</span> {stats.avgProgress}%
            </div>
          </div>
        </Panel>

        {/* 범례 패널 */}
        <Panel position="top-right" style={{
          background: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          fontSize: '12px',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>
            범례
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: '2px solid #3b82f6',
                background: '#eff6ff',
              }} />
              <span>📍 현재 학습 중</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: '2px solid #22c55e',
                background: '#f0fdf4',
              }} />
              <span>✅ 완료</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: '2px solid #ef4444',
                background: '#fef2f2',
              }} />
              <span>🔒 잠김</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
