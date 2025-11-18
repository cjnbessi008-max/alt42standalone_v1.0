<?php
/**
 * Thinking Routine Analyzer
 * Analyzes problem-solving patterns and thinking routines
 */

require_once __DIR__ . '/../../config/database.php';

class RoutineAnalyzer {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    /**
     * Analyze thinking routine for a user
     * @param int $user_id Local user ID
     * @param int $days_back Analysis period in days
     * @return array|null Analysis results
     */
    public function analyzeRoutine($user_id, $days_back = 30) {
        $responses = $this->getQuizResponses($user_id, $days_back);

        if (count($responses) < 5) {
            return null; // Not enough data
        }

        $analysis = [
            'user_id' => $user_id,
            'routine_type' => $this->determineRoutineType($responses),
            'avg_response_time' => $this->calculateAverageResponseTime($responses),
            'response_time_variance' => $this->calculateResponseTimeVariance($responses),
            'quick_question_ratio' => $this->calculateQuickQuestionRatio($responses),
            'slow_question_ratio' => $this->calculateSlowQuestionRatio($responses),
            'revision_pattern' => $this->analyzeRevisionPattern($user_id, $days_back),
            'error_correction_rate' => $this->calculateErrorCorrectionRate($user_id),
            'problem_solving_approach' => $this->determineProblemSolvingApproach($responses),
            'period_start' => date('Y-m-d', strtotime("-$days_back days")),
            'period_end' => date('Y-m-d')
        ];

        // Save to database
        $this->saveThinkingRoutine($analysis);

        return $analysis;
    }

