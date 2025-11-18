<?php
/**
 * Deviation Calculator Service
 * Calculates learning deviation (Z-score) and clusters students
 */

namespace DeviationBreeze\Services;

use DeviationBreeze\Utils\Database;

class DeviationCalculator
{
    private $db;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Calculate deviation for a specific quiz
     *
     * @param int $quizId Local quiz ID
     * @return array Calculation results
     */
    public function calculateQuizDeviation($quizId)
    {
        // Get all finished attempts for this quiz
        $attempts = $this->db->query(
            "SELECT qa.id, qa.student_id, qa.percentage as score
             FROM quiz_attempts qa
             WHERE qa.quiz_id = ? AND qa.state = 'finished'",
            [$quizId]
        );

        if (empty($attempts)) {
            return [
                'success' => false,
                'message' => 'No finished attempts found for this quiz'
            ];
        }

        // Calculate statistics
        $scores = array_column($attempts, 'score');
        $stats = $this->calculateStatistics($scores);

        // Clear existing deviation data for this quiz
        $this->db->execute(
            "DELETE FROM deviation_analytics WHERE quiz_id = ?",
            [$quizId]
        );

        // Calculate deviation for each student
        $deviations = [];
        foreach ($attempts as $attempt) {
            $deviation = $this->calculateStudentDeviation(
                $attempt['score'],
                $stats
            );

            $deviation['quiz_id'] = $quizId;
            $deviation['student_id'] = $attempt['student_id'];
            $deviation['score'] = $attempt['score'];
            $deviation['avg_score'] = $stats['mean'];
            $deviation['std_deviation'] = $stats['stdDev'];
            $deviation['variance'] = $stats['variance'];

            // Insert into database
            $this->saveDeviation($deviation);

            $deviations[] = $deviation;
        }

        // Update ranks
        $this->updateRanks($quizId);

        // Save to history
        $this->saveToHistory($quizId);

        return [
            'success' => true,
            'quiz_id' => $quizId,
            'total_students' => count($attempts),
            'statistics' => $stats,
            'deviations' => $deviations
        ];
    }

    /**
     * Calculate basic statistics
     *
     * @param array $scores
     * @return array Statistics
     */
    private function calculateStatistics($scores)
    {
        $count = count($scores);

        if ($count === 0) {
            return [
                'count' => 0,
                'mean' => 0,
                'stdDev' => 0,
                'variance' => 0,
                'min' => 0,
                'max' => 0
            ];
        }

        $mean = array_sum($scores) / $count;

        // Calculate variance
        $variance = 0;
        foreach ($scores as $score) {
            $variance += pow($score - $mean, 2);
        }
        $variance = $variance / $count;

        // Standard deviation
        $stdDev = sqrt($variance);

        return [
            'count' => $count,
            'mean' => round($mean, 2),
            'stdDev' => round($stdDev, 4),
            'variance' => round($variance, 4),
            'min' => min($scores),
            'max' => max($scores)
        ];
    }

    /**
     * Calculate deviation for a single student
     *
     * @param float $score Student's score
     * @param array $stats Overall statistics
     * @return array Deviation data
     */
    private function calculateStudentDeviation($score, $stats)
    {
        // Calculate Z-score
        $zScore = 0;
        if ($stats['stdDev'] > 0) {
            $zScore = ($score - $stats['mean']) / $stats['stdDev'];
        }

        // Determine cluster group
        $clusterGroup = $this->determineClusterGroup($zScore);

        // Calculate percentile
        $percentile = $this->calculatePercentile($score, $stats);

        // Calculate breeze visualization parameters
        $breezeParams = $this->calculateBreezeParams($zScore, $score, $stats['mean']);

        return [
            'deviation_score' => round($zScore, 4),
            'percentile' => $percentile,
            'cluster_group' => $clusterGroup,
            'breeze_intensity' => $breezeParams['intensity'],
            'breeze_direction' => $breezeParams['direction']
        ];
    }

    /**
     * Determine cluster group based on Z-score
     *
     * @param float $zScore
     * @return string Cluster group
     */
    private function determineClusterGroup($zScore)
    {
        $thresholdHigh = floatval(getenv('CLUSTER_THRESHOLD_HIGH') ?: 1.0);
        $thresholdLow = floatval(getenv('CLUSTER_THRESHOLD_LOW') ?: -1.0);

        if (abs($zScore) > 2.5) {
            return 'outlier';
        } elseif ($zScore >= $thresholdHigh) {
            return 'high';
        } elseif ($zScore <= $thresholdLow) {
            return 'low';
        } else {
            return 'medium';
        }
    }

    /**
     * Calculate percentile rank
     *
     * @param float $score
     * @param array $stats
     * @return int Percentile (0-100)
     */
    private function calculatePercentile($score, $stats)
    {
        // Simple percentile calculation
        // For more accurate results, could use actual score distribution
        if ($stats['max'] === $stats['min']) {
            return 50;
        }

        $percentile = (($score - $stats['min']) / ($stats['max'] - $stats['min'])) * 100;
        return round($percentile);
    }

