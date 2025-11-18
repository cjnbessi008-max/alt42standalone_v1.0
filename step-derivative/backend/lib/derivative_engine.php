<?php
/**
 * Derivative Engine
 * Step-by-step derivative calculation engine
 * Supports basic to advanced derivative rules
 */

class DerivativeEngine {
    private $steps = [];
    private $currentExpression;

    /**
     * Solve derivative step by step
     *
     * @param string $expression Mathematical expression to differentiate
     * @return array Array of solution steps
     */
    public function solve($expression) {
        $this->steps = [];
        $this->currentExpression = $this->normalize($expression);

        // Initial step
        $this->addStep(
            'initial',
            '',
            $this->currentExpression,
            "원래 식: d/dx(" . $this->currentExpression . ")",
            'initial'
        );

        // Parse and solve
        $result = $this->differentiate($this->currentExpression);

        // Final step
        $this->addStep(
            'final',
            $this->currentExpression,
            $result,
            "최종 답: " . $result,
            'final'
        );

        return $this->steps;
    }

    /**
     * Main differentiation logic
     */
    private function differentiate($expr) {
        $expr = trim($expr);

        // Constant
        if ($this->isConstant($expr)) {
            $this->addStep(
                'constant_rule',
                $expr,
                '0',
                "상수의 미분은 0입니다.",
                'constant_rule'
            );
            return '0';
        }

        // Simple variable x
        if ($expr === 'x') {
            $this->addStep(
                'power_rule',
                'x',
                '1',
                "x의 미분은 1입니다.",
                'power_rule'
            );
            return '1';
        }

        // Power: x^n
        if (preg_match('/^x\^([0-9]+)$/', $expr, $matches)) {
            return $this->applyPowerRule($expr, $matches[1]);
        }

        // Constant multiple: c*f(x)
        if (preg_match('/^([0-9]+)\*(.+)$/', $expr, $matches)) {
            return $this->applyConstantMultiple($matches[1], $matches[2]);
        }

        // Sum/Difference: f + g or f - g
        if ($this->containsAdditionOrSubtraction($expr)) {
            return $this->applySumRule($expr);
        }

        // Product: f*g
        if ($this->containsMultiplication($expr)) {
            return $this->applyProductRule($expr);
        }

        // Quotient: f/g
        if ($this->containsDivision($expr)) {
            return $this->applyQuotientRule($expr);
        }

        // Trigonometric functions
        if (preg_match('/^sin\((.+)\)$/', $expr, $matches)) {
            return $this->applySinRule($matches[1]);
        }
        if (preg_match('/^cos\((.+)\)$/', $expr, $matches)) {
            return $this->applyCosRule($matches[1]);
        }

        // Exponential
        if (preg_match('/^e\^(.+)$/', $expr, $matches)) {
            return $this->applyExponentialRule($matches[1]);
        }

        // Natural logarithm
        if (preg_match('/^ln\((.+)\)$/', $expr, $matches)) {
            return $this->applyLogarithmRule($matches[1]);
        }

        // Chain rule detection
        if ($this->isComposite($expr)) {
            return $this->applyChainRule($expr);
        }

        // Fallback - return as is with note
        $this->addStep(
            'complex',
            $expr,
            "d/dx(" . $expr . ")",
            "복잡한 식입니다. 더 세부적인 분석이 필요합니다.",
            'complex'
        );
        return "d/dx(" . $expr . ")";
    }

    /**
     * Apply power rule: d/dx(x^n) = n*x^(n-1)
     */
    private function applyPowerRule($expr, $n) {
        $n = intval($n);
        $newPower = $n - 1;

        if ($newPower === 0) {
            $result = (string)$n;
        } else if ($newPower === 1) {
            $result = $n . "*x";
        } else {
            $result = $n . "*x^" . $newPower;
        }

        $this->addStep(
            'power_rule',
            $expr,
            $result,
            "거듭제곱 규칙 적용: d/dx(x^{$n}) = {$n}*x^" . ($n-1),
            'power_rule'
        );

        return $result;
    }

