import { create } from 'zustand';
import { AppState, CompositionBlock, MathFunction, Problem, LTISession, Attempt } from '../types';

interface StoreActions {
  // 문제 관련
  setProblem: (problem: Problem) => void;

  // 함수 조립
  addFunction: (functionId: string) => void;
  removeFunction: (blockId: string) => void;
  reorderFunctions: (blocks: CompositionBlock[]) => void;
  clearComposition: () => void;

  // 계산
  setTestInput: (value: number) => void;
  calculateResult: () => void;

  // 제출
  submitAnswer: () => Promise<void>;

  // LTI
  setLTISession: (session: LTISession) => void;

  // UI
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

type Store = AppState & StoreActions;

// 기본 함수 정의
const defaultFunctions: MathFunction[] = [
  {
    id: 'f1',
    name: 'f',
    displayName: 'f(x) = x + 2',
    expression: 'x + 2',
    type: 'linear',
    calculate: (x) => x + 2,
    color: '#3b82f6', // blue-500
  },
  {
    id: 'g1',
    name: 'g',
    displayName: 'g(x) = 2x',
    expression: '2x',
    type: 'linear',
    calculate: (x) => 2 * x,
    color: '#10b981', // green-500
  },
  {
    id: 'h1',
    name: 'h',
    displayName: 'h(x) = x²',
    expression: 'x^2',
    type: 'quadratic',
    calculate: (x) => x * x,
    color: '#f59e0b', // amber-500
  },
  {
    id: 'k1',
    name: 'k',
    displayName: 'k(x) = x - 3',
    expression: 'x - 3',
    type: 'linear',
    calculate: (x) => x - 3,
    color: '#ef4444', // red-500
  },
  {
    id: 'm1',
    name: 'm',
    displayName: 'm(x) = 1/x',
    expression: '\\frac{1}{x}',
    type: 'inverse',
    calculate: (x) => (x !== 0 ? 1 / x : NaN),
    color: '#8b5cf6', // purple-500
  },
];

export const useStore = create<Store>((set, get) => ({
  // 초기 상태
  currentProblem: null,
  availableFunctions: defaultFunctions,
  composedFunctions: [],
  testInput: 0,
  calculationResult: null,
  submissionResult: null,
  ltiSession: null,
  isLoading: false,
  error: null,

  // 액션
  setProblem: (problem) => set({ currentProblem: problem }),

  addFunction: (functionId) => {
    const { composedFunctions } = get();
    const newBlock: CompositionBlock = {
      id: `block-${Date.now()}-${Math.random()}`,
      functionId,
      position: composedFunctions.length,
    };
    set({ composedFunctions: [...composedFunctions, newBlock] });
  },

  removeFunction: (blockId) => {
    const { composedFunctions } = get();
    const filtered = composedFunctions.filter((block) => block.id !== blockId);
    // 위치 재정렬
    const reordered = filtered.map((block, index) => ({
      ...block,
      position: index,
    }));
    set({ composedFunctions: reordered });
  },

  reorderFunctions: (blocks) => {
    const reordered = blocks.map((block, index) => ({
      ...block,
      position: index,
    }));
    set({ composedFunctions: reordered });
  },

  clearComposition: () => set({ composedFunctions: [], calculationResult: null }),

  setTestInput: (value) => set({ testInput: value }),

  calculateResult: () => {
    const { composedFunctions, availableFunctions, testInput } = get();

    if (composedFunctions.length === 0) {
      set({ calculationResult: testInput });
      return;
    }

    // 함수 합성 계산 (오른쪽에서 왼쪽으로)
    let result = testInput;

    // 역순으로 적용 (가장 안쪽 함수부터)
    for (let i = composedFunctions.length - 1; i >= 0; i--) {
      const block = composedFunctions[i];
      const func = availableFunctions.find((f) => f.id === block.functionId);

      if (func) {
        result = func.calculate(result);
      }
    }

    set({ calculationResult: result });
  },

  submitAnswer: async () => {
    const { currentProblem, composedFunctions, availableFunctions, ltiSession } = get();

    if (!currentProblem) {
      set({ error: '문제가 로드되지 않았습니다.' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // 테스트 케이스 검증
      let passedTests = 0;

      for (const testCase of currentProblem.testCases) {
        let result = testCase.input;

        // 합성함수 계산
        for (let i = composedFunctions.length - 1; i >= 0; i--) {
          const block = composedFunctions[i];
          const func = availableFunctions.find((f) => f.id === block.functionId);

          if (func) {
            result = func.calculate(result);
          }
        }

        // 결과 비교 (부동소수점 오차 고려)
        if (Math.abs(result - testCase.expectedOutput) < 0.0001) {
          passedTests++;
        }
      }

      const totalTests = currentProblem.testCases.length;
      const score = (passedTests / totalTests) * 100;
      const success = passedTests === totalTests;

      const attempt: Attempt = {
        problemId: currentProblem.id,
        studentId: ltiSession?.userId || 'anonymous',
        composition: composedFunctions,
        result: {
          success,
          passedTests,
          totalTests,
          score,
        },
        timestamp: new Date(),
      };

      // 서버에 제출
      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attempt),
      });

      if (!response.ok) {
        throw new Error('답안 제출 실패');
      }

      const savedAttempt = await response.json();

      set({
        submissionResult: savedAttempt.result,
        isLoading: false,
      });

    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        isLoading: false,
      });
    }
  },

  setLTISession: (session) => set({ ltiSession: session }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
