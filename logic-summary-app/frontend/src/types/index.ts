export interface Proposition {
  id: string;
  text: string;
  type: 'premise' | 'assumption' | 'conclusion' | 'constraint' | 'operation';
  confidence: number;
}

export interface VisualizationNode {
  id: string;
  label: string;
  type: string;
}

export interface VisualizationEdge {
  from: string;
  to: string;
  relationship: 'implies' | 'supports' | 'contradicts';
}

export interface VisualizationData {
  nodes: VisualizationNode[];
  edges: VisualizationEdge[];
}

export interface Problem {
  id: number;
  title: string;
  content: string;
  problem_type: string;
  grade_level?: string;
  propositions?: Proposition[];
  logic_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface ProblemCreate {
  title: string;
  content: string;
  problem_type?: string;
  grade_level?: string;
}

export interface LogicSummaryResponse {
  problem_id: number;
  propositions: Proposition[];
  logic_summary: string;
  visualization_data?: VisualizationData;
}
