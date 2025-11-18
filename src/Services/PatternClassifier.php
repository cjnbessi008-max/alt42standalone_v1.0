<?php
/**
 * Pattern Classification Service
 * Analyzes sequences and classifies them by pattern type
 */

namespace ColorPattern\Services;

class PatternClassifier {

    /**
     * Classify a sequence and return pattern type
     */
    public function classifySequence(array $sequence) {
        if (count($sequence) < 3) {
            return 'unknown';
        }

        // Check patterns in order of specificity
        if ($this->isFibonacci($sequence)) {
            return 'fibonacci';
        }

        if ($this->isPrime($sequence)) {
            return 'prime';
        }

        if ($this->isExponential($sequence)) {
            return 'exponential';
        }

        if ($this->isGeometric($sequence)) {
            return 'geometric';
        }

        if ($this->isQuadratic($sequence)) {
            return 'quadratic';
        }

        if ($this->isArithmetic($sequence)) {
            return 'arithmetic';
        }

        return 'custom';
    }

    /**
     * Check if sequence is arithmetic (constant difference)
     */
    public function isArithmetic(array $sequence) {
        if (count($sequence) < 3) {
            return false;
        }

        $differences = [];
        for ($i = 1; $i < count($sequence); $i++) {
            $differences[] = $sequence[$i] - $sequence[$i - 1];
        }

        // Check if all differences are the same
        $firstDiff = $differences[0];
        foreach ($differences as $diff) {
            if (abs($diff - $firstDiff) > 0.0001) { // Allow small floating point errors
                return false;
            }
        }

        return true;
    }

