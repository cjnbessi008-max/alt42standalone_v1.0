<?php
/**
 * Duplicate Barrier Service
 *
 * Tracks viewed questions and prevents duplicate displays
 * Uses PHP sessions and optional database persistence
 *
 * Compatible with: MySQL 5.7, PHP 7.1.9, Moodle 3.7
 */

namespace MoodleIntegration\Services;

use MoodleIntegration\Database\Connection;
use PDO;

class DuplicateBarrierService
{
    private $db;
    private $config;
    private $sessionKey = 'viewed_questions';
    private $tableCreated = false;

    public function __construct(Connection $db, array $config)
    {
        $this->db = $db;
        $this->config = $config;
        $this->initSession();
        $this->ensureTableExists();
    }

    /**
     * Initialize PHP session for tracking
     */
    private function initSession()
    {
        if (session_status() === PHP_STATUS_NONE) {
            session_start();
        }

        if (!isset($_SESSION[$this->sessionKey])) {
            $_SESSION[$this->sessionKey] = [];
        }
    }

    /**
     * Create duplicate tracking table if not exists
     */
    private function ensureTableExists()
    {
        if ($this->tableCreated) {
            return;
        }

        try {
            $pdo = $this->db->getConnection();
            $prefix = $this->config['moodle_db']['prefix'];

            $sql = "CREATE TABLE IF NOT EXISTS {$prefix}question_views (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question_id INT NOT NULL,
                user_session VARCHAR(255) NOT NULL,
                view_count INT DEFAULT 1,
                first_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_question_session (question_id, user_session),
                INDEX idx_last_viewed (last_viewed_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

            $pdo->exec($sql);
            $this->tableCreated = true;
        } catch (\PDOException $e) {
            // Table creation failed - continue with session-only mode
            error_log("Duplicate barrier table creation failed: " . $e->getMessage());
        }
    }

    /**
     * Check if a question has been viewed before
     *
     * @param int $questionId Question ID
     * @return array ['is_duplicate' => bool, 'view_count' => int, 'last_viewed' => string|null]
     */
    public function checkDuplicate($questionId)
    {
        $sessionId = session_id();

        // Check session first (fastest)
        $sessionViewed = $this->checkSessionViewed($questionId);

        // Check database for persistent tracking
        $dbData = $this->checkDatabaseViewed($questionId, $sessionId);

        $isDuplicate = $sessionViewed || ($dbData['view_count'] > 0);

        return [
            'is_duplicate' => $isDuplicate,
            'view_count' => max($sessionViewed ? 1 : 0, $dbData['view_count']),
            'last_viewed' => $dbData['last_viewed'],
            'session_viewed' => $sessionViewed,
            'db_viewed' => $dbData['view_count'] > 0
        ];
    }

    /**
     * Check session-based viewing
     */
    private function checkSessionViewed($questionId)
    {
        return isset($_SESSION[$this->sessionKey][$questionId]);
    }

    /**
     * Check database-based viewing
     */
    private function checkDatabaseViewed($questionId, $sessionId)
    {
        try {
            $pdo = $this->db->getConnection();
            $prefix = $this->config['moodle_db']['prefix'];

            $sql = "SELECT view_count, last_viewed_at
                    FROM {$prefix}question_views
                    WHERE question_id = :question_id
                    AND user_session = :session_id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':question_id' => $questionId,
                ':session_id' => $sessionId
            ]);

            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                return [
                    'view_count' => (int)$result['view_count'],
                    'last_viewed' => $result['last_viewed_at']
                ];
            }
        } catch (\PDOException $e) {
            error_log("Database duplicate check failed: " . $e->getMessage());
        }

        return ['view_count' => 0, 'last_viewed' => null];
    }

    /**
     * Mark a question as viewed
     *
     * @param int $questionId Question ID
     * @return bool Success status
     */
    public function markAsViewed($questionId)
    {
        $sessionId = session_id();

        // Mark in session
        $_SESSION[$this->sessionKey][$questionId] = time();

        // Mark in database
        return $this->markDatabaseViewed($questionId, $sessionId);
    }

    /**
     * Mark question as viewed in database
     */
    private function markDatabaseViewed($questionId, $sessionId)
    {
        try {
            $pdo = $this->db->getConnection();
            $prefix = $this->config['moodle_db']['prefix'];

            // Use INSERT ... ON DUPLICATE KEY UPDATE for MySQL 5.7 compatibility
            $sql = "INSERT INTO {$prefix}question_views
                    (question_id, user_session, view_count, first_viewed_at, last_viewed_at)
                    VALUES (:question_id, :session_id, 1, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                    view_count = view_count + 1,
                    last_viewed_at = NOW()";

            $stmt = $pdo->prepare($sql);
            return $stmt->execute([
                ':question_id' => $questionId,
                ':session_id' => $sessionId
            ]);
        } catch (\PDOException $e) {
            error_log("Database mark viewed failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get all viewed questions for current session
     *
     * @return array Question IDs with view timestamps
     */
    public function getViewedQuestions()
    {
        return $_SESSION[$this->sessionKey] ?? [];
    }

    /**
     * Clear viewed questions (reset session)
     *
     * @param bool $clearDatabase Also clear database records
     * @return bool Success status
     */
    public function clearViewed($clearDatabase = false)
    {
        $_SESSION[$this->sessionKey] = [];

        if ($clearDatabase) {
            return $this->clearDatabaseViewed(session_id());
        }

        return true;
    }

    /**
     * Clear database records for session
     */
    private function clearDatabaseViewed($sessionId)
    {
        try {
            $pdo = $this->db->getConnection();
            $prefix = $this->config['moodle_db']['prefix'];

            $sql = "DELETE FROM {$prefix}question_views
                    WHERE user_session = :session_id";

            $stmt = $pdo->prepare($sql);
            return $stmt->execute([':session_id' => $sessionId]);
        } catch (\PDOException $e) {
            error_log("Database clear viewed failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get duplicate statistics
     *
     * @return array Statistics about duplicates
     */
    public function getStatistics()
    {
        $sessionViewed = count($this->getViewedQuestions());

        try {
            $pdo = $this->db->getConnection();
            $prefix = $this->config['moodle_db']['prefix'];
            $sessionId = session_id();

            $sql = "SELECT
                    COUNT(DISTINCT question_id) as unique_questions,
                    SUM(view_count) as total_views,
                    MAX(view_count) as max_views_single,
                    AVG(view_count) as avg_views
                    FROM {$prefix}question_views
                    WHERE user_session = :session_id";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([':session_id' => $sessionId]);

            $dbStats = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                'session_viewed_count' => $sessionViewed,
                'db_unique_questions' => (int)($dbStats['unique_questions'] ?? 0),
                'db_total_views' => (int)($dbStats['total_views'] ?? 0),
                'db_max_views_single' => (int)($dbStats['max_views_single'] ?? 0),
                'db_avg_views' => round((float)($dbStats['avg_views'] ?? 0), 2)
            ];
        } catch (\PDOException $e) {
            return [
                'session_viewed_count' => $sessionViewed,
                'db_error' => $e->getMessage()
            ];
        }
    }

    /**
     * Clean up old view records (maintenance)
     *
     * @param int $daysOld Remove records older than N days
     * @return int Number of records deleted
     */
    public function cleanupOldRecords($daysOld = 30)
    {
        try {
            $pdo = $this->db->getConnection();
            $prefix = $this->config['moodle_db']['prefix'];

            $sql = "DELETE FROM {$prefix}question_views
                    WHERE last_viewed_at < DATE_SUB(NOW(), INTERVAL :days DAY)";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([':days' => $daysOld]);

            return $stmt->rowCount();
        } catch (\PDOException $e) {
            error_log("Cleanup old records failed: " . $e->getMessage());
            return 0;
        }
    }
}
