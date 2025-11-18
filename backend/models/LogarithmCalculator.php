<?php
/**
 * Logarithm Calculator
 * Core business logic for Power Candle calculations
 */

class LogarithmCalculator {

    /**
     * Calculate logarithm: log_base(result) = power
     *
     * @param int $base The base of the logarithm
     * @param int $result The result value
     * @return int The power (candle count)
     */
    public function calculate($base, $result) {
        if ($base <= 1) {
            throw new InvalidArgumentException('Base must be greater than 1');
        }

        if ($result <= 0) {
            throw new InvalidArgumentException('Result must be positive');
        }

        // Calculate using change of base formula
        // log_base(result) = log(result) / log(base)
        $power = log($result) / log($base);

        // Round to handle floating point precision
        $roundedPower = round($power);

        // Verify the answer is exact (power of base)
        if (abs(pow($base, $roundedPower) - $result) < 0.0001) {
            return (int)$roundedPower;
        }

        // Not an exact power - return closest integer
        return (int)$roundedPower;
    }

    /**
     * Verify if base^power = result
     *
     * @param int $base The base
     * @param int $power The power (candle count)
     * @param int $result The expected result
     * @return bool True if equation is correct
     */
    public function verify($base, $power, $result) {
        $calculated = pow($base, $power);
        return abs($calculated - $result) < 0.0001;
    }

    /**
     * Generate step-by-step multiplication sequence
     * Used for visual candle animation
     *
     * @param int $base The base number
     * @param int $power The power (number of steps)
     * @return array Array of intermediate results
     */
    public function generateSteps($base, $power) {
        $steps = [];

        for ($i = 1; $i <= $power; $i++) {
            $steps[] = [
                'step' => $i,
                'calculation' => $this->getCalculationString($base, $i),
                'result' => pow($base, $i),
                'candles' => $i
            ];
        }

        return $steps;
    }

    /**
     * Generate calculation string (e.g., "2 × 2 × 2")
     *
     * @param int $base The base number
     * @param int $power The power
     * @return string The calculation string
     */
    private function getCalculationString($base, $power) {
        $parts = array_fill(0, $power, $base);
        return implode(' × ', $parts);
    }

    /**
     * Get feedback message based on answer
     *
     * @param bool $isCorrect Whether answer is correct
     * @param int $base The base
     * @param int $result The result
     * @param int $correctAnswer The correct answer
     * @param int $studentAnswer The student's answer
     * @return string Feedback message
     */
    public function getFeedback($isCorrect, $base, $result, $correctAnswer, $studentAnswer) {
        if ($isCorrect) {
            $calculation = $this->getCalculationString($base, $correctAnswer);
            return sprintf(
                'Great job! %s = %d, so log₍%d₎ %d = %d. You need %d %s!',
                $calculation,
                $result,
                $base,
                $result,
                $correctAnswer,
                $correctAnswer,
                $correctAnswer === 1 ? 'candle' : 'candles'
            );
        } else {
            if ($studentAnswer < $correctAnswer) {
                return sprintf(
                    'Not quite. Try multiplying %d a few more times. You need more candles!',
                    $base
                );
            } else {
                return sprintf(
                    'Not quite. That\'s too many candles. Try counting again: how many times do you multiply %d to get %d?',
                    $base,
                    $result
                );
            }
        }
    }

    /**
     * Get hint for a problem
     *
     * @param int $base The base
     * @param int $result The result
     * @param int $correctAnswer The correct answer
     * @return string Hint message
     */
    public function getHint($base, $result, $correctAnswer) {
        if ($correctAnswer === 1) {
            return sprintf('%d to the power of 1 is just %d itself!', $base, $base);
        }

        $halfway = (int)floor($correctAnswer / 2);
        $halfwayResult = pow($base, $halfway);

        return sprintf(
            'Start counting: After %d %s, you get %d. Keep going until you reach %d!',
            $halfway,
            $halfway === 1 ? 'multiplication' : 'multiplications',
            $halfwayResult,
            $result
        );
    }

    /**
     * Check if a number is a perfect power of base
     *
     * @param int $base The base
     * @param int $number The number to check
     * @return bool True if number is a perfect power of base
     */
    public function isPerfectPower($base, $number) {
        if ($number === 1) {
            return true; // base^0 = 1
        }

        $power = log($number) / log($base);
        $roundedPower = round($power);

        return abs(pow($base, $roundedPower) - $number) < 0.0001;
    }

    /**
     * Generate a random problem
     *
     * @param int $difficulty Difficulty level (1-5)
     * @return array Problem data
     */
    public function generateProblem($difficulty = 1) {
        $bases = [2, 3, 5, 10];
        $base = $bases[array_rand($bases)];

        // Adjust power range based on difficulty
        $minPower = 1;
        $maxPower = min(2 + $difficulty, 6);

        $power = rand($minPower, $maxPower);
        $result = pow($base, $power);

        return [
            'base' => $base,
            'result' => $result,
            'correct_answer' => $power,
            'difficulty' => $difficulty,
            'question_text' => sprintf('Calculate: log₍%d₎ %d = ?', $base, $result)
        ];
    }

    /**
     * Format number with subscript for display
     *
     * @param int $number The number
     * @return string HTML formatted subscript
     */
    public function formatSubscript($number) {
        return sprintf('<sub>%d</sub>', $number);
    }

    /**
     * Format number with superscript for display
     *
     * @param int $number The number
     * @return string HTML formatted superscript
     */
    public function formatSuperscript($number) {
        return sprintf('<sup>%d</sup>', $number);
    }
}
