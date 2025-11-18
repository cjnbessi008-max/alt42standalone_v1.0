export interface LMSUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface LMSCourse {
  id: string;
  name: string;
  code: string;
}

export interface LMSSession {
  userId: string;
  courseId: string;
  sessionToken: string;
  expiresAt: Date;
}

export interface LMSActivityLog {
  userId: string;
  courseId: string;
  activityType: 'breathing_session';
  data: {
    pattern: string;
    duration: number;
    cycles: number;
    completed: boolean;
  };
  timestamp: Date;
}

export interface LMSConfig {
  apiUrl: string;
  apiKey?: string;
  enableTracking: boolean;
  enableAuthentication: boolean;
}