    /**
     * Apply constant multiple rule: d/dx(c*f) = c*d/dx(f)
     */
    private function applyConstantMultiple($constant, $function) {
        $this->addStep(
            'constant_multiple',
            $constant . "*" . $function,
            $constant . "*d/dx(" . $function . ")",
            "상수배 규칙: 상수 {$constant}를 앞으로 뺍니다.",
            'constant_multiple'
        );

        $derivative = $this->differentiate($function);
        $result = $this->simplify($constant . "*" . $derivative);

        $this->addStep(
            'simplification',
            $constant . "*" . $derivative,
            $result,
            "상수배를 곱합니다.",
            'simplification'
        );

        return $result;
    }

    /**
     * Apply sum/difference rule: d/dx(f ± g) = d/dx(f) ± d/dx(g)
     */
    private function applySumRule($expr) {
        // Split by + or - (simplified parsing)
        $parts = preg_split('/([+\-])/', $expr, -1, PREG_SPLIT_DELIM_CAPTURE);

        $this->addStep(
            'sum_rule',
            $expr,
            "각 항을 개별적으로 미분",
            "합/차 규칙: 각 항을 따로 미분합니다.",
            'sum_rule'
        );

        $result = '';
        $operator = '+';

        foreach ($parts as $part) {
            $part = trim($part);
            if ($part === '+' || $part === '-') {
                $operator = $part;
                continue;
            }

            if (!empty($part)) {
                $derivative = $this->differentiate($part);
                if (!empty($result)) {
                    $result .= ' ' . $operator . ' ';
                }
                $result .= $derivative;
            }
        }

        return $this->simplify($result);
    }

    /**
     * Apply product rule: d/dx(f*g) = f'*g + f*g'
     */
    private function applyProductRule($expr) {
        // Simple parsing for f*g
        $parts = explode('*', $expr, 2);
        if (count($parts) !== 2) {
            return $expr;
        }

        list($f, $g) = $parts;

        $this->addStep(
            'product_rule',
            $expr,
            "({$f})'*({$g}) + ({$f})*({$g})'",
            "곱셈 규칙 적용: (f*g)' = f'*g + f*g'",
            'product_rule'
        );

        $fPrime = $this->differentiate($f);
        $gPrime = $this->differentiate($g);

        $result = "({$fPrime})*({$g}) + ({$f})*({$gPrime})";
        $simplified = $this->simplify($result);

        $this->addStep(
            'simplification',
            $result,
            $simplified,
            "식을 정리합니다.",
            'simplification'
        );

        return $simplified;
    }

    /**
     * Apply quotient rule: d/dx(f/g) = (f'*g - f*g')/g^2
     */
    private function applyQuotientRule($expr) {
        $parts = explode('/', $expr, 2);
        if (count($parts) !== 2) {
            return $expr;
        }

        list($f, $g) = $parts;

        $this->addStep(
            'quotient_rule',
            $expr,
            "(({$f})'*({$g}) - ({$f})*({$g})')/(({$g})^2)",
            "나눗셈 규칙 적용: (f/g)' = (f'*g - f*g')/g²",
            'quotient_rule'
        );

        $fPrime = $this->differentiate($f);
        $gPrime = $this->differentiate($g);

        $result = "(({$fPrime})*({$g}) - ({$f})*({$gPrime}))/(({$g})^2)";
        $simplified = $this->simplify($result);

        return $simplified;
    }

    /**
     * Apply sin rule: d/dx(sin(u)) = cos(u)*u'
     */
    private function applySinRule($inner) {
        $this->addStep(
            'sin_rule',
            "sin({$inner})",
            "cos({$inner})",
            "삼각함수 미분: d/dx(sin(x)) = cos(x)",
            'sin_rule'
        );

        if ($inner !== 'x') {
            // Chain rule needed
            $innerDerivative = $this->differentiate($inner);
            $result = "cos({$inner})*({$innerDerivative})";

            $this->addStep(
                'chain_rule',
                "cos({$inner})",
                $result,
                "연쇄 법칙 적용: 내부 함수의 미분을 곱합니다.",
                'chain_rule'
            );

            return $this->simplify($result);
        }

        return "cos({$inner})";
    }

