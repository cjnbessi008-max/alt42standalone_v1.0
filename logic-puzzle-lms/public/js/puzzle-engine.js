/**
 * Puzzle Engine
 * 논리식 구조 관리 및 검증
 */

export class PuzzleEngine {
    constructor() {
        this.problem = null;
        this.correctFormula = null;
    }

    /**
     * 엔진 초기화
     */
    init(problem) {
        this.problem = problem;
        this.correctFormula = problem.correct_formula;
        console.log('Puzzle Engine 초기화됨:', problem.title);
    }

    /**
     * 블록 배열에서 논리식 구조 생성
     * @param {Array} blocks - 작업 영역의 블록 배열
     * @returns {Object} 논리식 구조
     */
    buildFormula(blocks) {
        if (blocks.length === 0) {
            return null;
        }

        // 연결 관계 분석
        const connections = this.analyzeConnections(blocks);

        // 루트 블록 찾기 (출력이 없는 블록)
        const rootBlock = this.findRootBlock(blocks, connections);

        if (!rootBlock) {
            // 연결되지 않은 단일 블록
            return this.blockToFormula(blocks[0]);
        }

        return this.blockToFormula(rootBlock, blocks, connections);
    }

    /**
     * 블록 간 연결 관계 분석
     */
    analyzeConnections(blocks) {
        // TODO: 실제 연결 데이터 사용
        // 현재는 간단한 순서 기반 연결
        return [];
    }

    /**
     * 루트 블록 찾기
     */
    findRootBlock(blocks, connections) {
        // 단순화: 마지막 블록을 루트로 가정
        return blocks[blocks.length - 1];
    }

    /**
     * 블록을 논리식 객체로 변환
     */
    blockToFormula(block, allBlocks = [], connections = []) {
        if (block.type === 'variable') {
            return {
                type: 'variable',
                value: block.value
            };
        }

        // 연산자 블록
        const formula = {
            type: block.type,
            inputs: []
        };

        // 입력이 연결된 블록 찾기
        const connectedInputs = this.findConnectedInputs(block, allBlocks, connections);

        if (connectedInputs.length > 0) {
            formula.inputs = connectedInputs.map(input =>
                this.blockToFormula(input, allBlocks, connections)
            );
        } else {
            // 연결이 없으면 더미 입력 사용 (개발용)
            formula.inputs = this.createDummyInputs(block.type);
        }

        return formula;
    }

    /**
     * 연결된 입력 블록 찾기
     */
    findConnectedInputs(block, allBlocks, connections) {
        // TODO: 실제 연결 데이터 사용
        return [];
    }

    /**
     * 더미 입력 생성 (연결이 없을 때)
     */
    createDummyInputs(type) {
        const inputCount = this.getInputCount(type);
        const dummyInputs = [];

        for (let i = 0; i < inputCount; i++) {
            dummyInputs.push({
                type: 'variable',
                value: '?'
            });
        }

        return dummyInputs;
    }

    /**
     * 블록 타입별 필요한 입력 개수
     */
    getInputCount(type) {
        const counts = {
            'and': 2,
            'or': 2,
            'not': 1,
            'implies': 2,
            'iff': 2
        };
        return counts[type] || 0;
    }

    /**
     * 논리식 객체를 문자열로 변환
     * @param {Object} formula - 논리식 객체
     * @returns {String} 문자열 표현
     */
    formulaToString(formula) {
        if (!formula) {
            return '';
        }

        if (formula.type === 'variable') {
            return formula.value;
        }

        const symbol = this.getOperatorSymbol(formula.type);
        const inputs = formula.inputs || [];

        if (formula.type === 'not') {
            // 단항 연산자
            return `${symbol}${this.formulaToString(inputs[0])}`;
        }

        // 이항 연산자
        const left = this.formulaToString(inputs[0]);
        const right = this.formulaToString(inputs[1]);

        return `(${left} ${symbol} ${right})`;
    }

    /**
     * 연산자 심볼 가져오기
     */
    getOperatorSymbol(type) {
        const symbols = {
            'and': '∧',
            'or': '∨',
            'not': '¬',
            'implies': '→',
            'iff': '↔'
        };
        return symbols[type] || '?';
    }

    /**
     * 논리식 검증
     * @param {Object} formula - 검증할 논리식
     * @returns {Object} 검증 결과
     */
    validateFormula(formula) {
        const result = {
            isValid: true,
            errors: []
        };

        if (!formula) {
            result.isValid = false;
            result.errors.push('논리식이 비어있습니다.');
            return result;
        }

        // 재귀적 검증
        this.validateNode(formula, result);

        return result;
    }

    /**
     * 노드 검증
     */
    validateNode(node, result) {
        if (node.type === 'variable') {
            // 변수는 항상 유효
            return;
        }

        // 연산자는 필요한 입력이 있어야 함
        const requiredInputs = this.getInputCount(node.type);
        const actualInputs = (node.inputs || []).length;

        if (actualInputs < requiredInputs) {
            result.isValid = false;
            result.errors.push(
                `${this.getOperatorSymbol(node.type)} 연산자에 입력이 부족합니다. (필요: ${requiredInputs}, 현재: ${actualInputs})`
            );
        }

        // 재귀적으로 하위 노드 검증
        if (node.inputs) {
            node.inputs.forEach(input => this.validateNode(input, result));
        }
    }

