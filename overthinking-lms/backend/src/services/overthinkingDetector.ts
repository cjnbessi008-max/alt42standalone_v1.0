import { OverthinkingScore, OverthinkingAnalysis } from '../types';

/**
 * Calculate overthinking score based on multiple behavioral indicators
 */
export function calculateOverthinkingScore(analysis: OverthinkingAnalysis): OverthinkingScore {
  const {
    timeSpent,
    avgTime,
    answerModifications,
    inactivityDuration,
    repetitiveClicks,
    consecutiveErrors,
  } = analysis;

  let score = 0;
  const triggers: string[] = [];

  // Time-based detection (max 40 points)
  if (avgTime > 0) {
    const timeRatio = timeSpent / avgTime;
    if (timeRatio > 2.5) {
      const timeScore = Math.min(40, (timeRatio - 2.5) * 10);
      score += timeScore;
      triggers.push(`time_exceeded_${timeRatio.toFixed(1)}x`);
    }
  }

  // Inactivity detection (max 25 points)
  if (inactivityDuration > 300) {
    // 5 minutes in seconds
    const inactivityScore = Math.min(25, (inactivityDuration - 300) / 12);
    score += inactivityScore;
    triggers.push(`inactive_${Math.floor(inactivityDuration / 60)}min`);
  }

  // Answer modifications (max 20 points)
  if (answerModifications >= 3) {
    const modScore = Math.min(20, answerModifications * 5);
    score += modScore;
    triggers.push(`answer_modifications_${answerModifications}`);
  }

  // Repetitive clicks (max 10 points)
  if (repetitiveClicks >= 5) {
    const clickScore = Math.min(10, repetitiveClicks * 2);
    score += clickScore;
    triggers.push(`repetitive_clicks_${repetitiveClicks}`);
  }

  // Consecutive errors (max 5 points)
  if (consecutiveErrors >= 3) {
    score += 5;
    triggers.push(`consecutive_errors_${consecutiveErrors}`);
  }

  // Cap at 100
  score = Math.min(100, Math.round(score));

  // Determine confidence and recommendation
  let confidence: 'low' | 'medium' | 'high';
  let recommendation: 'observe' | 'hint' | 'alert_teacher';

  if (score >= 70) {
    confidence = 'high';
    recommendation = 'alert_teacher';
  } else if (score >= 40) {
    confidence = 'medium';
    recommendation = 'hint';
  } else {
    confidence = 'low';
    recommendation = 'observe';
  }

  return {
    total: score,
    confidence,
    triggers,
    recommendation,
  };
}

/**
 * Analyze repetitive click patterns in recent behavior events
 */
export function analyzeRepetitiveClicks(
  events: Array<{ eventType: string; eventData: any; timestamp: Date }>
): number {
  const clickEvents = events.filter((e) => e.eventType === 'click');

  if (clickEvents.length < 5) return 0;

  let repetitiveCount = 0;
  const windowMs = 10000; // 10 seconds
  const sameAreaThreshold = 3; // clicks in same area

  for (let i = 0; i < clickEvents.length - sameAreaThreshold; i++) {
    const baseEvent = clickEvents[i];
    const baseTime = new Date(baseEvent.timestamp).getTime();
    const baseTarget = baseEvent.eventData?.target;

    if (!baseTarget) continue;

    let sameAreaCount = 1;

    for (let j = i + 1; j < clickEvents.length; j++) {
      const compareEvent = clickEvents[j];
      const compareTime = new Date(compareEvent.timestamp).getTime();
      const compareTarget = compareEvent.eventData?.target;

      if (compareTime - baseTime > windowMs) break;

      if (baseTarget === compareTarget) {
        sameAreaCount++;
      }
    }

    if (sameAreaCount >= sameAreaThreshold) {
      repetitiveCount += sameAreaCount;
    }
  }

  return repetitiveCount;
}

/**
 * Calculate inactivity duration from last meaningful event
 */
export function calculateInactivity(
  lastActivityAt: Date,
  currentTime: Date = new Date()
): number {
  return Math.floor((currentTime.getTime() - lastActivityAt.getTime()) / 1000);
}

/**
 * Get consecutive error count for student on similar problems
 */
export async function getConsecutiveErrors(
  studentId: string,
  problemType: string,
  prisma: any
): Promise<number> {
  const recentAttempts = await prisma.studentAttempt.findMany({
    where: {
      studentId,
      problem: {
        problemType,
      },
      isCorrect: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  let consecutiveCount = 0;
  for (const attempt of recentAttempts) {
    if (attempt.isCorrect === false) {
      consecutiveCount++;
    } else {
      break;
    }
  }

  return consecutiveCount;
}
