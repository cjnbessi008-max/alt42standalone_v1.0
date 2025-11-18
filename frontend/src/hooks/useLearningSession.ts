import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useLearningSession(sessionId: string) {
  const [session, setSession] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const token = localStorage.getItem('token') || 'demo-token';

        // Fetch session
        const sessionRes = await axios.get(
          `${API_URL}/api/sessions/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSession(sessionRes.data);

        // Fetch steps
        const stepsRes = await axios.get(
          `${API_URL}/api/steps/session/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSteps(stepsRes.data);

        // Fetch current step
        try {
          const currentStepRes = await axios.get(
            `${API_URL}/api/steps/session/${sessionId}/current`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setCurrentStep(currentStepRes.data);
        } catch (err) {
          // No current step yet
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching session data:', error);
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  return { session, currentStep, steps, loading };
}
