/**
 * Sequence Calculation Module
 * 수열 계산 및 분석 로직
 */

class SequenceCalculator {
    constructor() {
        this.terms = [];
        this.analysis = null;
    }

    /**
     * 등차수열 계산
     */
    calculateArithmetic(a1, d, n, start = 1) {
        const terms = [];
        for (let i = 0; i < n; i++) {
            const index = start + i;
            const value = a1 + d * i;
            terms.push({ n: index, value: this.round(value) });
        }
        return terms;
    }

    /**
     * 등비수열 계산
     */
    calculateGeometric(a1, r, n, start = 0) {
        const terms = [];
        for (let i = 0; i < n; i++) {
            const index = start + i;
            const value = a1 * Math.pow(r, i);
            terms.push({ n: index, value: this.round(value) });
        }
        return terms;
    }

    /**
     * 조화수열 계산
     */
    calculateHarmonic(n, start = 1) {
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
    calculateCustom(formula, n, start = 1) {
        const terms = [];
        for (let i = 0; i < n; i++) {
            const index = start + i;
            try {
                const value = this.evaluateFormula(formula, index);
                terms.push({ n: index, value: this.round(value) });
            } catch (e) {
                console.error('Formula evaluation error:', e);
                terms.push({ n: index, value: 0, error: true });
            }
        }
        return terms;
    }

    /**
     * 수식 평가
     */
    evaluateFormula(formula, n) {
        // 간단한 수식 평가 (보안상 제한적)
        let expr = formula.replace(/a_n\s*=\s*/, '');

        // (-1)^n 패턴 처리
        expr = expr.replace(/\(-1\)\^n/g, `(${Math.pow(-1, n)})`);
        expr = expr.replace(/\(-1\)\*\*n/g, `(${Math.pow(-1, n)})`);

        // n을 실제 값으로 치환
        expr = expr.replace(/\bn\b/g, n.toString());

        // ^를 **로 변환 (JavaScript 거듭제곱 연산자)
        expr = expr.replace(/\^/g, '**');

        // Math 함수 지원
        expr = expr.replace(/sin/g, 'Math.sin');
        expr = expr.replace(/cos/g, 'Math.cos');
        expr = expr.replace(/tan/g, 'Math.tan');
        expr = expr.replace(/log/g, 'Math.log');
        expr = expr.replace(/sqrt/g, 'Math.sqrt');

        // 안전성 검사
        if (!/^[\d\.\+\-\*\/\(\)\s\*\*Math\.sincogtaqrlp]+$/.test(expr)) {
            throw new Error('Invalid formula');
        }

        // 평가
        return Function('"use strict"; return (' + expr + ')')();
    }

    /**
     * 수렴성 분석
     */
    analyzeSequence(terms) {
        if (terms.length < 3) {
            return {
                type: 'unknown',
                confidence: 0,
                limit: null
            };
        }

        const values = terms.map(t => t.value);
        const lastValues = values.slice(-10);

        // 분산 계산
        const variance = this.calculateVariance(lastValues);

        // 추세 계산
        const trend = this.calculateTrend(values);

        // 수렴 판정
        const convergenceThreshold = 0.0001;
        const divergenceThreshold = 1000000;

        const isConvergent = variance < convergenceThreshold;
        const isDivergent = Math.abs(values[values.length - 1]) > divergenceThreshold;
        const isOscillating = trend.oscillating && variance < 1;

        let type = 'unknown';
        let limit = null;

        if (isOscillating) {
            type = 'oscillating';
            limit = this.estimateLimit(lastValues);
        } else if (isConvergent) {
            type = 'convergent';
            limit = this.round(values[values.length - 1]);
        } else if (isDivergent) {
            type = 'divergent';
        } else {
            // 값의 절댓값이 감소하는지 확인
            const absValues = values.map(Math.abs);
            const isDecreasing = this.isMonotonicallyDecreasing(absValues.slice(-20));

            if (isDecreasing) {
                type = 'convergent';
                limit = this.estimateLimit(lastValues);
            } else if (trend.increasingRatio > 0.7) {
                type = 'divergent';
            }
        }

        return {
            type,
            variance: this.round(variance),
            trend,
            limit,
            confidence: this.calculateConfidence(type, variance, trend)
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
     * 추세 계산
     */
    calculateTrend(values) {
        let signChanges = 0;
        let increasing = 0;
        let decreasing = 0;

        for (let i = 1; i < values.length; i++) {
            const diff = values[i] - values[i - 1];

            if (diff > 0) {
                increasing++;
            } else if (diff < 0) {
                decreasing++;
            }

            if (i > 1) {
                const prevDiff = values[i - 1] - values[i - 2];
                if (diff * prevDiff < 0) {
                    signChanges++;
                }
            }
        }

        const total = values.length - 1;

        return {
            increasingRatio: this.round(increasing / total),
            decreasingRatio: this.round(decreasing / total),
            signChanges,
            oscillating: signChanges > (values.length / 3)
        };
    }

    /**
     * 단조 감소 확인
     */
    isMonotonicallyDecreasing(values) {
        for (let i = 1; i < values.length; i++) {
            if (values[i] > values[i - 1]) {
                return false;
            }
        }
        return true;
    }

    /**
     * 극한값 추정
     */
    estimateLimit(values) {
        // 최근 값들의 평균을 극한값으로 추정
        const sum = values.reduce((a, b) => a + b, 0);
        return this.round(sum / values.length);
    }

    /**
     * 신뢰도 계산
     */
    calculateConfidence(type, variance, trend) {
        if (type === 'unknown') return 0;

        let confidence = 0.5;

        // 분산이 작을수록 신뢰도 증가
        if (variance < 0.001) confidence += 0.3;
        else if (variance < 0.01) confidence += 0.2;
        else if (variance < 0.1) confidence += 0.1;

        // 추세가 명확할수록 신뢰도 증가
        if (trend.increasingRatio > 0.8 || trend.decreasingRatio > 0.8) {
            confidence += 0.2;
        }

        return Math.min(this.round(confidence), 1.0);
    }

    /**
     * 반올림 헬퍼
     */
    round(value, decimals = 6) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }
}

// 전역 인스턴스
const sequenceCalculator = new SequenceCalculator();
