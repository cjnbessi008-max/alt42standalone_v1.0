/**
 * TypeScript type definitions for the application
 */

export type SeverityLevel = 'low' | 'medium' | 'high';

export interface MisconceptionPattern {
  id: string;
  name: string;
  description: string;
  concept_name: string;
  severity: SeverityLevel;
  occurrence_count: number;
  last_occurred_at: string;
  correction_strategy: string;
  typical_wrong_pattern?: Record<string, any>;
}

export interface TopMisconceptionsResponse {
  student_id: string;
  student_name: string;
  module_id: string;
  module_name: string;
  misconceptions: MisconceptionPattern[];
  total_count: number;
  generated_at: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  grade_level: string;
  email?: string;
  enrolled_modules_count?: number;
}

export interface ModuleInfo {
  id: string;
  name: string;
  description?: string;
  subject: string;
  grade_level: string;
  enrolled_at?: string;
  progress_percentage?: number;
}
