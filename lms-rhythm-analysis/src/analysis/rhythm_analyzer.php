<?php
/**
 * Rhythm Analyzer
 * Analyzes learning rhythm patterns and identifies optimal study times
 */

require_once __DIR__ . '/../../config/database.php';

class RhythmAnalyzer {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    /**
     * Analyze rhythm patterns for a user
     * @param int $user_id Local user ID
     * @param int $days_back Analysis period in days
     * @return array|null Analysis results
     */
    public function analyzeRhythm($user_id, $days_back = 30) {
        $sessions = $this->getLearningSessions($user_id, $days_back);

        if (count($sessions) < 3) {
            return null; // Not enough data
        }

        $analysis = [
            'user_id' => $user_id,
            'pattern_type' => $this->determinePatternType($sessions),
            'peak_hours' => $this->findPeakHours($sessions),
            'optimal_session_duration' => $this->calculateOptimalDuration($sessions),
            'avg_session_gap_hours' => $this->calculateAverageGap($sessions),
            'consistency_score' => $this->calculateConsistencyScore($sessions),
            'pattern_strength' => $this->calculatePatternStrength($sessions),
            'period_start' => date('Y-m-d', strtotime("-$days_back days")),
            'period_end' => date('Y-m-d')
        ];

        // Save to database
        $this->saveRhythmPattern($analysis);

        return $analysis;
    }

