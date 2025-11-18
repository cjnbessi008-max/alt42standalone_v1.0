/**
 * Shuffle Service Unit Tests
 *
 * Fisher-Yates 알고리즘의 정확성 및 균등 분포 검증
 */

const { ShuffleService, SeededRandom } = require('../ShuffleService');

describe('SeededRandom', () => {
    test('should generate same sequence with same seed', () => {
        const rng1 = new SeededRandom(12345);
        const rng2 = new SeededRandom(12345);

        const sequence1 = Array.from({ length: 10 }, () => rng1.next());
        const sequence2 = Array.from({ length: 10 }, () => rng2.next());

        expect(sequence1).toEqual(sequence2);
    });

    test('should generate different sequences with different seeds', () => {
        const rng1 = new SeededRandom(12345);
        const rng2 = new SeededRandom(54321);

        const sequence1 = Array.from({ length: 10 }, () => rng1.next());
        const sequence2 = Array.from({ length: 10 }, () => rng2.next());

        expect(sequence1).not.toEqual(sequence2);
    });

    test('should generate numbers between 0 and 1', () => {
        const rng = new SeededRandom(12345);

        for (let i = 0; i < 1000; i++) {
            const num = rng.next();
            expect(num).toBeGreaterThanOrEqual(0);
            expect(num).toBeLessThan(1);
        }
    });

    test('nextInt should generate integers in specified range', () => {
        const rng = new SeededRandom(12345);

        for (let i = 0; i < 1000; i++) {
            const num = rng.nextInt(0, 10);
            expect(Number.isInteger(num)).toBe(true);
            expect(num).toBeGreaterThanOrEqual(0);
            expect(num).toBeLessThan(10);
        }
    });
});

describe('ShuffleService.fisherYatesShuffle', () => {
    test('should return empty array for empty input', () => {
        const result = ShuffleService.fisherYatesShuffle([], 12345);
        expect(result).toEqual([]);
    });

    test('should not modify original array', () => {
        const original = [1, 2, 3, 4, 5];
        const copy = [...original];

        ShuffleService.fisherYatesShuffle(original, 12345);

        expect(original).toEqual(copy);
    });

    test('should contain all original elements', () => {
        const original = [1, 2, 3, 4, 5];
        const shuffled = ShuffleService.fisherYatesShuffle(original, 12345);

        expect(shuffled.length).toBe(original.length);
        expect(shuffled.sort()).toEqual(original.sort());
    });

    test('should be deterministic with same seed', () => {
        const array = [1, 2, 3, 4, 5];

        const result1 = ShuffleService.fisherYatesShuffle(array, 12345);
        const result2 = ShuffleService.fisherYatesShuffle(array, 12345);

        expect(result1).toEqual(result2);
    });

    test('should produce different results with different seeds', () => {
        const array = [1, 2, 3, 4, 5];

        const result1 = ShuffleService.fisherYatesShuffle(array, 12345);
        const result2 = ShuffleService.fisherYatesShuffle(array, 54321);

        // 같을 확률이 1/120이므로 거의 항상 다름
        expect(result1).not.toEqual(result2);
    });

    test('should handle single element array', () => {
        const array = [42];
        const shuffled = ShuffleService.fisherYatesShuffle(array, 12345);

        expect(shuffled).toEqual([42]);
    });

    test('should handle two element array', () => {
        const array = [1, 2];
        const shuffled = ShuffleService.fisherYatesShuffle(array, 12345);

        expect(shuffled.length).toBe(2);
        expect(shuffled.includes(1)).toBe(true);
        expect(shuffled.includes(2)).toBe(true);
    });

    test('should throw TypeError for non-array input', () => {
        expect(() => {
            ShuffleService.fisherYatesShuffle('not an array', 12345);
        }).toThrow(TypeError);
    });
});

describe('ShuffleService.generateShuffleSeed', () => {
    test('should generate same seed for same inputs', () => {
        const studentId = 'student-123';
        const questionSetId = 'qset-456';

        const seed1 = ShuffleService.generateShuffleSeed(studentId, questionSetId);
        const seed2 = ShuffleService.generateShuffleSeed(studentId, questionSetId);

        expect(seed1).toBe(seed2);
    });

    test('should generate different seeds for different students', () => {
        const questionSetId = 'qset-456';

        const seed1 = ShuffleService.generateShuffleSeed('student-1', questionSetId);
        const seed2 = ShuffleService.generateShuffleSeed('student-2', questionSetId);

        expect(seed1).not.toBe(seed2);
    });

    test('should generate different seeds for different question sets', () => {
        const studentId = 'student-123';

        const seed1 = ShuffleService.generateShuffleSeed(studentId, 'qset-1');
        const seed2 = ShuffleService.generateShuffleSeed(studentId, 'qset-2');

        expect(seed1).not.toBe(seed2);
    });

    test('should generate positive integer seeds', () => {
        const seed = ShuffleService.generateShuffleSeed('student-123', 'qset-456');

        expect(Number.isInteger(seed)).toBe(true);
        expect(seed).toBeGreaterThan(0);
    });
});

