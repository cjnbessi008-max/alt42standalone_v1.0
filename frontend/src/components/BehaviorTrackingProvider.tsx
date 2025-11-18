/**
 * Behavior Tracking Context Provider
 *
 * Provides behavior tracking functionality throughout the app
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useBehaviorTracking } from '../hooks/useBehaviorTracking';
import { MindWanderingAlert } from './MindWanderingAlert';

interface BehaviorTrackingContextType {
  sessionId: string | null;
  isTracking: boolean;
  checkMindWandering: () => Promise<any>;
}

const BehaviorTrackingContext = createContext<BehaviorTrackingContextType | null>(null);

export const useBehaviorTrackingContext = () => {
  const context = useContext(BehaviorTrackingContext);
  if (!context) {
    throw new Error('useBehaviorTrackingContext must be used within BehaviorTrackingProvider');
  }
  return context;
};

interface BehaviorTrackingProviderProps {
  studentId: string;
  moduleId: string;
  apiUrl?: string;
  enableAlerts?: boolean;
  children: ReactNode;
}

export const BehaviorTrackingProvider: React.FC<BehaviorTrackingProviderProps> = ({
  studentId,
  moduleId,
  apiUrl,
  enableAlerts = true,
  children
}) => {
  const [alertData, setAlertData] = useState<any | null>(null);

  const handleMindWanderingDetected = useCallback((data: any) => {
    console.log('Mind wandering detected:', data);

    if (enableAlerts && data.recommendation) {
      setAlertData({
        type: data.recommendation.type,
        message: data.recommendation.message,
        messageEn: data.recommendation.message_en,
        confidence: data.confidence,
        eventId: data.event_id
      });
    }
  }, [enableAlerts]);

  const {
    sessionId,
    isTracking,
    checkMindWandering
  } = useBehaviorTracking({
    studentId,
    moduleId,
    apiUrl,
    onMindWanderingDetected: handleMindWanderingDetected
  });

  const handleAlertDismiss = useCallback(() => {
    setAlertData(null);
  }, []);

  const handleAlertResponse = useCallback(async (response: string) => {
    if (alertData?.eventId) {
      try {
        await fetch(`${apiUrl || 'http://localhost:8000/api/v1'}/mind-wandering/events/${alertData.eventId}/intervention`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intervention_type: alertData.type,
            student_response: response
          })
        });
      } catch (error) {
        console.error('Failed to update intervention:', error);
      }
    }
  }, [alertData, apiUrl]);

  return (
    <BehaviorTrackingContext.Provider
      value={{
        sessionId,
        isTracking,
        checkMindWandering
      }}
    >
      {children}

      {alertData && (
        <MindWanderingAlert
          type={alertData.type}
          message={alertData.message}
          messageEn={alertData.messageEn}
          confidence={alertData.confidence}
          onDismiss={handleAlertDismiss}
          onResponse={handleAlertResponse}
        />
      )}
    </BehaviorTrackingContext.Provider>
  );
};
