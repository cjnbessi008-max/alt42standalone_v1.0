/**
 * LogCalculator - 로그 계산 및 단계별 분석 클래스
 */

class LogCalculator {
    constructor() {
        this.base = 2;
        this.value = 8;
        this.result = 0;
        this.steps = [];
        this.currentStep = 0;
    }

    /**
     * 로그 계산 설정
     * @param {number} base - 로그의 밑
     * @param {number} value - 로그의 진수
     */
    setParameters(base, value) {
        this.base = parseInt(base);
        this.value = parseInt(value);
        this.steps = [];
        this.currentStep = 0;

        // 입력 유효성 검사
        if (this.base <= 1) {
            throw new Error('밑(base)은 1보다 커야 합니다.');
        }
        if (this.value <= 0) {
            throw new Error('진수(value)는 0보다 커야 합니다.');
        }
    }

    /**
     * 로그 계산 실행 및 단계 생성
     * @returns {Object} 계산 결과 및 단계 정보
     */
    calculate() {
        this.steps = [];

        // Step 1: 초기 설정
        this.steps.push({
            stepNumber: 1,
            title: '문제 설정',
            description: `log<sub>${this.base}</sub>(${this.value})의 값을 구합니다.`,
            formula: `log<sub>${this.base}</sub>(${this.value}) = ?`,
            explanation: `${this.base}를 몇 번 곱해야 ${this.value}가 되는지 찾습니다.`,
            type: 'setup',
            values: {
                base: this.base,
                value: this.value,
                current: 1,
                power: 0
            }
        });

        // 실제 로그 값 계산
        this.result = Math.log(this.value) / Math.log(this.base);

        // 정수인 경우 단계별 계산 표시
        if (Number.isInteger(this.result)) {
            this.generateIntegerSteps();
        } else {
            this.generateDecimalSteps();
        }

        return {
            result: this.result,
            steps: this.steps,
            isInteger: Number.isInteger(this.result)
        };
    }

    /**
     * 정수 결과를 위한 단계별 계산
     */
    generateIntegerSteps() {
        let current = 1;
        let power = 0;

        // Step 2-N: 반복 곱셈 과정
        while (current < this.value) {
            current *= this.base;
            power++;

            const isLastStep = (current === this.value);

            this.steps.push({
                stepNumber: this.steps.length + 1,
                title: `${power}번째 곱셈`,
                description: `${this.base}<sup>${power}</sup> = ${current}`,
                formula: `${this.base} × ${current / this.base} = ${current}`,
                explanation: isLastStep
                    ? `✓ ${this.base}<sup>${power}</sup> = ${this.value}이므로 답을 찾았습니다!`
                    : `${current} < ${this.value}이므로 계속 곱합니다.`,
                type: isLastStep ? 'complete' : 'calculation',
                values: {
                    base: this.base,
                    value: this.value,
                    current: current,
                    power: power
                },
                isComplete: isLastStep
            });

            if (isLastStep) break;
        }

        // Final Step: 결과
        this.steps.push({
            stepNumber: this.steps.length + 1,
            title: '최종 답',
            description: `log<sub>${this.base}</sub>(${this.value}) = ${this.result}`,
            formula: `${this.base}<sup>${this.result}</sup> = ${this.value}`,
            explanation: `${this.base}를 ${this.result}번 곱하면 ${this.value}가 됩니다.`,
            type: 'result',
            values: {
                base: this.base,
                value: this.value,
                current: this.value,
                power: this.result
            },
            isComplete: true
        });
    }

