/**
 * Shuffle Service
 *
 * 문제와 답안을 고르게 섞는 핵심 서비스
 * Fisher-Yates Shuffle 알고리즘을 사용하여 균등 분포 보장
 *
 * @module ShuffleService
 */

const crypto = require('crypto');

/**
 * Seeded Random Number Generator
 * Linear Congruential Generator (LCG) 구현
 *
 * 참고: 동일한 시드로 항상 동일한 난수 시퀀스 생성
 */
class SeededRandom {
    /**
     * @param {number} seed - 난수 시드 (0 이상의 정수)
     */
    constructor(seed) {
        // LCG 파라미터: MINSTD (Park & Miller)
        this.seed = seed % 2147483647; // 2^31 - 1 (Mersenne prime)
        if (this.seed <= 0) {
            this.seed += 2147483646;
        }
    }

    /**
     * 다음 난수 생성 (0 이상 1 미만)
     * @returns {number} 0 ≤ n < 1
     */
    next() {
        this.seed = (this.seed * 16807) % 2147483647; // 7^5
        return (this.seed - 1) / 2147483646;
    }

    /**
     * 특정 범위의 정수 난수 생성
     * @param {number} min - 최소값 (포함)
     * @param {number} max - 최대값 (미포함)
     * @returns {number} min ≤ n < max
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min)) + min;
    }
}

/**
 * Shuffle Service 클래스
 */
class ShuffleService {
    /**
     * Fisher-Yates Shuffle 알고리즘
     *
     * 시간 복잡도: O(n)
     * 공간 복잡도: O(n) - 원본 배열을 복사하므로
     *
     * 모든 순열이 동일한 확률(1/n!)로 나타나는 것을 보장
     *
     * @param {Array} array - 셔플할 배열
     * @param {number} seed - 난수 시드
     * @returns {Array} 셔플된 배열 (새로운 배열)
     */
    static fisherYatesShuffle(array, seed) {
        if (!Array.isArray(array)) {
            throw new TypeError('First argument must be an array');
        }

        if (array.length === 0) {
            return [];
        }

        const rng = new SeededRandom(seed);
        const shuffled = [...array]; // 원본 배열 복사

        // Fisher-Yates 알고리즘
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = rng.nextInt(0, i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;
    }

    /**
     * 학생별 고유 셔플 시드 생성
     *
     * 학생 ID와 문제 세트 ID를 조합하여 고유한 시드 생성
     * 동일한 입력에 대해 항상 동일한 시드를 반환
     *
     * @param {string} studentId - 학생 UUID
     * @param {string} questionSetId - 문제 세트 UUID
     * @returns {number} 시드 값 (양의 정수)
     */
    static generateShuffleSeed(studentId, questionSetId) {
        const combined = `${studentId}-${questionSetId}`;

        // SHA-256 해시 생성
        const hash = crypto.createHash('sha256').update(combined).digest();

        // 해시의 첫 4바이트를 정수로 변환
        const seed = hash.readUInt32BE(0);

        return seed;
    }

    /**
     * 문제 순서 셔플
     *
     * @param {Array<Object>} questions - 문제 배열
     * @param {number} seed - 셔플 시드
     * @param {Object} options - 셔플 옵션
     * @param {boolean} options.preserveGroups - 그룹 유지 여부
     * @param {boolean} options.preserveDifficultyOrder - 난이도 순서 유지 여부
     * @param {boolean} options.sectionBased - 섹션별 독립 셔플
     * @returns {Array<Object>} 셔플된 문제 배열
     */
    static shuffleQuestions(questions, seed, options = {}) {
        const {
            preserveGroups = false,
            preserveDifficultyOrder = false,
            sectionBased = false
        } = options;

        // 섹션별 셔플
        if (sectionBased) {
            return this._shuffleBySection(questions, seed);
        }

        // 난이도 순서 유지
        if (preserveDifficultyOrder) {
            return this._shufflePreservingDifficulty(questions, seed);
        }

        // 그룹 유지
        if (preserveGroups) {
            return this._shufflePreservingGroups(questions, seed);
        }

        // 일반 셔플
        return this.fisherYatesShuffle(questions, seed);
    }

    /**
     * 답안 선택지 셔플
     *
     * @param {Array<Object>} choices - 선택지 배열
     * @param {number} seed - 셔플 시드
     * @returns {Array<Object>} 셔플된 선택지 배열
     */
    static shuffleAnswerChoices(choices, seed) {
        // is_fixed가 true인 선택지는 제외
        const fixedChoices = choices.filter(c => c.is_fixed);
        const shuffleableChoices = choices.filter(c => !c.is_fixed);

        // 셔플 가능한 선택지만 셔플
        const shuffled = this.fisherYatesShuffle(shuffleableChoices, seed);

        // 고정 선택지를 끝에 추가
        return [...shuffled, ...fixedChoices];
    }

    /**
     * 섹션별 독립 셔플
     *
     * @private
     */
    static _shuffleBySection(questions, seed) {
        const sections = {};

        // 섹션별로 그룹화
        questions.forEach(q => {
            const section = q.section || 'default';
            if (!sections[section]) {
                sections[section] = [];
            }
            sections[section].push(q);
        });

        // 각 섹션 독립적으로 셔플
        const result = [];
        Object.keys(sections).sort().forEach((section, index) => {
            const sectionSeed = seed + index; // 섹션별 다른 시드
            const shuffled = this.fisherYatesShuffle(sections[section], sectionSeed);
            result.push(...shuffled);
        });

        return result;
    }

    /**
     * 난이도 순서 유지하며 셔플
     *
     * @private
     */
    static _shufflePreservingDifficulty(questions, seed) {
        const byDifficulty = {};

        // 난이도별로 그룹화
        questions.forEach(q => {
            const level = q.difficulty_level || 3;
            if (!byDifficulty[level]) {
                byDifficulty[level] = [];
            }
            byDifficulty[level].push(q);
        });

        // 각 난이도 레벨 내에서만 셔플
        const result = [];
        Object.keys(byDifficulty).sort((a, b) => a - b).forEach((level, index) => {
            const levelSeed = seed + index;
            const shuffled = this.fisherYatesShuffle(byDifficulty[level], levelSeed);
            result.push(...shuffled);
        });

        return result;
    }

    /**
     * 그룹 유지하며 셔플
     *
     * @private
     */
    static _shufflePreservingGroups(questions, seed) {
        const groups = {};
        const standalone = [];

        // 그룹화
        questions.forEach(q => {
            if (q.group_id) {
                if (!groups[q.group_id]) {
                    groups[q.group_id] = [];
                }
                groups[q.group_id].push(q);
            } else {
                standalone.push(q);
            }
        });

        // 그룹을 단일 단위로 취급
        const groupUnits = Object.keys(groups).map(groupId => ({
            type: 'group',
            items: groups[groupId]
        }));

        const standaloneUnits = standalone.map(q => ({
            type: 'standalone',
            items: [q]
        }));

        const allUnits = [...groupUnits, ...standaloneUnits];

        // 단위 셔플
        const shuffledUnits = this.fisherYatesShuffle(allUnits, seed);

        // 평탄화
        const result = [];
        shuffledUnits.forEach(unit => {
            result.push(...unit.items);
        });

        return result;
    }

    /**
     * 전체 셔플 프로세스 실행
     *
     * @param {Object} params
     * @param {string} params.studentId - 학생 ID
     * @param {string} params.questionSetId - 문제 세트 ID
     * @param {Array<Object>} params.questions - 문제 배열
     * @param {boolean} params.shuffleQuestions - 문제 셔플 여부
     * @param {boolean} params.shuffleAnswers - 답안 셔플 여부
     * @param {Object} params.options - 셔플 옵션
     * @returns {Object} 셔플 결과
     */
    static performShuffle(params) {
        const {
            studentId,
            questionSetId,
            questions,
            shuffleQuestions = true,
            shuffleAnswers = true,
            options = {}
        } = params;

        // 시드 생성
        const seed = this.generateShuffleSeed(studentId, questionSetId);

        // 문제 셔플
        const shuffledQuestions = shuffleQuestions
            ? this.shuffleQuestions(questions, seed, options)
            : [...questions];

        // 답안 셔플
        const answerOrderMap = {};
        if (shuffleAnswers) {
            shuffledQuestions.forEach((question, qIndex) => {
                if (question.choices && question.choices.length > 0) {
                    const choiceSeed = seed + qIndex;
                    const shuffledChoices = this.shuffleAnswerChoices(
                        question.choices,
                        choiceSeed
                    );

                    // 원본 인덱스 매핑 저장
                    const orderMap = shuffledChoices.map(choice => {
                        return question.choices.findIndex(c => c.id === choice.id);
                    });

                    answerOrderMap[question.id] = orderMap;
                    question.choices = shuffledChoices;
                }
            });
        }

        return {
            seed,
            questionOrder: shuffledQuestions.map(q => q.id),
            answerOrderMap,
            shuffledQuestions
        };
    }

    /**
     * 셔플 검증 (통계적 균등성 검증)
     *
     * @param {Array} array - 검증할 배열
     * @param {number} iterations - 반복 횟수
     * @returns {Object} 통계 결과
     */
    static validateUniformDistribution(array, iterations = 10000) {
        const n = array.length;
        const positionCounts = {};

        // 초기화
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                positionCounts[`${array[i]}-${j}`] = 0;
            }
        }

        // 반복 셔플
        for (let iter = 0; iter < iterations; iter++) {
            const shuffled = this.fisherYatesShuffle(array, iter);
            shuffled.forEach((value, position) => {
                positionCounts[`${value}-${position}`]++;
            });
        }

        // 통계 계산
        const expectedProbability = 1 / n;
        const expectedCount = iterations * expectedProbability;
        const counts = Object.values(positionCounts);
        const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
        const variance = counts.reduce((sum, count) => {
            return sum + Math.pow(count - avgCount, 2);
        }, 0) / counts.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / avgCount;

        return {
            expectedCount,
            actualAvgCount: avgCount,
            standardDeviation: stdDev,
            coefficientOfVariation,
            isUniform: coefficientOfVariation < 0.1, // 10% 이내면 균등
            details: positionCounts
        };
    }
}

module.exports = {
    ShuffleService,
    SeededRandom
};
