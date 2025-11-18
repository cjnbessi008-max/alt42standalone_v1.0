<?php
/**
 * Progress Model
 * Handles learning progress tracking
 */

require_once __DIR__ . '/../config/database.php';

class Progress {
    private $db;

    public $id;
    public $moodleUserId;
    public $totalAttempts;
    public $correctAttempts;
    public $averageTime;
    public $masteryLevel;
    public $lastActivity;

    const MASTERY_BEGINNER = 'beginner';
    const MASTERY_INTERMEDIATE = 'intermediate';
    const MASTERY_ADVANCED = 'advanced';
    const MASTERY_EXPERT = 'expert';

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get progress by user ID
     */
    public function getByUserId($userId) {
        $sql = "SELECT * FROM learning_progress WHERE moodle_user_id = ?";
        $result = $this->db->fetchOne($sql, [$userId]);

        if ($result) {
            $this->hydrate($result);
            return $this;
        }
        return null;
    }

    /**
     * Get or create progress for user
     */
    public function getOrCreate($userId) {
        $progress = $this->getByUserId($userId);

        if (!$progress) {
            return $this->create([
                'moodle_user_id' => $userId,
                'total_attempts' => 0,
                'correct_attempts' => 0,
                'average_time' => 0,
                'mastery_level' => self::MASTERY_BEGINNER
            ]);
        }

        return $progress;
    }

    /**
     * Create new progress record
     */
    public function create($data) {
        $sql = "INSERT INTO learning_progress
                (moodle_user_id, total_attempts, correct_attempts, average_time, mastery_level)
                VALUES (?, ?, ?, ?, ?)";

        $params = [
            $data['moodle_user_id'],
            $data['total_attempts'] ?? 0,
            $data['correct_attempts'] ?? 0,
            $data['average_time'] ?? 0,
            $data['mastery_level'] ?? self::MASTERY_BEGINNER
        ];

        $this->db->query($sql, $params);
        $this->id = $this->db->lastInsertId();

        return $this->getByUserId($data['moodle_user_id']);
    }

    /**
     * Update progress after an attempt
     */
    public function updateAfterAttempt($userId, $isCorrect, $attemptTime) {
        $progress = $this->getOrCreate($userId);

        $newTotal = $progress->totalAttempts + 1;
        $newCorrect = $progress->correctAttempts + ($isCorrect ? 1 : 0);

        // Calculate new average time
        $currentTotal = $progress->totalAttempts * $progress->averageTime;
        $newAverage = ($currentTotal + $attemptTime) / $newTotal;

        // Calculate mastery level
        $successRate = ($newCorrect / $newTotal) * 100;
        $masteryLevel = $this->calculateMasteryLevel($successRate, $newTotal, $newAverage);

        $sql = "UPDATE learning_progress
                SET total_attempts = ?,
                    correct_attempts = ?,
                    average_time = ?,
                    mastery_level = ?,
                    last_activity = CURRENT_TIMESTAMP
                WHERE moodle_user_id = ?";

        $this->db->query($sql, [
            $newTotal,
            $newCorrect,
            $newAverage,
            $masteryLevel,
            $userId
        ]);

        return $this->getByUserId($userId);
    }

    /**
     * Calculate mastery level
     */
    private function calculateMasteryLevel($successRate, $totalAttempts, $averageTime) {
        // Beginner: < 60% success rate or < 10 attempts
        if ($successRate < 60 || $totalAttempts < 10) {
            return self::MASTERY_BEGINNER;
        }

        // Intermediate: 60-75% success rate, 10-30 attempts
        if ($successRate < 75 || $totalAttempts < 30) {
            return self::MASTERY_INTERMEDIATE;
        }

        // Advanced: 75-90% success rate, 30+ attempts, average time < 50s
        if ($successRate < 90 || $averageTime > 50) {
            return self::MASTERY_ADVANCED;
        }

        // Expert: 90%+ success rate, 30+ attempts, average time < 40s
        return self::MASTERY_EXPERT;
    }

    /**
     * Get success rate percentage
     */
    public function getSuccessRate() {
        if ($this->totalAttempts == 0) {
            return 0;
        }
        return round(($this->correctAttempts / $this->totalAttempts) * 100, 2);
    }

