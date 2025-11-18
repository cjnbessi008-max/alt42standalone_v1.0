export interface ValidationError {
  field: string;
  message: string;
  type: 'bracket' | 'sign' | 'format' | 'general';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface SubmissionData {
  answer: string;
  problemId?: string;
  studentId?: string;
}

export interface SubmissionResponse {
  success: boolean;
  validationResult: ValidationResult;
  message: string;
}
