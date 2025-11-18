import axios from 'axios';

export interface Problem {
  id: number;
  title: string;
  description: string;
  shape: 'rectangle' | 'square' | 'circle' | 'triangle';
  params: {
    width?: number;
    height?: number;
    side?: number;
    radius?: number;
    base?: number;
  };
  answer: number;
  unit: string;
}

const API_BASE_URL = '/api';

export const fetchProblems = async (): Promise<Problem[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/problems`);
    return response.data.problems || [];
  } catch (error) {
    console.error('Failed to fetch problems:', error);
    throw error;
  }
};

export const fetchProblem = async (id: number): Promise<Problem> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/problems/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch problem ${id}:`, error);
    throw error;
  }
};

export const submitAnswer = async (
  problemId: number,
  studentId: string,
  answer: number
): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/submit`, {
      problemId,
      studentId,
      answer,
    });
  } catch (error) {
    console.error('Failed to submit answer:', error);
    throw error;
  }
};
