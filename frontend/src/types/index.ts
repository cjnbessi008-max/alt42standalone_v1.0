export type PropositionType = 'universal' | 'existential' | 'conditional' | 'biconditional';
export type VisualizationMode = 'venn' | 'number-line' | 'graph' | 'custom';

export interface Proposition {
  id: string;
  title: string;
  statement: string;
  domain: string;
  type: PropositionType;
  truthValue: boolean | null;
  visualConfig: VisualizationConfig;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  counterexamples?: Counterexample[];
}

export interface Counterexample {
  id: string;
  propositionId: string;
  value: any;
  explanation: string;
  visualPosition: { x: number; y: number };
  shadowIntensity: number;
  createdAt: string;
}

export interface VisualizationConfig {
  mode: VisualizationMode;
  colors: {
    positive: string;
    negative: string;
    neutral: string;
  };
  animation: {
    duration: number;
    easing: string;
  };
}

export interface CreatePropositionRequest {
  title: string;
  statement: string;
  domain: string;
  type: PropositionType;
  truthValue?: boolean;
  visualConfig?: Partial<VisualizationConfig>;
}

export interface CreateCounterexampleRequest {
  value: any;
  explanation: string;
  visualPosition?: { x: number; y: number };
  shadowIntensity?: number;
}
