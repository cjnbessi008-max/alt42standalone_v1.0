/**
 * Metacognition Service
 * Core logic for generating metacognition state and insights
 */

import type {
  MetacognitionState,
  MetacognitionMirrorRequest,
  FocusLevel,
  LearningInsight,
  FocusAnalysis,
  ReflectionPrompt,
  ReflectionPromptType,
  InsightType
} from '../../../shared/types/index.js';
import { ActivityService } from './activityService.js';
import { BehaviorService } from './behaviorService.js';
import { logger } from '../utils/logger.js';

export class MetacognitionService {
  private activityService: ActivityService;
  private behaviorService: BehaviorService;

  constructor() {
    this.activityService = new ActivityService();
    this.behaviorService = new BehaviorService();
  }

  /**
   * Get comprehensive metacognition state for a student
   */
  async getMetacognitionState(request: MetacognitionMirrorRequest): Promise<MetacognitionState> {
    const { studentId, moduleId, timeRange } = request;

    try {
      // Get current activity
      const currentActivity = await this.activityService.getCurrentActivity(studentId);

      // Get recent activities
      const recentActivities = await this.activityService.getRecentActivitySummaries(studentId, 5);

      // Analyze behavior to determine focus level
      const behaviorAnalysis = await this.behaviorService.analyzeBehavior(studentId);
      const focusLevel = this.determineFocusLevel(behaviorAnalysis);

      // Calculate time distribution
      const timeDistribution = await this.calculateTimeDistribution(studentId, timeRange);

      // Identify learning pattern
      const learningPattern = await this.identifyLearningPattern(studentId);

      // Generate reflection prompts
      const reflectionPrompts = this.generateReflectionPrompts(
        currentActivity,
        focusLevel,
        behaviorAnalysis
      );

      const metacognitionState: MetacognitionState = {
        studentId,
        currentActivity,
        recentActivities,
        focusLevel,
        timeDistribution,
        learningPattern,
        reflectionPrompts,
        timestamp: new Date()
      };

      logger.info(`Generated metacognition state for student ${studentId}`);
      return metacognitionState;

    } catch (error) {
      logger.error(`Error generating metacognition state for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Get learning insights for a student
   */
  async getLearningInsights(studentId: string): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    try {
      // Analyze activity patterns
      const activityHistory = await this.activityService.getActivityHistory(studentId, 50, 0);

      // Check for prolonged focus
      const currentActivity = await this.activityService.getCurrentActivity(studentId);
      if (currentActivity && currentActivity.elapsedTime > 3600) {
        insights.push({
          insightType: InsightType.ATTENTION_WARNING,
          title: '장시간 학습 감지',
          description: '1시간 이상 같은 활동을 하고 있습니다. 잠시 휴식을 취하는 것이 좋습니다.',
          severity: 'warning',
          actionable: true,
          suggestedActions: ['5-10분 휴식하기', '스트레칭하기', '물 마시기']
        });
      }

      // Check for learning patterns
      const learningPattern = await this.identifyLearningPattern(studentId);
      if (learningPattern.strengths.length > 0) {
        insights.push({
          insightType: InsightType.STRENGTH_IDENTIFIED,
          title: '학습 강점 발견',
          description: `당신의 강점: ${learningPattern.strengths.join(', ')}`,
          severity: 'info',
          actionable: false,
          suggestedActions: []
        });
      }

      // Check for improvement opportunities
      if (learningPattern.areasForImprovement.length > 0) {
        insights.push({
          insightType: InsightType.IMPROVEMENT_OPPORTUNITY,
          title: '개선 기회',
          description: `향상시킬 수 있는 영역: ${learningPattern.areasForImprovement.join(', ')}`,
          severity: 'info',
          actionable: true,
          suggestedActions: ['연습 문제 더 풀기', '관련 비디오 시청하기', '선생님께 질문하기']
        });
      }

      return insights;

    } catch (error) {
      logger.error(`Error getting learning insights for student ${studentId}:`, error);
      return insights;
    }
  }

  /**
   * Get focus analysis for a student
   */
  async getFocusAnalysis(studentId: string): Promise<FocusAnalysis> {
    try {
      const behaviorAnalysis = await this.behaviorService.analyzeBehavior(studentId);
      const currentFocus = this.determineFocusLevel(behaviorAnalysis);

      // Mock focus history for now (in production, this would come from time-series data)
      const focusHistory = this.generateMockFocusHistory();

      const focusAnalysis: FocusAnalysis = {
        currentFocus,
        focusHistory,
        averageFocusDuration: behaviorAnalysis.averageInteractionInterval || 30,
        distractionEvents: behaviorAnalysis.tabSwitchCount || 0,
        recommendations: this.generateFocusRecommendations(currentFocus)
      };

      return focusAnalysis;

    } catch (error) {
      logger.error(`Error getting focus analysis for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Determine focus level based on behavior analysis
   */
  private determineFocusLevel(behaviorAnalysis: any): FocusLevel {
    const { interactionFrequency, tabSwitchCount, pauseCount } = behaviorAnalysis;

    // High interaction frequency + low tab switches = high focus
    if (interactionFrequency > 10 && tabSwitchCount < 2) {
      return FocusLevel.HIGHLY_FOCUSED;
    }

    // Moderate interaction + some tab switches
    if (interactionFrequency > 5 && tabSwitchCount < 5) {
      return FocusLevel.FOCUSED;
    }

    // Lower interaction or moderate tab switches
    if (interactionFrequency > 2 || tabSwitchCount < 8) {
      return FocusLevel.MODERATELY_FOCUSED;
    }

    // High tab switches or low interaction
    if (tabSwitchCount > 8 || interactionFrequency < 2) {
      return FocusLevel.DISTRACTED;
    }

    return FocusLevel.HIGHLY_DISTRACTED;
  }

  /**
   * Calculate time distribution across activity types
   */
  private async calculateTimeDistribution(studentId: string, timeRange?: any): Promise<any> {
    // Mock implementation - in production, this would query the database
    return {
      reading: 25,
      problemSolving: 40,
      videoWatching: 15,
      interactiveExercise: 15,
      assessment: 5,
      reflection: 0
    };
  }

  /**
   * Identify learning patterns for a student
   */
  private async identifyLearningPattern(studentId: string): Promise<any> {
    // Mock implementation - in production, this would use ML/analytics
    return {
      preferredLearningTime: 'afternoon',
      averageSessionDuration: 1800, // 30 minutes
      attentionSpan: 900, // 15 minutes
      breakFrequency: 2,
      strengths: ['문제 해결', '시각적 학습'],
      areasForImprovement: ['읽기 이해력', '자기 성찰']
    };
  }

  /**
   * Generate contextual reflection prompts
   */
  private generateReflectionPrompts(
    currentActivity: any,
    focusLevel: FocusLevel,
    behaviorAnalysis: any
  ): ReflectionPrompt[] {
    const prompts: ReflectionPrompt[] = [];

    // Always include awareness prompt
    prompts.push({
      id: 'awareness-1',
      prompt: '지금 뭘 하고 있지?',
      promptType: ReflectionPromptType.AWARENESS,
      priority: 'high',
      suggestedAction: '현재 활동을 명확히 인식하세요'
    });

    // Add understanding check if on problem-solving activity
    if (currentActivity?.activityType === 'problem_solving') {
      prompts.push({
        id: 'understanding-1',
        prompt: '이 문제를 이해하고 있나요?',
        promptType: ReflectionPromptType.UNDERSTANDING,
        priority: 'high',
        suggestedAction: '문제를 다시 읽어보거나 도움을 요청하세요'
      });
    }

    // Add focus check if distracted
    if (focusLevel === FocusLevel.DISTRACTED || focusLevel === FocusLevel.HIGHLY_DISTRACTED) {
      prompts.push({
        id: 'engagement-1',
        prompt: '집중하고 있나요?',
        promptType: ReflectionPromptType.ENGAGEMENT,
        priority: 'high',
        suggestedAction: '잠시 쉬거나 다른 학습 방법을 시도해보세요'
      });
    }

    // Add progress check if activity running long
    if (currentActivity && currentActivity.elapsedTime > 1800) {
      prompts.push({
        id: 'progress-1',
        prompt: '잘 진행되고 있나요?',
        promptType: ReflectionPromptType.PROGRESS,
        priority: 'medium',
        suggestedAction: '진행 상황을 점검하고 필요하면 전략을 조정하세요'
      });
    }

    return prompts;
  }

  /**
   * Generate focus recommendations based on focus level
   */
  private generateFocusRecommendations(focusLevel: FocusLevel): string[] {
    switch (focusLevel) {
      case FocusLevel.HIGHLY_FOCUSED:
        return ['계속 집중력을 유지하세요!', '정기적으로 휴식을 취하는 것을 잊지 마세요'];

      case FocusLevel.FOCUSED:
        return ['잘하고 있어요!', '계속 이 페이스를 유지하세요'];

      case FocusLevel.MODERATELY_FOCUSED:
        return ['방해 요소를 제거해보세요', '알림을 꺼보는 건 어떨까요?'];

      case FocusLevel.DISTRACTED:
        return ['5분 휴식을 취해보세요', '학습 환경을 정리해보세요', '다른 탭을 닫아보세요'];

      case FocusLevel.HIGHLY_DISTRACTED:
        return [
          '장시간 휴식이 필요할 수 있습니다',
          '학습 시간대를 변경해보세요',
          '더 짧은 학습 세션을 시도해보세요'
        ];

      default:
        return [];
    }
  }

  /**
   * Generate mock focus history (for demo purposes)
   */
  private generateMockFocusHistory(): any[] {
    const now = new Date();
    const history = [];

    for (let i = 10; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals
      history.push({
        timestamp,
        focusLevel: this.getRandomFocusLevel(),
        activityType: 'problem_solving'
      });
    }

    return history;
  }

  private getRandomFocusLevel(): FocusLevel {
    const levels = [
      FocusLevel.HIGHLY_FOCUSED,
      FocusLevel.FOCUSED,
      FocusLevel.MODERATELY_FOCUSED,
      FocusLevel.DISTRACTED
    ];
    return levels[Math.floor(Math.random() * levels.length)];
  }
}
