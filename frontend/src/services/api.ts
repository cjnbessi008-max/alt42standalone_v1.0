import axios from 'axios';
import { Checklist, ChecklistProgressUpdate } from '../types/checklist';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Checklist API
export const checklistApi = {
  // Get checklist by ID
  getChecklist: async (checklistId: string): Promise<Checklist> => {
    const response = await api.get(`/api/checklists/${checklistId}`);
    return response.data;
  },

  // Get all checklists for a module
  getModuleChecklists: async (moduleId: string): Promise<Checklist[]> => {
    const response = await api.get(`/api/checklists/module/${moduleId}`);
    return response.data;
  },

  // Get all checklists for a student
  getStudentChecklists: async (studentId: string): Promise<Checklist[]> => {
    const response = await api.get(`/api/checklists/student/${studentId}`);
    return response.data;
  },

  // Generate pipeline checklist for module
  generatePipelineChecklist: async (
    moduleId: string,
    teacherId: string
  ): Promise<Checklist> => {
    const response = await api.post(
      `/api/checklists/generate/pipeline/${moduleId}`,
      null,
      { params: { teacher_id: teacherId } }
    );
    return response.data;
  },

  // Generate learning checklist for student
  generateLearningChecklist: async (
    moduleId: string,
    studentId: string
  ): Promise<Checklist> => {
    const response = await api.post(
      `/api/checklists/generate/learning/${moduleId}/${studentId}`
    );
    return response.data;
  },

  // Update item progress
  updateItemProgress: async (
    update: ChecklistProgressUpdate
  ): Promise<void> => {
    await api.put('/api/checklists/items/progress', update);
  },

  // Delete checklist
  deleteChecklist: async (checklistId: string): Promise<void> => {
    await api.delete(`/api/checklists/${checklistId}`);
  },
};

// LMS API
export const lmsApi = {
  // Get LMS configuration
  getLMSConfig: async (lmsId: string) => {
    const response = await api.get(`/api/lms/config/${lmsId}`);
    return response.data;
  },

  // Submit grade to LMS
  submitGrade: async (
    lmsId: string,
    studentLmsId: string,
    resourceLinkId: string,
    score: number,
    maxScore: number = 100
  ) => {
    const response = await api.post('/api/lms/grade/submit', {
      lms_id: lmsId,
      student_lms_id: studentLmsId,
      resource_link_id: resourceLinkId,
      score,
      max_score: maxScore,
    });
    return response.data;
  },
};