    /**
     * 소수 결과를 위한 단계별 계산
     */
    generateDecimalSteps() {
        // Step 2: 근사값 찾기 시작
        let lowerPower = Math.floor(this.result);
        let upperPower = lowerPower + 1;
        let lowerValue = Math.pow(this.base, lowerPower);
        let upperValue = Math.pow(this.base, upperPower);

        this.steps.push({
            stepNumber: 2,
            title: '범위 찾기',
            description: `${this.base}<sup>${lowerPower}</sup> < ${this.value} < ${this.base}<sup>${upperPower}</sup>`,
            formula: `${lowerValue.toFixed(2)} < ${this.value} < ${upperValue.toFixed(2)}`,
            explanation: `${this.value}는 ${lowerPower}과 ${upperPower} 사이에 있습니다.`,
            type: 'calculation',
            values: {
                base: this.base,
                value: this.value,
                lowerPower: lowerPower,
                upperPower: upperPower,
                lowerValue: lowerValue,
                upperValue: upperValue
            }
        });

        // Step 3: 선형 보간
        const ratio = (this.value - lowerValue) / (upperValue - lowerValue);
        const approximation = lowerPower + ratio;

        this.steps.push({
            stepNumber: 3,
            title: '선형 보간',
            description: '비율을 이용한 근사값 계산',
            formula: `${lowerPower} + (${this.value} - ${lowerValue.toFixed(2)}) / (${upperValue.toFixed(2)} - ${lowerValue.toFixed(2)})`,
            explanation: `근사값: ${approximation.toFixed(4)}`,
            type: 'calculation',
            values: {
                ratio: ratio,
                approximation: approximation
            }
        });

        // Step 4: 정확한 값 계산
        this.steps.push({
            stepNumber: 4,
            title: '정확한 값',
            description: `log<sub>${this.base}</sub>(${this.value}) ≈ ${this.result.toFixed(6)}`,
            formula: `ln(${this.value}) / ln(${this.base})`,
            explanation: '자연로그를 이용한 정확한 계산',
            type: 'result',
            values: {
                exact: this.result
            },
            isComplete: true
        });
    }

    /**
     * 다음 단계로 이동
     * @returns {Object|null} 다음 단계 정보 또는 null
     */
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            return this.steps[this.currentStep];
        }
        return null;
    }

    /**
     * 이전 단계로 이동
     * @returns {Object|null} 이전 단계 정보 또는 null
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            return this.steps[this.currentStep];
        }
        return null;
    }

    /**
     * 현재 단계 정보 가져오기
     * @returns {Object} 현재 단계 정보
     */
    getCurrentStep() {
        return this.steps[this.currentStep] || null;
    }

    /**
     * 전체 단계 정보 가져오기
     * @returns {Array} 전체 단계 배열
     */
    getAllSteps() {
        return this.steps;
    }

    /**
     * 진행률 계산
     * @returns {number} 진행률 (0-100)
     */
    getProgress() {
        if (this.steps.length === 0) return 0;
        return Math.round((this.currentStep / (this.steps.length - 1)) * 100);
    }

    /**
     * 계산 초기화
     */
    reset() {
        this.currentStep = 0;
        this.steps = [];
        this.result = 0;
    }

    /**
     * 로그 계산의 성질을 이용한 추가 정보
     * @returns {Object} 로그의 성질 정보
     */
    getLogProperties() {
        const properties = [];

        // 로그의 곱셈 법칙
        if (this.value > 1) {
            const factor1 = 2;
            const factor2 = this.value / factor1;
            if (Number.isInteger(factor2)) {
                properties.push({
                    property: '곱셈 법칙',
                    formula: `log<sub>${this.base}</sub>(${this.value}) = log<sub>${this.base}</sub>(${factor1}) + log<sub>${this.base}</sub>(${factor2})`,
                    explanation: '로그의 곱셈은 덧셈으로 변환됩니다.'
                });
            }
        }

        // 로그의 거듭제곱 법칙
        const sqrt = Math.sqrt(this.value);
        if (Number.isInteger(sqrt)) {
            properties.push({
                property: '거듭제곱 법칙',
                formula: `log<sub>${this.base}</sub>(${this.value}) = 2 × log<sub>${this.base}</sub>(${sqrt})`,
                explanation: '로그의 거듭제곱은 곱셈으로 변환됩니다.'
            });
        }

        // 밑 변환 공식
        properties.push({
            property: '밑 변환 공식',
            formula: `log<sub>${this.base}</sub>(${this.value}) = log(${this.value}) / log(${this.base})`,
            explanation: '다른 밑의 로그로 변환할 수 있습니다.'
        });

        return properties;
    }

    /**
     * 계산 결과를 JSON 형식으로 반환
     * @returns {string} JSON 문자열
     */
    toJSON() {
        return JSON.stringify({
            base: this.base,
            value: this.value,
            result: this.result,
            steps: this.steps,
            currentStep: this.currentStep,
            progress: this.getProgress(),
            properties: this.getLogProperties()
        }, null, 2);
    }
}

// 전역에서 사용 가능하도록 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogCalculator;
}
