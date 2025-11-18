export enum StepType {
  ANALYSIS = 'analysis',
  STRATEGY = 'strategy',
  SUBSTEP = 'substep',
  SOLUTION = 'solution',
}

export interface StrategyStep {
  id: string;
  type: StepType;
  title: string;
  content: string;
  order: number;
  parent_id: string | null;
  children_ids: string[];
}

export interface StrategyResponse {
  problem: string;
  steps: StrategyStep[];
  total_steps: number;
}

export interface ProblemRequest {
  problem: string;
  subject?: string;
  difficulty?: string;
}
