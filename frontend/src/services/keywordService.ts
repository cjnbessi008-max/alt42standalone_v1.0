import axios from 'axios';
import type { ExtractionRequest, ExtractionResponse, Keyword, VisualizationData } from '../types/keyword';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class KeywordService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Extract keywords from LMS content
   */
  async extractKeywords(request: ExtractionRequest): Promise<ExtractionResponse> {
    const response = await this.api.post<ExtractionResponse>('/keywords/extract', request);
    return response.data;
  }

  /**
   * Get keywords for a specific module
   */
  async getModuleKeywords(moduleId: string): Promise<Keyword[]> {
    const response = await this.api.get<Keyword[]>(`/modules/${moduleId}/keywords`);
    return response.data;
  }

  /**
   * Get visualization data for keywords
   */
  async getVisualizationData(moduleId: string): Promise<VisualizationData> {
    const response = await this.api.get<VisualizationData>(
      `/modules/${moduleId}/visualization/bubbles`
    );
    return response.data;
  }

  /**
   * Generate new visualization layout
   */
  async generateVisualization(moduleId: string): Promise<VisualizationData> {
    const response = await this.api.post<VisualizationData>(
      `/modules/${moduleId}/visualization/bubbles/generate`
    );
    return response.data;
  }

  /**
   * Export visualization data
   */
  async exportVisualization(moduleId: string, format: 'svg' | 'png' | 'json'): Promise<Blob> {
    const response = await this.api.get(`/modules/${moduleId}/visualization/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }
}

export const keywordService = new KeywordService();
