import anthropic, { CLAUDE_MODEL } from '../config/claude';
import { ErrorAnalysis, ErrorType, Fraction, FractionProblemData } from '../types';
import logger from '../utils/logger';
import crypto from 'crypto';
import db from '../config/database';

/**
 * AI Service - Claude-powered intelligent error analysis
 */
export class AIService {
  /**
   * Generate cache key for feedback
   */
  private generateCacheKey(
    problemData: FractionProblemData,
    errorType: ErrorType,
    studentAnswer: Fraction
  ): string {
    const data = JSON.stringify({ problemData, errorType, studentAnswer });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if feedback exists in cache
   */
  private async getCachedFeedback(cacheKey: string): Promise<ErrorAnalysis | null> {
    try {
      const result = await db.query(
        `SELECT feedback, usage_count FROM ai_feedback_cache
         WHERE cache_key = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
        [cacheKey]
      );

      if (result.rows.length > 0) {
        // Update usage count and last used timestamp
        await db.query(
          `UPDATE ai_feedback_cache
           SET usage_count = usage_count + 1, last_used_at = NOW()
           WHERE cache_key = $1`,
          [cacheKey]
        );

        logger.info(`Cache hit for feedback: ${cacheKey}`);
        return result.rows[0].feedback as ErrorAnalysis;
      }

      return null;
    } catch (error) {
      logger.error('Error checking cache:', error);
      return null;
    }
  }

  /**
   * Save feedback to cache
   */
  private async cacheFeedback(
    cacheKey: string,
    problemType: string,
    errorType: ErrorType,
    feedback: ErrorAnalysis
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Cache for 30 days

      await db.query(
        `INSERT INTO ai_feedback_cache (cache_key, problem_type, error_type, feedback, usage_count, expires_at)
         VALUES ($1, $2, $3, $4, 1, $5)
         ON CONFLICT (cache_key) DO UPDATE
         SET feedback = $4, usage_count = ai_feedback_cache.usage_count + 1, last_used_at = NOW()`,
        [cacheKey, problemType, errorType, JSON.stringify(feedback), expiresAt]
      );

      logger.info(`Cached feedback: ${cacheKey}`);
    } catch (error) {
      logger.error('Error caching feedback:', error);
    }
  }

  /**
   * Generate error analysis using Claude AI
   */
  public async generateErrorAnalysis(
    problemData: FractionProblemData,
    studentAnswer: Fraction,
    correctAnswer: Fraction,
    errorType: ErrorType
  ): Promise<ErrorAnalysis> {
    // Check cache first
    const cacheKey = this.generateCacheKey(problemData, errorType, studentAnswer);
    const cached = await this.getCachedFeedback(cacheKey);

    if (cached) {
      return cached;
    }

    // If no API key, return basic feedback
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('ANTHROPIC_API_KEY not set, returning basic feedback');
      return this.getBasicFeedback(problemData, studentAnswer, correctAnswer, errorType);
    }

    try {
      const prompt = this.buildPrompt(problemData, studentAnswer, correctAnswer, errorType);

      const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const analysis = this.parseAIResponse(responseText);

      // Cache the result
      await this.cacheFeedback(cacheKey, 'fraction_addition', errorType, analysis);

      return analysis;
    } catch (error) {
      logger.error('Error generating AI feedback:', error);
      return this.getBasicFeedback(problemData, studentAnswer, correctAnswer, errorType);
    }
  }

  /**
   * Build prompt for Claude
   */
  private buildPrompt(
    problemData: FractionProblemData,
    studentAnswer: Fraction,
    correctAnswer: Fraction,
    errorType: ErrorType
  ): string {
    const operation = problemData.operation;
    const f1 = `${problemData.numerator1}/${problemData.denominator1}`;
    const f2 = problemData.numerator2
      ? `${problemData.numerator2}/${problemData.denominator2}`
      : '';
    const studentFraction = `${studentAnswer.numerator}/${studentAnswer.denominator}`;
    const correctFraction = `${correctAnswer.numerator}/${correctAnswer.denominator}`;

    return `You are a helpful math tutor for elementary school students. A student attempted to solve a fraction problem and made an error.

Problem: ${f1} ${this.getOperationSymbol(operation)} ${f2}

Student's Answer: ${studentFraction}
Correct Answer: ${correctFraction}
Error Type: ${errorType || 'unknown'}

Please provide educational feedback in the following JSON format:
{
  "identified_mistake": "Brief description of what went wrong",
  "explanation": "Clear explanation of why this is incorrect (appropriate for grade 3-5 students)",
  "hint": "A helpful hint to guide the student to the right answer (without giving it away)",
  "step_by_step": ["Step 1", "Step 2", "Step 3"],
  "common_misconception": "What common misunderstanding led to this error"
}

Keep the language simple, encouraging, and age-appropriate. Focus on helping the student understand the concept.`;
  }

  /**
   * Get operation symbol for display
   */
  private getOperationSymbol(operation: string): string {
    const symbols: Record<string, string> = {
      add: '+',
      subtract: '-',
      multiply: '×',
      divide: '÷',
    };
    return symbols[operation] || operation;
  }

  /**
   * Parse AI response into ErrorAnalysis
   */
  private parseAIResponse(response: string): ErrorAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          identified_mistake: parsed.identified_mistake || 'Calculation error detected',
          explanation: parsed.explanation || 'The answer is incorrect.',
          hint: parsed.hint || 'Try checking your work step by step.',
          step_by_step: parsed.step_by_step || [],
          common_misconception: parsed.common_misconception,
        };
      }

      // If no JSON found, use the whole response as explanation
      return {
        identified_mistake: 'Calculation error',
        explanation: response,
        hint: 'Review the steps carefully and try again.',
      };
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      return {
        identified_mistake: 'Calculation error',
        explanation: 'The answer is incorrect. Please check your calculations.',
        hint: 'Try breaking the problem into smaller steps.',
      };
    }
  }

  /**
   * Get basic feedback without AI (fallback)
   */
  private getBasicFeedback(
    problemData: FractionProblemData,
    studentAnswer: Fraction,
    correctAnswer: Fraction,
    errorType: ErrorType
  ): ErrorAnalysis {
    const feedbackMap: Record<string, ErrorAnalysis> = {
      conceptual_error: {
        identified_mistake: 'Conceptual misunderstanding',
        explanation:
          'It looks like there might be a misunderstanding about how fractions work with this operation.',
        hint: 'Remember the rules for working with fractions in this operation.',
        step_by_step: [
          'Review the concept of fractions',
          'Check if you need a common denominator',
          'Perform the operation correctly',
          'Simplify your answer',
        ],
        common_misconception: 'Treating fraction operations like whole number operations',
      },
      arithmetic_error: {
        identified_mistake: 'Arithmetic calculation error',
        explanation: 'Your approach is correct, but there is a small calculation mistake.',
        hint: 'Double-check your arithmetic. Go through each step carefully.',
        step_by_step: [
          'Verify your multiplication',
          'Check your addition/subtraction',
          'Make sure you simplified correctly',
        ],
        common_misconception: 'Simple calculation mistakes',
      },
      simplification_error: {
        identified_mistake: 'Answer not simplified',
        explanation: 'Your answer is mathematically correct but needs to be simplified.',
        hint: 'Can you reduce this fraction to its simplest form?',
        step_by_step: [
          'Find the greatest common divisor (GCD)',
          'Divide both numerator and denominator by the GCD',
        ],
        common_misconception: 'Forgetting to simplify fractions',
      },
      format_error: {
        identified_mistake: 'Invalid fraction format',
        explanation: 'The answer format is not valid. Check that the denominator is not zero.',
        hint: 'Make sure both numerator and denominator are whole numbers and denominator is not zero.',
        step_by_step: ['Check the format', 'Verify the denominator is not zero'],
      },
    };

    return (
      feedbackMap[errorType || 'arithmetic_error'] || {
        identified_mistake: 'Incorrect answer',
        explanation: `The correct answer is ${correctAnswer.numerator}/${correctAnswer.denominator}. Please review your work.`,
        hint: 'Try solving the problem step by step.',
      }
    );
  }
}

export default new AIService();
