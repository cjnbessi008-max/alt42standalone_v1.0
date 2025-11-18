/**
 * Peak Detector - 수학 함수의 극대값/극소값 탐지
 * 수치 미분을 사용한 극값 찾기
 */

class PeakDetector {
    constructor() {
        this.epsilon = 0.001; // 미분 계산을 위한 작은 값
        this.threshold = 0.01; // 극값 판정 임계값
        this.minDistance = 0.1; // 극값 간 최소 거리
    }

    /**
     * 함수 문자열을 실행 가능한 함수로 변환
     * @param {string} funcStr - 함수 문자열 (예: "x*x - 4*x + 3")
     * @returns {Function} 실행 가능한 함수
     */
    parseFunction(funcStr) {
        try {
            // 안전성을 위해 eval 대신 Function 생성자 사용
            return new Function('x', `return ${funcStr};`);
        } catch (error) {
            console.error('함수 파싱 오류:', error);
            return (x) => x * x; // 기본 함수
        }
    }

    /**
     * 수치 미분 계산
     * @param {Function} func - 함수
     * @param {number} x - 미분할 점
     * @returns {number} 도함수 값 (기울기)
     */
    derivative(func, x) {
        const h = this.epsilon;
        return (func(x + h) - func(x - h)) / (2 * h);
    }

    /**
     * 이계 도함수 (곡률) 계산
     * @param {Function} func - 함수
     * @param {number} x - 계산할 점
     * @returns {number} 이계 도함수 값
     */
    secondDerivative(func, x) {
        const h = this.epsilon;
        return (func(x + h) - 2 * func(x) + func(x - h)) / (h * h);
    }

    /**
     * 극값 찾기 (극대, 극소)
     * @param {string|Function} funcInput - 함수 또는 함수 문자열
     * @param {number} min - 범위 최소값
     * @param {number} max - 범위 최대값
     * @param {number} step - 샘플링 간격
     * @returns {Array} 극값 배열 [{x, y, type: 'max'|'min'}]
     */
    findPeaks(funcInput, min = -10, max = 10, step = 0.01) {
        const func = typeof funcInput === 'string'
            ? this.parseFunction(funcInput)
            : funcInput;

        const peaks = [];
        let prevDerivative = this.derivative(func, min);

        for (let x = min + step; x <= max; x += step) {
            const currentDerivative = this.derivative(func, x);

            // 도함수의 부호가 바뀌는 지점 찾기 (극값 후보)
            if (Math.abs(currentDerivative) < this.threshold) {
                const secondDeriv = this.secondDerivative(func, x);
                const y = func(x);

                // 이계 도함수로 극대/극소 판별
                if (Math.abs(secondDeriv) > this.threshold) {
                    const peakType = secondDeriv < 0 ? 'maximum' : 'minimum';

                    // 너무 가까운 극값 제거
                    const isTooClose = peaks.some(peak =>
                        Math.abs(peak.x - x) < this.minDistance
                    );

                    if (!isTooClose && !isNaN(y) && isFinite(y)) {
                        peaks.push({
                            x: parseFloat(x.toFixed(4)),
                            y: parseFloat(y.toFixed(4)),
                            type: peakType,
                            curvature: Math.abs(secondDeriv)
                        });
                    }
                }
            }

            prevDerivative = currentDerivative;
        }

        // 극값 정렬 (x 좌표 기준)
        peaks.sort((a, b) => a.x - b.x);

        return peaks;
    }

    /**
     * 변곡점 찾기 (이계 도함수가 0인 지점)
     * @param {string|Function} funcInput - 함수
     * @param {number} min - 범위 최소값
     * @param {number} max - 범위 최대값
     * @param {number} step - 샘플링 간격
     * @returns {Array} 변곡점 배열
     */
    findInflectionPoints(funcInput, min, max, step = 0.01) {
        const func = typeof funcInput === 'string'
            ? this.parseFunction(funcInput)
            : funcInput;

        const inflectionPoints = [];

        for (let x = min; x <= max; x += step) {
            const secondDeriv = this.secondDerivative(func, x);

            if (Math.abs(secondDeriv) < this.threshold) {
                inflectionPoints.push({
                    x: parseFloat(x.toFixed(4)),
                    y: parseFloat(func(x).toFixed(4)),
                    type: 'inflection'
                });
            }
        }

        return inflectionPoints;
    }

    /**
     * 함수 그래프 데이터 생성
     * @param {string|Function} funcInput - 함수
     * @param {number} min - 범위 최소값
     * @param {number} max - 범위 최대값
     * @param {number} points - 생성할 점의 개수
     * @returns {Array} [{x, y}] 배열
     */
    generateGraphData(funcInput, min, max, points = 500) {
        const func = typeof funcInput === 'string'
            ? this.parseFunction(funcInput)
            : funcInput;

        const step = (max - min) / points;
        const data = [];

        for (let x = min; x <= max; x += step) {
            const y = func(x);
            if (!isNaN(y) && isFinite(y)) {
                data.push({
                    x: parseFloat(x.toFixed(4)),
                    y: parseFloat(y.toFixed(4))
                });
            }
        }

        return data;
    }

    /**
     * 함수의 범위 자동 계산
     * @param {Array} graphData - 그래프 데이터
     * @returns {object} {minY, maxY, rangeY}
     */
    calculateRange(graphData) {
        if (!graphData || graphData.length === 0) {
            return { minY: -10, maxY: 10, rangeY: 20 };
        }

        const yValues = graphData.map(point => point.y);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        const rangeY = maxY - minY;

        // 여백 추가 (10%)
        const padding = rangeY * 0.1;

        return {
            minY: minY - padding,
            maxY: maxY + padding,
            rangeY: rangeY + 2 * padding
        };
    }

    /**
     * 극값 분석 결과 요약
     * @param {Array} peaks - 극값 배열
     * @returns {object} 분석 결과
     */
    analyzePeaks(peaks) {
        const maxima = peaks.filter(p => p.type === 'maximum');
        const minima = peaks.filter(p => p.type === 'minimum');

        let globalMax = null;
        let globalMin = null;

        if (maxima.length > 0) {
            globalMax = maxima.reduce((prev, current) =>
                current.y > prev.y ? current : prev
            );
        }

        if (minima.length > 0) {
            globalMin = minima.reduce((prev, current) =>
                current.y < prev.y ? current : prev
            );
        }

        return {
            totalPeaks: peaks.length,
            maxima: maxima.length,
            minima: minima.length,
            globalMaximum: globalMax,
            globalMinimum: globalMin,
            peaks: peaks
        };
    }

    /**
     * 특정 점에서의 함수 정보
     * @param {Function} func - 함수
     * @param {number} x - x 좌표
     * @returns {object} 점의 정보
     */
    getPointInfo(func, x) {
        const y = func(x);
        const slope = this.derivative(func, x);
        const curvature = this.secondDerivative(func, x);

        return {
            x: parseFloat(x.toFixed(4)),
            y: parseFloat(y.toFixed(4)),
            slope: parseFloat(slope.toFixed(4)),
            curvature: parseFloat(curvature.toFixed(4)),
            isCritical: Math.abs(slope) < this.threshold,
            concavity: curvature > 0 ? 'concave up' : 'concave down'
        };
    }
}

// 전역 인스턴스
window.peakDetector = new PeakDetector();
