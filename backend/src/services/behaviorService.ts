/**
 * Behavior Service
 * Tracks and analyzes student learning behaviors
 */

import type {
  BehaviorEvent,
  BehaviorEventType,
  BehaviorTrackingRequest
} from '../../../shared/types/index.js';
import { logger } from '../utils/logger.js';

// In-memory storage for demo (replace with database in production)
const behaviorEvents: Map<string, BehaviorEvent[]> = new Map();

export class BehaviorService {
  /**
   * Track behavior events
   */
  async trackBehaviorEvents(request: BehaviorTrackingRequest): Promise<any> {
    const { studentId, activityId, events } = request;

    if (!events || events.length === 0) {
      return {
        eventsRecorded: 0,
        message: 'No events to record'
      };
    }

    // Store events
    const key = `${studentId}:${activityId}`;
    if (!behaviorEvents.has(key)) {
      behaviorEvents.set(key, []);
    }

    const storedEvents = behaviorEvents.get(key)!;
    storedEvents.push(...events);

    logger.debug(`Recorded ${events.length} behavior events for student ${studentId}`);

    // Analyze behaviors in real-time
    const analysis = await this.analyzeBehavior(studentId, activityId);

    return {
      eventsRecorded: events.length,
      analysis
    };
  }

  /**
   * Analyze behavior patterns
   */
  async analyzeBehavior(
    studentId: string,
    activityId?: string
  ): Promise<any> {
    let relevantEvents: BehaviorEvent[] = [];

    if (activityId) {
      // Get events for specific activity
      const key = `${studentId}:${activityId}`;
      relevantEvents = behaviorEvents.get(key) || [];
    } else {
      // Get all events for student
      for (const [key, events] of behaviorEvents.entries()) {
        if (key.startsWith(studentId)) {
          relevantEvents.push(...events);
        }
      }
    }

    // Sort by timestamp
    relevantEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate metrics
    const clicks = relevantEvents.filter(e => e.eventType === 'click').length;
    const scrolls = relevantEvents.filter(e => e.eventType === 'scroll').length;
    const inputs = relevantEvents.filter(e => e.eventType === 'input').length;
    const tabSwitches = relevantEvents.filter(e => e.eventType === 'tab_switch').length;
    const pauses = relevantEvents.filter(e => e.eventType === 'pause').length;
    const helpRequests = relevantEvents.filter(e => e.eventType === 'help_request').length;

    // Calculate interaction frequency (events per minute)
    const timeSpan = this.calculateTimeSpan(relevantEvents);
    const interactionFrequency = timeSpan > 0
      ? (clicks + scrolls + inputs) / (timeSpan / 60)
      : 0;

    // Calculate average interaction interval
    const intervals = this.calculateInteractionIntervals(relevantEvents);
    const averageInteractionInterval = intervals.length > 0
      ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      : 0;

    return {
      totalEvents: relevantEvents.length,
      eventCounts: {
        clicks,
        scrolls,
        inputs,
        tabSwitches,
        pauses,
        helpRequests
      },
      interactionFrequency,
      averageInteractionInterval,
      tabSwitchCount: tabSwitches,
      pauseCount: pauses,
      engagementScore: this.calculateEngagementScore({
        clicks,
        scrolls,
        inputs,
        tabSwitches,
        pauses,
        helpRequests
      })
    };
  }

  /**
   * Calculate time span of events (in seconds)
   */
  private calculateTimeSpan(events: BehaviorEvent[]): number {
    if (events.length < 2) {
      return 0;
    }

    const first = events[0].timestamp;
    const last = events[events.length - 1].timestamp;

    return (last.getTime() - first.getTime()) / 1000;
  }

  /**
   * Calculate intervals between interactions (in seconds)
   */
  private calculateInteractionIntervals(events: BehaviorEvent[]): number[] {
    const intervals: number[] = [];

    for (let i = 1; i < events.length; i++) {
      const interval = (events[i].timestamp.getTime() - events[i - 1].timestamp.getTime()) / 1000;
      intervals.push(interval);
    }

    return intervals;
  }

  /**
   * Calculate engagement score (0-100)
   */
  private calculateEngagementScore(eventCounts: {
    clicks: number;
    scrolls: number;
    inputs: number;
    tabSwitches: number;
    pauses: number;
    helpRequests: number;
  }): number {
    const { clicks, scrolls, inputs, tabSwitches, pauses, helpRequests } = eventCounts;

    // Positive engagement indicators
    let score = 0;
    score += Math.min(clicks * 2, 30); // Max 30 points for clicks
    score += Math.min(inputs * 5, 40); // Max 40 points for inputs (most valuable)
    score += Math.min(scrolls * 1, 15); // Max 15 points for scrolls

    // Negative engagement indicators
    score -= Math.min(tabSwitches * 5, 20); // Deduct for tab switches
    score -= Math.min(pauses * 3, 15); // Deduct for pauses

    // Help requests are neutral/slightly positive
    score += Math.min(helpRequests * 2, 10);

    // Normalize to 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get behavior summary for a time period
   */
  async getBehaviorSummary(
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const allEvents: BehaviorEvent[] = [];

    // Collect all events for student within time range
    for (const [key, events] of behaviorEvents.entries()) {
      if (key.startsWith(studentId)) {
        const filteredEvents = events.filter(
          e => e.timestamp >= startDate && e.timestamp <= endDate
        );
        allEvents.push(...filteredEvents);
      }
    }

    return {
      totalEvents: allEvents.length,
      analysis: await this.analyzeBehavior(studentId),
      timeRange: {
        start: startDate,
        end: endDate
      }
    };
  }
}
