<?php
/**
 * Database Connection Manager
 *
 * Handles MySQL database connections using PDO
 * Singleton pattern for efficient connection management
 *
 * @package WeakLinkDetector
 */

class Database {
    private static $instance = null;
    private $pdo;

    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct() {
        try {
            $dsn = sprintf(
                "mysql:host=%s;dbname=%s;charset=%s",
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];

            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            $this->logError("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed. Please check configuration.");
        }
    }

    /**
     * Get singleton instance
     *
     * @return Database
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Get PDO connection
     *
     * @return PDO
     */
    public function getConnection() {
        return $this->pdo;
    }

    /**
     * Execute a query and return all results
     *
     * @param string $sql SQL query
     * @param array $params Query parameters
     * @return array
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->logError("Query failed: " . $e->getMessage() . "\nSQL: " . $sql);
            throw $e;
        }
    }

    /**
     * Execute a query and return single row
     *
     * @param string $sql SQL query
     * @param array $params Query parameters
     * @return array|null
     */
    public function queryOne($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            $this->logError("Query failed: " . $e->getMessage() . "\nSQL: " . $sql);
            throw $e;
        }
    }

    /**
     * Execute an INSERT/UPDATE/DELETE query
     *
     * @param string $sql SQL query
     * @param array $params Query parameters
     * @return int Number of affected rows or last insert ID
     */
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);

            // Return last insert ID for INSERT statements
            if (stripos(trim($sql), 'INSERT') === 0) {
                return $this->pdo->lastInsertId();
            }

            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->logError("Execute failed: " . $e->getMessage() . "\nSQL: " . $sql);
            throw $e;
        }
    }

    /**
     * Begin transaction
     */
    public function beginTransaction() {
        $this->pdo->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public function commit() {
        $this->pdo->commit();
    }

    /**
     * Rollback transaction
     */
    public function rollback() {
        $this->pdo->rollBack();
    }

    /**
     * Check if database connection is alive
     *
     * @return bool
     */
    public function ping() {
        try {
            $this->pdo->query('SELECT 1');
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Initialize database schema
     *
     * @param string $schemaFile Path to SQL schema file
     * @return bool
     */
    public function initializeSchema($schemaFile) {
        try {
            if (!file_exists($schemaFile)) {
                throw new Exception("Schema file not found: " . $schemaFile);
            }

            $sql = file_get_contents($schemaFile);

            // Split by semicolon and execute each statement
            $statements = array_filter(
                array_map('trim', explode(';', $sql)),
                function($stmt) {
                    return !empty($stmt) && substr($stmt, 0, 2) !== '--';
                }
            );

            foreach ($statements as $statement) {
                if (!empty($statement)) {
                    $this->pdo->exec($statement);
                }
            }

            return true;
        } catch (Exception $e) {
            $this->logError("Schema initialization failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Log error message
     *
     * @param string $message Error message
     */
    private function logError($message) {
        if (DEBUG_MODE) {
            error_log("[DB Error] " . $message);
        }
    }

    /**
     * Prevent cloning of singleton instance
     */
    private function __clone() {}

    /**
     * Prevent unserialization of singleton instance
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