    /**
     * Calculate breeze visualization parameters
     *
     * @param float $zScore
     * @param float $score
     * @param float $mean
     * @return array Breeze parameters
     */
    private function calculateBreezeParams($zScore, $score, $mean)
    {
        // Intensity: based on absolute Z-score (0-100)
        // Higher deviation = stronger breeze effect
        $intensity = min(abs($zScore) * 30, 100);

        // Direction: based on whether above or below mean
        // Above mean: 45 degrees (northeast)
        // Below mean: 225 degrees (southwest)
        $direction = ($score >= $mean) ? 45 : 225;

        // Add some variation based on exact deviation
        $variation = ($zScore * 10) % 30; // -30 to +30
        $direction += $variation;

        // Normalize to 0-360
        $direction = fmod($direction + 360, 360);

        return [
            'intensity' => round($intensity, 2),
            'direction' => round($direction, 2)
        ];
    }

    /**
     * Save deviation data to database
     *
     * @param array $deviation
     * @return bool Success status
     */
    private function saveDeviation($deviation)
    {
        $sql = "INSERT INTO deviation_analytics (
                    quiz_id, student_id, score, avg_score, std_deviation,
                    deviation_score, variance, percentile, cluster_group,
                    breeze_intensity, breeze_direction
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try {
            $this->db->execute($sql, [
                $deviation['quiz_id'],
                $deviation['student_id'],
                $deviation['score'],
                $deviation['avg_score'],
                $deviation['std_deviation'],
                $deviation['deviation_score'],
                $deviation['variance'],
                $deviation['percentile'],
                $deviation['cluster_group'],
                $deviation['breeze_intensity'],
                $deviation['breeze_direction']
            ]);

            return true;
        } catch (\Exception $e) {
            error_log("Failed to save deviation: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update ranks for all students in a quiz
     *
     * @param int $quizId
     * @return void
     */
    private function updateRanks($quizId)
    {
        // Get all deviation records ordered by score
        $records = $this->db->query(
            "SELECT id, score FROM deviation_analytics
             WHERE quiz_id = ?
             ORDER BY score DESC",
            [$quizId]
        );

        // Update rank and total_students
        $totalStudents = count($records);
        foreach ($records as $index => $record) {
            $rank = $index + 1;
            $this->db->execute(
                "UPDATE deviation_analytics
                 SET rank = ?, total_students = ?
                 WHERE id = ?",
                [$rank, $totalStudents, $record['id']]
            );
        }
    }

    /**
     * Save deviation data to history table
     *
     * @param int $quizId
     * @return void
     */
    private function saveToHistory($quizId)
    {
        $sql = "INSERT INTO deviation_history (student_id, quiz_id, deviation_score, cluster_group)
                SELECT student_id, quiz_id, deviation_score, cluster_group
                FROM deviation_analytics
                WHERE quiz_id = ?";

        $this->db->execute($sql, [$quizId]);
    }

    /**
     * Get deviation data for a quiz
     *
     * @param int $quizId
     * @return array Deviation data
     */
    public function getQuizDeviation($quizId)
    {
        $sql = "SELECT
                    da.*,
                    s.full_name,
                    s.username,
                    s.email
                FROM deviation_analytics da
                INNER JOIN students s ON da.student_id = s.id
                WHERE da.quiz_id = ?
                ORDER BY da.rank ASC";

        return $this->db->query($sql, [$quizId]);
    }

    /**
     * Get deviation data for visualization
     *
     * @param int $quizId
     * @return array Formatted data for D3.js
     */
    public function getDeviationVisualizationData($quizId)
    {
        $deviations = $this->getQuizDeviation($quizId);

        $data = [
            'quiz_id' => $quizId,
            'students' => [],
            'statistics' => []
        ];

        if (!empty($deviations)) {
            $data['statistics'] = [
                'avg_score' => $deviations[0]['avg_score'],
                'std_deviation' => $deviations[0]['std_deviation'],
                'total_students' => $deviations[0]['total_students']
            ];

            foreach ($deviations as $d) {
                $data['students'][] = [
                    'id' => $d['student_id'],
                    'name' => $d['full_name'],
                    'username' => $d['username'],
                    'score' => floatval($d['score']),
                    'deviation' => floatval($d['deviation_score']),
                    'percentile' => intval($d['percentile']),
                    'rank' => intval($d['rank']),
                    'cluster' => $d['cluster_group'],
                    'breeze' => [
                        'intensity' => floatval($d['breeze_intensity']),
                        'direction' => floatval($d['breeze_direction'])
                    ]
                ];
            }
        }

        return $data;
    }

    /**
     * Get student deviation history
     *
     * @param int $studentId
     * @param int $limit
     * @return array Historical data
     */
    public function getStudentDeviationHistory($studentId, $limit = 10)
    {
        $sql = "SELECT
                    dh.*,
                    q.quiz_name
                FROM deviation_history dh
                INNER JOIN quizzes q ON dh.quiz_id = q.id
                WHERE dh.student_id = ?
                ORDER BY dh.snapshot_date DESC
                LIMIT ?";

        return $this->db->query($sql, [$studentId, $limit]);
    }
}
