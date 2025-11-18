const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * 문제 조건을 핵심 3줄로 요약
   * @param {string} problemText - 문제 전문
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 요약 결과
   */
  async summarizeProblem(problemText, options = {}) {
    const {
      language = 'ko', // 'ko' 또는 'en'
      includeMetadata = true
    } = options;

    try {
      const prompt = this.buildSummarizationPrompt(problemText, language);

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        temperature: 0.3, // 일관성을 위해 낮은 temperature 사용
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const summary = this.parseSummaryResponse(message.content[0].text);

      return {
        success: true,
        summary: summary,
        metadata: includeMetadata ? {
          model: 'claude-sonnet-4-5',
          tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
          timestamp: new Date().toISOString()
        } : undefined
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error(`Failed to summarize problem: ${error.message}`);
    }
  }

  /**
   * 요약을 위한 프롬프트 생성
   * @param {string} problemText - 문제 텍스트
   * @param {string} language - 언어 설정
   * @returns {string} 프롬프트
   */
  buildSummarizationPrompt(problemText, language) {
    if (language === 'ko') {
      return `다음은 교육용 문제입니다. 이 문제의 핵심 조건을 정확히 3줄로 요약해주세요.

요구사항:
- 반드시 3줄로만 작성하세요 (더 많거나 적으면 안됩니다)
- 각 줄은 핵심 조건 하나를 명확하게 표현해야 합니다
- 학생이 문제를 풀기 위해 반드시 알아야 할 정보만 포함하세요
- 불필요한 설명이나 예시는 제외하세요
- 간결하고 명확한 문장으로 작성하세요

문제:
${problemText}

핵심 3줄 요약:`;
    } else {
      return `Here is an educational problem. Please summarize the key conditions of this problem in exactly 3 lines.

Requirements:
- Write exactly 3 lines (no more, no less)
- Each line should clearly express one key condition
- Include only essential information students need to solve the problem
- Exclude unnecessary explanations or examples
- Use concise and clear sentences

Problem:
${problemText}

3-Line Summary:`;
    }
  }

  /**
   * Claude 응답에서 요약 파싱
   * @param {string} responseText - Claude 응답 텍스트
   * @returns {Array<string>} 3줄 요약 배열
   */
  parseSummaryResponse(responseText) {
    // 응답에서 실제 요약 내용 추출
    const lines = responseText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.includes('요약:') && !line.includes('Summary:'));

    // 숫자나 불릿 포인트 제거 (예: "1. ", "- ", "• ")
    const cleanedLines = lines.map(line =>
      line.replace(/^[\d]+[\.\)]\s*/, '').replace(/^[-•]\s*/, '').trim()
    );

    // 정확히 3줄만 반환
    return cleanedLines.slice(0, 3);
  }

  /**
   * 여러 문제를 배치로 요약
   * @param {Array<Object>} problems - 문제 배열 [{id, text}]
   * @param {Object} options - 옵션
   * @returns {Promise<Array<Object>>} 요약 결과 배열
   */
  async summarizeProblemsInBatch(problems, options = {}) {
    const results = [];

    for (const problem of problems) {
      try {
        const summary = await this.summarizeProblem(problem.text, options);
        results.push({
          problemId: problem.id,
          ...summary
        });
      } catch (error) {
        results.push({
          problemId: problem.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new ClaudeService();
