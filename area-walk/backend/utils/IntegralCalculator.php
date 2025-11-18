<?php
/**
 * Integral Calculator
 * 수치 적분 계산 (Simpson's Rule)
 */

require_once __DIR__ . '/FunctionParser.php';

class IntegralCalculator {
    private $parser;
    private $precision;
    private $timeout;

    public function __construct($precision = null, $timeout = null) {
        $this->parser = new FunctionParser();
        $this->precision = $precision ?? INTEGRAL_PRECISION;
        $this->timeout = $timeout ?? INTEGRAL_TIMEOUT;
    }

    /**
     * 정적분 계산 (Simpson's Rule)
     *
     * @param string $functionExpr 함수 표현식 (예: "x^2", "sin(x)")
     * @param float $a 적분 하한
     * @param float $b 적분 상한
     * @param int $n 분할 수 (짝수여야 함)
     * @return array ['result' => float, 'method' => string, 'accuracy' => string]
     */
    public function calculate($functionExpr, $a, $b, $n = null) {
        $startTime = microtime(true);
        $n = $n ?? $this->precision;

        // n을 짝수로 만들기 (Simpson's Rule 요구사항)
        if ($n % 2 !== 0) {
            $n++;
        }

        try {
            // 함수 파싱 검증
            if (!$this->parser->isValid($functionExpr)) {
                throw new Exception('Invalid function expression');
            }

            // 적분 범위 검증
            if ($a >= $b) {
                throw new Exception('Lower bound must be less than upper bound');
            }

            // Simpson's Rule 적용
            $h = ($b - $a) / $n;
            $sum = $this->evaluateFunction($functionExpr, $a)
                + $this->evaluateFunction($functionExpr, $b);

            for ($i = 1; $i < $n; $i++) {
                $x = $a + $i * $h;
                $multiplier = ($i % 2 == 0) ? 2 : 4;
                $sum += $multiplier * $this->evaluateFunction($functionExpr, $x);

                // 타임아웃 체크
                if (microtime(true) - $startTime > $this->timeout) {
                    throw new Exception('Calculation timeout');
                }
            }

            $result = ($h / 3) * $sum;
            $computationTime = round((microtime(true) - $startTime) * 1000, 2);

            return [
                'result' => round($result, 4),
                'method' => 'simpson',
                'accuracy' => $this->getAccuracyLevel($n),
                'computation_time_ms' => $computationTime,
                'steps' => $n
            ];
        } catch (Exception $e) {
            error_log('[IntegralCalculator] Error: ' . $e->getMessage());
            return [
                'result' => null,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * 함수 값 계산
     */
    private function evaluateFunction($expression, $x) {
        return $this->parser->evaluate($expression, $x);
    }

    /**
     * 리만 합 계산 (단순 방법 - 테스트용)
     *
     * @param string $functionExpr
     * @param float $a
     * @param float $b
     * @param int $n
     * @return float
     */
    public function riemannSum($functionExpr, $a, $b, $n = 100) {
        $h = ($b - $a) / $n;
        $sum = 0;

        for ($i = 0; $i < $n; $i++) {
            $x = $a + $i * $h + $h / 2; // 중점
            $sum += $this->evaluateFunction($functionExpr, $x);
        }

        return round($sum * $h, 4);
    }

    /**
     * 사다리꼴 공식 (Trapezoidal Rule)
     *
     * @param string $functionExpr
     * @param float $a
     * @param float $b
     * @param int $n
     * @return float
     */
    public function trapezoidalRule($functionExpr, $a, $b, $n = 100) {
        $h = ($b - $a) / $n;
        $sum = ($this->evaluateFunction($functionExpr, $a)
            + $this->evaluateFunction($functionExpr, $b)) / 2;

        for ($i = 1; $i < $n; $i++) {
            $x = $a + $i * $h;
            $sum += $this->evaluateFunction($functionExpr, $x);
        }

        return round($sum * $h, 4);
    }

    /**
     * 정확도 수준 판정
     */
    private function getAccuracyLevel($steps) {
        if ($steps >= 1000) {
            return 'very_high';
        } elseif ($steps >= 500) {
            return 'high';
        } elseif ($steps >= 100) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * 적분 값 검증 (오차 범위 내인지 확인)
     *
     * @param float $userAnswer 사용자 답안
     * @param float $correctAnswer 정답
     * @param float $tolerance 허용 오차
     * @return array
     */
    public function validate($userAnswer, $correctAnswer, $tolerance = 0.01) {
        $error = abs($userAnswer - $correctAnswer);
        $errorPercentage = ($correctAnswer != 0)
            ? round(($error / abs($correctAnswer)) * 100, 2)
            : 0;

        $isCorrect = $error <= $tolerance;

        return [
            'is_correct' => $isCorrect,
            'user_answer' => $userAnswer,
            'correct_answer' => $correctAnswer,
            'error' => round($error, 4),
            'error_percentage' => $errorPercentage,
            'tolerance' => $tolerance
        ];
    }

    /**
     * 점수 계산 (오차율 기반)
     *
     * @param float $errorPercentage
     * @return float (0-100)
     */
    public function calculateScore($errorPercentage) {
        if ($errorPercentage <= 1) {
            return 100; // 오차 1% 이하
        } elseif ($errorPercentage <= 5) {
            return 90 - ($errorPercentage - 1) * 2.5; // 90-80점
        } elseif ($errorPercentage <= 10) {
            return 80 - ($errorPercentage - 5) * 4; // 80-60점
        } elseif ($errorPercentage <= 20) {
            return 60 - ($errorPercentage - 10) * 3; // 60-30점
        } else {
            return max(0, 30 - ($errorPercentage - 20)); // 30점 이하
        }
    }

    /**
     * 다양한 방법으로 적분 계산 비교
     */
    public function compareMethodsfunction($functionExpr, $a, $b) {
        return [
            'simpson' => $this->calculate($functionExpr, $a, $b),
            'riemann' => $this->riemannSum($functionExpr, $a, $b),
            'trapezoidal' => $this->trapezoidalRule($functionExpr, $a, $b)
        ];
    }
}
