<?php
/**
 * Thinking Pattern Analyzer
 * Analyzes morning vs evening learning performance and thinking patterns
 */

class ThinkingPatternAnalyzer {
    private $db;

    /**
     * Constructor
     *
     * @param PDO $db Database connection
     */
    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Analyze thinking patterns for a user over a period
     *
     * @param int $userId Moodle user ID
     * @param string $startDate Start date (Y-m-d)
     * @param string $endDate End date (Y-m-d)
     * @return array Analysis results
     */
    public function analyzeUserPatterns($userId, $startDate, $endDate) {
        $patterns = [];

        // Get data for each time period
        $timeOfDayPeriods = ['morning', 'afternoon', 'evening', 'night'];

        foreach ($timeOfDayPeriods as $timeOfDay) {
            $patterns[$timeOfDay] = $this->analyzeTimeOfDay(
                $userId,
                $timeOfDay,
                $startDate,
                $endDate
            );
        }

        // Calculate comparative metrics
        $comparison = $this->compareTimeOfDayPerformance($patterns);

        // Store analysis results
        $this->storeAnalysisResults($userId, $startDate, $endDate, $patterns);

        return [
            'user_id' => $userId,
            'period' => ['start' => $startDate, 'end' => $endDate],
            'patterns' => $patterns,
            'comparison' => $comparison,
            'recommendations' => $this->generateRecommendations($comparison)
        ];
    }

