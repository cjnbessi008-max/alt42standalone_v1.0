<?php
/**
 * Moodle Integration Configuration
 * Compatible with Moodle 3.7
 */

// Moodle installation path
define('MOODLE_PATH', getenv('MOODLE_PATH') ?: '/var/www/html/moodle');
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');

// Moodle database configuration (if different from main DB)
define('MOODLE_DB_HOST', getenv('MOODLE_DB_HOST') ?: 'localhost');
define('MOODLE_DB_NAME', getenv('MOODLE_DB_NAME') ?: 'moodle');
define('MOODLE_DB_USER', getenv('MOODLE_DB_USER') ?: 'moodleuser');
define('MOODLE_DB_PASS', getenv('MOODLE_DB_PASS') ?: '');
define('MOODLE_DB_PREFIX', getenv('MOODLE_DB_PREFIX') ?: 'mdl_');

/**
 * Get Moodle database connection
 * @return PDO
 */
function getMoodleDBConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = sprintf(
                "mysql:host=%s;dbname=%s;charset=utf8mb4",
                MOODLE_DB_HOST,
                MOODLE_DB_NAME
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $pdo = new PDO($dsn, MOODLE_DB_USER, MOODLE_DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Moodle database connection failed: " . $e->getMessage());
            return null;
        }
    }

    return $pdo;
}

/**
 * Validate Moodle session token
 * @param string $token
 * @return array|null User data if valid, null otherwise
 */
function validateMoodleToken($token) {
    if (empty($token)) {
        return null;
    }

    $moodle_pdo = getMoodleDBConnection();
    if (!$moodle_pdo) {
        return null;
    }

    try {
        $stmt = $moodle_pdo->prepare("
            SELECT u.id, u.username, u.firstname, u.lastname, u.email
            FROM " . MOODLE_DB_PREFIX . "user u
            INNER JOIN " . MOODLE_DB_PREFIX . "sessions s ON s.userid = u.id
            WHERE s.sid = :token
            AND s.timecreated > :timeout
        ");

        $timeout = time() - 86400; // 24 hours
        $stmt->execute([
            'token' => $token,
            'timeout' => $timeout
        ]);

        return $stmt->fetch();
    } catch (PDOException $e) {
        error_log("Token validation failed: " . $e->getMessage());
        return null;
    }
}

/**
 * Get question data from Moodle
 * @param int $questionId
 * @return array|null
 */
function getMoodleQuestion($questionId) {
    $moodle_pdo = getMoodleDBConnection();
    if (!$moodle_pdo) {
        return null;
    }

    try {
        $stmt = $moodle_pdo->prepare("
            SELECT q.id, q.name, q.questiontext, q.qtype
            FROM " . MOODLE_DB_PREFIX . "question q
            WHERE q.id = :questionId
        ");

        $stmt->execute(['questionId' => $questionId]);
        return $stmt->fetch();
    } catch (PDOException $e) {
        error_log("Failed to fetch question: " . $e->getMessage());
        return null;
    }
}

/**
 * Send grade back to Moodle
 * @param int $userId
 * @param int $questionId
 * @param float $score
 * @return bool
 */
function sendGradeToMoodle($userId, $questionId, $score) {
    // This would integrate with Moodle's grade API
    // Implementation depends on specific Moodle setup
    error_log("Grade sent to Moodle: User $userId, Question $questionId, Score $score");
    return true;
}