    /**
     * Get quiz responses for analysis
     * @param int $user_id
     * @param int $days_back
     * @return array
     */
    private function getQuizResponses($user_id, $days_back) {
        $query = "SELECT * FROM quiz_responses
                 WHERE user_id = :user_id
                 AND time_started >= DATE_SUB(NOW(), INTERVAL :days_back DAY)
                 ORDER BY time_started ASC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':days_back', $days_back, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Determine routine type based on response patterns
     * @param array $responses
     * @return string 'quick_thinker', 'deliberate_thinker', or 'varied'
     */
    private function determineRoutineType($responses) {
        $response_times = array_map(function($r) {
            return $r['response_time_seconds'];
        }, $responses);

        $avg_time = array_sum($response_times) / count($response_times);
        $variance = $this->calculateVariance($response_times);
        $cv = sqrt($variance) / $avg_time; // Coefficient of variation

        // Quick thinker: Low avg time (< 60s) and consistent
        if ($avg_time < 60 && $cv < 0.5) {
            return 'quick_thinker';
        }

        // Deliberate thinker: Higher avg time (> 120s) and consistent
        if ($avg_time > 120 && $cv < 0.7) {
            return 'deliberate_thinker';
        }

        // Varied: High variance in response times
        return 'varied';
    }

    /**
     * Calculate average response time
     * @param array $responses
     * @return float
     */
    private function calculateAverageResponseTime($responses) {
        $times = array_map(function($r) {
            return $r['response_time_seconds'];
        }, $responses);

        return count($times) > 0 ? array_sum($times) / count($times) : 0;
    }

    /**
     * Calculate response time variance
     * @param array $responses
     * @return float
     */
    private function calculateResponseTimeVariance($responses) {
        $times = array_map(function($r) {
            return $r['response_time_seconds'];
        }, $responses);

        return $this->calculateVariance($times);
    }

    /**
     * Calculate ratio of quickly answered questions
     * @param array $responses
     * @return float Ratio (0-100)
     */
    private function calculateQuickQuestionRatio($responses) {
        $quick_threshold = 30; // 30 seconds
        $quick_count = 0;

        foreach ($responses as $response) {
            if ($response['response_time_seconds'] <= $quick_threshold) {
                $quick_count++;
            }
        }

        return count($responses) > 0
            ? ($quick_count / count($responses)) * 100
            : 0;
    }

    /**
     * Calculate ratio of slowly answered questions
     * @param array $responses
     * @return float Ratio (0-100)
     */
    private function calculateSlowQuestionRatio($responses) {
        $slow_threshold = 120; // 2 minutes
        $slow_count = 0;

        foreach ($responses as $response) {
            if ($response['response_time_seconds'] >= $slow_threshold) {
                $slow_count++;
            }
        }

        return count($responses) > 0
            ? ($slow_count / count($responses)) * 100
            : 0;
    }

    /**
     * Analyze revision/retry pattern
     * @param int $user_id
     * @param int $days_back
     * @return string 'minimal', 'moderate', or 'extensive'
     */
    private function analyzeRevisionPattern($user_id, $days_back) {
        // Look for repeated attempts on same questions
        $query = "SELECT question_id, COUNT(*) as attempt_count
                 FROM quiz_responses
                 WHERE user_id = :user_id
                 AND time_started >= DATE_SUB(NOW(), INTERVAL :days_back DAY)
                 GROUP BY question_id
                 HAVING attempt_count > 1";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':days_back', $days_back, PDO::PARAM_INT);
        $stmt->execute();

        $repeated_questions = $stmt->fetchAll();

        // Get total unique questions
        $query = "SELECT COUNT(DISTINCT question_id) as total_questions
                 FROM quiz_responses
                 WHERE user_id = :user_id
                 AND time_started >= DATE_SUB(NOW(), INTERVAL :days_back DAY)";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();

        $total = $stmt->fetch()['total_questions'];

        if ($total == 0) return 'minimal';

        $revision_ratio = count($repeated_questions) / $total;

        if ($revision_ratio < 0.1) {
            return 'minimal'; // Less than 10% of questions revisited
        } else if ($revision_ratio < 0.3) {
            return 'moderate'; // 10-30% revisited
        } else {
            return 'extensive'; // More than 30% revisited
        }
    }

    /**
     * Calculate error correction rate
     * How often does user get correct answer after wrong attempt
     * @param int $user_id
     * @return float Percentage (0-100)
     */
    private function calculateErrorCorrectionRate($user_id) {
        // Find questions that were answered incorrectly then correctly
        $query = "SELECT r1.question_id
                 FROM quiz_responses r1
                 INNER JOIN quiz_responses r2
                     ON r1.question_id = r2.question_id
                     AND r1.user_id = r2.user_id
                     AND r1.time_started < r2.time_started
                 WHERE r1.user_id = :user_id
                 AND r1.is_correct = 0
                 AND r2.is_correct = 1
                 GROUP BY r1.question_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();

        $corrected_count = $stmt->rowCount();

        // Get total incorrect answers
        $query = "SELECT COUNT(*) as total_incorrect
                 FROM quiz_responses
                 WHERE user_id = :user_id
                 AND is_correct = 0";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();

        $total_incorrect = $stmt->fetch()['total_incorrect'];

        return $total_incorrect > 0
            ? ($corrected_count / $total_incorrect) * 100
            : 0;
    }

    /**
     * Determine problem solving approach
     * @param array $responses
     * @return string 'sequential', 'selective', or 'random'
     */
    private function determineProblemSolvingApproach($responses) {
        if (count($responses) < 10) {
            return 'unknown';
        }

        // Analyze question order patterns
        $question_order = array_map(function($r) {
            return $r['question_id'];
        }, $responses);

        // Check if questions are answered in order
        $sequential_count = 0;
        for ($i = 1; $i < count($question_order); $i++) {
            if ($question_order[$i] == $question_order[$i - 1] + 1 ||
                $question_order[$i] == $question_order[$i - 1]) {
                $sequential_count++;
            }
        }

        $sequential_ratio = $sequential_count / (count($question_order) - 1);

        if ($sequential_ratio > 0.7) {
            return 'sequential'; // Answers questions in order
        }

        // Check for selective pattern (skipping difficult questions)
        $response_time_pattern = [];
        foreach ($responses as $response) {
            $response_time_pattern[] = $response['response_time_seconds'];
        }

        // If many quick responses (< 5s), might be skipping
        $skip_count = 0;
        foreach ($response_time_pattern as $time) {
            if ($time < 5) {
                $skip_count++;
            }
        }

        $skip_ratio = $skip_count / count($response_time_pattern);

        if ($skip_ratio > 0.2 && $sequential_ratio < 0.5) {
            return 'selective'; // Skips questions strategically
        }

        return 'random'; // No clear pattern
    }

    /**
     * Calculate variance
     * @param array $values
     * @return float
     */
    private function calculateVariance($values) {
        $count = count($values);
        if ($count === 0) return 0;

        $mean = array_sum($values) / $count;
        $sum_squares = 0;

        foreach ($values as $value) {
            $sum_squares += pow($value - $mean, 2);
        }

        return $sum_squares / $count;
    }

    /**
     * Save thinking routine to database
     * @param array $analysis
     * @return bool
     */
    private function saveThinkingRoutine($analysis) {
        try {
            $query = "INSERT INTO thinking_routines
                     (user_id, routine_type, avg_response_time, response_time_variance,
                      quick_question_ratio, slow_question_ratio, revision_pattern,
                      error_correction_rate, problem_solving_approach,
                      analyzed_period_start, analyzed_period_end)
                     VALUES
                     (:user_id, :routine_type, :avg_response_time, :response_time_variance,
                      :quick_question_ratio, :slow_question_ratio, :revision_pattern,
                      :error_correction_rate, :problem_solving_approach,
                      :period_start, :period_end)";

            $stmt = $this->db->prepare($query);

            $stmt->bindParam(':user_id', $analysis['user_id']);
            $stmt->bindParam(':routine_type', $analysis['routine_type']);
            $stmt->bindParam(':avg_response_time', $analysis['avg_response_time']);
            $stmt->bindParam(':response_time_variance', $analysis['response_time_variance']);
            $stmt->bindParam(':quick_question_ratio', $analysis['quick_question_ratio']);
            $stmt->bindParam(':slow_question_ratio', $analysis['slow_question_ratio']);
            $stmt->bindParam(':revision_pattern', $analysis['revision_pattern']);
            $stmt->bindParam(':error_correction_rate', $analysis['error_correction_rate']);
            $stmt->bindParam(':problem_solving_approach', $analysis['problem_solving_approach']);
            $stmt->bindParam(':period_start', $analysis['period_start']);
            $stmt->bindParam(':period_end', $analysis['period_end']);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Save thinking routine error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get latest thinking routine for user
     * @param int $user_id
     * @return array|null
     */
    public function getLatestRoutine($user_id) {
        try {
            $query = "SELECT * FROM thinking_routines
                     WHERE user_id = :user_id
                     ORDER BY created_at DESC
                     LIMIT 1";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();

            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Get latest routine error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get response time distribution
     * @param int $user_id
     * @param int $days_back
     * @return array Distribution data
     */
    public function getResponseTimeDistribution($user_id, $days_back = 30) {
        $responses = $this->getQuizResponses($user_id, $days_back);

        $distribution = [
            '0-10s' => 0,
            '10-30s' => 0,
            '30-60s' => 0,
            '60-120s' => 0,
            '120s+' => 0
        ];

        foreach ($responses as $response) {
            $time = $response['response_time_seconds'];

            if ($time <= 10) {
                $distribution['0-10s']++;
            } else if ($time <= 30) {
                $distribution['10-30s']++;
            } else if ($time <= 60) {
                $distribution['30-60s']++;
            } else if ($time <= 120) {
                $distribution['60-120s']++;
            } else {
                $distribution['120s+']++;
            }
        }

        return $distribution;
    }

    /**
     * Get accuracy by question type
     * @param int $user_id
     * @param int $days_back
     * @return array Accuracy data by type
     */
    public function getAccuracyByType($user_id, $days_back = 30) {
        $query = "SELECT
                     question_type,
                     COUNT(*) as total,
                     SUM(is_correct) as correct,
                     (SUM(is_correct) / COUNT(*)) * 100 as accuracy
                 FROM quiz_responses
                 WHERE user_id = :user_id
                 AND time_started >= DATE_SUB(NOW(), INTERVAL :days_back DAY)
                 GROUP BY question_type";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':days_back', $days_back, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
