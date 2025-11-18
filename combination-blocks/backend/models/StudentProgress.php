<?php
/**
 * StudentProgress Model
 * Handles student progress tracking and statistics
 */

class StudentProgress {
    private $pdo;

    public function __construct() {
        $this->pdo = getDBConnection();
    }

    /**
     * Get progress for a specific user and block
     * @param int $userId
     * @param int $blockId
     * @return array
     */
    public function getProgress($userId, $blockId) {
        $stmt = $this->pdo->prepare("
            SELECT sp.id, sp.combination_block_id, sp.moodle_user_id,
                   sp.attempts_count, sp.correct_attempts, sp.best_score,
                   sp.best_time, sp.is_completed, sp.first_attempt_at,
                   sp.last_attempt_at, sp.completed_at,
                   cb.title, cb.target_combination, cb.difficulty_level
            FROM student_progress sp
            JOIN combination_blocks cb ON cb.id = sp.combination_block_id
            WHERE sp.moodle_user_id = :userId
            AND sp.combination_block_id = :blockId
        ");

        $stmt->execute([
            'userId' => $userId,
            'blockId' => $blockId
        ]);

        $progress = $stmt->fetch();

        if (!$progress) {
            // Return empty progress if not found
            return [
                'combination_block_id' => $blockId,
                'moodle_user_id' => $userId,
                'attempts_count' => 0,
                'correct_attempts' => 0,
                'best_score' => null,
                'best_time' => null,
                'is_completed' => false,
                'first_attempt_at' => null,
                'last_attempt_at' => null,
                'completed_at' => null
            ];
        }

        // Calculate accuracy
        if ($progress['attempts_count'] > 0) {
            $progress['accuracy'] = round(
                ($progress['correct_attempts'] / $progress['attempts_count']) * 100,
                2
            );
        } else {
            $progress['accuracy'] = 0;
        }

        return $progress;
    }

    /**
     * Get all progress for a user
     * @param int $userId
     * @return array
     */
    public function getUserProgress($userId) {
        $stmt = $this->pdo->prepare("
            SELECT sp.id, sp.combination_block_id, sp.attempts_count,
                   sp.correct_attempts, sp.best_score, sp.best_time,
                   sp.is_completed, sp.first_attempt_at, sp.last_attempt_at,
                   sp.completed_at,
                   cb.title, cb.target_combination, cb.difficulty_level
            FROM student_progress sp
            JOIN combination_blocks cb ON cb.id = sp.combination_block_id
            WHERE sp.moodle_user_id = :userId
            ORDER BY sp.last_attempt_at DESC
        ");

        $stmt->execute(['userId' => $userId]);
        $progressList = $stmt->fetchAll();

        foreach ($progressList as &$progress) {
            if ($progress['attempts_count'] > 0) {
                $progress['accuracy'] = round(
                    ($progress['correct_attempts'] / $progress['attempts_count']) * 100,
                    2
                );
            } else {
                $progress['accuracy'] = 0;
            }
        }

        return $progressList;
    }

    /**
     * Get leaderboard for a specific block
     * @param int $blockId
     * @param int $limit
     * @return array
     */
    public function getLeaderboard($blockId, $limit = 10) {
        $stmt = $this->pdo->prepare("
            SELECT sp.moodle_user_id, sp.best_score, sp.best_time,
                   sp.attempts_count, sp.completed_at
            FROM student_progress sp
            WHERE sp.combination_block_id = :blockId
            AND sp.is_completed = 1
            ORDER BY sp.best_score DESC, sp.best_time ASC, sp.attempts_count ASC
            LIMIT :limit
        ");

        $stmt->bindValue('blockId', $blockId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get overall statistics for a block
     * @param int $blockId
     * @return array
     */
    public function getBlockStatistics($blockId) {
        $stmt = $this->pdo->prepare("
            SELECT
                COUNT(DISTINCT moodle_user_id) as total_students,
                SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_students,
                AVG(attempts_count) as avg_attempts,
                AVG(CASE WHEN is_completed = 1 THEN best_time ELSE NULL END) as avg_completion_time,
                AVG(best_score) as avg_score
            FROM student_progress
            WHERE combination_block_id = :blockId
        ");

        $stmt->execute(['blockId' => $blockId]);
        $stats = $stmt->fetch();

        if ($stats['total_students'] > 0) {
            $stats['completion_rate'] = round(
                ($stats['completed_students'] / $stats['total_students']) * 100,
                2
            );
        } else {
            $stats['completion_rate'] = 0;
        }

        $stats['avg_attempts'] = round($stats['avg_attempts'] ?? 0, 2);
        $stats['avg_completion_time'] = round($stats['avg_completion_time'] ?? 0, 2);
        $stats['avg_score'] = round($stats['avg_score'] ?? 0, 2);

        return $stats;
    }
}
