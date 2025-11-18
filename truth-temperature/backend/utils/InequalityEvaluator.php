<?php
/**
 * Inequality Evaluator Utility
 * Safely evaluates mathematical inequalities
 */

class InequalityEvaluator {

    /**
     * Evaluate an inequality
     *
     * @param string $left_side Left side expression
     * @param string $operator Comparison operator
     * @param string $right_side Right side expression
     * @return bool Result of the evaluation
     */
    public function evaluate($left_side, $operator, $right_side) {
        $left_value = $this->safeEval($left_side);
        $right_value = $this->safeEval($right_side);

        if ($left_value === false || $right_value === false) {
            throw new Exception("Invalid expression");
        }

        switch ($operator) {
            case '<':
                return $left_value < $right_value;
            case '<=':
                return $left_value <= $right_value;
            case '>':
                return $left_value > $right_value;
            case '>=':
                return $left_value >= $right_value;
            case '=':
            case '==':
                return abs($left_value - $right_value) < 0.0001; // Float comparison
            case '!=':
                return abs($left_value - $right_value) >= 0.0001;
            default:
                throw new Exception("Invalid operator: " . $operator);
        }
    }

    /**
     * Safely evaluate a mathematical expression
     *
     * @param string $expression Mathematical expression
     * @return float|false Result or false on error
     */
    private function safeEval($expression) {
        // Remove whitespace
        $expression = trim($expression);

        // Replace unicode operators
        $expression = str_replace('×', '*', $expression);
        $expression = str_replace('÷', '/', $expression);
        $expression = str_replace('−', '-', $expression);

        // Only allow numbers, operators, parentheses, and decimal points
        if (!preg_match('/^[0-9+\-*\/().\s]+$/', $expression)) {
            return false;
        }

        // Check for balanced parentheses
        if (!$this->hasBalancedParentheses($expression)) {
            return false;
        }

        // Prevent dangerous patterns
        if (preg_match('/[;{}$`\\\\]/', $expression)) {
            return false;
        }

        try {
            // Create a safe evaluation context
            $result = @eval('return ' . $expression . ';');

            if ($result === false || !is_numeric($result)) {
                return false;
            }

            return floatval($result);
        } catch (Exception $e) {
            error_log("Expression evaluation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if parentheses are balanced
     *
     * @param string $expression Expression to check
     * @return bool True if balanced
     */
    private function hasBalancedParentheses($expression) {
        $count = 0;
        for ($i = 0; $i < strlen($expression); $i++) {
            if ($expression[$i] === '(') {
                $count++;
            } elseif ($expression[$i] === ')') {
                $count--;
                if ($count < 0) {
                    return false;
                }
            }
        }
        return $count === 0;
    }

    /**
     * Parse an inequality expression into components
     *
     * @param string $expression Full inequality expression (e.g., "5 + 3 < 10")
     * @return array|false Array with keys: left_side, operator, right_side
     */
    public function parseInequality($expression) {
        $expression = trim($expression);

        // Replace unicode operators for matching
        $expression = str_replace('×', '*', $expression);
        $expression = str_replace('÷', '/', $expression);

        // Match inequality patterns
        $operators = ['<=', '>=', '!=', '<', '>', '='];
        foreach ($operators as $op) {
            $pattern = '/^(.+?)' . preg_quote($op, '/') . '(.+)$/';
            if (preg_match($pattern, $expression, $matches)) {
                return [
                    'left_side' => trim($matches[1]),
                    'operator' => $op,
                    'right_side' => trim($matches[2])
                ];
            }
        }

        return false;
    }

    /**
     * Validate an expression
     *
     * @param string $expression Expression to validate
     * @return bool True if valid
     */
    public function isValidExpression($expression) {
        return $this->safeEval($expression) !== false;
    }

    /**
     * Calculate the result of an expression
     *
     * @param string $expression Expression to calculate
     * @return float|false Result or false on error
     */
    public function calculate($expression) {
        return $this->safeEval($expression);
    }
}