describe('ShuffleService.validateUniformDistribution', () => {
    test('should validate uniform distribution for small array', () => {
        const array = [1, 2, 3, 4, 5];
        const result = ShuffleService.validateUniformDistribution(array, 10000);

        expect(result.isUniform).toBe(true);
        expect(result.coefficientOfVariation).toBeLessThan(0.1);
    });

    test('should detect expected count correctly', () => {
        const array = [1, 2, 3];
        const iterations = 9000;
        const result = ShuffleService.validateUniformDistribution(array, iterations);

        // 각 요소가 각 위치에 나타날 기대 횟수 = iterations / array.length
        const expectedCount = iterations / array.length;
        expect(result.expectedCount).toBe(expectedCount);
        expect(result.actualAvgCount).toBeCloseTo(expectedCount, 0);
    });
});

describe('ShuffleService.shuffleQuestions', () => {
    const sampleQuestions = [
        { id: 'q1', section: 'A', difficulty_level: 1, group_id: null },
        { id: 'q2', section: 'A', difficulty_level: 2, group_id: null },
        { id: 'q3', section: 'B', difficulty_level: 3, group_id: 'g1' },
        { id: 'q4', section: 'B', difficulty_level: 3, group_id: 'g1' },
        { id: 'q5', section: 'B', difficulty_level: 5, group_id: null }
    ];

    test('should shuffle normally without options', () => {
        const shuffled = ShuffleService.shuffleQuestions(sampleQuestions, 12345);

        expect(shuffled.length).toBe(sampleQuestions.length);
        expect(shuffled.map(q => q.id).sort()).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
    });

    test('should preserve groups when preserveGroups is true', () => {
        const shuffled = ShuffleService.shuffleQuestions(sampleQuestions, 12345, {
            preserveGroups: true
        });

        // q3와 q4는 같은 그룹이므로 인접해야 함
        const q3Index = shuffled.findIndex(q => q.id === 'q3');
        const q4Index = shuffled.findIndex(q => q.id === 'q4');

        expect(Math.abs(q3Index - q4Index)).toBe(1);
    });

    test('should preserve difficulty order when preserveDifficultyOrder is true', () => {
        const shuffled = ShuffleService.shuffleQuestions(sampleQuestions, 12345, {
            preserveDifficultyOrder: true
        });

        // 난이도가 증가하는지 확인 (같은 난이도 내에서는 섞임)
        for (let i = 1; i < shuffled.length; i++) {
            expect(shuffled[i].difficulty_level).toBeGreaterThanOrEqual(
                shuffled[i - 1].difficulty_level
            );
        }
    });

    test('should shuffle by section when sectionBased is true', () => {
        const shuffled = ShuffleService.shuffleQuestions(sampleQuestions, 12345, {
            sectionBased: true
        });

        // 섹션 A 문제들이 앞에, 섹션 B 문제들이 뒤에 있어야 함
        const sectionAQuestions = shuffled.filter(q => q.section === 'A');
        const sectionBQuestions = shuffled.filter(q => q.section === 'B');

        expect(sectionAQuestions.length).toBe(2);
        expect(sectionBQuestions.length).toBe(3);

        // 모든 섹션 A 문제가 섹션 B 문제보다 앞에 있어야 함
        const lastAIndex = shuffled.lastIndexOf(
            shuffled.find(q => q.section === 'A')
        );
        const firstBIndex = shuffled.indexOf(
            shuffled.find(q => q.section === 'B')
        );

        expect(lastAIndex).toBeLessThan(firstBIndex);
    });
});

