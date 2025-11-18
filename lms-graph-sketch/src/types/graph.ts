// Graph-related type definitions

export interface ConceptNode {
  id: string;
  label: string;
  type: 'concept' | 'entity' | 'operation';
  description?: string;
}

export interface ConceptRelationship {
  id: string;
  source: string;
  target: string;
  label: string;
  type: 'has-a' | 'is-a' | 'part-of' | 'relates-to' | 'divided-into' | 'custom';
}

export interface ConceptGraph {
  nodes: ConceptNode[];
  relationships: ConceptRelationship[];
}

export interface ExtractionResult {
  concepts: ConceptNode[];
  relationships: ConceptRelationship[];
  rawResponse?: string;
}

export interface GraphState {
  graph: ConceptGraph | null;
  isLoading: boolean;
  error: string | null;
  inputText: string;
}
