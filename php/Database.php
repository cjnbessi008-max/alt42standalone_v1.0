<?php
/**
 * Database Connection Class
 * Handles MySQL connections with PDO
 * Compatible with PHP 7.1.9 and MySQL 5.7
 */

defined('AREA_RECOM_APP') or define('AREA_RECOM_APP', true);

class Database {
    private static $instance = null;
    private $connection = null;
    private $moodleConnection = null;

    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct() {
        $this->connect();
    }

    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Establish database connection
     */
    private function connect() {
        try {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);

        } catch (PDOException $e) {
            $this->logError('Database connection failed: ' . $e->getMessage());
            throw new Exception('Database connection failed. Please try again later.');
        }
    }

    /**
     * Get main database connection
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Get Moodle database connection
     */
    public function getMoodleConnection() {
        if ($this->moodleConnection === null) {
            try {
                $dsn = sprintf(
                    'mysql:host=%s;dbname=%s;charset=%s',
                    MOODLE_DB_HOST,
                    MOODLE_DB_NAME,
                    DB_CHARSET
                );

                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ];

                $this->moodleConnection = new PDO($dsn, MOODLE_DB_USER, MOODLE_DB_PASS, $options);

            } catch (PDOException $e) {
                $this->logError('Moodle database connection failed: ' . $e->getMessage());
                throw new Exception('Moodle connection failed. Please try again later.');
            }
        }
        return $this->moodleConnection;
    }

    /**
     * Execute a query with parameters
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->logError('Query failed: ' . $e->getMessage() . ' | SQL: ' . $sql);
            throw new Exception('Database query failed. Please try again.');
        }
    }

    /**
     * Fetch all rows
     */
    public function fetchAll($sql, $params = []) {
        return $this->query($sql, $params)->fetchAll();
    }

    /**
     * Fetch single row
     */
    public function fetchOne($sql, $params = []) {
        return $this->query($sql, $params)->fetch();
    }

    /**
     * Execute INSERT and return last insert ID
     */
    public function insert($sql, $params = []) {
        $this->query($sql, $params);
        return $this->connection->lastInsertId();
    }

    /**
     * Execute UPDATE/DELETE and return affected rows
     */
    public function execute($sql, $params = []) {
        return $this->query($sql, $params)->rowCount();
    }

    /**
     * Begin transaction
     */
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public function commit() {
        return $this->connection->commit();
    }

    /**
     * Rollback transaction
     */
    public function rollback() {
        return $this->connection->rollBack();
    }

    /**
     * Call stored procedure
     */
    public function callProcedure($procedureName, $params = []) {
        try {
            $placeholders = implode(',', array_fill(0, count($params), '?'));
            $sql = "CALL $procedureName($placeholders)";
            return $this->query($sql, $params);
        } catch (PDOException $e) {
            $this->logError('Procedure call failed: ' . $e->getMessage());
            throw new Exception('Procedure execution failed.');
        }
    }

    /**
     * Verify Moodle user exists and is enrolled in course
     */
    public function verifyMoodleUser($userId, $courseId) {
        try {
            $moodleConn = $this->getMoodleConnection();
            $prefix = MOODLE_DB_PREFIX;

            $sql = "
                SELECT u.id, u.username, u.firstname, u.lastname, u.email
                FROM {$prefix}user u
                INNER JOIN {$prefix}user_enrolments ue ON u.id = ue.userid
                INNER JOIN {$prefix}enrol e ON ue.enrolid = e.id
                WHERE u.id = ? AND e.courseid = ? AND u.deleted = 0 AND u.suspended = 0
                LIMIT 1
            ";

            $stmt = $moodleConn->prepare($sql);
            $stmt->execute([$userId, $courseId]);
            return $stmt->fetch();

        } catch (PDOException $e) {
            $this->logError('Moodle user verification failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Log error to file
     */
    private function logError($message) {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] ERROR: $message" . PHP_EOL;

        if (defined('ERROR_LOG_FILE')) {
            $logDir = dirname(ERROR_LOG_FILE);
            if (!file_exists($logDir)) {
                mkdir($logDir, 0755, true);
            }
            error_log($logMessage, 3, ERROR_LOG_FILE);
        }

        if (APP_DEBUG) {
            error_log($message);
        }
    }

    /**
     * Prevent cloning
     */
    private function __clone() {}

    /**
     * Prevent unserialization
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