describe('ShuffleService.shuffleAnswerChoices', () => {
    const sampleChoices = [
        { id: 'c1', text: 'Choice 1', is_fixed: false },
        { id: 'c2', text: 'Choice 2', is_fixed: false },
        { id: 'c3', text: 'Choice 3', is_fixed: false },
        { id: 'c4', text: 'None of the above', is_fixed: true }
    ];

    test('should shuffle non-fixed choices', () => {
        const shuffled = ShuffleService.shuffleAnswerChoices(sampleChoices, 12345);

        expect(shuffled.length).toBe(4);
    });

    test('should keep fixed choices at the end', () => {
        const shuffled = ShuffleService.shuffleAnswerChoices(sampleChoices, 12345);

        // 마지막 요소가 고정 선택지여야 함
        expect(shuffled[shuffled.length - 1].is_fixed).toBe(true);
        expect(shuffled[shuffled.length - 1].id).toBe('c4');
    });

    test('should not modify choices without is_fixed', () => {
        const allShuffleable = [
            { id: 'c1', text: 'Choice 1' },
            { id: 'c2', text: 'Choice 2' },
            { id: 'c3', text: 'Choice 3' }
        ];

        const shuffled = ShuffleService.shuffleAnswerChoices(allShuffleable, 12345);

        expect(shuffled.length).toBe(3);
        expect(shuffled.map(c => c.id).sort()).toEqual(['c1', 'c2', 'c3']);
    });
});

describe('ShuffleService.performShuffle', () => {
    const mockQuestions = [
        {
            id: 'q1',
            question_text: 'Question 1',
            choices: [
                { id: 'q1c1', text: 'A', is_fixed: false },
                { id: 'q1c2', text: 'B', is_fixed: false }
            ]
        },
        {
            id: 'q2',
            question_text: 'Question 2',
            choices: [
                { id: 'q2c1', text: 'A', is_fixed: false },
                { id: 'q2c2', text: 'B', is_fixed: false }
            ]
        }
    ];

    test('should return shuffle result with all required fields', () => {
        const result = ShuffleService.performShuffle({
            studentId: 'student-123',
            questionSetId: 'qset-456',
            questions: mockQuestions
        });

        expect(result).toHaveProperty('seed');
        expect(result).toHaveProperty('questionOrder');
        expect(result).toHaveProperty('answerOrderMap');
        expect(result).toHaveProperty('shuffledQuestions');
    });

    test('should generate consistent seed', () => {
        const result1 = ShuffleService.performShuffle({
            studentId: 'student-123',
            questionSetId: 'qset-456',
            questions: mockQuestions
        });

        const result2 = ShuffleService.performShuffle({
            studentId: 'student-123',
            questionSetId: 'qset-456',
            questions: mockQuestions
        });

        expect(result1.seed).toBe(result2.seed);
        expect(result1.questionOrder).toEqual(result2.questionOrder);
    });

    test('should shuffle both questions and answers when enabled', () => {
        const result = ShuffleService.performShuffle({
            studentId: 'student-123',
            questionSetId: 'qset-456',
            questions: mockQuestions,
            shuffleQuestions: true,
            shuffleAnswers: true
        });

        expect(result.questionOrder).toHaveLength(2);
        expect(Object.keys(result.answerOrderMap)).toHaveLength(2);
    });

    test('should not shuffle when disabled', () => {
        const result = ShuffleService.performShuffle({
            studentId: 'student-123',
            questionSetId: 'qset-456',
            questions: mockQuestions,
            shuffleQuestions: false,
            shuffleAnswers: false
        });

        expect(result.questionOrder).toEqual(['q1', 'q2']);
        expect(result.answerOrderMap).toEqual({});
    });
});

describe('Statistical Validation (Integration Test)', () => {
    test('Fisher-Yates should produce uniform distribution', () => {
        const array = [1, 2, 3, 4, 5];
        const iterations = 100000;
        const positionCounts = {};

        // 초기화
        for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < array.length; j++) {
                positionCounts[`${array[i]}-${j}`] = 0;
            }
        }

        // 반복 셔플
        for (let iter = 0; iter < iterations; iter++) {
            const shuffled = ShuffleService.fisherYatesShuffle(array, iter);
            shuffled.forEach((value, position) => {
                positionCounts[`${value}-${position}`]++;
            });
        }

        // 각 위치에 각 값이 나타날 기대 확률 = 1/5 = 20%
        const expectedProbability = 0.2;
        const tolerance = 0.01; // 1% 오차 허용

        Object.entries(positionCounts).forEach(([key, count]) => {
            const actualProbability = count / iterations;
            expect(Math.abs(actualProbability - expectedProbability)).toBeLessThan(tolerance);
        });
    }, 30000); // 30초 타임아웃
});
