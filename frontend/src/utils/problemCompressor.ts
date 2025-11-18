/**
 * Problem Compression Utility
 * Compresses problem data into a single-line format for efficient display
 */

export interface Problem {
  id: string;
  type: string;
  subject: string;
  difficulty: number;
  title: string;
  description: string;
  data?: any;
}

export interface CompressedProblem {
  id: string;
  compressed: string;
  original: Problem;
}

/**
 * Compress a problem into a single-line format
 * Format: [TYPE] Subject • Lv.X • Title (first 50 chars)
 */
export function compressProblem(problem: Problem): CompressedProblem {
  const typeIcon = getProblemTypeIcon(problem.type);
  const difficultyLevel = `Lv.${problem.difficulty}`;

  // Truncate title to 50 characters
  const truncatedTitle = problem.title.length > 50
    ? problem.title.substring(0, 47) + '...'
    : problem.title;

  // Build compressed format
  const compressed = `${typeIcon} ${problem.subject} • ${difficultyLevel} • ${truncatedTitle}`;

  return {
    id: problem.id,
    compressed,
    original: problem
  };
}

/**
 * Compress multiple problems
 */
export function compressProblems(problems: Problem[]): CompressedProblem[] {
  return problems.map(compressProblem);
}

/**
 * Get icon/prefix for problem type
 */
function getProblemTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    'multiple-choice': '[MC]',
    'short-answer': '[SA]',
    'fraction': '[FR]',
    'calculation': '[CA]',
    'visualization': '[VI]',
    'essay': '[ES]',
    'coding': '[CO]',
  };

  return icons[type] || '[??]';
}

/**
 * Extract key metadata from problem for tooltip/details
 */
export function getProblemMetadata(problem: Problem): string {
  const lines = [
    `ID: ${problem.id}`,
    `Type: ${problem.type}`,
    `Subject: ${problem.subject}`,
    `Difficulty: ${problem.difficulty}/5`,
    `Title: ${problem.title}`,
    `Description: ${problem.description.substring(0, 100)}${problem.description.length > 100 ? '...' : ''}`
  ];

  return lines.join('\n');
}
