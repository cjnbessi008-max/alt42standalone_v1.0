import { useCallback } from 'react'
import { eventService, sessionService } from '../services/api'

export function useEventTracking() {
  const startSession = useCallback(async (courseId: string, problemId?: string) => {
    try {
      const sessionId = await sessionService.createSession(courseId, problemId)
      console.log('Session started:', sessionId)
      return sessionId
    } catch (error) {
      console.error('Failed to start session:', error)
      return null
    }
  }, [])

  const endSession = useCallback(async (sessionId: string) => {
    try {
      await sessionService.endSession(sessionId)
      console.log('Session ended:', sessionId)
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }, [])

  const trackEvent = useCallback(async (
    sessionId: string,
    eventType: string,
    data: any = {}
  ) => {
    try {
      await eventService.trackEvent(sessionId, eventType, data)
      console.log('Event tracked:', eventType)
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }, [])

  return {
    startSession,
    endSession,
    trackEvent,
  }
}
