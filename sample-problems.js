/**
 * ALT42 Sample Problems Database
 * Pre-loaded educational problems for standalone mode
 */

const SAMPLE_PROBLEMS = [
  {
    title: '분수의 기본 개념',
    description: '분수는 전체를 같은 크기로 나눈 부분을 나타냅니다. 분자와 분모로 구성됩니다.',
    type: 'concept_learning',
    difficulty: 'beginner',
    concepts: ['fraction', 'numerator', 'denominator'],
    graphData: {
      nodes: [
        { id: 0, label: '분수', concept: 'fraction', description: '전체를 나눈 부분' },
        { id: 1, label: '분자', concept: 'numerator', description: '나눈 부분의 개수' },
        { id: 2, label: '분모', concept: 'denominator', description: '전체를 나눈 개수' }
      ],
      edges: [
        { from: 0, to: 1, label: '포함', relationship: 'has_part' },
        { from: 0, to: 2, label: '포함', relationship: 'has_part' }
      ]
    },
    questions: [
      {
        question: '피자를 4조각으로 나누고 그 중 1조각을 먹었습니다. 먹은 피자는?',
        answer: '1/4',
        hint: '전체 조각 수가 분모, 먹은 조각 수가 분자입니다.'
      }
    ]
  },

  {
    title: '분수의 덧셈 - 같은 분모',
    description: '분모가 같은 분수끼리는 분자만 더하면 됩니다.',
    type: 'fraction_addition',
    difficulty: 'easy',
    concepts: ['fraction', 'addition', 'same_denominator'],
    graphData: {
      nodes: [
        { id: 0, label: '분수', concept: 'fraction' },
        { id: 1, label: '덧셈', concept: 'addition' },
        { id: 2, label: '같은 분모', concept: 'same_denominator' },
        { id: 3, label: '분자 더하기', concept: 'add_numerators' }
      ],
      edges: [
        { from: 0, to: 1, label: '연산', relationship: 'operation' },
        { from: 1, to: 2, label: '조건', relationship: 'requires' },
        { from: 2, to: 3, label: '방법', relationship: 'method' }
      ]
    },
    questions: [
      {
        question: '1/5 + 2/5 = ?',
        answer: '3/5',
        hint: '분모가 같으므로 분자만 더합니다: 1+2=3'
      },
      {
        question: '2/7 + 3/7 = ?',
        answer: '5/7',
        hint: '분모 7은 그대로, 분자 2+3=5'
      }
    ]
  },

  {
    title: '분수의 덧셈 - 다른 분모',
    description: '분모가 다른 분수는 통분을 먼저 해야 합니다.',
    type: 'fraction_addition',
    difficulty: 'medium',
    concepts: ['fraction', 'addition', 'common_denominator', 'lcm'],
    graphData: {
      nodes: [
        { id: 0, label: '분수', concept: 'fraction' },
        { id: 1, label: '덧셈', concept: 'addition' },
        { id: 2, label: '다른 분모', concept: 'different_denominator' },
        { id: 3, label: '통분', concept: 'common_denominator' },
        { id: 4, label: '최소공배수', concept: 'lcm' },
        { id: 5, label: '분자 더하기', concept: 'add_numerators' }
      ],
      edges: [
        { from: 0, to: 1, label: '연산', relationship: 'operation' },
        { from: 1, to: 2, label: '상황', relationship: 'scenario' },
        { from: 2, to: 3, label: '필요', relationship: 'requires' },
        { from: 3, to: 4, label: '찾기', relationship: 'find' },
        { from: 3, to: 5, label: '그 다음', relationship: 'then' }
      ]
    },
    questions: [
      {
        question: '1/2 + 1/4 = ?',
        answer: '3/4',
        hint: '2와 4의 최소공배수는 4입니다. 1/2 = 2/4'
      },
      {
        question: '1/3 + 1/6 = ?',
        answer: '1/2',
        hint: '3과 6의 최소공배수는 6입니다. 1/3 = 2/6'
      }
    ]
  },

  {
    title: '분수의 뺄셈 - 같은 분모',
    description: '분모가 같은 분수끼리는 분자만 빼면 됩니다.',
    type: 'fraction_subtraction',
    difficulty: 'easy',
    concepts: ['fraction', 'subtraction', 'same_denominator'],
    graphData: {
      nodes: [
        { id: 0, label: '분수', concept: 'fraction' },
        { id: 1, label: '뺄셈', concept: 'subtraction' },
        { id: 2, label: '같은 분모', concept: 'same_denominator' },
        { id: 3, label: '분자 빼기', concept: 'subtract_numerators' }
      ],
      edges: [
        { from: 0, to: 1, label: '연산', relationship: 'operation' },
        { from: 1, to: 2, label: '조건', relationship: 'requires' },
        { from: 2, to: 3, label: '방법', relationship: 'method' }
      ]
    },
    questions: [
      {
        question: '4/5 - 1/5 = ?',
        answer: '3/5',
        hint: '분모가 같으므로 분자만 뺍니다: 4-1=3'
      },
      {
        question: '5/8 - 2/8 = ?',
        answer: '3/8',
        hint: '분모 8은 그대로, 분자 5-2=3'
      }
    ]
  },

  {
    title: '분수의 곱셈',
    description: '분수의 곱셈은 분자끼리, 분모끼리 곱합니다.',
    type: 'fraction_multiplication',
    difficulty: 'medium',
    concepts: ['fraction', 'multiplication'],
    graphData: {
      nodes: [
        { id: 0, label: '분수', concept: 'fraction' },
        { id: 1, label: '곱셈', concept: 'multiplication' },
        { id: 2, label: '분자×분자', concept: 'multiply_numerators' },
        { id: 3, label: '분모×분모', concept: 'multiply_denominators' },
        { id: 4, label: '약분', concept: 'simplify' }
      ],
      edges: [
        { from: 0, to: 1, label: '연산', relationship: 'operation' },
        { from: 1, to: 2, label: '방법', relationship: 'method' },
        { from: 1, to: 3, label: '방법', relationship: 'method' },
        { from: 2, to: 4, label: '그 다음', relationship: 'then' },
        { from: 3, to: 4, label: '그 다음', relationship: 'then' }
      ]
    },
    questions: [
      {
        question: '1/2 × 1/3 = ?',
        answer: '1/6',
        hint: '분자: 1×1=1, 분모: 2×3=6'
      },
      {
        question: '2/3 × 3/4 = ?',
        answer: '1/2',
        hint: '분자: 2×3=6, 분모: 3×4=12, 약분하면 1/2'
      }
    ]
  },

  {
    title: '분수의 나눗셈',
    description: '분수의 나눗셈은 나누는 수를 뒤집어서 곱합니다.',
    type: 'fraction_division',
    difficulty: 'hard',
    concepts: ['fraction', 'division', 'reciprocal', 'multiplication'],
    graphData: {
      nodes: [
        { id: 0, label: '분수', concept: 'fraction' },
        { id: 1, label: '나눗셈', concept: 'division' },
        { id: 2, label: '역수', concept: 'reciprocal' },
        { id: 3, label: '곱셈으로 변환', concept: 'convert_to_multiplication' },
        { id: 4, label: '분자×분자', concept: 'multiply_numerators' },
        { id: 5, label: '분모×분모', concept: 'multiply_denominators' }
      ],
      edges: [
        { from: 0, to: 1, label: '연산', relationship: 'operation' },
        { from: 1, to: 2, label: '찾기', relationship: 'find' },
        { from: 2, to: 3, label: '변환', relationship: 'convert' },
        { from: 3, to: 4, label: '방법', relationship: 'method' },
        { from: 3, to: 5, label: '방법', relationship: 'method' }
      ]
    },
    questions: [
      {
        question: '1/2 ÷ 1/3 = ?',
        answer: '3/2',
        hint: '1/2 × 3/1 = 3/2 (1과 1/2)'
      },
      {
        question: '2/3 ÷ 4/5 = ?',
        answer: '5/6',
        hint: '2/3 × 5/4 = 10/12 = 5/6'
      }
    ]
  },

  {
    title: '대분수와 가분수',
    description: '대분수는 자연수와 진분수를 합친 것이고, 가분수는 분자가 분모보다 큰 분수입니다.',
    type: 'concept_learning',
    difficulty: 'medium',
    concepts: ['fraction', 'improper_fraction', 'mixed_number'],
    graphData: {
      nodes: [
        { id: 0, label: '분수', concept: 'fraction' },
        { id: 1, label: '진분수', concept: 'proper_fraction' },
        { id: 2, label: '가분수', concept: 'improper_fraction' },
        { id: 3, label: '대분수', concept: 'mixed_number' },
        { id: 4, label: '변환', concept: 'conversion' }
      ],
      edges: [
        { from: 0, to: 1, label: '종류', relationship: 'type' },
        { from: 0, to: 2, label: '종류', relationship: 'type' },
        { from: 0, to: 3, label: '종류', relationship: 'type' },
        { from: 2, to: 4, label: '가능', relationship: 'can' },
        { from: 3, to: 4, label: '가능', relationship: 'can' }
      ]
    },
    questions: [
      {
        question: '5/3을 대분수로 바꾸면?',
        answer: '1 2/3',
        hint: '5 ÷ 3 = 1 나머지 2, 따라서 1과 2/3'
      },
      {
        question: '2 1/4를 가분수로 바꾸면?',
        answer: '9/4',
        hint: '2 × 4 + 1 = 9, 분모는 그대로 4'
      }
    ]
  },

  {
    title: '분수의 크기 비교',
    description: '분수의 크기를 비교하는 방법을 배웁니다.',
    type: 'concept_learning',
    difficulty: 'easy',
    concepts: ['fraction', 'comparison', 'common_denominator'],
    graphData: {
      nodes: [
        { id: 0, label: '분수', concept: 'fraction' },
        { id: 1, label: '크기 비교', concept: 'comparison' },
        { id: 2, label: '같은 분모', concept: 'same_denominator' },
        { id: 3, label: '통분', concept: 'common_denominator' },
        { id: 4, label: '분자 비교', concept: 'compare_numerators' }
      ],
      edges: [
        { from: 0, to: 1, label: '연산', relationship: 'operation' },
        { from: 1, to: 2, label: '확인', relationship: 'check' },
        { from: 2, to: 4, label: '예', relationship: 'if_yes' },
        { from: 1, to: 3, label: '아니오', relationship: 'if_no' },
        { from: 3, to: 4, label: '그 다음', relationship: 'then' }
      ]
    },
    questions: [
      {
        question: '1/3과 1/4 중 어느 것이 더 클까요?',
        answer: '1/3',
        hint: '통분하면 4/12와 3/12, 따라서 1/3이 더 큽니다.'
      },
      {
        question: '2/5와 3/5 중 어느 것이 더 클까요?',
        answer: '3/5',
        hint: '분모가 같으면 분자가 큰 것이 더 큽니다.'
      }
    ]
  },

  {
    title: '분수와 소수의 관계',
    description: '분수를 소수로, 소수를 분수로 변환하는 방법을 배웁니다.',
    type: 'concept_learning',
    difficulty: 'medium',
    concepts: ['fraction', 'decimal', 'conversion'],
    graphData: {
      nodes: [
        { id: 0, label: '분수', concept: 'fraction' },
        { id: 1, label: '소수', concept: 'decimal' },
        { id: 2, label: '나눗셈', concept: 'division' },
        { id: 3, label: '분모를 10, 100...', concept: 'power_of_ten' },
        { id: 4, label: '변환', concept: 'conversion' }
      ],
      edges: [
        { from: 0, to: 4, label: '가능', relationship: 'can' },
        { from: 1, to: 4, label: '가능', relationship: 'can' },
        { from: 0, to: 2, label: '방법1', relationship: 'method' },
        { from: 1, to: 3, label: '방법2', relationship: 'method' }
      ]
    },
    questions: [
      {
        question: '1/4를 소수로 나타내면?',
        answer: '0.25',
        hint: '1 ÷ 4 = 0.25'
      },
      {
        question: '0.5를 분수로 나타내면?',
        answer: '1/2',
        hint: '0.5 = 5/10 = 1/2'
      }
    ]
  },

  {
    title: '분수의 응용 - 실생활 문제',
    description: '실생활에서 분수를 사용하는 문제를 풀어봅니다.',
    type: 'application',
    difficulty: 'hard',
    concepts: ['fraction', 'word_problem', 'addition', 'subtraction'],
    graphData: {
      nodes: [
        { id: 0, label: '실생활 문제', concept: 'word_problem' },
        { id: 1, label: '분수', concept: 'fraction' },
        { id: 2, label: '문제 이해', concept: 'understand' },
        { id: 3, label: '식 세우기', concept: 'setup_equation' },
        { id: 4, label: '계산', concept: 'calculate' },
        { id: 5, label: '답 확인', concept: 'verify' }
      ],
      edges: [
        { from: 0, to: 1, label: '사용', relationship: 'uses' },
        { from: 0, to: 2, label: '첫 단계', relationship: 'step1' },
        { from: 2, to: 3, label: '다음', relationship: 'step2' },
        { from: 3, to: 4, label: '다음', relationship: 'step3' },
        { from: 4, to: 5, label: '마지막', relationship: 'step4' }
      ]
    },
    questions: [
      {
        question: '케이크의 1/4를 아침에 먹고, 1/3을 점심에 먹었습니다. 남은 케이크는 얼마일까요?',
        answer: '5/12',
        hint: '먹은 양: 1/4 + 1/3 = 7/12, 남은 양: 1 - 7/12 = 5/12'
      },
      {
        question: '물병에 2/5만큼 물이 있습니다. 1/5를 마셨습니다. 남은 물은?',
        answer: '1/5',
        hint: '2/5 - 1/5 = 1/5'
      }
    ]
  }
];

