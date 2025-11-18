<?php
/**
 * Stat Digest Service
 * Computes and manages statistical summaries of problem data
 */

namespace StatDigest\Services;

use StatDigest\Utils\Database;

class StatDigestService
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Compute statistics for a specific problem
     */
    public function computeProblemStats($problemId)
    {
        // Get all attempts for this problem
        $stats = $this->db->fetchOne(
            'SELECT
                COUNT(*) as total_attempts,
                COUNT(DISTINCT student_id) as total_students,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
                SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect_attempts,
                AVG(time_spent) as avg_time_spent,
                AVG(score) as avg_score
            FROM student_attempts
            WHERE problem_id = ?',
            [$problemId]
        );

        if (!$stats || $stats['total_attempts'] == 0) {
            return null;
        }

        // Calculate accuracy rate
        $accuracyRate = ($stats['total_attempts'] > 0)
            ? ($stats['correct_attempts'] / $stats['total_attempts']) * 100
            : 0;

        // Calculate difficulty index (inverse of accuracy)
        // 0 = very easy, 100 = very difficult
        $difficultyIndex = 100 - $accuracyRate;

        // Upsert into stat_digests table
        $this->db->query(
            'INSERT INTO stat_digests
                (problem_id, total_attempts, total_students, correct_attempts,
                 incorrect_attempts, accuracy_rate, avg_time_spent, avg_score,
                 difficulty_index, last_computed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                total_attempts = VALUES(total_attempts),
                total_students = VALUES(total_students),
                correct_attempts = VALUES(correct_attempts),
                incorrect_attempts = VALUES(incorrect_attempts),
                accuracy_rate = VALUES(accuracy_rate),
                avg_time_spent = VALUES(avg_time_spent),
                avg_score = VALUES(avg_score),
                difficulty_index = VALUES(difficulty_index),
                last_computed_at = NOW()',
            [
                $problemId,
                $stats['total_attempts'],
                $stats['total_students'],
                $stats['correct_attempts'],
                $stats['incorrect_attempts'],
                round($accuracyRate, 2),
                round($stats['avg_time_spent'], 2),
                round($stats['avg_score'], 2),
                round($difficultyIndex, 2)
            ]
        );

        return [
            'problem_id' => $problemId,
            'total_attempts' => $stats['total_attempts'],
            'total_students' => $stats['total_students'],
            'accuracy_rate' => round($accuracyRate, 2),
            'difficulty_index' => round($difficultyIndex, 2),
            'avg_time_spent' => round($stats['avg_time_spent'], 2),
            'avg_score' => round($stats['avg_score'], 2)
        ];
    }

    /**
     * Compute statistics for all problems
     */
    public function computeAllStats()
    {
        $problems = $this->db->fetchAll('SELECT id FROM problems');
        $computed = 0;

        foreach ($problems as $problem) {
            $result = $this->computeProblemStats($problem['id']);
            if ($result !== null) {
                $computed++;
            }
        }

        return [
            'success' => true,
            'computed' => $computed,
            'total' => count($problems)
        ];
    }

    /**
     * Get digest summary for display
     */
    public function getDigestSummary($sessionId = null, $filters = [])
    {
        $where = [];
        $params = [];

        // Build WHERE clause based on filters
        if (!empty($filters['category'])) {
            $where[] = 'p.category = ?';
            $params[] = $filters['category'];
        }

        if (!empty($filters['difficulty_min'])) {
            $where[] = 'sd.difficulty_index >= ?';
            $params[] = $filters['difficulty_min'];
        }

        if (!empty($filters['difficulty_max'])) {
            $where[] = 'sd.difficulty_index <= ?';
            $params[] = $filters['difficulty_max'];
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Get aggregate statistics
        $summary = $this->db->fetchOne(
            "SELECT
                COUNT(DISTINCT p.id) as total_problems,
                SUM(sd.total_attempts) as total_attempts,
                AVG(sd.accuracy_rate) as average_accuracy,
                AVG(sd.difficulty_index) as average_difficulty,
                MAX(sd.difficulty_index) as max_difficulty
            FROM problems p
            LEFT JOIN stat_digests sd ON p.id = sd.problem_id
            {$whereClause}",
            $params
        );

        // Find most difficult topic
        $difficultTopic = $this->db->fetchOne(
            "SELECT
                p.category,
                AVG(sd.difficulty_index) as avg_difficulty
            FROM problems p
            LEFT JOIN stat_digests sd ON p.id = sd.problem_id
            WHERE p.category IS NOT NULL
            GROUP BY p.category
            ORDER BY avg_difficulty DESC
            LIMIT 1"
        );

        // Calculate improvement trend (comparing last 7 days vs previous 7 days)
        $trend = $this->calculateImprovementTrend();

        // Get detailed breakdown by category
        $breakdown = $this->db->fetchAll(
            "SELECT
                p.category,
                COUNT(DISTINCT p.id) as problem_count,
                AVG(sd.accuracy_rate) as avg_accuracy,
                AVG(sd.difficulty_index) as avg_difficulty,
                SUM(sd.total_attempts) as total_attempts
            FROM problems p
            LEFT JOIN stat_digests sd ON p.id = sd.problem_id
            WHERE p.category IS NOT NULL
            GROUP BY p.category
            ORDER BY avg_difficulty DESC"
        );

        $summaryData = [
            'total_problems' => (int)$summary['total_problems'],
            'total_attempts' => (int)$summary['total_attempts'],
            'average_accuracy' => round($summary['average_accuracy'], 2),
            'average_difficulty' => round($summary['average_difficulty'], 2),
            'most_difficult_topic' => $difficultTopic['category'] ?? 'N/A',
            'improvement_trend' => $trend,
            'category_breakdown' => $breakdown
        ];

        // Save summary if session ID provided
        if ($sessionId) {
            $this->saveSummary($sessionId, 'custom', $summaryData);
        }

        return $summaryData;
    }

    /**
     * Calculate improvement trend
     */
    private function calculateImprovementTrend()
    {
        // Last 7 days accuracy
        $recent = $this->db->fetchOne(
            "SELECT AVG(score) as avg_score
            FROM student_attempts
            WHERE attempted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
        );

        // Previous 7 days accuracy
        $previous = $this->db->fetchOne(
            "SELECT AVG(score) as avg_score
            FROM student_attempts
            WHERE attempted_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
            AND attempted_at < DATE_SUB(NOW(), INTERVAL 7 DAY)"
        );

        if (!$recent || !$previous || $previous['avg_score'] == 0) {
            return 'stable';
        }

        $change = (($recent['avg_score'] - $previous['avg_score']) / $previous['avg_score']) * 100;

        if ($change > 5) {
            return 'improving';
        } elseif ($change < -5) {
            return 'declining';
        } else {
            return 'stable';
        }
    }

    /**
     * Save digest summary
     */
    private function saveSummary($sessionId, $type, $data)
    {
        $this->db->insert(
            'INSERT INTO digest_summaries
                (session_id, summary_type, total_problems, total_attempts,
                 average_accuracy, average_difficulty, most_difficult_topic,
                 improvement_trend, data_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [
                $sessionId,
                $type,
                $data['total_problems'],
                $data['total_attempts'],
                $data['average_accuracy'],
                $data['average_difficulty'],
                $data['most_difficult_topic'],
                $data['improvement_trend'],
                json_encode($data['category_breakdown'])
            ]
        );
    }

    /**
     * Get top difficult problems
     */
    public function getTopDifficultProblems($limit = 10)
    {
        return $this->db->fetchAll(
            "SELECT
                p.id,
                p.question_text,
                p.category,
                sd.difficulty_index,
                sd.accuracy_rate,
                sd.total_attempts,
                sd.avg_time_spent
            FROM problems p
            INNER JOIN stat_digests sd ON p.id = sd.problem_id
            WHERE sd.total_attempts >= 5
            ORDER BY sd.difficulty_index DESC
            LIMIT ?",
            [$limit]
        );
    }

    /**
     * Get performance insights
     */
    public function getPerformanceInsights()
    {
        return [
            'top_difficult' => $this->getTopDifficultProblems(5),
            'overall_summary' => $this->getDigestSummary(),
            'trend' => $this->calculateImprovementTrend()
        ];
    }
}
