/**
 * Activity Service
 * Manages learning activity tracking and retrieval
 */

import type {
  LearningActivity,
  ActivityType,
  CurrentActivity,
  ActivitySummary
} from '../../../shared/types/index.js';
import { logger } from '../utils/logger.js';

// In-memory storage for demo (replace with database in production)
const activities: Map<string, LearningActivity[]> = new Map();
const currentActivities: Map<string, string> = new Map(); // studentId -> activityId

export class ActivityService {
  /**
   * Start a new learning activity
   */
  async startActivity(params: {
    studentId: string;
    moduleId: string;
    activityType: ActivityType;
    activityName: string;
    metadata?: Record<string, any>;
  }): Promise<LearningActivity> {
    const { studentId, moduleId, activityType, activityName, metadata = {} } = params;

    // Complete any existing current activity first
    const existingActivityId = currentActivities.get(studentId);
    if (existingActivityId) {
      await this.completeActivity({
        activityId: existingActivityId,
        studentId,
        outcome: 'abandoned'
      });
    }

    const activity: LearningActivity = {
      id: this.generateId(),
      studentId,
      moduleId,
      activityType,
      activityName,
      startedAt: new Date(),
      metadata
    };

    // Store activity
    if (!activities.has(studentId)) {
      activities.set(studentId, []);
    }
    activities.get(studentId)!.push(activity);

    // Set as current activity
    currentActivities.set(studentId, activity.id);

    logger.info(`Activity started: ${activity.id} for student ${studentId}`);
    return activity;
  }

  /**
   * Complete an activity
   */
  async completeActivity(params: {
    activityId: string;
    studentId: string;
    outcome?: 'completed' | 'abandoned' | 'in_progress';
    metadata?: Record<string, any>;
  }): Promise<LearningActivity> {
    const { activityId, studentId, outcome = 'completed', metadata = {} } = params;

    const studentActivities = activities.get(studentId);
    const activity = studentActivities?.find(a => a.id === activityId);

    if (!activity) {
      throw new Error(`Activity ${activityId} not found for student ${studentId}`);
    }

    // Update activity
    activity.completedAt = new Date();
    activity.duration = Math.floor(
      (activity.completedAt.getTime() - activity.startedAt.getTime()) / 1000
    );
    activity.metadata = { ...activity.metadata, ...metadata, outcome };

    // Remove from current activities if it's the current one
    if (currentActivities.get(studentId) === activityId) {
      currentActivities.delete(studentId);
    }

    logger.info(`Activity completed: ${activity.id} for student ${studentId}`);
    return activity;
  }

  /**
   * Get current active activity for a student
   */
  async getCurrentActivity(studentId: string): Promise<CurrentActivity | null> {
    const activityId = currentActivities.get(studentId);
    if (!activityId) {
      return null;
    }

    const studentActivities = activities.get(studentId);
    const activity = studentActivities?.find(a => a.id === activityId);

    if (!activity) {
      return null;
    }

    const now = new Date();
    const elapsedTime = Math.floor((now.getTime() - activity.startedAt.getTime()) / 1000);

    const currentActivity: CurrentActivity = {
      activityId: activity.id,
      activityType: activity.activityType,
      activityName: activity.activityName,
      moduleName: activity.metadata.moduleName || 'Unknown Module',
      startedAt: activity.startedAt,
      elapsedTime,
      progress: activity.metadata.progress || 0,
      interactions: activity.metadata.interactionCount || 0,
      lastInteractionAt: activity.metadata.lastInteractionAt || activity.startedAt
    };

    return currentActivity;
  }

  /**
   * Get activity history for a student
   */
  async getActivityHistory(
    studentId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<LearningActivity[]> {
    const studentActivities = activities.get(studentId) || [];

    // Sort by start time descending
    const sorted = [...studentActivities].sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
    );

    return sorted.slice(offset, offset + limit);
  }

  /**
   * Get recent activity summaries
   */
  async getRecentActivitySummaries(
    studentId: string,
    count: number = 5
  ): Promise<ActivitySummary[]> {
    const studentActivities = activities.get(studentId) || [];

    // Get completed activities only
    const completed = studentActivities
      .filter(a => a.completedAt)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
      .slice(0, count);

    return completed.map(a => ({
      activityType: a.activityType,
      activityName: a.activityName,
      duration: a.duration || 0,
      completedAt: a.completedAt!,
      outcome: a.metadata.outcome || 'completed'
    }));
  }

  /**
   * Update activity metadata (e.g., progress, interactions)
   */
  async updateActivityMetadata(
    activityId: string,
    studentId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const studentActivities = activities.get(studentId);
    const activity = studentActivities?.find(a => a.id === activityId);

    if (activity) {
      activity.metadata = { ...activity.metadata, ...metadata };
      logger.debug(`Updated metadata for activity ${activityId}`);
    }
  }

  /**
   * Generate a unique ID (in production, use UUID)
   */
  private generateId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
