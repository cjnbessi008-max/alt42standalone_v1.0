import type { ExtractionResult, ConceptNode, ConceptRelationship } from '../types/graph';

// For demo purposes, we'll use a mock extraction
// In production, this would call Claude API or your backend
export const extractConcepts = async (text: string): Promise<ExtractionResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock response based on text content
  // In production, replace this with actual Claude API call
  const mockExtraction = generateMockExtraction(text);

  return mockExtraction;
};

// Mock extraction function that generates reasonable concepts based on keywords
function generateMockExtraction(text: string): ExtractionResult {
  const lowerText = text.toLowerCase();
  const concepts: ConceptNode[] = [];
  const relationships: ConceptRelationship[] = [];

  // Define keyword-based concept detection
  const conceptKeywords: { [key: string]: { label: string; type: ConceptNode['type']; description: string } } = {
    'fraction': { label: '분수', type: 'concept', description: '전체를 나눈 부분' },
    'numerator': { label: '분자', type: 'entity', description: '분수의 위 숫자' },
    'denominator': { label: '분모', type: 'entity', description: '분수의 아래 숫자' },
    'pizza': { label: '피자', type: 'entity', description: '시각적 예시' },
    'slice': { label: '조각', type: 'entity', description: '나눠진 부분' },
    'whole': { label: '전체', type: 'concept', description: '완전한 것' },
    'part': { label: '부분', type: 'concept', description: '전체의 일부' },
    'add': { label: '더하기', type: 'operation', description: '분수 덧셈' },
    'subtract': { label: '빼기', type: 'operation', description: '분수 뺄셈' },
    'multiply': { label: '곱하기', type: 'operation', description: '분수 곱셈' },
    'divide': { label: '나누기', type: 'operation', description: '분수 나눗셈' },
    'simplify': { label: '약분', type: 'operation', description: '분수 간단히 하기' },
    'student': { label: '학생', type: 'entity', description: '학습자' },
    'teacher': { label: '교사', type: 'entity', description: '교육자' },
    'lesson': { label: '수업', type: 'concept', description: '교육 내용' },
    'problem': { label: '문제', type: 'entity', description: '연습 문제' },
    'solution': { label: '해답', type: 'entity', description: '문제의 답' },
    'module': { label: '모듈', type: 'concept', description: '교육 단위' },
    'concept': { label: '개념', type: 'concept', description: '학습 개념' },
  };

  // Extract concepts based on keywords
  const foundConcepts = new Set<string>();
  Object.keys(conceptKeywords).forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      foundConcepts.add(keyword);
      concepts.push({
        id: `concept-${keyword}`,
        ...conceptKeywords[keyword],
      });
    }
  });

  // If no specific concepts found, generate generic ones
  if (concepts.length === 0) {
    concepts.push(
      { id: 'concept-1', label: '주요 개념', type: 'concept', description: '입력된 내용의 핵심 개념' },
      { id: 'concept-2', label: '학습 목표', type: 'concept', description: '달성해야 할 목표' },
      { id: 'concept-3', label: '학습 활동', type: 'operation', description: '학습을 위한 활동' },
    );
    relationships.push(
      { id: 'rel-1', source: 'concept-1', target: 'concept-2', label: '목표로 함', type: 'relates-to' },
      { id: 'rel-2', source: 'concept-2', target: 'concept-3', label: '통해 달성', type: 'relates-to' },
    );
  } else {
    // Generate relationships based on found concepts
    if (foundConcepts.has('fraction')) {
      if (foundConcepts.has('numerator')) {
        relationships.push({
          id: 'rel-fraction-numerator',
          source: 'concept-fraction',
          target: 'concept-numerator',
          label: '가지다',
          type: 'has-a',
        });
      }
      if (foundConcepts.has('denominator')) {
        relationships.push({
          id: 'rel-fraction-denominator',
          source: 'concept-fraction',
          target: 'concept-denominator',
          label: '가지다',
          type: 'has-a',
        });
      }
      if (foundConcepts.has('pizza')) {
        relationships.push({
          id: 'rel-pizza-fraction',
          source: 'concept-pizza',
          target: 'concept-fraction',
          label: '예시',
          type: 'relates-to',
        });
      }
      if (foundConcepts.has('slice')) {
        relationships.push({
          id: 'rel-pizza-slice',
          source: 'concept-pizza',
          target: 'concept-slice',
          label: '나눠짐',
          type: 'divided-into',
        });
      }
    }

    if (foundConcepts.has('lesson')) {
      if (foundConcepts.has('student')) {
        relationships.push({
          id: 'rel-lesson-student',
          source: 'concept-lesson',
          target: 'concept-student',
          label: '학습됨',
          type: 'relates-to',
        });
      }
      if (foundConcepts.has('teacher')) {
        relationships.push({
          id: 'rel-teacher-lesson',
          source: 'concept-teacher',
          target: 'concept-lesson',
          label: '가르침',
          type: 'relates-to',
        });
      }
    }

    // Add generic relationships if not enough specific ones
    if (relationships.length < concepts.length - 1 && concepts.length > 1) {
      for (let i = 0; i < concepts.length - 1; i++) {
        const hasRelationship = relationships.some(
          (r) => r.source === concepts[i].id || r.target === concepts[i].id
        );
        if (!hasRelationship) {
          relationships.push({
            id: `rel-${i}`,
            source: concepts[i].id,
            target: concepts[i + 1].id,
            label: '관련됨',
            type: 'relates-to',
          });
        }
      }
    }
  }

  return {
    concepts,
    relationships,
    rawResponse: `Extracted ${concepts.length} concepts and ${relationships.length} relationships from input text.`,
  };
}

// Real Claude API integration (commented out for now)
// export const extractConceptsWithClaude = async (text: string, apiKey: string): Promise<ExtractionResult> => {
//   const response = await axios.post(
//     'https://api.anthropic.com/v1/messages',
//     {
//       model: 'claude-3-sonnet-20240229',
//       max_tokens: 2000,
//       messages: [
//         {
//           role: 'user',
//           content: `Analyze the following educational content and extract:
// 1. Key concepts (name, type: concept/entity/operation, description)
// 2. Relationships between concepts (source, target, relationship type)
//
// Content: ${text}
//
// Return a JSON object with "concepts" and "relationships" arrays.`
//         }
//       ]
//     },
//     {
//       headers: {
//         'Content-Type': 'application/json',
//         'x-api-key': apiKey,
//         'anthropic-version': '2023-06-01',
//       },
//     }
//   );
//
//   // Parse Claude's response and convert to our format
//   const content = response.data.content[0].text;
//   const parsed = JSON.parse(content);
//
//   return {
//     concepts: parsed.concepts.map((c: any, i: number) => ({
//       id: `concept-${i}`,
//       label: c.name,
//       type: c.type,
//       description: c.description,
//     })),
//     relationships: parsed.relationships.map((r: any, i: number) => ({
//       id: `rel-${i}`,
//       source: r.source,
//       target: r.target,
//       label: r.label,
//       type: r.type,
//     })),
//     rawResponse: content,
//   };
// };
