// Type definitions for the application

export interface LogDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface LogGraphData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
  }[];
}

export interface MoodleActivityLog {
  id: number;
  userid: number;
  courseid: number;
  activityname: string;
  timestamp: number;
  score?: number;
  duration?: number;
}

export interface MoodleConfig {
  baseUrl: string;
  wsToken?: string;
  wsFunction?: string;
}

export interface ZoomOptions {
  enabled: boolean;
  mode: 'x' | 'y' | 'xy';
  speed: number;
  animationDuration: number;
}

export interface PanOptions {
  enabled: boolean;
  mode: 'x' | 'y' | 'xy';
  speed: number;
}