    /**
     * Analyze performance for specific time of day
     *
     * @param int $userId User ID
     * @param string $timeOfDay Time of day period
     * @param string $startDate Start date
     * @param string $endDate End date
     * @return array Analysis data
     */
    private function analyzeTimeOfDay($userId, $timeOfDay, $startDate, $endDate) {
        $stmt = $this->db->prepare("
            SELECT
                COUNT(DISTINCT la.id) as total_activities,
                AVG(tm.problem_solving_speed) as avg_solving_speed,
                AVG(tm.accuracy_rate) as avg_accuracy,
                AVG(tm.concentration_score) as avg_concentration,
                AVG(tm.thinking_depth_score) as avg_thinking_depth,
                AVG(la.score) as avg_score,
                AVG(la.time_spent_seconds) as avg_time_spent,
                SUM(la.time_spent_seconds) as total_time_spent,
                SUM(CASE WHEN la.is_completed = 1 THEN 1 ELSE 0 END) as completed_count,
                AVG(tm.error_count) as avg_errors,
                AVG(tm.hint_usage_count) as avg_hints,
                AVG(tm.retry_count) as avg_retries,
                STDDEV(tm.accuracy_rate) as accuracy_stddev,
                MIN(tm.accuracy_rate) as min_accuracy,
                MAX(tm.accuracy_rate) as max_accuracy
            FROM learning_activities la
            JOIN thinking_metrics tm ON la.id = tm.activity_id
            WHERE la.moodle_user_id = ?
            AND tm.time_of_day = ?
            AND la.started_at BETWEEN ? AND ?
            AND la.is_completed = 1
        ");

        $stmt->execute([
            $userId,
            $timeOfDay,
            $startDate . ' 00:00:00',
            $endDate . ' 23:59:59'
        ]);

        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        // Calculate derived metrics
        if ($data && $data['total_activities'] > 0) {
            $data['completion_rate'] = round(
                ($data['completed_count'] / $data['total_activities']) * 100,
                2
            );

            $data['efficiency_score'] = $this->calculateEfficiencyScore($data);
            $data['consistency_score'] = $this->calculateConsistencyScore($data);
        } else {
            $data = [
                'total_activities' => 0,
                'completion_rate' => 0,
                'efficiency_score' => 0,
                'consistency_score' => 0
            ];
        }

        return $data;
    }

    /**
     * Calculate efficiency score
     * Considers speed and accuracy together
     *
     * @param array $data Performance data
     * @return float Efficiency score (0-100)
     */
    private function calculateEfficiencyScore(array $data) {
        if (!isset($data['avg_accuracy']) || !isset($data['avg_solving_speed'])) {
            return 0;
        }

        $accuracy = $data['avg_accuracy'];

        // Normalize speed (lower is better, cap at 300 seconds)
        $speedNormalized = max(0, 100 - ($data['avg_solving_speed'] / 3));

        // Weight: 70% accuracy, 30% speed
        $efficiency = ($accuracy * 0.7) + ($speedNormalized * 0.3);

        return round($efficiency, 2);
    }

    /**
     * Calculate consistency score
     * Lower standard deviation = higher consistency
     *
     * @param array $data Performance data
     * @return float Consistency score (0-100)
     */
    private function calculateConsistencyScore(array $data) {
        if (!isset($data['accuracy_stddev']) || $data['accuracy_stddev'] === null) {
            return 0;
        }

        // Lower stddev = higher consistency
        // If stddev = 0, consistency = 100
        // If stddev = 30, consistency = 50
        // If stddev >= 50, consistency = 0
        $consistency = max(0, 100 - ($data['accuracy_stddev'] * 2));

        return round($consistency, 2);
    }

    /**
     * Compare performance across different times of day
     *
     * @param array $patterns Patterns data for all time periods
     * @return array Comparison results
     */
    private function compareTimeOfDayPerformance(array $patterns) {
        $comparison = [];

        // Find best time for each metric
        $metrics = [
            'avg_accuracy' => 'highest',
            'avg_concentration' => 'highest',
            'avg_thinking_depth' => 'highest',
            'avg_solving_speed' => 'lowest', // Lower is better
            'efficiency_score' => 'highest',
            'consistency_score' => 'highest',
            'avg_errors' => 'lowest'
        ];

        foreach ($metrics as $metric => $preferredDirection) {
            $bestTime = null;
            $bestValue = null;

            foreach ($patterns as $timeOfDay => $data) {
                if (!isset($data[$metric]) || $data['total_activities'] == 0) {
                    continue;
                }

                $value = $data[$metric];

                if ($bestValue === null) {
                    $bestValue = $value;
                    $bestTime = $timeOfDay;
                    continue;
                }

                if ($preferredDirection === 'highest' && $value > $bestValue) {
                    $bestValue = $value;
                    $bestTime = $timeOfDay;
                } elseif ($preferredDirection === 'lowest' && $value < $bestValue) {
                    $bestValue = $value;
                    $bestTime = $timeOfDay;
                }
            }

            $comparison['best_time_for_' . $metric] = [
                'time_of_day' => $bestTime,
                'value' => $bestValue
            ];
        }

        // Overall best performance time
        $overallScores = [];
        foreach ($patterns as $timeOfDay => $data) {
            if ($data['total_activities'] > 0) {
                $overallScores[$timeOfDay] = $data['efficiency_score'] ?? 0;
            }
        }

        if (!empty($overallScores)) {
            arsort($overallScores);
            $comparison['overall_best_time'] = array_key_first($overallScores);
            $comparison['overall_ranking'] = array_keys($overallScores);
        }

        // Calculate morning vs evening difference
        $comparison['morning_vs_evening'] = $this->compareMorningEvening($patterns);

        return $comparison;
    }

    /**
     * Compare morning vs evening performance specifically
     *
     * @param array $patterns All patterns data
     * @return array Comparison
     */
    private function compareMorningEvening(array $patterns) {
        $morning = $patterns['morning'] ?? [];
        $evening = $patterns['evening'] ?? [];

        if (empty($morning) || empty($evening) ||
            $morning['total_activities'] == 0 || $evening['total_activities'] == 0) {
            return ['data_insufficient' => true];
        }

        $comparison = [
            'accuracy_difference' => ($morning['avg_accuracy'] ?? 0) - ($evening['avg_accuracy'] ?? 0),
            'concentration_difference' => ($morning['avg_concentration'] ?? 0) - ($evening['avg_concentration'] ?? 0),
            'thinking_depth_difference' => ($morning['avg_thinking_depth'] ?? 0) - ($evening['avg_thinking_depth'] ?? 0),
            'speed_difference' => ($evening['avg_solving_speed'] ?? 0) - ($morning['avg_solving_speed'] ?? 0), // Positive means morning is faster
            'efficiency_difference' => ($morning['efficiency_score'] ?? 0) - ($evening['efficiency_score'] ?? 0),
        ];

        // Determine which is better
        $morningBetter = 0;
        $eveningBetter = 0;

        foreach (['accuracy_difference', 'concentration_difference',
                  'thinking_depth_difference', 'efficiency_difference'] as $key) {
            if ($comparison[$key] > 5) {  // Meaningful difference threshold
                $morningBetter++;
            } elseif ($comparison[$key] < -5) {
                $eveningBetter++;
            }
        }

        if ($comparison['speed_difference'] > 30) { // Morning faster by 30+ seconds
            $morningBetter++;
        } elseif ($comparison['speed_difference'] < -30) {
            $eveningBetter++;
        }

        if ($morningBetter > $eveningBetter) {
            $comparison['better_time'] = 'morning';
            $comparison['confidence'] = round(($morningBetter / ($morningBetter + $eveningBetter)) * 100, 1);
        } elseif ($eveningBetter > $morningBetter) {
            $comparison['better_time'] = 'evening';
            $comparison['confidence'] = round(($eveningBetter / ($morningBetter + $eveningBetter)) * 100, 1);
        } else {
            $comparison['better_time'] = 'similar';
            $comparison['confidence'] = 0;
        }

        return $comparison;
    }

    /**
     * Generate personalized recommendations
     *
     * @param array $comparison Comparison data
     * @return array Recommendations
     */
    private function generateRecommendations(array $comparison) {
        $recommendations = [];

        // Overall best time recommendation
        if (isset($comparison['overall_best_time'])) {
            $bestTime = $comparison['overall_best_time'];
            $recommendations[] = [
                'type' => 'optimal_study_time',
                'priority' => 'high',
                'message_ko' => "가장 효율적인 학습 시간대는 {$bestTime}입니다.",
                'message_en' => "Your most efficient study time is {$bestTime}.",
                'time_of_day' => $bestTime
            ];
        }

        // Morning vs evening recommendation
        if (isset($comparison['morning_vs_evening']['better_time'])) {
            $betterTime = $comparison['morning_vs_evening']['better_time'];
            $confidence = $comparison['morning_vs_evening']['confidence'] ?? 0;

            if ($betterTime !== 'similar' && $confidence >= 60) {
                $recommendations[] = [
                    'type' => 'morning_evening_preference',
                    'priority' => 'medium',
                    'message_ko' => "{$betterTime}에 학습할 때 사고력이 {$confidence}% 더 향상됩니다.",
                    'message_en' => "Your thinking ability improves by {$confidence}% during {$betterTime}.",
                    'better_time' => $betterTime,
                    'confidence' => $confidence
                ];
            }
        }

        // Accuracy improvement needed
        if (isset($comparison['best_time_for_avg_accuracy']['value']) &&
            $comparison['best_time_for_avg_accuracy']['value'] < 70) {
            $recommendations[] = [
                'type' => 'improve_accuracy',
                'priority' => 'high',
                'message_ko' => '전반적인 정확도 향상이 필요합니다. 문제를 천천히 읽고 검토하세요.',
                'message_en' => 'Overall accuracy needs improvement. Read problems carefully and review your answers.'
            ];
        }

        // Concentration issues
        if (isset($comparison['best_time_for_avg_concentration']['value']) &&
            $comparison['best_time_for_avg_concentration']['value'] < 60) {
            $recommendations[] = [
                'type' => 'improve_concentration',
                'priority' => 'medium',
                'message_ko' => '집중도를 높이기 위해 짧은 학습 세션과 규칙적인 휴식을 권장합니다.',
                'message_en' => 'To improve concentration, try shorter study sessions with regular breaks.'
            ];
        }

        return $recommendations;
    }

    /**
     * Store analysis results in database
     *
     * @param int $userId User ID
     * @param string $startDate Start date
     * @param string $endDate End date
     * @param array $patterns Patterns data
     * @return bool Success
     */
    private function storeAnalysisResults($userId, $startDate, $endDate, array $patterns) {
        $stmt = $this->db->prepare("
            INSERT INTO thinking_pattern_analysis
            (moodle_user_id, analysis_period_start, analysis_period_end, time_of_day,
             avg_problem_solving_speed, avg_accuracy_rate, avg_concentration_score,
             avg_thinking_depth_score, total_activities, total_time_spent_seconds,
             completion_rate, avg_score, analyzed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                avg_problem_solving_speed = VALUES(avg_problem_solving_speed),
                avg_accuracy_rate = VALUES(avg_accuracy_rate),
                avg_concentration_score = VALUES(avg_concentration_score),
                avg_thinking_depth_score = VALUES(avg_thinking_depth_score),
                total_activities = VALUES(total_activities),
                total_time_spent_seconds = VALUES(total_time_spent_seconds),
                completion_rate = VALUES(completion_rate),
                avg_score = VALUES(avg_score),
                analyzed_at = NOW()
        ");

        try {
            foreach ($patterns as $timeOfDay => $data) {
                if ($data['total_activities'] == 0) {
                    continue;
                }

                $stmt->execute([
                    $userId,
                    $startDate,
                    $endDate,
                    $timeOfDay,
                    $data['avg_solving_speed'] ?? null,
                    $data['avg_accuracy'] ?? null,
                    $data['avg_concentration'] ?? null,
                    $data['avg_thinking_depth'] ?? null,
                    $data['total_activities'],
                    $data['total_time_spent'] ?? null,
                    $data['completion_rate'] ?? null,
                    $data['avg_score'] ?? null
                ]);
            }

            return true;
        } catch (PDOException $e) {
            error_log("Failed to store analysis results: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get historical analysis for a user
     *
     * @param int $userId User ID
     * @param int $limit Number of recent analyses to fetch
     * @return array Historical data
     */
    public function getHistoricalAnalysis($userId, $limit = 10) {
        $stmt = $this->db->prepare("
            SELECT *
            FROM thinking_pattern_analysis
            WHERE moodle_user_id = ?
            ORDER BY analyzed_at DESC
            LIMIT ?
        ");

        $stmt->execute([$userId, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
