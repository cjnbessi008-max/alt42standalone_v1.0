import type { IntervalSummary, Interval, IntervalType } from '../../../shared/types.js';

/**
 * Interval Extractor Service
 * Automatically extracts range/interval information from question text
 */

// Regex patterns for different interval types
const PATTERNS = {
  // Numerical ranges: [10, 20], 10~20, 10-20, 10부터 20까지
  numerical: [
    /\[(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\]/g,
    /\((\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\)/g,
    /(\d+(?:\.\d+)?)\s*~\s*(\d+(?:\.\d+)?)/g,
    /(\d+(?:\.\d+)?)부터\s*(\d+(?:\.\d+)?)까지/g,
    /(\d+(?:\.\d+)?)\s*에서\s*(\d+(?:\.\d+)?)\s*사이/g,
  ],

  // Time ranges: 1시간~2시간, 09:00-10:00
  time: [
    /(\d+)시간\s*~\s*(\d+)시간/g,
    /(\d+)시간\s*에서\s*(\d+)시간\s*사이/g,
    /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g,
  ],

  // Score ranges: 80-100점, 80점~100점
  score: [
    /(\d+)점?\s*~\s*(\d+)점/g,
    /(\d+)점?\s*-\s*(\d+)점/g,
    /(\d+)점?\s*에서\s*(\d+)점\s*사이/g,
  ],
};

/**
 * Extract intervals from question content
 */
export function extractIntervals(questionId: string, content: string): IntervalSummary {
  const intervals: Interval[] = [];
  let totalMatches = 0;

  // Extract numerical ranges
  for (const pattern of PATTERNS.numerical) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const isInclusive = match[0].startsWith('[');
      intervals.push({
        type: 'numerical_range',
        start: parseFloat(match[1]),
        end: parseFloat(match[2]),
        inclusive: {
          start: isInclusive,
          end: isInclusive
        },
        rawText: match[0],
        context: getContext(content, match.index, 30)
      });
      totalMatches++;
    }
  }

  // Extract time ranges
  for (const pattern of PATTERNS.time) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      intervals.push({
        type: 'time_range',
        start: match[1],
        end: match[2],
        inclusive: { start: true, end: true },
        unit: '시간' in match[0] ? 'hours' : 'time',
        rawText: match[0],
        context: getContext(content, match.index, 30)
      });
      totalMatches++;
    }
  }

  // Extract score ranges
  for (const pattern of PATTERNS.score) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      intervals.push({
        type: 'score_range',
        start: parseInt(match[1]),
        end: parseInt(match[2]),
        inclusive: { start: true, end: true },
        unit: 'points',
        rawText: match[0],
        context: getContext(content, match.index, 30)
      });
      totalMatches++;
    }
  }

  // Calculate confidence based on number and quality of matches
  const confidence = calculateConfidence(intervals, content);

  return {
    questionId,
    intervals,
    extractedAt: new Date().toISOString(),
    confidence
  };
}

/**
 * Get surrounding context for an interval match
 */
function getContext(text: string, index: number, radius: number): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.substring(start, end).trim();
}

/**
 * Calculate confidence score for extraction
 */
function calculateConfidence(intervals: Interval[], content: string): number {
  if (intervals.length === 0) return 0;

  // Base confidence on:
  // 1. Number of intervals found
  // 2. Clarity of interval notation
  // 3. Context consistency

  let score = 0;

  // More intervals = higher confidence (up to a point)
  score += Math.min(intervals.length * 0.3, 0.6);

  // Well-formatted intervals (with brackets) = higher confidence
  const wellFormatted = intervals.filter(i =>
    i.rawText.includes('[') || i.rawText.includes('(')
  ).length;
  score += (wellFormatted / intervals.length) * 0.3;

  // Presence of context keywords
  const keywords = ['범위', '사이', '까지', '부터', 'range', 'between'];
  const hasKeywords = keywords.some(kw => content.includes(kw));
  if (hasKeywords) score += 0.1;

  return Math.min(score, 1.0);
}
