export interface Formula {
  id: string;
  imageUrl: string;
  text: string;
  components: FormulaComponent[];
}

export interface FormulaComponent {
  id: string;
  text: string;
  type: 'variable' | 'operator' | 'constant' | 'function' | 'expression';
  position: number;
}

export interface Question {
  id: string;
  text: string;
  hint?: string;
  focusComponent?: string; // ID of the component to highlight
}

export type LearningPhase = 'upload' | 'initial-view' | 'question' | 'reveal' | 'complete';
