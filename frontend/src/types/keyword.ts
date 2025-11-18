export interface Keyword {
  id: string;
  keyword: string;
  normalizedKeyword: string;
  keywordType: 'concept' | 'operation' | 'entity' | 'attribute';
  importanceScore: number;
  frequency: number;
  category: string;
  sourceContent: string;
}

export interface KeywordRelationship {
  id: string;
  sourceKeywordId: string;
  targetKeywordId: string;
  relationshipType: 'has_part' | 'related_to' | 'prerequisite';
  strength: number;
}

export interface BubbleNode extends Keyword {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface BubbleLink {
  source: string;
  target: string;
  strength: number;
  relationshipType: string;
}

export interface VisualizationData {
  nodes: BubbleNode[];
  links: BubbleLink[];
}

export interface ExtractionRequest {
  content: string;
  language?: 'ko' | 'en';
  extractionOptions?: {
    minImportance?: number;
    maxKeywords?: number;
    includeRelationships?: boolean;
  };
}

export interface ExtractionResponse {
  keywords: Keyword[];
  relationships: KeywordRelationship[];
  visualizationData: VisualizationData;
}
