/**
 * Mock Data Generator
 * Generates sample problem data for demonstration
 */

const PROBLEM_TYPES = [
  'multiple-choice',
  'short-answer',
  'fraction',
  'calculation',
  'visualization',
  'essay',
  'coding'
];

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'History'
];

const PROBLEM_TEMPLATES = {
  fraction: {
    titles: [
      'Add two fractions with different denominators',
      'Subtract fractions and simplify',
      'Visualize fraction equivalence',
      'Compare fraction sizes',
      'Convert mixed numbers to improper fractions'
    ],
    descriptions: [
      'Given two fractions, find their sum and simplify the result.',
      'Subtract the second fraction from the first and express in lowest terms.',
      'Use visual models to show that two fractions are equivalent.',
      'Determine which fraction is larger using common denominators.',
      'Convert the mixed number to an improper fraction.'
    ]
  },
  'multiple-choice': {
    titles: [
      'Identify the correct formula',
      'Select the best answer',
      'Choose the appropriate method',
      'Find the correct solution',
      'Determine the right approach'
    ],
    descriptions: [
      'Which of the following formulas is correct for this scenario?',
      'Based on the given information, select the best answer.',
      'Choose the most appropriate method to solve this problem.',
      'Find which solution correctly addresses the question.',
      'Determine the right approach for this situation.'
    ]
  },
  calculation: {
    titles: [
      'Calculate the area of a circle',
      'Find the velocity given distance and time',
      'Compute the compound interest',
      'Determine the slope of a line',
      'Solve the quadratic equation'
    ],
    descriptions: [
      'Given radius r = 5cm, calculate the area using π ≈ 3.14159.',
      'An object travels 100 meters in 5 seconds. Calculate its average velocity.',
      'Calculate the final amount after 3 years with 5% annual interest compounded quarterly.',
      'Find the slope of the line passing through points (2, 3) and (5, 9).',
      'Solve the equation x² - 5x + 6 = 0 and find both roots.'
    ]
  }
};

const problemCache = new Map();

/**
 * Generate mock problems for a module
 */
export function generateMockProblems(moduleId, count = 50) {
  const cacheKey = `${moduleId}-${count}`;

  // Return cached data if available
  if (problemCache.has(cacheKey)) {
    return problemCache.get(cacheKey);
  }

  const problems = [];

  for (let i = 0; i < count; i++) {
    const type = PROBLEM_TYPES[i % PROBLEM_TYPES.length];
    const subject = SUBJECTS[i % SUBJECTS.length];
    const difficulty = (i % 5) + 1;

    const problem = generateProblem(moduleId, i, type, subject, difficulty);
    problems.push(problem);
  }

  // Cache the generated problems
  problemCache.set(cacheKey, problems);

  return problems;
}

/**
 * Generate a single problem
 */
function generateProblem(moduleId, index, type, subject, difficulty) {
  const templates = PROBLEM_TEMPLATES[type] || PROBLEM_TEMPLATES['multiple-choice'];
  const titleIndex = index % templates.titles.length;
  const descIndex = index % templates.descriptions.length;

  const problem = {
    id: `${moduleId}-problem-${String(index + 1).padStart(4, '0')}`,
    type,
    subject,
    difficulty,
    title: templates.titles[titleIndex],
    description: templates.descriptions[descIndex],
    data: generateProblemData(type, difficulty)
  };

  return problem;
}

/**
 * Generate problem-specific data
 */
function generateProblemData(type, difficulty) {
  switch (type) {
    case 'fraction':
      return {
        numerator1: Math.floor(Math.random() * 10) + 1,
        denominator1: Math.floor(Math.random() * 10) + 2,
        numerator2: Math.floor(Math.random() * 10) + 1,
        denominator2: Math.floor(Math.random() * 10) + 2,
        operation: ['add', 'subtract', 'multiply', 'divide'][Math.floor(Math.random() * 4)]
      };

    case 'multiple-choice':
      return {
        question: 'What is the correct answer?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: Math.floor(Math.random() * 4)
      };

    case 'calculation':
      return {
        expression: `${Math.floor(Math.random() * 100)} + ${Math.floor(Math.random() * 100)}`,
        expectedResult: null // Would be calculated
      };

    case 'coding':
      return {
        language: 'javascript',
        prompt: 'Write a function that solves this problem',
        starterCode: 'function solve() {\n  // Your code here\n}',
        testCases: [
          { input: [1, 2], expected: 3 },
          { input: [5, 7], expected: 12 }
        ]
      };

    default:
      return {
        content: 'Problem content goes here',
        maxLength: difficulty * 100
      };
  }
}

/**
 * Get a problem by ID
 */
export function getProblemById(problemId) {
  // Parse module ID from problem ID
  const match = problemId.match(/^(.+)-problem-(\d+)$/);
  if (!match) return null;

  const [, moduleId, indexStr] = match;
  const index = parseInt(indexStr) - 1;

  // Generate the problem set and find the specific problem
  const problems = generateMockProblems(moduleId, index + 1);
  return problems[index] || null;
}
