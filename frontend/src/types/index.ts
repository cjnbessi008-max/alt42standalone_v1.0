/**
 * TypeScript type definitions
 */

export interface InefficientDetection {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  line_number: number;
  end_line_number: number;
  message: string;
  suggestion: string;
  code_snippet: string;
  estimated_complexity_before: string;
  estimated_complexity_after: string;
  context: Record<string, any>;
}

export interface AnalysisResult {
  submission_id?: string;
  total_loops: number;
  inefficient_loops: number;
  efficiency_score: number;
  total_issues: number;
  critical_issues: number;
  warning_issues: number;
  info_issues: number;
  inefficiencies: InefficientDetection[];
  recommendations: string[];
  analysis_duration_ms: number;
  analyzed_at: string;
}

export interface AnalysisRequest {
  code: string;
  student_id?: string;
  assignment_id?: number;
}

export interface Student {
  id: string;
  moodle_id: number;
  username: string;
  email: string;
  firstname?: string;
  lastname?: string;
  is_active: boolean;
  created_at: string;
}

export interface Submission {
  id: string;
  filename?: string;
  submitted_at: string;
  analyzed: boolean;
  efficiency_score?: number;
}
