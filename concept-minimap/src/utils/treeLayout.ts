import { Node, Edge } from 'reactflow';
import { Concept, ConceptTreeData } from '../types/concept';

export interface ConceptNode extends Node {
  data: {
    concept: Concept;
    progress: number;
    isCompleted: boolean;
    isLocked: boolean;
    isCurrent: boolean;
  };
}

/**
 * 개념 트리를 React Flow 노드와 엣지로 변환
 */
export function convertToFlowElements(
  conceptTree: ConceptTreeData,
  currentConceptIds: string[],
  studentProgress: Record<string, number>,
  completedConcepts: string[]
): { nodes: ConceptNode[]; edges: Edge[] } {
  const nodes: ConceptNode[] = [];
  const edges: Edge[] = [];
  const { concepts } = conceptTree;

  // 레벨별로 노드를 그룹화
  const nodesByLevel: Map<number, ConceptNode[]> = new Map();

  // 모든 개념을 노드로 변환
  Object.values(concepts).forEach((concept) => {
    const progress = studentProgress[concept.id] || 0;
    const isCompleted = completedConcepts.includes(concept.id);
    const isLocked = concept.isLocked || false;
    const isCurrent = currentConceptIds.includes(concept.id);

    const node: ConceptNode = {
      id: concept.id,
      type: 'custom',
      position: { x: 0, y: 0 }, // 나중에 계산
      data: {
        concept,
        progress,
        isCompleted,
        isLocked,
        isCurrent,
      },
    };

    nodes.push(node);

    // 레벨별로 그룹화
    if (!nodesByLevel.has(concept.level)) {
      nodesByLevel.set(concept.level, []);
    }
    nodesByLevel.get(concept.level)!.push(node);

    // 자식 노드로의 엣지 생성
    concept.children.forEach((childId) => {
      edges.push({
        id: `${concept.id}-${childId}`,
        source: concept.id,
        target: childId,
        type: 'smoothstep',
        animated: currentConceptIds.includes(childId),
        style: {
          stroke: isCurrent || currentConceptIds.includes(childId)
            ? '#3b82f6'
            : '#94a3b8',
          strokeWidth: isCurrent || currentConceptIds.includes(childId) ? 2 : 1,
        },
      });
    });
  });

  // 레벨별 위치 계산 (트리 레이아웃)
  const levelHeight = 150; // 레벨 간 세로 간격
  const nodeWidth = 200; // 노드 간 가로 간격

  nodesByLevel.forEach((levelNodes, level) => {
    const totalWidth = levelNodes.length * nodeWidth;
    const startX = -totalWidth / 2;

    levelNodes.forEach((node, index) => {
      node.position = {
        x: startX + index * nodeWidth + nodeWidth / 2,
        y: level * levelHeight,
      };
    });
  });

  return { nodes, edges };
}

/**
 * 특정 개념의 모든 선조 개념 ID를 가져오기
 */
export function getAncestors(
  conceptId: string,
  concepts: Record<string, Concept>
): string[] {
  const ancestors: string[] = [];
  const concept = concepts[conceptId];

  if (!concept) return ancestors;

  concept.prerequisites.forEach((prereqId) => {
    if (!ancestors.includes(prereqId)) {
      ancestors.push(prereqId);
      // 재귀적으로 선조들도 추가
      const prereqAncestors = getAncestors(prereqId, concepts);
      prereqAncestors.forEach((id) => {
        if (!ancestors.includes(id)) {
          ancestors.push(id);
        }
      });
    }
  });

  return ancestors;
}

/**
 * 특정 개념의 모든 후손 개념 ID를 가져오기
 */
export function getDescendants(
  conceptId: string,
  concepts: Record<string, Concept>
): string[] {
  const descendants: string[] = [];
  const concept = concepts[conceptId];

  if (!concept) return descendants;

  concept.children.forEach((childId) => {
    if (!descendants.includes(childId)) {
      descendants.push(childId);
      // 재귀적으로 후손들도 추가
      const childDescendants = getDescendants(childId, concepts);
      childDescendants.forEach((id) => {
        if (!descendants.includes(id)) {
          descendants.push(id);
        }
      });
    }
  });

  return descendants;
}