    /**
     * Get progress percentage (0-100)
     */
    public function getProgressPercentage() {
        $masteryLevels = [
            self::MASTERY_BEGINNER => 25,
            self::MASTERY_INTERMEDIATE => 50,
            self::MASTERY_ADVANCED => 75,
            self::MASTERY_EXPERT => 100
        ];

        return $masteryLevels[$this->masteryLevel] ?? 0;
    }

    /**
     * Get all progress records (for leaderboard)
     */
    public function getLeaderboard($limit = 10) {
        $sql = "SELECT
                    moodle_user_id,
                    total_attempts,
                    correct_attempts,
                    average_time,
                    mastery_level,
                    ROUND((correct_attempts / total_attempts * 100), 2) as success_rate
                FROM learning_progress
                WHERE total_attempts > 0
                ORDER BY mastery_level DESC, success_rate DESC, average_time ASC
                LIMIT ?";

        return $this->db->fetchAll($sql, [$limit]);
    }

    /**
     * Get statistics for all users
     */
    public function getGlobalStats() {
        $sql = "SELECT
                    COUNT(*) as total_users,
                    SUM(total_attempts) as total_attempts,
                    SUM(correct_attempts) as total_correct,
                    AVG(average_time) as global_avg_time,
                    SUM(CASE WHEN mastery_level = 'beginner' THEN 1 ELSE 0 END) as beginners,
                    SUM(CASE WHEN mastery_level = 'intermediate' THEN 1 ELSE 0 END) as intermediate,
                    SUM(CASE WHEN mastery_level = 'advanced' THEN 1 ELSE 0 END) as advanced,
                    SUM(CASE WHEN mastery_level = 'expert' THEN 1 ELSE 0 END) as experts
                FROM learning_progress";

        return $this->db->fetchOne($sql);
    }

    /**
     * Get user rank
     */
    public function getUserRank($userId) {
        $sql = "SELECT COUNT(*) + 1 as rank
                FROM learning_progress lp1
                WHERE (
                    SELECT
                        FIELD(mastery_level, 'beginner', 'intermediate', 'advanced', 'expert') * 1000000 +
                        (correct_attempts / total_attempts * 10000) -
                        average_time
                    FROM learning_progress
                    WHERE moodle_user_id = lp1.moodle_user_id
                ) > (
                    SELECT
                        FIELD(mastery_level, 'beginner', 'intermediate', 'advanced', 'expert') * 1000000 +
                        (correct_attempts / total_attempts * 10000) -
                        average_time
                    FROM learning_progress
                    WHERE moodle_user_id = ?
                )";

        $result = $this->db->fetchOne($sql, [$userId]);
        return $result['rank'] ?? null;
    }

    /**
     * Reset progress for user
     */
    public function reset($userId) {
        $sql = "UPDATE learning_progress
                SET total_attempts = 0,
                    correct_attempts = 0,
                    average_time = 0,
                    mastery_level = ?
                WHERE moodle_user_id = ?";

        $this->db->query($sql, [self::MASTERY_BEGINNER, $userId]);
        return $this->getByUserId($userId);
    }

    /**
     * Hydrate object from database result
     */
    private function hydrate($data) {
        $this->id = $data['id'];
        $this->moodleUserId = $data['moodle_user_id'];
        $this->totalAttempts = $data['total_attempts'];
        $this->correctAttempts = $data['correct_attempts'];
        $this->averageTime = $data['average_time'];
        $this->masteryLevel = $data['mastery_level'];
        $this->lastActivity = $data['last_activity'];
    }

    /**
     * Convert to array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'moodleUserId' => $this->moodleUserId,
            'totalAttempts' => $this->totalAttempts,
            'correctAttempts' => $this->correctAttempts,
            'successRate' => $this->getSuccessRate(),
            'averageTime' => round($this->averageTime, 2),
            'masteryLevel' => $this->masteryLevel,
            'progressPercentage' => $this->getProgressPercentage(),
            'lastActivity' => $this->lastActivity,
        ];
    }
}
