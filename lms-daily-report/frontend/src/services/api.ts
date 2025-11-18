import axios from 'axios';
import type { DailyReport, DashboardOverview, TrendData, Incident } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const reportsApi = {
  // 리포트 목록 조회
  getReports: async (params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<DailyReport[]> => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  // 리포트 상세 조회
  getReport: async (reportId: number): Promise<DailyReport> => {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  },

  // 날짜로 리포트 조회
  getReportByDate: async (date: string): Promise<DailyReport> => {
    const response = await api.get(`/reports/by-date/${date}`);
    return response.data;
  },

  // 최신 리포트 요약
  getLatestReportSummary: async () => {
    const response = await api.get('/reports/latest/summary');
    return response.data;
  },

  // 리포트 생성
  generateReport: async (date?: string) => {
    const response = await api.post('/reports/generate', null, {
      params: { report_date: date },
    });
    return response.data;
  },
};

export const dashboardApi = {
  // 대시보드 개요
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  // 대시보드 트렌드
  getTrends: async (days: number = 7): Promise<{ period: any; trends: TrendData[] }> => {
    const response = await api.get('/dashboard/trends', {
      params: { days },
    });
    return response.data;
  },
};

export const incidentsApi = {
  // 사고 목록 조회
  getIncidents: async (params?: {
    skip?: number;
    limit?: number;
    incident_type?: string;
    severity?: string;
    student_id?: number;
    course_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<Incident[]> => {
    const response = await api.get('/incidents', { params });
    return response.data;
  },

  // 사고 통계
  getIncidentStats: async (params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await api.get('/incidents/stats/summary', { params });
    return response.data;
  },

  // 사고 생성
  createIncident: async (incident: any) => {
    const response = await api.post('/incidents', incident);
    return response.data;
  },

  // 일괄 생성 (테스트용)
  createIncidentsBatch: async (incidents: any[]) => {
    const response = await api.post('/incidents/batch', incidents);
    return response.data;
  },
};

export default api;
