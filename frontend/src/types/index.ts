// Vector Space Map Types

export interface Concept {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: number; // 1-5
  position?: {
    x: number;
    y: number;
    z?: number;
  };
  embedding?: number[];
  parentConceptId?: string;
  metadata?: Record<string, any>;
}

export interface ConceptRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'prerequisite' | 'similar' | 'extends' | 'related';
  weight: number; // 0-1
}

export interface VectorSpaceData {
  concepts: Concept[];
  relationships: ConceptRelationship[];
  clusters?: ConceptCluster[];
  metadata?: {
    moduleId: string;
    moduleName: string;
    totalConcepts: number;
    generatedAt: string;
  };
}

export interface ConceptCluster {
  id: string;
  name: string;
  concepts: string[]; // concept IDs
  center: { x: number; y: number; z?: number };
  color: string;
}

export interface StudentLearningPath {
  studentId: string;
  moduleId: string;
  visitedConcepts: {
    conceptId: string;
    timestamp: string;
    masteryScore: number; // 0-1
    timeSpent: number; // seconds
  }[];
  currentConceptId?: string;
}

export interface MoodleQuestion {
  id: number;
  name: string;
  questiontext: string;
  questiontype: string;
  category: string;
  difficulty?: number;
  conceptTags?: string[];
}

export interface MoodleModule {
  id: number;
  course: number;
  name: string;
  intro: string;
  questions?: MoodleQuestion[];
}

// Component Props Types
export interface VectorSpaceMapProps {
  moduleId: string;
  interactiveMode?: 'explore' | 'student-progress' | 'edit';
  dimension?: '2d' | '3d';
  colorScheme?: 'by-category' | 'by-difficulty' | 'by-mastery';
  onConceptSelect?: (concept: Concept) => void;
  studentId?: string;
  className?: string;
}

export interface SmartphoneFrameProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}
