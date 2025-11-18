export interface NodePosition {
  x: number
  y: number
}

export interface NodeStyle {
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  color?: string
}

export interface FlowchartNode {
  id: string
  solution_id: string
  node_type: string
  label: string
  description?: string
  position: NodePosition
  action_id?: string
  data?: any
  style?: NodeStyle
  created_at: string
}

export interface EdgeStyle {
  strokeColor?: string
  strokeWidth?: number
  animated?: boolean
}

export interface FlowchartEdge {
  id: string
  solution_id: string
  source_node_id: string
  target_node_id: string
  label?: string
  weight?: number
  data?: any
  style?: EdgeStyle
  created_at: string
}

export interface FlowchartData {
  nodes: FlowchartNode[]
  edges: FlowchartEdge[]
}

export interface ActionData {
  action_type: string
  action_data?: any
  timestamp: string
  sequence_number: number
}

export interface SolutionFlowchart {
  solution_id: string
  student_id: string
  problem_id: string
  module_id: string
  started_at: string
  completed_at?: string
  time_spent_seconds: number
  is_correct?: boolean
  attempts_count: number
  hints_used_count: number
  flowchart: FlowchartData
  actions: ActionData[]
}
