import { EquationStep } from '../types';

export interface EquationState {
  left: string;
  right: string;
  steps: EquationStep[];
}

// Parse equation string like "2x + 5" into components
export function parseEquation(equation: string): { coefficient: number; constant: number } {
  const cleaned = equation.trim().replace(/\s+/g, '');

  // Handle simple cases like "7", "x", "2x", "x + 3", "2x - 4", etc.
  let coefficient = 0;
  let constant = 0;

  // Match patterns like "2x", "x", "-x", "-2x"
  const xMatch = cleaned.match(/([+-]?\d*)x/);
  if (xMatch) {
    const coefStr = xMatch[1];
    if (coefStr === '' || coefStr === '+') {
      coefficient = 1;
    } else if (coefStr === '-') {
      coefficient = -1;
    } else {
      coefficient = parseInt(coefStr);
    }
  }

  // Match patterns like "+ 5", "- 3", just "7"
  const constMatch = cleaned.match(/([+-]?\d+)(?!.*x)/);
  if (constMatch && !cleaned.match(/^[+-]?\d+x$/)) {
    constant = parseInt(constMatch[1]);
  }

  return { coefficient, constant };
}

// Apply operation to both sides of equation
export function applyOperation(
  state: EquationState,
  operation: 'add' | 'subtract' | 'multiply' | 'divide',
  value: number
): EquationState {
  const leftParsed = parseEquation(state.left);
  const rightParsed = parseEquation(state.right);

  let newLeft = { ...leftParsed };
  let newRight = { ...rightParsed };

  switch (operation) {
    case 'add':
      newLeft.constant += value;
      newRight.constant += value;
      break;
    case 'subtract':
      newLeft.constant -= value;
      newRight.constant -= value;
      break;
    case 'multiply':
      newLeft.coefficient *= value;
      newLeft.constant *= value;
      newRight.coefficient *= value;
      newRight.constant *= value;
      break;
    case 'divide':
      if (value === 0) throw new Error('Cannot divide by zero');
      newLeft.coefficient /= value;
      newLeft.constant /= value;
      newRight.coefficient /= value;
      newRight.constant /= value;
      break;
  }

  const newLeftStr = formatEquationSide(newLeft.coefficient, newLeft.constant);
  const newRightStr = formatEquationSide(newRight.coefficient, newRight.constant);

  const newStep: EquationStep = {
    step: state.steps.length + 1,
    operation,
    value,
    leftSide: newLeftStr,
    rightSide: newRightStr,
  };

  return {
    left: newLeftStr,
    right: newRightStr,
    steps: [...state.steps, newStep],
  };
}

// Format equation side from coefficient and constant
export function formatEquationSide(coefficient: number, constant: number): string {
  let result = '';

  // Handle coefficient and x term
  if (coefficient !== 0) {
    if (coefficient === 1) {
      result = 'x';
    } else if (coefficient === -1) {
      result = '-x';
    } else {
      result = `${coefficient}x`;
    }
  }

  // Handle constant term
  if (constant !== 0) {
    if (coefficient !== 0) {
      if (constant > 0) {
        result += ` + ${constant}`;
      } else {
        result += ` - ${Math.abs(constant)}`;
      }
    } else {
      result = constant.toString();
    }
  }

  // If both are zero, return "0"
  if (result === '') {
    result = '0';
  }

  return result;
}

// Extract solution from simplified equation
export function extractSolution(left: string, right: string): string | null {
  const leftParsed = parseEquation(left);
  const rightParsed = parseEquation(right);

  // Check if left side is just "x" (coefficient = 1, constant = 0)
  if (leftParsed.coefficient === 1 && leftParsed.constant === 0 && rightParsed.coefficient === 0) {
    return `x = ${rightParsed.constant}`;
  }

  // Check if right side is just "x"
  if (rightParsed.coefficient === 1 && rightParsed.constant === 0 && leftParsed.coefficient === 0) {
    return `x = ${leftParsed.constant}`;
  }

  return null;
}

// Check if equation is solved (one side is just "x", other is a number)
export function isSolved(left: string, right: string): boolean {
  return extractSolution(left, right) !== null;
}

// Validate if a step is mathematically correct
export function validateStep(
  prevLeft: string,
  prevRight: string,
  newLeft: string,
  newRight: string,
  operation: string,
  value: number
): boolean {
  try {
    const state: EquationState = {
      left: prevLeft,
      right: prevRight,
      steps: [],
    };

    const result = applyOperation(state, operation as any, value);

    // Compare normalized forms (remove extra spaces)
    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

    return (
      normalize(result.left) === normalize(newLeft) &&
      normalize(result.right) === normalize(newRight)
    );
  } catch {
    return false;
  }
}

// Get hint for next step
export function getNextStepHint(left: string, right: string): string {
  const leftParsed = parseEquation(left);
  const rightParsed = parseEquation(right);

  // If left has a constant, suggest removing it
  if (leftParsed.constant !== 0) {
    const operation = leftParsed.constant > 0 ? '빼세요' : '더하세요';
    const value = Math.abs(leftParsed.constant);
    return `양변에 ${value}를 ${operation}`;
  }

  // If right has a variable term, suggest moving it
  if (rightParsed.coefficient !== 0) {
    const value = Math.abs(rightParsed.coefficient);
    return `양변에서 ${value}x를 빼세요`;
  }

  // If left coefficient is not 1, suggest dividing
  if (leftParsed.coefficient !== 1 && leftParsed.coefficient !== 0) {
    const value = Math.abs(leftParsed.coefficient);
    return `양변을 ${value}로 나누세요`;
  }

  return '거의 다 풀었어요!';
}
