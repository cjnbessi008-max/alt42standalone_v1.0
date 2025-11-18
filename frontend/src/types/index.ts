export interface Condition {
  id: string;
  type: 'completion' | 'grade' | 'date' | 'group' | 'user' | 'custom';
  description: string;
  operator?: 'AND' | 'OR';
  value?: string | number;
  nested?: Condition[];
}

export interface MoodleActivity {
  id: number;
  name: string;
  modulename: string;
  availability?: string; // JSON string containing conditions
  conditions?: Condition[];
}

export interface ScanState {
  currentIndex: number;
  isScanning: boolean;
  isPaused: boolean;
  speed: number; // milliseconds per step
}

export interface HighlightedCondition extends Condition {
  isHighlighted: boolean;
  wasScanned: boolean;
}