/**
 * Initialize sample problems in storage
 */
async function initializeSampleProblems(storageManager) {
  console.log('[Sample Problems] Initializing...');

  try {
    // Check if problems already exist
    const existingProblems = await storageManager.getAllProblems();

    if (existingProblems.length > 0) {
      console.log('[Sample Problems] Problems already initialized:', existingProblems.length);
      return existingProblems;
    }

    // Add sample problems
    const savedProblems = [];
    for (const problem of SAMPLE_PROBLEMS) {
      const id = await storageManager.saveProblem(problem);
      savedProblems.push({ ...problem, id });
      console.log(`[Sample Problems] Saved: ${problem.title}`);
    }

    console.log('[Sample Problems] Initialization complete:', savedProblems.length);
    return savedProblems;
  } catch (error) {
    console.error('[Sample Problems] Initialization failed:', error);
    throw error;
  }
}

/**
 * Get random problem
 */
function getRandomProblem(difficulty = null) {
  let problems = SAMPLE_PROBLEMS;

  if (difficulty) {
    problems = problems.filter(p => p.difficulty === difficulty);
  }

  return problems[Math.floor(Math.random() * problems.length)];
}

/**
 * Get problems by concept
 */
function getProblemsByConcept(concept) {
  return SAMPLE_PROBLEMS.filter(p => p.concepts.includes(concept));
}

/**
 * Get problems by type
 */
function getProblemsByType(type) {
  return SAMPLE_PROBLEMS.filter(p => p.type === type);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SAMPLE_PROBLEMS,
    initializeSampleProblems,
    getRandomProblem,
    getProblemsByConcept,
    getProblemsByType
  };
}
