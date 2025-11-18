import { PlaceStairProblem, ProblemConfig } from '../types';

/**
 * Generate Place Stair problems dynamically
 * This service creates problems that teach place value concepts
 */
class ProblemGenerator {
  /**
   * Generate a set of problems based on configuration
   */
  generateProblems(config: ProblemConfig): PlaceStairProblem[] {
    const problems: PlaceStairProblem[] = [];

    for (let i = 0; i < config.count; i++) {
      const number = this.generateNumber(config.minValue, config.maxValue);
      const type = this.selectProblemType(config.difficulty);
      const problem = this.createProblem(i + 1, number, type, config.difficulty);
      problems.push(problem);
    }

    return problems;
  }

  /**
   * Generate a random number within range
   */
  private generateNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Select problem type based on difficulty
   */
  private selectProblemType(difficulty: number): PlaceStairProblem['type'] {
    const types: PlaceStairProblem['type'][] = ['identification', 'composition', 'decomposition', 'comparison'];

    if (difficulty <= 2) {
      return 'identification'; // Easiest: identify place values
    } else if (difficulty === 3) {
      return Math.random() > 0.5 ? 'composition' : 'decomposition';
    } else {
      return types[Math.floor(Math.random() * types.length)];
    }
  }

  /**
   * Create a specific problem based on type
   */
  private createProblem(id: number, number: number, type: PlaceStairProblem['type'], difficulty: number): PlaceStairProblem {
    const maxDigits = number.toString().length;

    let question = '';
    let hints: string[] = [];

    switch (type) {
      case 'identification':
        question = `${number}에서 각 자리값을 찾아보세요.`;
        hints = ['일의 자리부터 시작해보세요', '각 숫자가 어느 위치에 있는지 생각해보세요'];
        break;

      case 'composition':
        const digits = this.getPlaceValues(number);
        question = `${Object.entries(digits).map(([place, val]) => `${val}${this.getPlaceNameKorean(place)}`).join(' + ')}은 무엇일까요?`;
        hints = ['각 자리값을 더해보세요', '계단의 높이를 생각해보세요'];
        break;

      case 'decomposition':
        question = `${number}을(를) 자리값으로 나누어보세요.`;
        hints = ['각 숫자가 실제로 나타내는 값을 생각해보세요', '예: 345 = 300 + 40 + 5'];
        break;

      case 'comparison':
        const otherNumber = this.generateNumber(number - 100, number + 100);
        question = `${number}과(와) ${otherNumber} 중 어느 수가 더 클까요?`;
        hints = ['가장 큰 자리값부터 비교해보세요', '백의 자리를 먼저 확인하세요'];
        break;
    }

    return {
      id,
      type,
      number,
      question,
      maxDigits,
      difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
      hints,
      createdAt: new Date()
    };
  }

  /**
   * Extract place values from a number
   */
  private getPlaceValues(num: number): { [key: string]: number } {
    const str = num.toString();
    const result: { [key: string]: number } = {};
    const places = ['ones', 'tens', 'hundreds', 'thousands'];

    for (let i = 0; i < str.length; i++) {
      const digit = parseInt(str[str.length - 1 - i]);
      const value = digit * Math.pow(10, i);
      if (value > 0) {
        result[places[i]] = value;
      }
    }

    return result;
  }

  /**
   * Get Korean name for place value
   */
  private getPlaceNameKorean(place: string): string {
    const names: { [key: string]: string } = {
      'ones': '일',
      'tens': '십',
      'hundreds': '백',
      'thousands': '천'
    };
    return names[place] || '';
  }

  /**
   * Validate student answer
   */
  validateAnswer(problem: PlaceStairProblem, answer: any): { isCorrect: boolean; feedback: string } {
    const correctValues = this.getPlaceValues(problem.number);

    let isCorrect = true;
    let feedback = '';

    switch (problem.type) {
      case 'identification':
      case 'decomposition':
        // Check if all place values match
        for (const place in correctValues) {
          if (answer[place] !== correctValues[place]) {
            isCorrect = false;
            feedback += `${this.getPlaceNameKorean(place)}의 자리값이 틀렸습니다. `;
          }
        }

        if (isCorrect) {
          feedback = '정답입니다! 자리값을 정확히 이해하셨네요!';
        } else {
          feedback += '다시 한 번 생각해보세요.';
        }
        break;

      case 'composition':
        if (answer.result === problem.number) {
          isCorrect = true;
          feedback = '정답입니다! 자리값을 잘 합쳤어요!';
        } else {
          isCorrect = false;
          feedback = `틀렸습니다. 정답은 ${problem.number}입니다.`;
        }
        break;

      case 'comparison':
        // Comparison logic would go here
        break;
    }

    return { isCorrect, feedback };
  }
}

export default new ProblemGenerator();
