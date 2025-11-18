<?php
/**
 * Prime Factorization Engine
 * 소수 분해 알고리즘 및 애니메이션 데이터 생성
 *
 * @author Prime Fireworks Team
 * @version 1.0.0
 */

class PrimeFactorizer {

    /**
     * 주어진 숫자를 소수로 분해
     *
     * @param int $n 분해할 숫자
     * @return array 소수 인수 배열
     */
    public static function factorize($n) {
        if ($n <= 1) {
            return [];
        }

        $factors = [];

        // 2로 나누기
        while ($n % 2 == 0) {
            $factors[] = 2;
            $n = intval($n / 2);
        }

        // 홀수로 나누기 (3부터 sqrt(n)까지)
        for ($i = 3; $i <= sqrt($n); $i += 2) {
            while ($n % $i == 0) {
                $factors[] = intval($i);
                $n = intval($n / $i);
            }
        }

        // n이 2보다 큰 소수인 경우
        if ($n > 2) {
            $factors[] = intval($n);
        }

        return $factors;
    }

    /**
     * 소수 분해 과정을 단계별로 생성 (폭죽 애니메이션용)
     *
     * @param int $n 분해할 숫자
     * @return array 분해 단계 정보
     */
    public static function getFactorizationSteps($n) {
        if ($n <= 1) {
            return [
                'original' => $n,
                'steps' => [],
                'final_primes' => [],
                'is_prime' => false
            ];
        }

        $steps = [];
        $current = $n;
        $stepNumber = 0;

        // 2로 나누기
        while ($current % 2 == 0) {
            $quotient = intval($current / 2);
            $steps[] = [
                'step' => ++$stepNumber,
                'number' => $current,
                'divisor' => 2,
                'quotient' => $quotient,
                'is_prime_divisor' => true,
                'position' => self::calculatePosition($stepNumber, count($steps))
            ];
            $current = $quotient;
        }

        // 홀수로 나누기
        for ($i = 3; $i <= sqrt($current); $i += 2) {
            while ($current % $i == 0) {
                $quotient = intval($current / $i);
                $steps[] = [
                    'step' => ++$stepNumber,
                    'number' => $current,
                    'divisor' => intval($i),
                    'quotient' => $quotient,
                    'is_prime_divisor' => self::isPrime($i),
                    'position' => self::calculatePosition($stepNumber, count($steps))
                ];
                $current = $quotient;
            }
        }

        // 최종 결과가 소수인 경우
        $finalPrimes = self::factorize($n);

        return [
            'original' => $n,
            'steps' => $steps,
            'final_primes' => $finalPrimes,
            'is_prime' => count($finalPrimes) === 1 && $finalPrimes[0] === $n,
            'step_count' => count($steps)
        ];
    }

    /**
     * 폭죽 애니메이션용 전체 데이터 생성
     *
     * @param int $n 분해할 숫자
     * @return array 애니메이션 데이터
     */
    public static function generateFireworksData($n) {
        $factorization = self::getFactorizationSteps($n);

        $fireworksStages = [];
        $primePositions = [];
        $canvasWidth = 350;
        $canvasHeight = 500;

        // 각 단계를 폭죽 애니메이션으로 변환
        foreach ($factorization['steps'] as $index => $step) {
            $stage = [
                'stage_number' => $index + 1,
                'from_number' => $step['number'],
                'to_numbers' => [$step['divisor'], $step['quotient']],
                'explosion' => [
                    'center_x' => $canvasWidth / 2,
                    'center_y' => 100 + ($index * 60),
                    'radius' => 80,
                    'color' => self::getColorForNumber($step['number']),
                    'particles' => self::generateParticles($step['number'])
                ],
                'factor_positions' => [
                    [
                        'number' => $step['divisor'],
                        'x' => $canvasWidth / 2 - 60,
                        'y' => 100 + ($index * 60) + 40,
                        'is_prime' => self::isPrime($step['divisor']),
                        'color' => self::getColorForPrime($step['divisor'])
                    ],
                    [
                        'number' => $step['quotient'],
                        'x' => $canvasWidth / 2 + 60,
                        'y' => 100 + ($index * 60) + 40,
                        'is_prime' => self::isPrime($step['quotient']),
                        'color' => self::getColorForPrime($step['quotient'])
                    ]
                ],
                'duration_ms' => 1000,
                'delay_ms' => $index * 1200
            ];

            $fireworksStages[] = $stage;
        }

        // 최종 소수들의 위치 계산
        $primeCount = count($factorization['final_primes']);
        $spacing = $canvasWidth / ($primeCount + 1);

        foreach ($factorization['final_primes'] as $index => $prime) {
            $primePositions[] = [
                'number' => $prime,
                'x' => $spacing * ($index + 1),
                'y' => $canvasHeight - 100,
                'color' => self::getColorForPrime($prime),
                'size' => 30,
                'glow' => true
            ];
        }

        return [
            'original_number' => $n,
            'prime_factors' => $factorization['final_primes'],
            'is_prime' => $factorization['is_prime'],
            'animation_stages' => $fireworksStages,
            'final_prime_positions' => $primePositions,
            'total_duration_ms' => count($fireworksStages) * 1200 + 2000,
            'canvas_size' => [
                'width' => $canvasWidth,
                'height' => $canvasHeight
            ]
        ];
    }

