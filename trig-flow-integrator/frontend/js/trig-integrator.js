/**
 * Trig Flow Integrator - 삼각함수 적분 계산 엔진
 * 부드러운 파형 변화를 위한 수학 계산
 */

class TrigIntegrator {
    constructor() {
        this.functions = {
            sin: {
                original: (x, a, b, c, d) => a * Math.sin(b * x + c) + d,
                integral: (x, a, b, c, d, C) => -a/b * Math.cos(b * x + c) + d * x + C,
                derivative: (x, a, b, c, d) => a * b * Math.cos(b * x + c),
                name: 'sin(x)',
                integralName: '-cos(x) + C'
            },
            cos: {
                original: (x, a, b, c, d) => a * Math.cos(b * x + c) + d,
                integral: (x, a, b, c, d, C) => a/b * Math.sin(b * x + c) + d * x + C,
                derivative: (x, a, b, c, d) => -a * b * Math.sin(b * x + c),
                name: 'cos(x)',
                integralName: 'sin(x) + C'
            },
            tan: {
                original: (x, a, b, c, d) => a * Math.tan(b * x + c) + d,
                integral: (x, a, b, c, d, C) => {
                    // ∫tan(x)dx = -ln|cos(x)| + C
                    const cosValue = Math.cos(b * x + c);
                    if (Math.abs(cosValue) < 0.001) return NaN; // 발산 방지
                    return -a/b * Math.log(Math.abs(cosValue)) + d * x + C;
                },
                derivative: (x, a, b, c, d) => {
                    const cosValue = Math.cos(b * x + c);
                    return a * b / (cosValue * cosValue);
                },
                name: 'tan(x)',
                integralName: '-ln|cos(x)| + C'
            }
        };

        this.currentFunction = 'sin';
        this.params = {
            a: 1,    // 계수 (진폭)
            b: 1,    // 주파수
            c: 0,    // 위상 이동
            d: 0,    // 수직 이동
            C: 0     // 적분 상수
        };
    }

    /**
     * 함수 타입 설정
     */
    setFunction(type) {
        if (this.functions[type]) {
            this.currentFunction = type;
            return true;
        }
        return false;
    }

    /**
     * 매개변수 설정
     */
    setParameter(param, value) {
        if (this.params.hasOwnProperty(param)) {
            this.params[param] = parseFloat(value);
            return true;
        }
        return false;
    }

    /**
     * 모든 매개변수 설정
     */
    setParameters(params) {
        Object.assign(this.params, params);
    }

    /**
     * 원함수 계산
     */
    evaluateOriginal(x) {
        const func = this.functions[this.currentFunction];
        const { a, b, c, d } = this.params;
        return func.original(x, a, b, c, d);
    }

    /**
     * 적분 함수 계산
     */
    evaluateIntegral(x) {
        const func = this.functions[this.currentFunction];
        const { a, b, c, d, C } = this.params;
        return func.integral(x, a, b, c, d, C);
    }

    /**
     * 도함수 계산
     */
    evaluateDerivative(x) {
        const func = this.functions[this.currentFunction];
        const { a, b, c, d } = this.params;
        return func.derivative(x, a, b, c, d);
    }

    /**
     * 정적분 계산 (면적)
     */
    definiteIntegral(x1, x2, numSteps = 1000) {
        const dx = (x2 - x1) / numSteps;
        let area = 0;

        // 심슨 규칙 (Simpson's Rule)을 사용한 수치 적분
        for (let i = 0; i <= numSteps; i++) {
            const x = x1 + i * dx;
            const y = this.evaluateOriginal(x);

            if (i === 0 || i === numSteps) {
                area += y;
            } else if (i % 2 === 1) {
                area += 4 * y;
            } else {
                area += 2 * y;
            }
        }

        return (dx / 3) * area;
    }

    /**
     * 특정 범위에서 함수 값 배열 생성
     */
    generatePoints(x1, x2, numPoints, type = 'original') {
        const points = [];
        const dx = (x2 - x1) / (numPoints - 1);

        for (let i = 0; i < numPoints; i++) {
            const x = x1 + i * dx;
            let y;

            switch(type) {
                case 'integral':
                    y = this.evaluateIntegral(x);
                    break;
                case 'derivative':
                    y = this.evaluateDerivative(x);
                    break;
                default:
                    y = this.evaluateOriginal(x);
            }

            // NaN 체크
            if (!isNaN(y) && isFinite(y)) {
                points.push({ x, y });
            }
        }

        return points;
    }

    /**
     * 적분 면적 폴리곤 점들 생성
     */
    generateAreaPoints(x1, x2, numPoints) {
        const points = [];
        const dx = (x2 - x1) / (numPoints - 1);

        // 하단 기준선
        const baseline = this.params.d;

        for (let i = 0; i < numPoints; i++) {
            const x = x1 + i * dx;
            const y = this.evaluateOriginal(x);

            if (!isNaN(y) && isFinite(y)) {
                points.push({ x, y });
            }
        }

        // 역순으로 기준선 추가
        for (let i = numPoints - 1; i >= 0; i--) {
            const x = x1 + i * dx;
            points.push({ x, y: baseline });
        }

        return points;
    }

    /**
     * 함수 문자열 표현
     */
    getFunctionString() {
        const { a, b, c, d } = this.params;
        const func = this.functions[this.currentFunction];

        let str = '';

        // 계수
        if (a !== 1) {
            str += a.toFixed(2);
        }

        // 함수 이름
        str += func.name.replace('x',
            (b !== 1 ? b.toFixed(2) : '') + 'x' +
            (c !== 0 ? (c > 0 ? '+' : '') + c.toFixed(2) : '')
        );

        // 수직 이동
        if (d !== 0) {
            str += (d > 0 ? '+' : '') + d.toFixed(2);
        }

        return str || '0';
    }

    /**
     * 적분 함수 문자열 표현
     */
    getIntegralString() {
        const { a, b, c, d, C } = this.params;
        const func = this.functions[this.currentFunction];

        let str = '∫ ' + this.getFunctionString() + ' dx = ';

        // 적분 결과
        const integralFunc = func.integralName;

        if (a/b !== 1 && this.currentFunction !== 'tan') {
            str += (a/b).toFixed(2);
        }

        str += integralFunc.replace('x',
            (b !== 1 ? b.toFixed(2) : '') + 'x' +
            (c !== 0 ? (c > 0 ? '+' : '') + c.toFixed(2) : '')
        );

        if (d !== 0) {
            str += ' + ' + d.toFixed(2) + 'x';
        }

        if (C !== 0) {
            str = str.replace('C', C.toFixed(2));
        }

        return str;
    }

    /**
     * 함수 정보 가져오기
     */
    getInfo() {
        return {
            function: this.currentFunction,
            params: { ...this.params },
            functionString: this.getFunctionString(),
            integralString: this.getIntegralString()
        };
    }
}
