import { Character } from '../types';

/**
 * Character definitions for Quantifier Friends
 * Each character explains a specific quantifier type
 */

export const characters: Character[] = [
  {
    id: 'universal-owl',
    name: '올빼미 박사',
    avatar: '🦉',
    color: '#4A90E2',
    personality: 'wise',
    quantifierType: 'universal',
  },
  {
    id: 'existential-fox',
    name: '여우 탐정',
    avatar: '🦊',
    color: '#E94B3C',
    personality: 'curious',
    quantifierType: 'existential',
  },
];

export const characterMessages = {
  'universal-owl': {
    greeting: '안녕! 나는 올빼미 박사야. "모든"의 의미를 함께 알아보자!',
    introduction: '"모든"은 예외 없이 전부를 의미해. 단 하나라도 조건을 만족하지 않으면 거짓이 된단다.',
    examples: [
      '예: "모든 새는 날 수 있다" - 펭귄은 새지만 날지 못하므로 거짓이야!',
      '예: "모든 짝수는 2로 나누어떨어진다" - 모든 짝수가 조건을 만족하므로 참이야!',
    ],
    hints: [
      '모든 요소를 하나하나 확인해봐야 해!',
      '단 하나의 반례만 있어도 거짓이야!',
      '전부 다 조건을 만족해야 참이란다!',
    ],
    correct: '훌륭해! "모든"의 의미를 정확히 이해했구나!',
    incorrect: '아쉽지만 틀렸어. "모든"은 예외가 없어야 한다는 걸 기억해!',
  },
  'existential-fox': {
    greeting: '안녕! 나는 여우 탐정이야. "어떤"의 비밀을 찾아보자!',
    introduction: '"어떤"은 최소한 하나라도 있다는 의미야. 단 하나만 조건을 만족해도 참이 된단다.',
    examples: [
      '예: "어떤 새는 날지 못한다" - 펭귄이 있으므로 참이야!',
      '예: "어떤 소수는 짝수다" - 2가 있으므로 참이야!',
    ],
    hints: [
      '단 하나만 찾으면 돼!',
      '모든 요소를 확인할 필요는 없어!',
      '조건을 만족하는 예시를 하나라도 찾아봐!',
    ],
    correct: '완벽해! "어떤"의 의미를 정확히 알았구나!',
    incorrect: '아쉽지만 틀렸어. "어떤"은 하나만 있어도 된다는 걸 기억해!',
  },
};

export const getCharacterByType = (quantifierType: 'universal' | 'existential'): Character => {
  return characters.find(c => c.quantifierType === quantifierType) || characters[0];
};

export const getCharacterMessages = (characterId: string) => {
  return characterMessages[characterId as keyof typeof characterMessages] || characterMessages['universal-owl'];
};

export default characters;
