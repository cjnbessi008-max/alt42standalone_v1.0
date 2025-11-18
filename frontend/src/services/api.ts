import axios from 'axios';
import { Proposition, CreatePropositionRequest, Counterexample, CreateCounterexampleRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Propositions API
export const propositionsApi = {
  getAll: async (): Promise<Proposition[]> => {
    const response = await api.get('/propositions');
    return response.data;
  },

  getById: async (id: string): Promise<Proposition> => {
    const response = await api.get(`/propositions/${id}`);
    return response.data;
  },

  create: async (data: CreatePropositionRequest): Promise<Proposition> => {
    const response = await api.post('/propositions', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreatePropositionRequest>): Promise<Proposition> => {
    const response = await api.put(`/propositions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/propositions/${id}`);
  },

  search: async (query: string): Promise<Proposition[]> => {
    const response = await api.get('/propositions/search', { params: { q: query } });
    return response.data;
  },
};

// Counterexamples API
export const counterexamplesApi = {
  getByProposition: async (propositionId: string): Promise<Counterexample[]> => {
    const response = await api.get(`/propositions/${propositionId}/counterexamples`);
    return response.data;
  },

  create: async (propositionId: string, data: CreateCounterexampleRequest): Promise<Counterexample> => {
    const response = await api.post(`/propositions/${propositionId}/counterexamples`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCounterexampleRequest>): Promise<Counterexample> => {
    const response = await api.put(`/counterexamples/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/counterexamples/${id}`);
  },
};

export default api;
