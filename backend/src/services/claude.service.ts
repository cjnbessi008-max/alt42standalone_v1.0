import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env';
import { StoryData } from '../types';

const client = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

interface GenerateStoryInput {
  subject: string;
  topic: string;
  question: string;
  type: string;
  options?: any;
  answer: string;
  explanation?: string;
  difficulty: string;
  theme?: string;
}

export class ClaudeService {
  private static buildPrompt(input: GenerateStoryInput): string {
    const optionsText = input.options
      ? `\nOptions: ${JSON.stringify(input.options, null, 2)}`
      : '';

    return `당신은 교육 콘텐츠 전문가이며 인터랙티브 스토리텔링 전문가입니다.

다음 교육 문제를 매력적인 상황극 시나리오로 변환해주세요:

문제 정보:
과목: ${input.subject}
주제: ${input.topic}
난이도: ${input.difficulty}
문제 유형: ${input.type}
질문: ${input.question}${optionsText}
정답: ${input.answer}
${input.explanation ? `설명: ${input.explanation}` : ''}

요구사항:
1. 학생들이 공감할 수 있는 현실적이고 관련성 있는 시나리오를 만드세요
2. 학생들이 연결될 수 있는 캐릭터(이름, 역할, 성격)를 디자인하세요
3. 자연스럽고 연령에 적합한 매력적인 대화를 작성하세요
4. 각 선택지가 문제의 옵션과 명확하게 매핑되도록 하세요
5. 정답과 오답 모두에 대해 건설적인 피드백을 제공하세요
6. 긍정적이고 격려하는 톤을 유지하세요
7. 한국어로 작성하세요
8. 스토리는 2-4개의 장면으로 구성하세요
9. 교육적 가치를 유지하면서 재미있게 만드세요

출력 형식: JSON으로 다음 구조를 따라주세요:
{
  "title": "스토리 제목 (흥미롭고 교육적)",
  "context": "배경 설정 (2-3 문장, 학생을 스토리에 몰입시키기)",
  "character": {
    "name": "캐릭터 이름",
    "role": "캐릭터의 역할",
    "personality": "캐릭터의 성격 (간단히)"
  },
  "scenes": [
    {
      "id": "scene-1",
      "dialogue": "캐릭터의 대사 (자연스럽고 친근하게)",
      "narration": "상황 설명 (학생이 이해하기 쉽게)",
      "choices": [
        {
          "id": "choice-1",
          "text": "선택지 텍스트",
          "isCorrect": true 또는 false,
          "feedback": "선택에 대한 피드백 (긍정적이고 교육적)",
          "nextScene": "scene-2" 또는 null (스토리 종료)
        }
      ]
    }
  ],
  "originalProblem": {
    "question": "${input.question}",
    "answer": "${input.answer}",
    "explanation": "${input.explanation || ''}"
  }
}

중요: 반드시 유효한 JSON만 반환하세요. 추가 설명이나 마크다운 없이 JSON만 출력하세요.

학습을 즐겁게 만드는 몰입형 교육 경험을 만들어주세요!`;
  }

  static async generateStory(input: GenerateStoryInput): Promise<StoryData> {
    const startTime = Date.now();

    try {
      const prompt = this.buildPrompt(input);

      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      const responseText = content.text.trim();

      // Extract JSON from response (handle potential markdown code blocks)
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else if (responseText.startsWith('```') && responseText.endsWith('```')) {
        jsonText = responseText.slice(3, -3).trim();
      }

      const storyData = JSON.parse(jsonText) as StoryData;

      // Validate the story structure
      this.validateStoryData(storyData);

      const generationTime = Date.now() - startTime;
      console.log(`Story generated in ${generationTime}ms`);

      return storyData;
    } catch (error) {
      console.error('Error generating story:', error);
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse AI response as JSON');
      }
      throw error;
    }
  }

  private static validateStoryData(data: any): void {
    if (!data.title || typeof data.title !== 'string') {
      throw new Error('Invalid story: missing or invalid title');
    }
    if (!data.context || typeof data.context !== 'string') {
      throw new Error('Invalid story: missing or invalid context');
    }
    if (!data.character || typeof data.character !== 'object') {
      throw new Error('Invalid story: missing or invalid character');
    }
    if (!Array.isArray(data.scenes) || data.scenes.length === 0) {
      throw new Error('Invalid story: missing or invalid scenes');
    }

    // Validate each scene
    data.scenes.forEach((scene: any, index: number) => {
      if (!scene.id || !scene.dialogue || !scene.narration) {
        throw new Error(`Invalid scene ${index}: missing required fields`);
      }
      if (!Array.isArray(scene.choices) || scene.choices.length === 0) {
        throw new Error(`Invalid scene ${index}: missing or invalid choices`);
      }

      // Validate each choice
      scene.choices.forEach((choice: any, choiceIndex: number) => {
        if (!choice.id || !choice.text || typeof choice.isCorrect !== 'boolean') {
          throw new Error(`Invalid choice ${choiceIndex} in scene ${index}`);
        }
      });
    });
  }

  static async testConnection(): Promise<boolean> {
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      });
      return message.content.length > 0;
    } catch (error) {
      console.error('Claude API connection test failed:', error);
      return false;
    }
  }
}