    /**
     * Check if sequence is geometric (constant ratio)
     */
    public function isGeometric(array $sequence) {
        if (count($sequence) < 3) {
            return false;
        }

        // Check for zeros (would cause division by zero)
        if (in_array(0, array_slice($sequence, 0, -1))) {
            return false;
        }

        $ratios = [];
        for ($i = 1; $i < count($sequence); $i++) {
            $ratios[] = $sequence[$i] / $sequence[$i - 1];
        }

        // Check if all ratios are the same
        $firstRatio = $ratios[0];
        foreach ($ratios as $ratio) {
            if (abs($ratio - $firstRatio) > 0.0001) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if sequence is Fibonacci
     */
    public function isFibonacci(array $sequence) {
        if (count($sequence) < 3) {
            return false;
        }

        // Check if each term is sum of previous two
        for ($i = 2; $i < count($sequence); $i++) {
            if ($sequence[$i] != $sequence[$i - 1] + $sequence[$i - 2]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if sequence is quadratic (perfect squares or quadratic)
     */
    public function isQuadratic(array $sequence) {
        if (count($sequence) < 4) {
            return false;
        }

        // Check if it's perfect squares: 1, 4, 9, 16, 25...
        $isPerfectSquares = true;
        for ($i = 0; $i < count($sequence); $i++) {
            $expected = ($i + 1) * ($i + 1);
            if ($sequence[$i] != $expected) {
                $isPerfectSquares = false;
                break;
            }
        }

        if ($isPerfectSquares) {
            return true;
        }

        // Check if second differences are constant (quadratic pattern)
        $firstDiff = [];
        for ($i = 1; $i < count($sequence); $i++) {
            $firstDiff[] = $sequence[$i] - $sequence[$i - 1];
        }

        $secondDiff = [];
        for ($i = 1; $i < count($firstDiff); $i++) {
            $secondDiff[] = $firstDiff[$i] - $firstDiff[$i - 1];
        }

        if (empty($secondDiff)) {
            return false;
        }

        $firstSecondDiff = $secondDiff[0];
        foreach ($secondDiff as $diff) {
            if (abs($diff - $firstSecondDiff) > 0.0001) {
                return false;
            }
        }

        return $firstSecondDiff != 0; // Must have non-zero second difference
    }

    /**
     * Check if sequence contains only prime numbers
     */
    public function isPrime(array $sequence) {
        if (count($sequence) < 3) {
            return false;
        }

        foreach ($sequence as $num) {
            if (!$this->isPrimeNumber($num)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if a number is prime
     */
    private function isPrimeNumber($n) {
        if ($n < 2) {
            return false;
        }
        if ($n == 2) {
            return true;
        }
        if ($n % 2 == 0) {
            return false;
        }

        $sqrt = sqrt($n);
        for ($i = 3; $i <= $sqrt; $i += 2) {
            if ($n % $i == 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if sequence is exponential (powers of a number)
     */
    public function isExponential(array $sequence) {
        if (count($sequence) < 3) {
            return false;
        }

        // Check if it's powers of 2: 2, 4, 8, 16, 32...
        $base = 2;
        $isPowersOfTwo = true;
        for ($i = 0; $i < count($sequence); $i++) {
            $expected = pow($base, $i + 1);
            if ($sequence[$i] != $expected) {
                $isPowersOfTwo = false;
                break;
            }
        }

        if ($isPowersOfTwo) {
            return true;
        }

        // Check if it's powers of 3: 3, 9, 27, 81...
        $base = 3;
        $isPowersOfThree = true;
        for ($i = 0; $i < count($sequence); $i++) {
            $expected = pow($base, $i + 1);
            if ($sequence[$i] != $expected) {
                $isPowersOfThree = false;
                break;
            }
        }

        return $isPowersOfThree;
    }

    /**
     * Generate next term in sequence
     */
    public function generateNextTerm(array $sequence, $patternType) {
        switch ($patternType) {
            case 'arithmetic':
                $diff = $sequence[1] - $sequence[0];
                return $sequence[count($sequence) - 1] + $diff;

            case 'geometric':
                $ratio = $sequence[1] / $sequence[0];
                return $sequence[count($sequence) - 1] * $ratio;

            case 'fibonacci':
                $n = count($sequence);
                return $sequence[$n - 1] + $sequence[$n - 2];

            case 'quadratic':
                // For perfect squares
                $n = count($sequence) + 1;
                return $n * $n;

            case 'exponential':
                // For powers of 2
                $n = count($sequence) + 1;
                return pow(2, $n);

            default:
                return null;
        }
    }

    /**
     * Compare student answer with correct answer
     */
    public function checkAnswer(array $studentAnswer, array $correctAnswer) {
        if (count($studentAnswer) !== count($correctAnswer)) {
            return [
                'is_correct' => false,
                'score' => 0,
                'details' => 'Answer length mismatch'
            ];
        }

        $correctCount = 0;
        $total = count($correctAnswer);
        $feedback = [];

        for ($i = 0; $i < $total; $i++) {
            if ($studentAnswer[$i] === $correctAnswer[$i]) {
                $correctCount++;
                $feedback[] = [
                    'index' => $i,
                    'correct' => true
                ];
            } else {
                $feedback[] = [
                    'index' => $i,
                    'correct' => false,
                    'expected' => $correctAnswer[$i],
                    'actual' => $studentAnswer[$i]
                ];
            }
        }

        $score = ($correctCount / $total) * 100;
        $isCorrect = $score >= 100;

        return [
            'is_correct' => $isCorrect,
            'score' => round($score, 2),
            'correct_count' => $correctCount,
            'total_count' => $total,
            'feedback' => $feedback
        ];
    }

    /**
     * Generate a random sequence of given pattern type
     */
    public function generateSequence($patternType, $length = 6, $difficulty = 1) {
        switch ($patternType) {
            case 'arithmetic':
                return $this->generateArithmeticSequence($length, $difficulty);

            case 'geometric':
                return $this->generateGeometricSequence($length, $difficulty);

            case 'fibonacci':
                return $this->generateFibonacciSequence($length);

            case 'quadratic':
                return $this->generateQuadraticSequence($length);

            case 'prime':
                return $this->generatePrimeSequence($length);

            case 'exponential':
                return $this->generateExponentialSequence($length);

            default:
                return [];
        }
    }

    private function generateArithmeticSequence($length, $difficulty) {
        $start = rand(1, 10);
        $diff = rand(1, $difficulty * 5);
        $sequence = [$start];

        for ($i = 1; $i < $length; $i++) {
            $sequence[] = $sequence[$i - 1] + $diff;
        }

        return $sequence;
    }

    private function generateGeometricSequence($length, $difficulty) {
        $start = rand(1, 5);
        $ratio = rand(2, min(3, $difficulty + 1));
        $sequence = [$start];

        for ($i = 1; $i < $length; $i++) {
            $sequence[] = $sequence[$i - 1] * $ratio;
            if ($sequence[$i] > 10000) break; // Prevent overflow
        }

        return $sequence;
    }

    private function generateFibonacciSequence($length) {
        if ($length < 2) return [1];
        $sequence = [1, 1];

        for ($i = 2; $i < $length; $i++) {
            $sequence[] = $sequence[$i - 1] + $sequence[$i - 2];
        }

        return $sequence;
    }

    private function generateQuadraticSequence($length) {
        $sequence = [];
        for ($i = 1; $i <= $length; $i++) {
            $sequence[] = $i * $i;
        }
        return $sequence;
    }

    private function generatePrimeSequence($length) {
        $primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
        return array_slice($primes, 0, $length);
    }

    private function generateExponentialSequence($length) {
        $sequence = [];
        for ($i = 1; $i <= $length; $i++) {
            $sequence[] = pow(2, $i);
        }
        return $sequence;
    }
}
