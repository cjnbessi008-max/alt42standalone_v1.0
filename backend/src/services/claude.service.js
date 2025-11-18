import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Claude AI를 사용한 추론 구조 생성 서비스
 */
class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS) || 4096;
  }

  /**
   * 문제에 대한 추론 구조 생성
   * @param {object} problem - 문제 데이터
   * @returns {Promise<object>} - 추론 구조
   */
  async generateReasoningStructure(problem) {
    const prompt = this.buildReasoningPrompt(problem);

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = message.content[0].text;
      const reasoning = this.parseReasoningResponse(responseText);

      return {
        ...reasoning,
        aiModel: this.model,
        analysisQualityScore: this.assessQuality(reasoning)
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`AI 추론 구조 생성 실패: ${error.message}`);
    }
  }

  /**
   * 추론 구조 생성을 위한 프롬프트 작성
   * @param {object} problem
   * @returns {string}
   */
  buildReasoningPrompt(problem) {
    return `당신은 교육 전문가이자 수학 문제 분석 전문가입니다. 다음 문제를 분석하여 상세한 추론 구조를 생성해주세요.

## 문제 정보
**문제**: ${problem.question}
**학생 답안**: ${problem.studentAnswer || '(답안 없음)'}
**정답**: ${problem.correctAnswer || '(정답 정보 없음)'}
**결과**: ${problem.isCorrect ? '정답' : '오답'}
**문제 유형**: ${problem.type}

## 요청사항
다음 형식의 JSON으로 분석 결과를 제공해주세요:

\`\`\`json
{
  "concepts": [
    "개념1",
    "개념2",
    "개념3"
  ],
  "difficultyAssessment": "easy|medium|hard|very_hard",
  "prerequisites": [
    "선행 개념1",
    "선행 개념2"
  ],
  "reasoningSteps": [
    {
      "step": 1,
      "description": "단계 설명",
      "concept": "관련 개념",
      "formula": "수식 또는 규칙 (있는 경우)",
      "explanation": "상세 설명"
    }
  ],
  "studentApproach": {
    "correct": true/false,
    "steps": ["학생이 사용한 접근 방식"],
    "insights": "학생 풀이에 대한 통찰",
    "commonMistakes": ["이 유형의 문제에서 흔한 실수들"]
  },
  "relatedConcepts": [
    "관련 개념1",
    "관련 개념2"
  ],
  "nextRecommendedTopics": [
    {
      "topic": "추천 주제",
      "reason": "추천 이유"
    }
  ],
  "pedagogicalInsights": {
    "strengthens": ["강화된 영역"],
    "needsWork": ["보완이 필요한 영역"],
    "studyTips": "학습 조언"
  }
}
\`\`\`

## 분석 지침
1. **개념 추출**: 이 문제를 해결하는데 필요한 모든 수학적 개념을 나열하세요.
2. **난이도 평가**: 학년 수준과 복잡도를 고려하여 평가하세요.
3. **추론 단계**: 문제를 해결하는 논리적 단계를 순서대로 설명하세요.
4. **학생 분석**: 학생의 답안을 분석하고, 사고 과정을 추론하세요.
5. **교육적 통찰**: 이 문제를 통해 무엇을 배울 수 있는지 설명하세요.
6. **다음 단계**: 학생의 학습 진도를 위한 추천 주제를 제시하세요.

**중요**: 응답은 반드시 유효한 JSON 형식이어야 하며, 한국어로 작성해주세요.`;
  }

  /**
   * Claude 응답 파싱
   * @param {string} responseText
   * @returns {object}
   */
  parseReasoningResponse(responseText) {
    try {
      // JSON 코드 블록에서 추출
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // JSON 객체 직접 파싱 시도
      const jsonObjectMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        return JSON.parse(jsonObjectMatch[0]);
      }

      throw new Error('JSON 응답을 찾을 수 없습니다');
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      console.error('Response text:', responseText);

      // 파싱 실패시 기본 구조 반환
      return {
        concepts: ['파싱 실패'],
        difficultyAssessment: 'medium',
        prerequisites: [],
        reasoningSteps: [
          {
            step: 1,
            description: '응답 파싱 실패',
            concept: 'N/A',
            explanation: responseText.substring(0, 500)
          }
        ],
        studentApproach: {
          correct: false,
          steps: [],
          insights: 'AI 응답 파싱에 실패했습니다.',
          commonMistakes: []
        },
        relatedConcepts: [],
        nextRecommendedTopics: [],
        pedagogicalInsights: {
          strengthens: [],
          needsWork: [],
          studyTips: ''
        }
      };
    }
  }

  /**
   * 일괄 문제 분석
   * @param {Array} problems - 문제 배열
   * @returns {Promise<Array>} - 추론 구조 배열
   */
  async analyzeBatch(problems) {
    const results = [];

    // Rate limiting을 위해 순차 처리
    for (const problem of problems) {
      try {
        const reasoning = await this.generateReasoningStructure(problem);
        results.push({
          problem,
          reasoning,
          success: true
        });

        // API rate limit 방지를 위한 딜레이
        await this.delay(1000);
      } catch (error) {
        console.error(`Failed to analyze problem ${problem.questionId}:`, error);
        results.push({
          problem,
          reasoning: null,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 학습 패턴 분석 및 인사이트 생성
   * @param {Array} problems - 오늘 푼 문제들
   * @param {Array} reasoningStructures - 각 문제의 추론 구조
   * @returns {Promise<object>}
   */
  async generateLearningInsights(problems, reasoningStructures) {
    const prompt = `당신은 교육 데이터 분석 전문가입니다. 학생이 오늘 해결한 문제들과 각 문제의 추론 구조를 분석하여 학습 패턴과 인사이트를 도출해주세요.

## 오늘의 학습 데이터
**총 문제 수**: ${problems.length}
**정답률**: ${this.calculateAccuracy(problems)}%
**다룬 개념들**: ${this.extractAllConcepts(reasoningStructures).join(', ')}

## 문제별 요약
${this.summarizeProblems(problems, reasoningStructures)}

## 요청사항
다음 형식의 JSON으로 학습 패턴 분석을 제공해주세요:

\`\`\`json
{
  "overallPerformance": {
    "summary": "전반적인 학습 성과 요약",
    "strengths": ["잘하는 영역1", "잘하는 영역2"],
    "weaknesses": ["보완이 필요한 영역1", "보완이 필요한 영역2"]
  },
  "conceptMastery": {
    "strong": ["숙달된 개념들"],
    "developing": ["발전 중인 개념들"],
    "needsWork": ["더 연습이 필요한 개념들"]
  },
  "learningPatterns": {
    "preferredApproaches": ["선호하는 문제 해결 방식"],
    "commonMistakes": ["반복되는 실수 패턴"],
    "improvementTrend": "향상|정체|하락"
  },
  "recommendations": {
    "nextTopics": ["다음에 학습할 주제"],
    "practiceAreas": ["집중 연습이 필요한 영역"],
    "studyTips": ["구체적인 학습 조언"]
  },
  "motivationalMessage": "격려 메시지"
}
\`\`\`

**중요**: 응답은 반드시 유효한 JSON 형식이어야 하며, 한국어로 작성해주세요.`;

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.5,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = message.content[0].text;
      return this.parseReasoningResponse(responseText);
    } catch (error) {
      console.error('Failed to generate learning insights:', error);
      throw error;
    }
  }

  /**
   * 정답률 계산
   * @param {Array} problems
   * @returns {number}
   */
  calculateAccuracy(problems) {
    if (problems.length === 0) return 0;
    const correct = problems.filter(p => p.isCorrect).length;
    return Math.round((correct / problems.length) * 100);
  }

  /**
   * 모든 개념 추출
   * @param {Array} reasoningStructures
   * @returns {Array}
   */
  extractAllConcepts(reasoningStructures) {
    const conceptsSet = new Set();
    reasoningStructures.forEach(rs => {
      if (rs.concepts) {
        rs.concepts.forEach(c => conceptsSet.add(c));
      }
    });
    return Array.from(conceptsSet);
  }

  /**
   * 문제 요약 생성
   * @param {Array} problems
   * @param {Array} reasoningStructures
   * @returns {string}
   */
  summarizeProblems(problems, reasoningStructures) {
    return problems
      .slice(0, 10)
      .map((p, i) => {
        const rs = reasoningStructures[i];
        return `- ${p.question.substring(0, 100)}... (${p.isCorrect ? '정답' : '오답'}, 개념: ${rs?.concepts?.join(', ') || 'N/A'})`;
      })
      .join('\n');
  }

  /**
   * 분석 품질 평가
   * @param {object} reasoning
   * @returns {number} - 0-1 사이의 품질 점수
   */
  assessQuality(reasoning) {
    let score = 0;

    // 개념이 있는지
    if (reasoning.concepts && reasoning.concepts.length > 0) score += 0.2;

    // 추론 단계가 있는지
    if (reasoning.reasoningSteps && reasoning.reasoningSteps.length > 0)
      score += 0.3;

    // 학생 분석이 있는지
    if (reasoning.studentApproach && reasoning.studentApproach.insights)
      score += 0.2;

    // 관련 개념이 있는지
    if (reasoning.relatedConcepts && reasoning.relatedConcepts.length > 0)
      score += 0.15;

    // 추천 주제가 있는지
    if (
      reasoning.nextRecommendedTopics &&
      reasoning.nextRecommendedTopics.length > 0
    )
      score += 0.15;

    return Math.min(score, 1.0);
  }

  /**
   * 딜레이 헬퍼
   * @param {number} ms
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ClaudeService();