    /**
     * 두 논리식 비교
     * @param {Object} formula1
     * @param {Object} formula2
     * @returns {Boolean} 일치 여부
     */
    compareFormulas(formula1, formula2) {
        if (!formula1 || !formula2) {
            return false;
        }

        if (formula1.type !== formula2.type) {
            return false;
        }

        if (formula1.type === 'variable') {
            return formula1.value === formula2.value;
        }

        // 연산자 비교
        const inputs1 = formula1.inputs || [];
        const inputs2 = formula2.inputs || [];

        if (inputs1.length !== inputs2.length) {
            return false;
        }

        // 교환 법칙 적용 (AND, OR)
        if (formula1.type === 'and' || formula1.type === 'or') {
            return this.compareCommutative(inputs1, inputs2);
        }

        // 순서가 중요한 연산자
        for (let i = 0; i < inputs1.length; i++) {
            if (!this.compareFormulas(inputs1[i], inputs2[i])) {
                return false;
            }
        }

        return true;
    }

    /**
     * 교환 법칙 적용 비교
     */
    compareCommutative(inputs1, inputs2) {
        // 순서 무관 비교
        const matched = new Set();

        for (const input1 of inputs1) {
            let found = false;
            for (let i = 0; i < inputs2.length; i++) {
                if (!matched.has(i) && this.compareFormulas(input1, inputs2[i])) {
                    matched.add(i);
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }

        return true;
    }

    /**
     * 논리식 평가 (진리값 계산)
     * @param {Object} formula - 논리식
     * @param {Object} values - 변수 값 맵 (예: { P: true, Q: false })
     * @returns {Boolean} 평가 결과
     */
    evaluate(formula, values) {
        if (formula.type === 'variable') {
            return values[formula.value] || false;
        }

        const inputs = formula.inputs || [];

        switch (formula.type) {
            case 'and':
                return inputs.every(input => this.evaluate(input, values));

            case 'or':
                return inputs.some(input => this.evaluate(input, values));

            case 'not':
                return !this.evaluate(inputs[0], values);

            case 'implies':
                const p = this.evaluate(inputs[0], values);
                const q = this.evaluate(inputs[1], values);
                return !p || q;

            case 'iff':
                const left = this.evaluate(inputs[0], values);
                const right = this.evaluate(inputs[1], values);
                return left === right;

            default:
                return false;
        }
    }

    /**
     * 진리표 생성
     * @param {Object} formula - 논리식
     * @returns {Array} 진리표 배열
     */
    generateTruthTable(formula) {
        // 논리식에서 사용된 변수 추출
        const variables = this.extractVariables(formula);

        // 모든 진리값 조합 생성
        const combinations = this.generateCombinations(variables.length);

        // 각 조합에 대해 평가
        const truthTable = combinations.map(combination => {
            const values = {};
            variables.forEach((variable, index) => {
                values[variable] = combination[index];
            });

            const result = this.evaluate(formula, values);

            return {
                ...values,
                result
            };
        });

        return truthTable;
    }

    /**
     * 논리식에서 변수 추출
     */
    extractVariables(formula) {
        const variables = new Set();

        const extract = (node) => {
            if (node.type === 'variable') {
                variables.add(node.value);
            } else if (node.inputs) {
                node.inputs.forEach(input => extract(input));
            }
        };

        extract(formula);
        return Array.from(variables).sort();
    }

    /**
     * 진리값 조합 생성
     * @param {Number} count - 변수 개수
     * @returns {Array} 조합 배열
     */
    generateCombinations(count) {
        const combinations = [];
        const total = Math.pow(2, count);

        for (let i = 0; i < total; i++) {
            const combination = [];
            for (let j = 0; j < count; j++) {
                combination.push(Boolean(i & (1 << (count - 1 - j))));
            }
            combinations.push(combination);
        }

        return combinations;
    }

    /**
     * 논리식 단순화
     * @param {Object} formula - 논리식
     * @returns {Object} 단순화된 논리식
     */
    simplify(formula) {
        // TODO: 논리식 단순화 알고리즘
        // - 이중 부정 제거
        // - 항등원 제거
        // - 드 모르간 법칙 적용 등

        return formula;
    }

    /**
     * 힌트 생성
     * @param {Object} userFormula - 사용자가 만든 논리식
     * @returns {String} 힌트 메시지
     */
    generateHint(userFormula) {
        if (!userFormula) {
            return '논리식을 만들어보세요.';
        }

        const correct = this.correctFormula;

        // 최상위 연산자 비교
        if (userFormula.type !== correct.type) {
            return `힌트: 최상위 연산자는 ${this.getOperatorSymbol(correct.type)} 입니다.`;
        }

        // 구조가 거의 맞음
        return '힌트: 구조는 거의 맞습니다! 변수를 확인해보세요.';
    }
}

export default PuzzleEngine;
