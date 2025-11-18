import axios from 'axios';
import { GeometricShape, SimilarityProblem, SimilarityAnalysis } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const api = {
    // Shapes
    getAllShapes: async () => {
        const response = await apiClient.get<{ success: boolean; data: GeometricShape[] }>('/shapes');
        return response.data.data;
    },

    getShapeById: async (id: number) => {
        const response = await apiClient.get<{ success: boolean; data: GeometricShape }>(`/shapes/${id}`);
        return response.data.data;
    },

    createShape: async (shape: Omit<GeometricShape, 'id' | 'created_at'>) => {
        const response = await apiClient.post<{ success: boolean; data: GeometricShape }>('/shapes', shape);
        return response.data.data;
    },

    // Problems
    getAllProblems: async () => {
        const response = await apiClient.get<{ success: boolean; data: SimilarityProblem[] }>('/problems');
        return response.data.data;
    },

    getProblemById: async (id: number) => {
        const response = await apiClient.get<{ success: boolean; data: SimilarityProblem }>(`/problems/${id}`);
        return response.data.data;
    },

    createProblem: async (problem: Omit<SimilarityProblem, 'id' | 'created_at'>) => {
        const response = await apiClient.post<{ success: boolean; data: any }>('/problems', problem);
        return response.data.data;
    },

    analyzeSimilarity: async (shape_a_id: number, shape_b_id: number) => {
        const response = await apiClient.post<{ success: boolean; data: SimilarityAnalysis }>('/problems/analyze', {
            shape_a_id,
            shape_b_id,
        });
        return response.data.data;
    },

    // Health check
    healthCheck: async () => {
        const response = await apiClient.get('/health');
        return response.data;
    },
};
