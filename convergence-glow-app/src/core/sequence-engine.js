/**
 * Sequence Calculation Engine
 * 개선된 수열 계산 및 분석 엔진
 */

export class SequenceEngine {
    constructor() {
        this.cache = new Map();
    }

    /**
     * 수열 항 계산
     */
    calculate(problem, numTerms = 50) {
        const cacheKey = `${problem.id}-${numTerms}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let terms;

        switch (problem.type) {
            case 'arithmetic':
                terms = this.calculateArithmetic(problem, numTerms);
                break;
            case 'geometric':
                terms = this.calculateGeometric(problem, numTerms);
                break;
            case 'harmonic':
                terms = this.calculateHarmonic(problem, numTerms);
                break;
            case 'custom':
                terms = this.calculateCustom(problem, numTerms);
                break;
            default:
                throw new Error(`Unknown sequence type: ${problem.type}`);
        }

        const result = {
            terms,
            analysis: this.analyze(terms, problem.convergenceType)
        };

        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * 등차수열 계산
     */
    calculateArithmetic(problem, n) {
        const { initialTerm, commonDifference } = problem;
        const start = problem.formula.nStart || 1;
        const terms = [];

        for (let i = 0; i < n; i++) {
            const index = start + i;
            const value = initialTerm + commonDifference * i;
            terms.push({ n: index, value: this.round(value) });
        }

        return terms;
    }

    /**
     * 등비수열 계산
     */
    calculateGeometric(problem, n) {
        const { initialTerm, commonRatio } = problem;
        const start = problem.formula.nStart || 0;
        const terms = [];

        for (let i = 0; i < n; i++) {
            const index = start + i;
            const value = initialTerm * Math.pow(commonRatio, i);
            terms.push({ n: index, value: this.round(value) });
        }

        return terms;
    }

    /**
     * 조화수열 계산
     */
    calculateHarmonic(problem, n) {
        const start = problem.formula.nStart || 1;
        const terms = [];

        for (let i = 0; i < n; i++) {
            const index = start + i;
            const value = 1.0 / index;
            terms.push({ n: index, value: this.round(value) });
        }

        return terms;
    }

    /**
     * 사용자 정의 수열 계산
     */
    calculateCustom(problem, n) {
        const { expression } = problem.formula;
        const start = problem.formula.nStart || 1;
        const terms = [];

        for (let i = 0; i < n; i++) {
            const index = start + i;
            try {
                const value = this.evaluateExpression(expression, index);
                terms.push({ n: index, value: this.round(value) });
            } catch (error) {
                console.error(`Expression evaluation error at n=${index}:`, error);
                terms.push({ n: index, value: 0, error: true });
            }
        }

        return terms;
    }

    /**
     * 수식 평가 (안전한 방식)
     */
    evaluateExpression(expression, n) {
        // a_n = 제거
        let expr = expression.replace(/a_n\s*=\s*/, '').trim();

        // 수학 함수 매핑
        const mathFunctions = {
            'sqrt': Math.sqrt,
            'abs': Math.abs,
            'sin': Math.sin,
            'cos': Math.cos,
            'tan': Math.tan,
            'log': Math.log,
            'ln': Math.log,
            'exp': Math.exp,
            'floor': Math.floor,
            'ceil': Math.ceil,
            'round': Math.round
        };

        // (-1)^n 패턴 처리
        const powNegOne = Math.pow(-1, n);
        expr = expr.replace(/\(-1\)\s*\^\s*n/g, powNegOne.toString());
        expr = expr.replace(/\(-1\)\s*\*\*\s*n/g, powNegOne.toString());

        // n 치환
        expr = expr.replace(/\bn\b/g, n.toString());

        // ^ 를 ** 로 변환
        expr = expr.replace(/\^/g, '**');

        // 수학 함수 처리
        for (const [fn, impl] of Object.entries(mathFunctions)) {
            const regex = new RegExp(`\\b${fn}\\s*\\(([^)]+)\\)`, 'g');
            expr = expr.replace(regex, (match, arg) => {
                try {
                    const argValue = this.evaluateExpression(arg, n);
                    return impl(argValue).toString();
                } catch {
                    return match;
                }
            });
        }

        // 안전성 검사
        if (!/^[\d\.\+\-\*\/\(\)\s\*\*e]+$/.test(expr)) {
            throw new Error(`Unsafe expression: ${expr}`);
        }

        try {
            // 안전한 평가
            return Function('"use strict"; return (' + expr + ')')();
        } catch (error) {
            throw new Error(`Evaluation error: ${error.message}`);
        }
    }

    /**
     * 수열 분석
     */
    analyze(terms, expectedType) {
        if (terms.length < 3) {
            return {
                type: 'unknown',
                confidence: 0,
                details: {}
            };
        }

        const values = terms.map(t => t.value).filter(v => !isNaN(v));
        const lastValues = values.slice(-Math.min(10, values.length));

        // 기본 통계
        const stats = this.calculateStatistics(values);

        // 수렴성 판정
        const convergenceTest = this.testConvergence(values);
        const oscillationTest = this.testOscillation(values);
        const divergenceTest = this.testDivergence(values);

        // 타입 결정
        let detectedType = 'unknown';
        let confidence = 0.5;

        if (oscillationTest.isOscillating && convergenceTest.variance < 1) {
            detectedType = 'oscillating';
            confidence = Math.min(oscillationTest.confidence, convergenceTest.confidence);
        } else if (convergenceTest.isConvergent) {
            detectedType = 'convergent';
            confidence = convergenceTest.confidence;
        } else if (divergenceTest.isDivergent) {
            detectedType = 'divergent';
            confidence = divergenceTest.confidence;
        } else {
            // 추가 분석: 절댓값의 추세
            const absValues = values.map(Math.abs);
            const absDecreasing = this.isMonotonicallyDecreasing(absValues.slice(-20));

            if (absDecreasing) {
                detectedType = 'convergent';
                confidence = 0.7;
            } else {
                const trend = this.calculateTrend(values);
                if (trend.increasingRatio > 0.7) {
                    detectedType = 'divergent';
                    confidence = 0.6;
                }
            }
        }

        return {
            type: detectedType,
            expected: expectedType,
            confidence: this.round(confidence, 2),
            limitValue: convergenceTest.estimatedLimit,
            details: {
                variance: stats.variance,
                mean: stats.mean,
                range: stats.range,
                ...convergenceTest,
                ...oscillationTest,
                ...divergenceTest
            }
        };
    }

    /**
     * 수렴 테스트
     */
    testConvergence(values) {
        const lastValues = values.slice(-Math.min(10, values.length));
        const variance = this.calculateVariance(lastValues);
        const estimatedLimit = this.estimateLimit(lastValues);

        const isConvergent = variance < 0.0001;
        const confidence = isConvergent ? Math.max(0.8, 1 - Math.log10(variance + 1)) : 0.3;

        return {
            isConvergent,
            variance: this.round(variance, 6),
            estimatedLimit: this.round(estimatedLimit, 6),
            confidence: this.round(confidence, 2)
        };
    }

    /**
     * 진동 테스트
     */
    testOscillation(values) {
        let signChanges = 0;
        let consecutiveSigns = 0;

        for (let i = 1; i < values.length; i++) {
            if (values[i] * values[i - 1] < 0) {
                signChanges++;
            } else {
                consecutiveSigns++;
            }
        }

        const oscillationRatio = signChanges / (values.length - 1);
        const isOscillating = oscillationRatio > 0.3;
        const confidence = isOscillating ? Math.min(0.9, oscillationRatio * 2) : 0.2;

        return {
            isOscillating,
            signChanges,
            oscillationRatio: this.round(oscillationRatio, 2),
            confidence: this.round(confidence, 2)
        };
    }

    /**
     * 발산 테스트
     */
    testDivergence(values) {
        const lastValue = Math.abs(values[values.length - 1]);
        const isDivergent = lastValue > 1000000 || !isFinite(lastValue);

        // 증가율 계산
        const recentValues = values.slice(-5);
        let growthRates = [];

        for (let i = 1; i < recentValues.length; i++) {
            if (Math.abs(recentValues[i - 1]) > 0.001) {
                const rate = Math.abs(recentValues[i] / recentValues[i - 1]);
                growthRates.push(rate);
            }
        }

        const avgGrowthRate = growthRates.length > 0
            ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
            : 1;

        const confidence = isDivergent ? 0.95 : (avgGrowthRate > 1.5 ? 0.7 : 0.3);

        return {
            isDivergent,
            lastValue: this.round(lastValue, 2),
            avgGrowthRate: this.round(avgGrowthRate, 2),
            confidence: this.round(confidence, 2)
        };
    }

    /**
     * 통계 계산
     */
    calculateStatistics(values) {
        const n = values.length;
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / n;

        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
        const stdDev = Math.sqrt(variance);

        const min = Math.min(...values);
        const max = Math.max(...values);

        return {
            mean: this.round(mean, 6),
            variance: this.round(variance, 6),
            stdDev: this.round(stdDev, 6),
            min: this.round(min, 6),
            max: this.round(max, 6),
            range: this.round(max - min, 6)
        };
    }

    /**
     * 분산 계산
     */
    calculateVariance(values) {
        if (values.length === 0) return 0;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }

    /**
     * 극한값 추정
     */
    estimateLimit(values) {
        // 최근 값들의 가중 평균
        const weights = values.map((_, i) => i + 1);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);

        return weightedSum / totalWeight;
    }

    /**
     * 추세 계산
     */
    calculateTrend(values) {
        let increasing = 0;
        let decreasing = 0;

        for (let i = 1; i < values.length; i++) {
            const diff = values[i] - values[i - 1];
            if (diff > 0) increasing++;
            else if (diff < 0) decreasing++;
        }

        const total = values.length - 1;

        return {
            increasingRatio: this.round(increasing / total, 2),
            decreasingRatio: this.round(decreasing / total, 2)
        };
    }

    /**
     * 단조 감소 확인
     */
    isMonotonicallyDecreasing(values) {
        for (let i = 1; i < values.length; i++) {
            if (values[i] > values[i - 1] * 1.01) {  // 1% 여유
                return false;
            }
        }
        return true;
    }

    /**
     * 반올림 헬퍼
     */
    round(value, decimals = 6) {
        if (!isFinite(value)) return value;
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /**
     * 캐시 지우기
     */
    clearCache() {
        this.cache.clear();
    }
}

// 싱글톤 인스턴스
let engineInstance = null;

export function getSequenceEngine() {
    if (!engineInstance) {
        engineInstance = new SequenceEngine();
    }
    return engineInstance;
}

export default SequenceEngine;
