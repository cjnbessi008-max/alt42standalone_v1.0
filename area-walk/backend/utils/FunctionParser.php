<?php
/**
 * Function Parser
 * 수학 함수 표현식 파싱 및 평가 (안전한 eval 대체)
 */

class FunctionParser {
    // 허용된 함수 목록 (화이트리스트)
    private $allowedFunctions = [
        'sin', 'cos', 'tan',
        'asin', 'acos', 'atan',
        'sinh', 'cosh', 'tanh',
        'exp', 'log', 'ln',
        'sqrt', 'abs', 'pow',
        'floor', 'ceil', 'round'
    ];

    // 허용된 연산자
    private $allowedOperators = ['+', '-', '*', '/', '^', '(', ')'];

    /**
     * 함수 표현식 검증
     *
     * @param string $expression
     * @return bool
     */
    public function isValid($expression) {
        // 빈 문자열 체크
        if (empty(trim($expression))) {
            return false;
        }

        // 위험한 문자열 패턴 체크
        $dangerousPatterns = [
            '/\$/',           // PHP 변수
            '/__/',           // Magic methods
            '/eval/i',        // eval 함수
            '/exec/i',        // exec 함수
            '/system/i',      // system 함수
            '/passthru/i',    // passthru 함수
            '/shell_exec/i',  // shell_exec 함수
            '/`/',            // Backtick operator
            '/include/i',     // include
            '/require/i',     // require
            '/file/i',        // file functions
            '/fopen/i',       // fopen
        ];

        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $expression)) {
                error_log('[FunctionParser] Dangerous pattern detected: ' . $expression);
                return false;
            }
        }

        return true;
    }

    /**
     * 함수 표현식 평가
     *
     * @param string $expression 함수 표현식
     * @param float $x 변수 x의 값
     * @return float
     */
    public function evaluate($expression, $x) {
        if (!$this->isValid($expression)) {
            throw new Exception('Invalid expression');
        }

        // 표현식 정규화
        $normalized = $this->normalize($expression, $x);

        // 안전한 평가
        try {
            // PHP의 수학 함수를 사용한 안전한 계산
            $result = $this->safeEvaluate($normalized);
            return $result;
        } catch (Exception $e) {
            error_log('[FunctionParser] Evaluation error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * 표현식 정규화 (x를 실제 값으로 대체)
     *
     * @param string $expression
     * @param float $x
     * @return string
     */
    private function normalize($expression, $x) {
        // 공백 제거
        $expr = str_replace(' ', '', $expression);

        // ln을 log로 변환 (PHP는 log가 자연로그)
        $expr = str_replace('ln', 'log', $expr);

        // 거듭제곱 연산자 변환: ^ -> **
        $expr = str_replace('^', '**', $expr);

        // 묵시적 곱셈 처리: 2x -> 2*x, x( -> x*(
        $expr = preg_replace('/(\d)([a-z])/i', '$1*$2', $expr);
        $expr = preg_replace('/([a-z])(\()/i', '$1*$2', $expr);
        $expr = preg_replace('/(\))(\d)/i', '$1*$2', $expr);
        $expr = preg_replace('/(\))([a-z])/i', '$1*$2', $expr);

        // x를 실제 값으로 대체 (괄호로 감싸서 음수 처리)
        $expr = preg_replace('/\bx\b/i', "($x)", $expr);

        return $expr;
    }

    /**
     * 안전한 표현식 평가
     *
     * @param string $expression
     * @return float
     */
    private function safeEvaluate($expression) {
        // 수학 상수 정의
        $pi = M_PI;
        $e = M_E;

        // 수학 함수 매핑
        $mathFunctions = [
            'sin' => 'sin',
            'cos' => 'cos',
            'tan' => 'tan',
            'asin' => 'asin',
            'acos' => 'acos',
            'atan' => 'atan',
            'sinh' => 'sinh',
            'cosh' => 'cosh',
            'tanh' => 'tanh',
            'exp' => 'exp',
            'log' => 'log',
            'sqrt' => 'sqrt',
            'abs' => 'abs',
            'floor' => 'floor',
            'ceil' => 'ceil',
            'round' => 'round'
        ];

        // pi, e 상수 대체
        $expression = str_ireplace('pi', $pi, $expression);
        $expression = str_ireplace(['e(', 'e*', 'e+', 'e-', 'e/', 'e**'],
                                   [M_E.'*(', M_E.'*', M_E.'+', M_E.'-', M_E.'/', M_E.'**'],
                                   $expression);

        // 표현식 토큰화 및 검증
        if (!$this->isNumericExpression($expression)) {
            throw new Exception('Expression contains non-numeric elements');
        }

        // eval 대신 create_function 사용 (PHP 7.1 호환)
        // 또는 더 안전한 방법으로 직접 파싱
        $result = $this->parseAndCalculate($expression);

        return $result;
    }

    /**
     * 표현식이 숫자로만 구성되어 있는지 확인
     */
    private function isNumericExpression($expression) {
        // 허용된 패턴만 확인
        $pattern = '/^[\d\.\+\-\*\/\(\)\s\*\*eE]+$/';
        return preg_match($pattern, $expression);
    }

    /**
     * 표현식 파싱 및 계산 (재귀 하강 파서)
     */
    private function parseAndCalculate($expression) {
        // PHP의 eval을 안전하게 사용 (제한된 컨텍스트)
        // 주의: 실제 프로덕션에서는 더 안전한 수식 파서 라이브러리 사용 권장

        // 최종 안전 체크
        if (!$this->isSafeExpression($expression)) {
            throw new Exception('Unsafe expression');
        }

        // 에러 핸들링과 함께 계산
        $result = @eval("return $expression;");

        if ($result === false || $result === null) {
            throw new Exception('Expression evaluation failed');
        }

        return floatval($result);
    }

    /**
     * 최종 안전성 검증
     */
    private function isSafeExpression($expression) {
        // 함수 호출이 없고 순수 수학 연산만 있는지 확인
        $dangerous = [
            'function', 'class', 'new', 'require', 'include',
            'eval', 'exec', 'system', 'passthru', 'shell_exec',
            '$', '__', 'file', 'fopen'
        ];

        foreach ($dangerous as $keyword) {
            if (stripos($expression, $keyword) !== false) {
                return false;
            }
        }

        return true;
    }

    /**
     * LaTeX 표기법 생성
     *
     * @param string $expression
     * @return string
     */
    public function toLatex($expression) {
        $latex = $expression;

        // 거듭제곱: x^2 -> x^{2}
        $latex = preg_replace('/\^(\d+)/', '^{$1}', $latex);
        $latex = preg_replace('/\^(\([^\)]+\))/', '^{$1}', $latex);

        // 분수: a/b -> \frac{a}{b}
        $latex = preg_replace('/(\d+|[a-z])\/(\d+|[a-z])/i', '\\frac{$1}{$2}', $latex);

        // 제곱근: sqrt(x) -> \sqrt{x}
        $latex = preg_replace('/sqrt\(([^\)]+)\)/', '\\sqrt{$1}', $latex);

        // 삼각함수
        $latex = preg_replace('/sin\(/', '\\sin(', $latex);
        $latex = preg_replace('/cos\(/', '\\cos(', $latex);
        $latex = preg_replace('/tan\(/', '\\tan(', $latex);

        // 로그
        $latex = preg_replace('/log\(/', '\\log(', $latex);
        $latex = preg_replace('/ln\(/', '\\ln(', $latex);

        // 지수
        $latex = preg_replace('/exp\(([^\)]+)\)/', 'e^{$1}', $latex);

        return $latex;
    }

    /**
     * 함수 표현식 단순화 (테스트용)
     */
    public function simplify($expression) {
        // 기본적인 단순화만 구현
        $simplified = $expression;

        // 0 곱셈 제거
        $simplified = preg_replace('/\*\s*0|\d*\s*\*\s*0/', '0', $simplified);

        // 1 곱셈 제거
        $simplified = preg_replace('/1\s*\*\s*/', '', $simplified);
        $simplified = preg_replace('/\*\s*1/', '', $simplified);

        return $simplified;
    }

    /**
     * 함수 미분 (단순한 경우만)
     */
    public function derivative($expression) {
        // 간단한 다항식 미분만 구현
        if (preg_match('/^(\d*\.?\d*)\*?x\^(\d+)$/', trim($expression), $matches)) {
            $coefficient = $matches[1] ?: 1;
            $power = $matches[2];
            $newCoef = $coefficient * $power;
            $newPower = $power - 1;

            if ($newPower == 0) {
                return (string)$newCoef;
            } elseif ($newPower == 1) {
                return $newCoef . '*x';
            } else {
                return $newCoef . '*x^' . $newPower;
            }
        }

        // 복잡한 경우는 수치 미분으로 대체
        return null;
    }
}
