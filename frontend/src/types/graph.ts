export interface GraphNode {
  id: string;
  label: string;
  title?: string;
  level?: number;
  color?: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  arrows?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AnimationPhase {
  name: string;
  duration: number;
  startTime: number;
}
