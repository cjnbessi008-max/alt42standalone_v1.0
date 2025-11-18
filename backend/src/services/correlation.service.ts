import { MoodleApiService } from './moodleApi.service';
import {
  CorrelationData,
  StudentPerformance,
  QuestionStats,
  MoodleQuestionAttempt
} from '../types/moodle.types';

export class CorrelationService {
  constructor(private moodleApi: MoodleApiService) {}

  /**
   * Calculate Pearson correlation coefficient between two arrays
   */
  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      return 0;
    }

    const n = x.length;

    // Calculate means
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;

    // Calculate correlation
    let numerator = 0;
    let sumSquareX = 0;
    let sumSquareY = 0;

    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;

      numerator += diffX * diffY;
      sumSquareX += diffX * diffX;
      sumSquareY += diffY * diffY;
    }

    const denominator = Math.sqrt(sumSquareX * sumSquareY);

    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }

  /**
   * Get correlation data for a quiz
   */
  async getQuizCorrelationData(quizId: number): Promise<CorrelationData> {
    try {
      // Get quiz details
      const quiz = await this.moodleApi.getQuizById(quizId);
      if (!quiz) {
        throw new Error(`Quiz ${quizId} not found`);
      }

      // Get all attempts for this quiz
      const attempts = await this.moodleApi.getQuizAttempts(quizId);

      if (attempts.length === 0) {
        return {
          quizId,
          quizName: quiz.name,
          matrix: [],
          labels: [],
          questions: [],
          timestamp: Date.now()
        };
      }

      // Collect all student performances per question
      const performanceMap = new Map<number, Map<number, StudentPerformance>>();
      const questionIds = new Set<number>();
      const questionSlotMap = new Map<number, number>();

      // Process each attempt
      for (const attempt of attempts) {
        if (attempt.state !== 'finished') continue;

        try {
          const attemptData = await this.moodleApi.getAttemptData(attempt.id);

          for (const question of attemptData.questions) {
            questionIds.add(question.questionid);
            questionSlotMap.set(question.questionid, question.slot);

            if (!performanceMap.has(question.questionid)) {
              performanceMap.set(question.questionid, new Map());
            }

            const userPerformance: StudentPerformance = {
              userId: attempt.userid,
              questionId: question.questionid,
              mark: question.mark,
              maxMark: question.maxmark,
              fraction: question.fraction
            };

            performanceMap.get(question.questionid)!.set(attempt.userid, userPerformance);
          }
        } catch (error) {
          console.error(`Error processing attempt ${attempt.id}:`, error);
          continue;
        }
      }

      // Convert to array and sort by slot
      const sortedQuestionIds = Array.from(questionIds).sort((a, b) => {
        const slotA = questionSlotMap.get(a) || 0;
        const slotB = questionSlotMap.get(b) || 0;
        return slotA - slotB;
      });

      // Calculate statistics for each question
      const questionStats: QuestionStats[] = sortedQuestionIds.map(qid => {
        const performances = Array.from(performanceMap.get(qid)!.values());
        const totalAttempts = performances.length;
        const correctAttempts = performances.filter(p => p.fraction >= 1.0).length;
        const averageMark = performances.reduce((sum, p) => sum + p.mark, 0) / totalAttempts;
        const maxMark = performances[0]?.maxMark || 0;

        return {
          id: qid,
          slot: questionSlotMap.get(qid) || 0,
          questiontext: `Question ${questionSlotMap.get(qid)}`,
          totalAttempts,
          correctAttempts,
          averageMark,
          maxMark,
          successRate: correctAttempts / totalAttempts
        };
      });

      // Build correlation matrix
      const n = sortedQuestionIds.length;
      const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === j) {
            matrix[i][j] = 1.0; // Perfect correlation with itself
          } else {
            const q1Id = sortedQuestionIds[i];
            const q2Id = sortedQuestionIds[j];

            // Get common users who attempted both questions
            const users1 = performanceMap.get(q1Id)!;
            const users2 = performanceMap.get(q2Id)!;

            const commonUserIds = Array.from(users1.keys()).filter(uid => users2.has(uid));

            if (commonUserIds.length < 2) {
              matrix[i][j] = 0;
              continue;
            }

            // Extract performance scores for common users
            const scores1 = commonUserIds.map(uid => users1.get(uid)!.fraction);
            const scores2 = commonUserIds.map(uid => users2.get(uid)!.fraction);

            // Calculate correlation
            matrix[i][j] = this.calculatePearsonCorrelation(scores1, scores2);
          }
        }
      }

      return {
        quizId,
        quizName: quiz.name,
        matrix,
        labels: sortedQuestionIds.map(qid => `Q${questionSlotMap.get(qid)}`),
        questions: questionStats,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error(`Error calculating correlation for quiz ${quizId}:`, error);
      throw error;
    }
  }

  /**
   * Get top correlations (strongest positive and negative)
   */
  getTopCorrelations(correlationData: CorrelationData, limit: number = 10): {
    positive: Array<{ q1: string; q2: string; correlation: number }>;
    negative: Array<{ q1: string; q2: string; correlation: number }>;
  } {
    const pairs: Array<{ q1: string; q2: string; correlation: number }> = [];

    const n = correlationData.matrix.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        pairs.push({
          q1: correlationData.labels[i],
          q2: correlationData.labels[j],
          correlation: correlationData.matrix[i][j]
        });
      }
    }

    // Sort by correlation value
    const sorted = pairs.sort((a, b) => b.correlation - a.correlation);

    return {
      positive: sorted.slice(0, limit),
      negative: sorted.slice(-limit).reverse()
    };
  }
}
