import Anthropic from '@anthropic-ai/sdk';
import { EquationSummary, ParsedProblem } from '../types';

export class AIService {
  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    });

    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  }

  /**
   * Generate 3-line equation summary using Claude
   */
  async generateSummary(problem: ParsedProblem): Promise<EquationSummary> {
    const startTime = Date.now();

    try {
      const prompt = this.buildPrompt(problem);

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 500,
        temperature: 0.3, // Lower temperature for more consistent summaries
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      const summary = this.parseSummaryResponse(responseText);
      const processingTime = Date.now() - startTime;

      return {
        ...summary,
        processingTime,
      };
    } catch (error) {
      console.error('Error generating AI summary:', error);
      throw new Error('Failed to generate equation summary');
    }
  }

  /**
   * Build prompt for Claude API
   */
  private buildPrompt(problem: ParsedProblem): string {
    let prompt = `당신은 수학/과학 문제를 분석하는 교육 전문가입니다. 다음 문제의 구조를 정확히 3줄로 요약해주세요.

문제 유형: ${problem.type}
문제 내용: ${problem.plainText}
`;

    if (problem.equations && problem.equations.length > 0) {
      prompt += `\n수식: ${problem.equations.join(', ')}\n`;
    }

    if (problem.choices && problem.choices.length > 0) {
      prompt += `\n선택지:\n`;
      problem.choices.forEach((choice, idx) => {
        prompt += `${idx + 1}. ${choice.text}\n`;
      });
    }

    prompt += `
요약 형식 (반드시 이 형식을 따라주세요):
LINE1: [문제 유형 및 핵심 개념]
LINE2: [주요 수식/방정식 구조]
LINE3: [해결 접근 방법]
CONFIDENCE: [0.0-1.0 사이의 신뢰도]

각 줄은 한 문장으로 간결하게 작성하고, LINE1, LINE2, LINE3, CONFIDENCE 레이블을 반드시 포함해주세요.`;

    return prompt;
  }

  /**
   * Parse Claude's response into structured summary
   */
  private parseSummaryResponse(response: string): Omit<EquationSummary, 'processingTime'> {
    const lines = response.split('\n').filter(line => line.trim());

    let line1 = '';
    let line2 = '';
    let line3 = '';
    let confidence = 0.8; // Default confidence

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('LINE1:')) {
        line1 = trimmed.replace('LINE1:', '').trim();
      } else if (trimmed.startsWith('LINE2:')) {
        line2 = trimmed.replace('LINE2:', '').trim();
      } else if (trimmed.startsWith('LINE3:')) {
        line3 = trimmed.replace('LINE3:', '').trim();
      } else if (trimmed.startsWith('CONFIDENCE:')) {
        const confStr = trimmed.replace('CONFIDENCE:', '').trim();
        const confNum = parseFloat(confStr);
        if (!isNaN(confNum) && confNum >= 0 && confNum <= 1) {
          confidence = confNum;
        }
      }
    }

    // Fallback if parsing fails
    if (!line1 || !line2 || !line3) {
      const allLines = lines.filter(l => !l.startsWith('LINE') && !l.startsWith('CONFIDENCE'));
      line1 = allLines[0] || '문제 유형을 분석할 수 없습니다.';
      line2 = allLines[1] || '수식 구조를 파악할 수 없습니다.';
      line3 = allLines[2] || '해결 방법을 제시할 수 없습니다.';
      confidence = 0.5;
    }

    return {
      line1,
      line2,
      line3,
      confidence,
    };
  }

  /**
   * Test AI service connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      });

      return message.content.length > 0;
    } catch (error) {
      console.error('AI service test failed:', error);
      return false;
    }
  }
}
