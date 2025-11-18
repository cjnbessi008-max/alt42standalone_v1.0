export enum ChecklistType {
  GENERATION_PIPELINE = 'generation_pipeline',
  LEARNING_PROGRESS = 'learning_progress',
  QUALITY_ASSURANCE = 'quality_assurance',
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  description?: string;
  order: number;
  is_completed: boolean;
  is_required: boolean;
  depends_on?: string;
  pipeline_stage?: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Checklist {
  id: string;
  title: string;
  description?: string;
  checklist_type: ChecklistType;
  module_id?: string;
  student_id?: string;
  teacher_id?: string;
  total_items: number;
  completed_items: number;
  auto_generated: boolean;
  created_at: string;
  updated_at: string;
  items: ChecklistItem[];
}

export interface ChecklistProgressUpdate {
  item_id: string;
  is_completed: boolean;
  progress_percentage?: number;
}
