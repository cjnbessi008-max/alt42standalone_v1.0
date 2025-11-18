<?php
/**
 * Equation Solver
 * Generates step-by-step solutions for algebraic equations
 */

class EquationSolver {
    private $equation;
    private $steps = [];

    public function __construct($equation) {
        $this->equation = trim($equation);
    }

    /**
     * Solve equation and generate steps
     */
    public function solve() {
        $this->steps = [];

        // Parse equation into left and right sides
        $parts = explode('=', $this->equation);
        if (count($parts) !== 2) {
            throw new Exception("Invalid equation format");
        }

        $left = trim($parts[0]);
        $right = trim($parts[1]);

        // Generate steps based on equation complexity
        $this->generateSteps($left, $right);

        return $this->steps;
    }

    /**
     * Generate solution steps
     */
    private function generateSteps($left, $right) {
        // Step 1: Original equation
        $this->addStep(
            'Original equation',
            "$left = $right",
            'original',
            'This is the equation we need to solve'
        );

        // Detect equation type and generate appropriate steps
        if ($this->hasParentheses($left)) {
            $this->solveWithDistribution($left, $right);
        } elseif ($this->isSimpleLinear($left, $right)) {
            $this->solveSimpleLinear($left, $right);
        } else {
            $this->solveComplexLinear($left, $right);
        }
    }

    /**
     * Check if expression has parentheses
     */
    private function hasParentheses($expr) {
        return strpos($expr, '(') !== false;
    }

    /**
     * Check if it's a simple linear equation (ax + b = c)
     */
    private function isSimpleLinear($left, $right) {
        // Simple pattern matching
        return preg_match('/^\d*x\s*[+-]\s*\d+$/', $left) && is_numeric($right);
    }

    /**
     * Solve simple linear equation (e.g., 3x + 12 = 27)
     */
    private function solveSimpleLinear($left, $right) {
        // Extract coefficient and constant
        preg_match('/^(\d*)x\s*([+-])\s*(\d+)$/', $left, $matches);

        $coefficient = $matches[1] === '' ? 1 : intval($matches[1]);
        $operator = $matches[2];
        $constant = intval($matches[3]);
        $rightValue = intval($right);

        if ($operator === '+') {
            // Step 2: Subtract constant from both sides
            $newRight = $rightValue - $constant;
            $this->addStep(
                "Subtract $constant from both sides",
                "{$coefficient}x + $constant - $constant = $right - $constant",
                'isolate',
                "To isolate x, first remove the constant term by subtracting $constant"
            );

            // Step 3: Simplify
            $this->addStep(
                'Simplify',
                "{$coefficient}x = $newRight",
                'simplify',
                'Combine like terms'
            );

            // Step 4: Divide by coefficient
            $solution = $newRight / $coefficient;
            $this->addStep(
                "Divide both sides by $coefficient",
                "{$coefficient}x ÷ $coefficient = $newRight ÷ $coefficient",
                'solve',
                "Isolate the variable by dividing both sides by $coefficient"
            );

            // Step 5: Solution
            $this->addStep(
                'Solution',
                "x = $solution",
                'verify',
                "Check your answer by substituting x = $solution back into the original equation"
            );
        } else {
            // Similar logic for subtraction
            $newRight = $rightValue + $constant;
            $this->addStep(
                "Add $constant to both sides",
                "{$coefficient}x - $constant + $constant = $right + $constant",
                'isolate',
                "To isolate x, first remove the constant term by adding $constant"
            );

            $this->addStep(
                'Simplify',
                "{$coefficient}x = $newRight",
                'simplify',
                'Combine like terms'
            );

            $solution = $newRight / $coefficient;
            $this->addStep(
                "Divide both sides by $coefficient",
                "{$coefficient}x ÷ $coefficient = $newRight ÷ $coefficient",
                'solve',
                "Isolate the variable by dividing"
            );

            $this->addStep(
                'Solution',
                "x = $solution",
                'verify',
                "Verify by substituting x = $solution into the original equation"
            );
        }
    }

    /**
     * Solve equation with distribution (e.g., 2(x - 5) + 4 = 18)
     */
    private function solveWithDistribution($left, $right) {
        // Simplified distribution example
        // In a real implementation, you'd parse and evaluate more complex expressions

        $this->addStep(
            'Distribute',
            "Expand the parentheses using the distributive property",
            'simplify',
            'Use the distributive property: a(b + c) = ab + ac'
        );

        $this->addStep(
            'Combine like terms',
            "Simplify by combining constants and variable terms",
            'combine',
            'Add or subtract like terms together'
        );

        $this->addStep(
            'Isolate variable',
            "Move all variable terms to one side and constants to the other",
            'isolate',
            'Use inverse operations to isolate the variable'
        );

        $this->addStep(
            'Solve',
            "Divide or multiply to get the final answer",
            'solve',
            'Perform the final operation to solve for x'
        );

        $this->addStep(
            'Verify',
            "Check the solution by substituting back",
            'verify',
            'Always verify your answer in the original equation'
        );
    }

    /**
     * Solve complex linear equation
     */
    private function solveComplexLinear($left, $right) {
        // Placeholder for more complex equations
        $this->addStep(
            'Simplify both sides',
            "Combine like terms on each side",
            'simplify',
            'Simplify each side of the equation first'
        );

        $this->addStep(
            'Move variables to one side',
            "Collect all x terms on the left side",
            'isolate',
            'Use addition or subtraction to move terms'
        );

        $this->addStep(
            'Move constants to other side',
            "Collect all numbers on the right side",
            'isolate',
            'Use inverse operations'
        );

        $this->addStep(
            'Solve for x',
            "Divide to find the value of x",
            'solve',
            'Complete the solution'
        );

        $this->addStep(
            'Verify solution',
            "Substitute and check",
            'verify',
            'Confirm your answer is correct'
        );
    }

    /**
     * Add a step to the solution
     */
    private function addStep($description, $equation, $type, $hint) {
        $this->steps[] = [
            'step_number' => count($this->steps) + 1,
            'step_description' => $description,
            'step_equation' => $equation,
            'step_type' => $type,
            'hint_text' => $hint
        ];
    }

    /**
     * Get all steps
     */
    public function getSteps() {
        return $this->steps;
    }

    /**
     * Get specific step
     */
    public function getStep($stepNumber) {
        return isset($this->steps[$stepNumber - 1]) ? $this->steps[$stepNumber - 1] : null;
    }

    /**
     * Verify user's answer for a specific step
     */
    public function verifyStep($stepNumber, $userAnswer) {
        $step = $this->getStep($stepNumber);
        if (!$step) {
            return false;
        }

        // Normalize both equations for comparison
        $correctAnswer = $this->normalizeEquation($step['step_equation']);
        $userAnswer = $this->normalizeEquation($userAnswer);

        return $correctAnswer === $userAnswer;
    }

    /**
     * Normalize equation for comparison
     */
    private function normalizeEquation($equation) {
        // Remove whitespace
        $equation = preg_replace('/\s+/', '', $equation);
        // Convert to lowercase
        $equation = strtolower($equation);
        return $equation;
    }
}
