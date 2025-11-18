export interface Student {
  id: number;
  name: string;
  email: string;
  student_id: string;
}

export interface ConsistencyScore {
  date: string;
  attendance_score: number;
  activity_score: number;
  submission_score: number;
  total_score: number;
}

export interface StudentScore extends Student {
  date: string;
  attendance_score: number;
  activity_score: number;
  submission_score: number;
  total_score: number;
}

export interface StudentScoreTrend {
  student: Student;
  scores: ConsistencyScore[];
}
