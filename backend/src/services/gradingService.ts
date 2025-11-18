/**
 * Grading Service
 * Business logic for grading student answers
 */

import { GradingResult, Problem, GradingRule } from '../types/grading';

export class GradingService {
  /**
   * Grade a student's answer
   */
  async gradeAnswer(
    studentId: string,
    moduleId: string,
    problemId: string,
    answer: string,
    timeSpent?: number
  ): Promise<GradingResult> {
    // In a real implementation, this would:
    // 1. Fetch the problem from database
    // 2. Fetch grading rules
    // 3. Apply grading logic
    // 4. Generate feedback
    // 5. Save result to database

    const problem = await this.getProblem(problemId);
    const rules = await this.getGradingRules(problemId);

    const { isCorrect, score, feedback } = await this.applyGradingRules(
      answer,
      problem,
      rules
    );

    const result: GradingResult = {
      id: this.generateId(),
      studentId,
      moduleId,
      problemId,
      answer,
      isCorrect,
      score,
      maxScore: problem.maxScore,
      feedback,
      timestamp: new Date(),
      timeSpent,
    };

    // Save to database (mock)
    await this.saveGradingResult(result);

    return result;
  }

  /**
   * Apply grading rules to determine correctness and score
   */
  private async applyGradingRules(
    answer: string,
    problem: Problem,
    rules: GradingRule[]
  ): Promise<{ isCorrect: boolean; score: number; feedback?: string }> {
    // Default simple exact match
    if (rules.length === 0) {
      const isCorrect = this.normalizeAnswer(answer) ===
                       this.normalizeAnswer(problem.correctAnswer);
      return {
        isCorrect,
        score: isCorrect ? problem.maxScore : 0,
        feedback: isCorrect
          ? '정확합니다! 잘 이해하셨네요.'
          : '아쉽네요. 다시 한 번 생각해보세요.',
      };
    }

    // Apply custom grading rules
    for (const rule of rules) {
      switch (rule.ruleType) {
        case 'exact_match':
          return this.exactMatchRule(answer, problem, rule);
        case 'partial_match':
          return this.partialMatchRule(answer, problem, rule);
        case 'custom_function':
          return this.customFunctionRule(answer, problem, rule);
        default:
          throw new Error(`Unknown rule type: ${rule.ruleType}`);
      }
    }

    return { isCorrect: false, score: 0 };
  }

  private normalizeAnswer(answer: string): string {
    return answer.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private exactMatchRule(
    answer: string,
    problem: Problem,
    rule: GradingRule
  ): { isCorrect: boolean; score: number; feedback?: string } {
    const isCorrect = this.normalizeAnswer(answer) ===
                     this.normalizeAnswer(problem.correctAnswer);
    return {
      isCorrect,
      score: isCorrect ? problem.maxScore : 0,
      feedback: isCorrect ? rule.feedbackOnSuccess : rule.feedbackOnFailure,
    };
  }

  private partialMatchRule(
    answer: string,
    problem: Problem,
    rule: GradingRule
  ): { isCorrect: boolean; score: number; feedback?: string } {
    const normalized = this.normalizeAnswer(answer);
    const correctNormalized = this.normalizeAnswer(problem.correctAnswer);

    // Calculate similarity score
    const similarity = this.calculateSimilarity(normalized, correctNormalized);
    const threshold = rule.ruleConfig?.threshold || 0.8;

    const isCorrect = similarity >= threshold;
    const score = Math.floor(problem.maxScore * similarity);

    return {
      isCorrect,
      score,
      feedback: isCorrect ? rule.feedbackOnSuccess : rule.feedbackOnFailure,
    };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private customFunctionRule(
    answer: string,
    problem: Problem,
    rule: GradingRule
  ): { isCorrect: boolean; score: number; feedback?: string } {
    // Execute custom grading function (would be loaded from rule.ruleConfig)
    // For security, this should be sandboxed
    try {
      const gradingFunction = new Function(
        'answer',
        'correctAnswer',
        'maxScore',
        rule.ruleConfig.functionBody
      );

      const result = gradingFunction(answer, problem.correctAnswer, problem.maxScore);

      return {
        isCorrect: result.isCorrect,
        score: result.score,
        feedback: result.isCorrect ? rule.feedbackOnSuccess : rule.feedbackOnFailure,
      };
    } catch (error) {
      console.error('Custom grading function error:', error);
      return {
        isCorrect: false,
        score: 0,
        feedback: '채점 중 오류가 발생했습니다.',
      };
    }
  }

  // Mock database methods
  private async getProblem(problemId: string): Promise<Problem> {
    // In real implementation, fetch from database
    return {
      id: problemId,
      moduleId: 'module-1',
      title: 'Sample Problem',
      description: 'What is 2 + 2?',
      correctAnswer: '4',
      maxScore: 10,
      difficulty: 'easy',
      orderIndex: 0,
    };
  }

  private async getGradingRules(problemId: string): Promise<GradingRule[]> {
    // In real implementation, fetch from database
    return [];
  }

  private async saveGradingResult(result: GradingResult): Promise<void> {
    // In real implementation, save to database
    console.log('Saving grading result:', result);
  }

  private generateId(): string {
    return `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new GradingService();
