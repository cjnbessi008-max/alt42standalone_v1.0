export enum IncidentType {
  LEARNING_ACTIVITY = 'learning_activity',
  ASSESSMENT = 'assessment',
  SYSTEM_ERROR = 'system_error',
  LOGIN = 'login',
  CONTENT_ACCESS = 'content_access',
  SUBMISSION = 'submission',
  DISCUSSION = 'discussion'
}

export enum IncidentSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface Student {
  id: number;
  name: string;
  email: string;
  student_id: string;
  created_at: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at: string;
}

export interface Incident {
  id: number;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  student_id?: number;
  course_id?: number;
  created_at: string;
}

export interface DailyReport {
  id: number;
  report_date: string;
  summary?: Record<string, any>;
  incidents_count: number;
  generated_at: string;
  total_students: number;
  active_students: number;
  total_activities: number;
  error_count: number;
  details?: Record<string, any>;
}

export interface DashboardOverview {
  today: {
    incidents: number;
    date: string;
  };
  this_week: {
    incidents: number;
    active_students: number;
    errors: number;
  };
  latest_report: {
    date: string | null;
    incidents: number;
  };
}

export interface TrendData {
  date: string;
  incidents: number;
  active_students: number;
  errors: number;
}