    /**
     * Apply cos rule: d/dx(cos(u)) = -sin(u)*u'
     */
    private function applyCosRule($inner) {
        $this->addStep(
            'cos_rule',
            "cos({$inner})",
            "-sin({$inner})",
            "삼각함수 미분: d/dx(cos(x)) = -sin(x)",
            'cos_rule'
        );

        if ($inner !== 'x') {
            $innerDerivative = $this->differentiate($inner);
            $result = "-sin({$inner})*({$innerDerivative})";

            $this->addStep(
                'chain_rule',
                "-sin({$inner})",
                $result,
                "연쇄 법칙 적용",
                'chain_rule'
            );

            return $this->simplify($result);
        }

        return "-sin({$inner})";
    }

    /**
     * Apply exponential rule: d/dx(e^u) = e^u*u'
     */
    private function applyExponentialRule($inner) {
        $this->addStep(
            'exponential_rule',
            "e^{$inner}",
            "e^{$inner}",
            "지수함수 미분: d/dx(e^x) = e^x",
            'exponential_rule'
        );

        if ($inner !== 'x') {
            $innerDerivative = $this->differentiate($inner);
            $result = "e^{$inner}*({$innerDerivative})";

            $this->addStep(
                'chain_rule',
                "e^{$inner}",
                $result,
                "연쇄 법칙 적용",
                'chain_rule'
            );

            return $this->simplify($result);
        }

        return "e^{$inner}";
    }

    /**
     * Apply logarithm rule: d/dx(ln(u)) = (1/u)*u'
     */
    private function applyLogarithmRule($inner) {
        $this->addStep(
            'logarithm_rule',
            "ln({$inner})",
            "1/({$inner})",
            "로그함수 미분: d/dx(ln(x)) = 1/x",
            'logarithm_rule'
        );

        if ($inner !== 'x') {
            $innerDerivative = $this->differentiate($inner);
            $result = "(1/({$inner}))*({$innerDerivative})";

            $this->addStep(
                'chain_rule',
                "1/({$inner})",
                $result,
                "연쇄 법칙 적용",
                'chain_rule'
            );

            return $this->simplify($result);
        }

        return "1/({$inner})";
    }

    /**
     * Apply chain rule for composite functions
     */
    private function applyChainRule($expr) {
        $this->addStep(
            'chain_rule',
            $expr,
            "외부함수' * 내부함수'",
            "합성함수이므로 연쇄 법칙을 적용합니다.",
            'chain_rule'
        );

        // Simplified implementation
        return "d/dx({$expr})";
    }

    /**
     * Helper functions
     */
    private function isConstant($expr) {
        return is_numeric($expr);
    }

    private function containsAdditionOrSubtraction($expr) {
        return preg_match('/[+\-]/', $expr);
    }

    private function containsMultiplication($expr) {
        return strpos($expr, '*') !== false;
    }

    private function containsDivision($expr) {
        return strpos($expr, '/') !== false;
    }

    private function isComposite($expr) {
        // Check if expression has nested functions
        return preg_match('/\w+\([^)]+\([^)]+\)\)/', $expr);
    }

    private function normalize($expr) {
        // Remove spaces
        $expr = preg_replace('/\s+/', '', $expr);
        return $expr;
    }

    private function simplify($expr) {
        // Basic simplification
        $expr = str_replace('0*', '', $expr);
        $expr = str_replace('*0', '', $expr);
        $expr = str_replace('1*', '', $expr);
        $expr = str_replace('*1', '', $expr);
        $expr = str_replace('+ 0', '', $expr);
        $expr = str_replace('0 +', '', $expr);
        $expr = preg_replace('/\(\s*\)/', '', $expr);

        return $expr;
    }

    private function addStep($type, $before, $after, $explanation, $rule) {
        $this->steps[] = [
            'type' => $type,
            'before' => $before,
            'after' => $after,
            'explanation' => $explanation,
            'rule' => $rule
        ];
    }
}