    /**
     * 소수 판별
     *
     * @param int $n 판별할 숫자
     * @return bool 소수 여부
     */
    public static function isPrime($n) {
        if ($n <= 1) return false;
        if ($n <= 3) return true;
        if ($n % 2 == 0 || $n % 3 == 0) return false;

        for ($i = 5; $i * $i <= $n; $i += 6) {
            if ($n % $i == 0 || $n % ($i + 2) == 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * 답안 검증
     *
     * @param int $number 원래 숫자
     * @param array $submittedFactors 제출된 인수 배열
     * @return array 검증 결과
     */
    public static function validateAnswer($number, $submittedFactors) {
        $correctFactors = self::factorize($number);

        // 배열 정렬 (순서 무관)
        sort($correctFactors);
        sort($submittedFactors);

        $isCorrect = $correctFactors === $submittedFactors;

        return [
            'is_correct' => $isCorrect,
            'submitted' => $submittedFactors,
            'correct_answer' => $correctFactors,
            'submitted_product' => array_product($submittedFactors),
            'expected_product' => $number,
            'all_primes' => self::areAllPrime($submittedFactors),
            'feedback' => self::generateFeedback($number, $submittedFactors, $correctFactors)
        ];
    }

    /**
     * 모든 요소가 소수인지 확인
     *
     * @param array $numbers 숫자 배열
     * @return bool 모든 요소가 소수인지 여부
     */
    private static function areAllPrime($numbers) {
        foreach ($numbers as $num) {
            if (!self::isPrime($num)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 피드백 메시지 생성
     *
     * @param int $number 원래 숫자
     * @param array $submitted 제출된 답
     * @param array $correct 정답
     * @return string 피드백 메시지
     */
    private static function generateFeedback($number, $submitted, $correct) {
        if ($submitted === $correct) {
            return "정답입니다! 🎉 {$number}의 소수 인수분해를 완벽하게 완성했습니다.";
        }

        $product = array_product($submitted);

        if ($product !== $number) {
            return "답이 틀렸습니다. 제출한 인수들의 곱이 {$product}이지만, {$number}이 되어야 합니다.";
        }

        if (!self::areAllPrime($submitted)) {
            $composites = array_filter($submitted, function($n) {
                return !PrimeFactorizer::isPrime($n);
            });
            $compositeStr = implode(', ', $composites);
            return "아직 완전히 분해되지 않았습니다. {$compositeStr}은(는) 소수가 아니므로 더 분해할 수 있습니다.";
        }

        return "답이 틀렸습니다. 다시 한 번 확인해보세요.";
    }

    /**
     * 애니메이션용 위치 계산
     *
     * @param int $step 현재 단계
     * @param int $total 전체 단계 수
     * @return array x, y 좌표
     */
    private static function calculatePosition($step, $total) {
        $canvasWidth = 350;
        $canvasHeight = 500;

        return [
            'x' => $canvasWidth / 2,
            'y' => 100 + ($step * 60)
        ];
    }

    /**
     * 숫자에 따른 색상 반환
     *
     * @param int $number 숫자
     * @return string 16진수 색상 코드
     */
    private static function getColorForNumber($number) {
        $colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
        ];

        return $colors[$number % count($colors)];
    }

    /**
     * 소수에 따른 특별한 색상 반환
     *
     * @param int $prime 소수
     * @return string 16진수 색상 코드
     */
    private static function getColorForPrime($prime) {
        if (!self::isPrime($prime)) {
            return '#CCCCCC'; // 합성수는 회색
        }

        $primeColors = [
            2 => '#FF1744',   // 빨강
            3 => '#00E676',   // 초록
            5 => '#2979FF',   // 파랑
            7 => '#FFD600',   // 노랑
            11 => '#FF6D00',  // 주황
            13 => '#AA00FF',  // 보라
        ];

        if (isset($primeColors[$prime])) {
            return $primeColors[$prime];
        }

        // 기타 소수는 랜덤 밝은 색상
        return '#' . dechex(0xFF0000 + ($prime * 12345) % 0x00FFFF);
    }

    /**
     * 폭죽 파티클 생성
     *
     * @param int $number 기준 숫자
     * @return array 파티클 데이터
     */
    private static function generateParticles($number) {
        $particleCount = min(20, max(10, $number / 5));
        $particles = [];

        for ($i = 0; $i < $particleCount; $i++) {
            $angle = ($i / $particleCount) * 2 * M_PI;
            $velocity = 2 + rand(0, 3);

            $particles[] = [
                'angle' => $angle,
                'velocity' => $velocity,
                'vx' => cos($angle) * $velocity,
                'vy' => sin($angle) * $velocity,
                'life' => 1.0,
                'decay' => 0.02,
                'size' => rand(2, 5),
                'color' => self::getColorForNumber($number + $i)
            ];
        }

        return $particles;
    }

    /**
     * 난이도 판정
     *
     * @param int $number 숫자
     * @return string 난이도 (easy, medium, hard)
     */
    public static function assessDifficulty($number) {
        $factors = self::factorize($number);
        $uniquePrimes = count(array_unique($factors));
        $totalFactors = count($factors);

        if ($number <= 20 && $totalFactors <= 2) {
            return 'easy';
        } elseif ($number <= 100 && $totalFactors <= 4) {
            return 'medium';
        } else {
            return 'hard';
        }
    }
}
