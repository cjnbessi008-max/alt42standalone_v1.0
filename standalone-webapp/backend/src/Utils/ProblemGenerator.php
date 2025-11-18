<?php

namespace DualDance\Utils;

/**
 * Math problem generator for Dual Dance
 */
class ProblemGenerator
{
    /**
     * Generate a random problem based on difficulty
     */
    public static function generate(int $difficulty = 3, ?int $userId = null): array
    {
        $problemTypes = ['exponential', 'logarithmic', 'intersection'];
        $problemType = $problemTypes[array_rand($problemTypes)];

        // Adjust ranges based on difficulty
        $difficultyFactor = $difficulty / 5.0;

        $expBaseMin = 1.5 + ($difficultyFactor * 0.5);
        $expBaseMax = 2.5 + ($difficultyFactor * 2.0);
        $logBaseMin = 2.0;
        $logBaseMax = 5.0 + ($difficultyFactor * 15.0);

        $expBase = self::randomFloat($expBaseMin, $expBaseMax, 2);
        $logBase = self::randomFloat($logBaseMin, $logBaseMax, 2);
        $expCoeff = self::randomFloat(0.5, 2.0, 2);
        $logCoeff = self::randomFloat(0.5, 2.0, 2);

        $problem = [
            'user_id' => $userId,
            'problem_type' => $problemType,
            'exp_base' => $expBase,
            'log_base' => $logBase,
            'exp_coefficient' => $expCoeff,
            'log_coefficient' => $logCoeff,
            'difficulty' => $difficulty
        ];

        switch ($problemType) {
            case 'exponential':
                $x = rand(1, 5);
                $answer = $expCoeff * pow($expBase, $x);
                $problem['question_text'] = sprintf(
                    'Calculate: %.1f × %.1f^%d',
                    $expCoeff,
                    $expBase,
                    $x
                );
                $problem['answer'] = round($answer, 4);
                $problem['tolerance'] = 0.01;
                break;

            case 'logarithmic':
                $value = pow($logBase, rand(2, 4));
                $answer = $logCoeff * log($value) / log($logBase);
                $problem['question_text'] = sprintf(
                    'Calculate: %.1f × log<sub>%.1f</sub>(%.0f)',
                    $logCoeff,
                    $logBase,
                    $value
                );
                $problem['answer'] = round($answer, 4);
                $problem['tolerance'] = 0.01;
                break;

            case 'intersection':
                // Simplified: Find x where exp and log are approximately equal
                // For visualization purposes
                $answer = self::randomFloat(1.5, 3.5, 2);
                $problem['question_text'] = sprintf(
                    'At what x value do these functions intersect?<br>' .
                    'f(x) = %.1f × %.1f^x<br>' .
                    'g(x) = %.1f × log<sub>%.1f</sub>(x)',
                    $expCoeff,
                    $expBase,
                    $logCoeff,
                    $logBase
                );
                $problem['answer'] = round($answer, 4);
                $problem['tolerance'] = 0.5; // Larger tolerance for intersection
                break;
        }

        return $problem;
    }

    /**
     * Check if answer is correct
     */
    public static function checkAnswer(float $answer, float $correct, float $tolerance = 0.01): bool
    {
        return abs($answer - $correct) <= $tolerance;
    }

    /**
     * Calculate grade based on correctness and time
     */
    public static function calculateGrade(bool $isCorrect, int $timeSpent): float
    {
        if (!$isCorrect) {
            return 0.0;
        }

        $baseGrade = 100.0;
        $timePenalty = min(20.0, $timeSpent / 10.0); // Max 20% penalty
        $grade = max(50.0, $baseGrade - $timePenalty);

        return round($grade, 2);
    }

    /**
     * Generate random float with precision
     */
    private static function randomFloat(float $min, float $max, int $decimals = 2): float
    {
        $scale = pow(10, $decimals);
        $minScaled = (int)($min * $scale);
        $maxScaled = (int)($max * $scale);
        $random = rand($minScaled, $maxScaled);
        return round($random / $scale, $decimals);
    }
}
