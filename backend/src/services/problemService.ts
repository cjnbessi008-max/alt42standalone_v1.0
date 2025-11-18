/**
 * 문제 관리 서비스
 * 닮음 문제 생성 및 답안 검증
 */

interface Shape {
  id: string;
  type: 'triangle' | 'rectangle' | 'polygon';
  vertices: Array<{ x: number; y: number }>;
  sides: number[];
  angles: number[];
}

interface ProblemData {
  id: string;
  title: string;
  description: string;
  shape1: Shape;
  shape2: Shape;
  correctAnswer: {
    isSimilar: boolean;
    condition?: string;
    ratio?: number;
  };
}

class ProblemService {
  private problems: Map<string, ProblemData>;

  constructor() {
    this.problems = new Map();
    this.initializeDemoProblems();
  }

  /**
   * 데모 문제 초기화
   */
  private initializeDemoProblems() {
    // 문제 1: SSS 닮음
    this.problems.set('problem-1', {
      id: 'problem-1',
      title: 'SSS 닮음 조건',
      description: '두 삼각형의 대응하는 세 변의 길이 비가 같은지 확인하세요.',
      shape1: {
        id: 'triangle-1',
        type: 'triangle',
        vertices: [
          { x: 50, y: 50 },
          { x: 150, y: 50 },
          { x: 100, y: 130 },
        ],
        sides: [100, 100, 89.44], // 정삼각형에 가까운 이등변삼각형
        angles: [60, 60, 60],
      },
      shape2: {
        id: 'triangle-2',
        type: 'triangle',
        vertices: [
          { x: 200, y: 50 },
          { x: 400, y: 50 },
          { x: 300, y: 210 },
        ],
        sides: [200, 200, 178.88], // 2배 확대
        angles: [60, 60, 60],
      },
      correctAnswer: {
        isSimilar: true,
        condition: 'SSS',
        ratio: 2,
      },
    });

    // 문제 2: AA 닮음
    this.problems.set('problem-2', {
      id: 'problem-2',
      title: 'AA 닮음 조건',
      description: '두 삼각형의 두 각이 각각 같은지 확인하세요.',
      shape1: {
        id: 'triangle-3',
        type: 'triangle',
        vertices: [
          { x: 50, y: 100 },
          { x: 150, y: 100 },
          { x: 150, y: 200 },
        ],
        sides: [100, 100, 141.42],
        angles: [45, 45, 90],
      },
      shape2: {
        id: 'triangle-4',
        type: 'triangle',
        vertices: [
          { x: 200, y: 100 },
          { x: 350, y: 100 },
          { x: 350, y: 250 },
        ],
        sides: [150, 150, 212.13],
        angles: [45, 45, 90],
      },
      correctAnswer: {
        isSimilar: true,
        condition: 'AA',
        ratio: 1.5,
      },
    });

    // 문제 3: 닮음이 아닌 경우
    this.problems.set('problem-3', {
      id: 'problem-3',
      title: '닮음이 아닌 삼각형',
      description: '이 두 삼각형이 닮음인지 확인하세요.',
      shape1: {
        id: 'triangle-5',
        type: 'triangle',
        vertices: [
          { x: 50, y: 50 },
          { x: 150, y: 50 },
          { x: 100, y: 130 },
        ],
        sides: [100, 100, 89.44],
        angles: [60, 60, 60],
      },
      shape2: {
        id: 'triangle-6',
        type: 'triangle',
        vertices: [
          { x: 200, y: 50 },
          { x: 350, y: 50 },
          { x: 250, y: 100 },
        ],
        sides: [150, 100, 111.80],
        angles: [30, 120, 30],
      },
      correctAnswer: {
        isSimilar: false,
      },
    });
  }

  /**
   * 모든 문제 가져오기
   */
  async getProblems(): Promise<ProblemData[]> {
    return Array.from(this.problems.values());
  }

  /**
   * 특정 문제 가져오기
   */
  async getProblem(problemId: string): Promise<ProblemData | null> {
    return this.problems.get(problemId) || null;
  }

  /**
   * 답안 검증
   */
  async checkAnswer(
    problemId: string,
    selectedCondition: string | null,
    calculatedRatio?: number
  ): Promise<{ correct: boolean; feedback: string }> {
    const problem = this.problems.get(problemId);

    if (!problem) {
      return {
        correct: false,
        feedback: '문제를 찾을 수 없습니다.',
      };
    }

    const { correctAnswer } = problem;

    // 닮음이 아닌 경우
    if (!correctAnswer.isSimilar) {
      if (selectedCondition === null) {
        return {
          correct: true,
          feedback: '정답입니다! 이 두 도형은 닮음이 아닙니다.',
        };
      } else {
        return {
          correct: false,
          feedback: '이 두 도형은 닮음이 아닙니다.',
        };
      }
    }

    // 닮음인 경우
    if (selectedCondition === correctAnswer.condition) {
      let feedback = `정답입니다! ${correctAnswer.condition} 닮음 조건이 성립합니다.`;

      if (correctAnswer.ratio && calculatedRatio) {
        const ratioCorrect = Math.abs(calculatedRatio - correctAnswer.ratio) < 0.1;
        if (ratioCorrect) {
          feedback += ` 닮음비도 정확합니다! (1:${correctAnswer.ratio})`;
        } else {
          feedback += ` 하지만 닮음비가 정확하지 않습니다. (정답: 1:${correctAnswer.ratio})`;
        }
      }

      return {
        correct: true,
        feedback,
      };
    } else {
      return {
        correct: false,
        feedback: `틀렸습니다. 올바른 닮음 조건은 ${correctAnswer.condition}입니다.`,
      };
    }
  }
}

export const problemService = new ProblemService();