    /**
     * Get learning sessions for analysis
     * @param int $user_id
     * @param int $days_back
     * @return array
     */
    private function getLearningSessions($user_id, $days_back) {
        $query = "SELECT * FROM learning_sessions
                 WHERE user_id = :user_id
                 AND session_start >= DATE_SUB(NOW(), INTERVAL :days_back DAY)
                 ORDER BY session_start ASC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':days_back', $days_back, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Determine pattern type (daily, weekly, concentrated, distributed)
     * @param array $sessions
     * @return string
     */
    private function determinePatternType($sessions) {
        $day_distribution = array_fill(0, 7, 0);
        $hour_distribution = array_fill(0, 24, 0);

        foreach ($sessions as $session) {
            $day_distribution[$session['day_of_week']]++;
            $hour_distribution[$session['hour_of_day']]++;
        }

        // Calculate variance
        $day_variance = $this->calculateVariance($day_distribution);
        $hour_variance = $this->calculateVariance($hour_distribution);

        // High day variance = concentrated (specific days)
        // High hour variance = concentrated (specific times)
        // Low variance = distributed evenly

        $total_sessions = count($sessions);
        $days_active = count(array_filter($day_distribution, function($count) { return $count > 0; }));

        if ($days_active <= 2) {
            return 'concentrated'; // Only studies on 1-2 days
        } else if ($days_active >= 5) {
            return 'distributed'; // Studies spread across week
        } else if ($day_variance < 2) {
            return 'daily'; // Consistent daily pattern
        } else {
            return 'weekly'; // Weekly pattern with specific days
        }
    }

    /**
     * Find peak learning hours
     * @param array $sessions
     * @return array Hour numbers when performance is best
     */
    private function findPeakHours($sessions) {
        $hour_performance = array_fill(0, 24, [
            'count' => 0,
            'total_success_rate' => 0,
            'total_focus' => 0
        ]);

        foreach ($sessions as $session) {
            $hour = $session['hour_of_day'];
            $hour_performance[$hour]['count']++;
            $hour_performance[$hour]['total_success_rate'] += $session['success_rate'];

            // Calculate focus score (longer duration + higher success rate = better focus)
            $focus_score = ($session['success_rate'] * 0.7) + (min($session['duration_minutes'] / 60, 1) * 30);
            $hour_performance[$hour]['total_focus'] += $focus_score;
        }

        // Calculate average performance for each hour
        $hour_scores = [];
        foreach ($hour_performance as $hour => $data) {
            if ($data['count'] > 0) {
                $avg_success = $data['total_success_rate'] / $data['count'];
                $avg_focus = $data['total_focus'] / $data['count'];
                $hour_scores[$hour] = ($avg_success * 0.6) + ($avg_focus * 0.4);
            }
        }

        // Sort by score and get top hours
        arsort($hour_scores);
        $peak_hours = array_slice(array_keys($hour_scores), 0, 5);

        return $peak_hours;
    }

    /**
     * Calculate optimal session duration
     * @param array $sessions
     * @return int Optimal duration in minutes
     */
    private function calculateOptimalDuration($sessions) {
        // Analyze relationship between duration and success rate
        $duration_buckets = [
            '0-15' => ['count' => 0, 'total_success' => 0],
            '15-30' => ['count' => 0, 'total_success' => 0],
            '30-60' => ['count' => 0, 'total_success' => 0],
            '60-90' => ['count' => 0, 'total_success' => 0],
            '90+' => ['count' => 0, 'total_success' => 0]
        ];

        foreach ($sessions as $session) {
            $duration = $session['duration_minutes'];
            $success = $session['success_rate'];

            if ($duration <= 15) {
                $bucket = '0-15';
            } else if ($duration <= 30) {
                $bucket = '15-30';
            } else if ($duration <= 60) {
                $bucket = '30-60';
            } else if ($duration <= 90) {
                $bucket = '60-90';
            } else {
                $bucket = '90+';
            }

            $duration_buckets[$bucket]['count']++;
            $duration_buckets[$bucket]['total_success'] += $success;
        }

        // Find bucket with highest average success rate
        $best_bucket = null;
        $best_success = 0;

        foreach ($duration_buckets as $bucket => $data) {
            if ($data['count'] > 0) {
                $avg_success = $data['total_success'] / $data['count'];
                if ($avg_success > $best_success) {
                    $best_success = $avg_success;
                    $best_bucket = $bucket;
                }
            }
        }

        // Return midpoint of best bucket
        $duration_map = [
            '0-15' => 10,
            '15-30' => 22,
            '30-60' => 45,
            '60-90' => 75,
            '90+' => 90
        ];

        return $duration_map[$best_bucket] ?? 45;
    }

    /**
     * Calculate average gap between sessions
     * @param array $sessions
     * @return float Average gap in hours
     */
    private function calculateAverageGap($sessions) {
        if (count($sessions) < 2) {
            return 0;
        }

        $gaps = [];
        for ($i = 1; $i < count($sessions); $i++) {
            $prev_end = strtotime($sessions[$i - 1]['session_end']);
            $current_start = strtotime($sessions[$i]['session_start']);
            $gap_hours = ($current_start - $prev_end) / 3600;
            $gaps[] = $gap_hours;
        }

        return count($gaps) > 0 ? array_sum($gaps) / count($gaps) : 0;
    }

    /**
     * Calculate consistency score (0-100)
     * Higher score = more regular learning pattern
     * @param array $sessions
     * @return float
     */
    private function calculateConsistencyScore($sessions) {
        if (count($sessions) < 3) {
            return 0;
        }

        $gaps = [];
        for ($i = 1; $i < count($sessions); $i++) {
            $prev_end = strtotime($sessions[$i - 1]['session_end']);
            $current_start = strtotime($sessions[$i]['session_start']);
            $gap_hours = ($current_start - $prev_end) / 3600;
            $gaps[] = $gap_hours;
        }

        // Calculate coefficient of variation (lower = more consistent)
        $mean = array_sum($gaps) / count($gaps);
        $variance = $this->calculateVariance($gaps);
        $std_dev = sqrt($variance);

        $cv = $mean > 0 ? ($std_dev / $mean) : 1;

        // Convert to 0-100 score (lower CV = higher score)
        // CV of 0 = 100 score, CV of 2+ = 0 score
        $consistency_score = max(0, min(100, 100 - ($cv * 50)));

        return round($consistency_score, 2);
    }

    /**
     * Calculate pattern strength (0-100)
     * How strong/predictable is the pattern
     * @param array $sessions
     * @return float
     */
    private function calculatePatternStrength($sessions) {
        $day_distribution = array_fill(0, 7, 0);
        $hour_distribution = array_fill(0, 24, 0);

        foreach ($sessions as $session) {
            $day_distribution[$session['day_of_week']]++;
            $hour_distribution[$session['hour_of_day']]++;
        }

        // Calculate entropy for both distributions
        $day_entropy = $this->calculateEntropy($day_distribution);
        $hour_entropy = $this->calculateEntropy($hour_distribution);

        // Lower entropy = stronger pattern
        // Max entropy for 7 days = log2(7) ≈ 2.807
        // Max entropy for 24 hours = log2(24) ≈ 4.585

        $max_day_entropy = log(7, 2);
        $max_hour_entropy = log(24, 2);

        $day_strength = (1 - ($day_entropy / $max_day_entropy)) * 100;
        $hour_strength = (1 - ($hour_entropy / $max_hour_entropy)) * 100;

        // Combine both strengths
        $pattern_strength = ($day_strength * 0.5) + ($hour_strength * 0.5);

        return round($pattern_strength, 2);
    }

    /**
     * Calculate variance of array
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
     * Calculate entropy (measure of randomness)
     * @param array $distribution
     * @return float
     */
    private function calculateEntropy($distribution) {
        $total = array_sum($distribution);
        if ($total === 0) return 0;

        $entropy = 0;
        foreach ($distribution as $count) {
            if ($count > 0) {
                $probability = $count / $total;
                $entropy -= $probability * log($probability, 2);
            }
        }

        return $entropy;
    }

    /**
     * Save rhythm pattern to database
     * @param array $analysis
     * @return bool
     */
    private function saveRhythmPattern($analysis) {
        try {
            $query = "INSERT INTO rhythm_patterns
                     (user_id, pattern_type, peak_hours, optimal_session_duration,
                      avg_session_gap_hours, consistency_score, pattern_strength,
                      analyzed_period_start, analyzed_period_end)
                     VALUES
                     (:user_id, :pattern_type, :peak_hours, :optimal_session_duration,
                      :avg_session_gap_hours, :consistency_score, :pattern_strength,
                      :period_start, :period_end)";

            $stmt = $this->db->prepare($query);

            $stmt->bindParam(':user_id', $analysis['user_id']);
            $stmt->bindParam(':pattern_type', $analysis['pattern_type']);

            $peak_hours_json = json_encode($analysis['peak_hours']);
            $stmt->bindParam(':peak_hours', $peak_hours_json);

            $stmt->bindParam(':optimal_session_duration', $analysis['optimal_session_duration']);
            $stmt->bindParam(':avg_session_gap_hours', $analysis['avg_session_gap_hours']);
            $stmt->bindParam(':consistency_score', $analysis['consistency_score']);
            $stmt->bindParam(':pattern_strength', $analysis['pattern_strength']);
            $stmt->bindParam(':period_start', $analysis['period_start']);
            $stmt->bindParam(':period_end', $analysis['period_end']);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Save rhythm pattern error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get latest rhythm pattern for user
     * @param int $user_id
     * @return array|null
     */
    public function getLatestPattern($user_id) {
        try {
            $query = "SELECT * FROM rhythm_patterns
                     WHERE user_id = :user_id
                     ORDER BY created_at DESC
                     LIMIT 1";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();

            $result = $stmt->fetch();

            if ($result) {
                $result['peak_hours'] = json_decode($result['peak_hours'], true);
            }

            return $result;
        } catch (PDOException $e) {
            error_log("Get latest pattern error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate daily focus snapshot
     * @param int $user_id
     * @param string $date Date in Y-m-d format
     * @return bool
     */
    public function generateDailySnapshot($user_id, $date) {
        try {
            // Get sessions for the day
            $query = "SELECT
                         COUNT(*) as session_count,
                         SUM(duration_minutes) as total_minutes,
                         AVG(success_rate) as avg_success_rate,
                         AVG(avg_response_time) as avg_response_time
                     FROM learning_sessions
                     WHERE user_id = :user_id
                     AND DATE(session_start) = :date";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':date', $date);
            $stmt->execute();

            $stats = $stmt->fetch();

            if ($stats['session_count'] == 0) {
                return false; // No activity on this day
            }

            // Calculate focus score
            // Based on: total time (30%), success rate (40%), consistency (30%)
            $time_score = min(($stats['total_minutes'] / 120) * 30, 30); // 2 hours = max
            $success_score = ($stats['avg_success_rate'] ?? 0) * 0.4;
            $consistency_score = min($stats['session_count'] * 10, 30); // Multiple sessions = better

            $focus_score = $time_score + $success_score + $consistency_score;

            // Insert snapshot
            $query = "INSERT INTO daily_focus_snapshots
                     (user_id, snapshot_date, total_learning_minutes, session_count,
                      quiz_accuracy, avg_response_time, focus_score)
                     VALUES
                     (:user_id, :date, :total_minutes, :session_count,
                      :quiz_accuracy, :avg_response_time, :focus_score)
                     ON DUPLICATE KEY UPDATE
                     total_learning_minutes = VALUES(total_learning_minutes),
                     session_count = VALUES(session_count),
                     quiz_accuracy = VALUES(quiz_accuracy),
                     avg_response_time = VALUES(avg_response_time),
                     focus_score = VALUES(focus_score)";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':date', $date);
            $stmt->bindValue(':total_minutes', $stats['total_minutes'] ?? 0);
            $stmt->bindValue(':session_count', $stats['session_count']);
            $stmt->bindValue(':quiz_accuracy', $stats['avg_success_rate'] ?? 0);
            $stmt->bindValue(':avg_response_time', $stats['avg_response_time'] ?? 0);
            $stmt->bindValue(':focus_score', round($focus_score, 2));

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Generate daily snapshot error: " . $e->getMessage());
            return false;
        }
    }
}
