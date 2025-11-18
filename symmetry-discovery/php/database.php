<?php
/**
 * Database Class
 * MySQL 5.7 compatible with PHP 7.1.9
 */

class Database {
    private $connection;
    private $lastInsertId;

    /**
     * Constructor - Establish database connection
     */
    public function __construct() {
        $this->connect();
    }

    /**
     * Connect to database
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
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            $this->logError('Database connection failed: ' . $e->getMessage());
            throw new Exception('Database connection failed');
        }
    }

    /**
     * Execute a query with parameters
     * @param string $sql SQL query
     * @param array $params Parameters for prepared statement
     * @return array Result set
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->logError('Query failed: ' . $e->getMessage() . ' SQL: ' . $sql);
            throw new Exception('Query execution failed');
        }
    }

    /**
     * Execute a statement (INSERT, UPDATE, DELETE)
     * @param string $sql SQL statement
     * @param array $params Parameters for prepared statement
     * @return int Number of affected rows
     */
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            $this->lastInsertId = $this->connection->lastInsertId();
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->logError('Execute failed: ' . $e->getMessage() . ' SQL: ' . $sql);
            throw new Exception('Statement execution failed');
        }
    }

    /**
     * Get a single row
     * @param string $sql SQL query
     * @param array $params Parameters
     * @return array|null Single row or null
     */
    public function queryOne($sql, $params = []) {
        $result = $this->query($sql, $params);
        return !empty($result) ? $result[0] : null;
    }

    /**
     * Get a single value
     * @param string $sql SQL query
     * @param array $params Parameters
     * @return mixed Single value or null
     */
    public function queryValue($sql, $params = []) {
        $result = $this->queryOne($sql, $params);
        return $result ? reset($result) : null;
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
     * Get last insert ID
     * @return string Last insert ID
     */
    public function lastInsertId() {
        return $this->lastInsertId;
    }

    /**
     * Sanitize input for LIKE queries
     * @param string $value Value to sanitize
     * @return string Sanitized value
     */
    public function escapeLike($value) {
        return str_replace(['%', '_'], ['\%', '\_'], $value);
    }

    /**
     * Get connection
     * @return PDO PDO connection
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Check if table exists
     * @param string $tableName Table name
     * @return bool True if exists
     */
    public function tableExists($tableName) {
        $sql = "SHOW TABLES LIKE ?";
        $result = $this->query($sql, [$tableName]);
        return !empty($result);
    }

    /**
     * Get table row count
     * @param string $tableName Table name
     * @return int Row count
     */
    public function getRowCount($tableName) {
        $sql = "SELECT COUNT(*) as count FROM `{$tableName}`";
        $result = $this->queryOne($sql);
        return intval($result['count'] ?? 0);
    }

    /**
     * Log error
     * @param string $message Error message
     */
    private function logError($message) {
        if (ENABLE_EVENT_LOGGING) {
            $logMessage = sprintf(
                "[%s] DATABASE ERROR: %s\n",
                date('Y-m-d H:i:s'),
                $message
            );

            // Create logs directory if it doesn't exist
            $logDir = dirname(LOG_FILE_PATH);
            if (!is_dir($logDir)) {
                mkdir($logDir, 0755, true);
            }

            error_log($logMessage, 3, LOG_FILE_PATH);
        }
    }

    /**
     * Destructor - Close connection
     */
    public function __destruct() {
        $this->connection = null;
    }
}

/**
 * Database Helper Functions
 */
class DatabaseHelper {
    /**
     * Build WHERE clause from array
     * @param array $conditions Associative array of conditions
     * @return array [sql, params]
     */
    public static function buildWhereClause($conditions) {
        if (empty($conditions)) {
            return ['', []];
        }

        $whereClauses = [];
        $params = [];

        foreach ($conditions as $column => $value) {
            if (is_null($value)) {
                $whereClauses[] = "`{$column}` IS NULL";
            } elseif (is_array($value)) {
                $placeholders = implode(',', array_fill(0, count($value), '?'));
                $whereClauses[] = "`{$column}` IN ({$placeholders})";
                $params = array_merge($params, $value);
            } else {
                $whereClauses[] = "`{$column}` = ?";
                $params[] = $value;
            }
        }

        $sql = 'WHERE ' . implode(' AND ', $whereClauses);
        return [$sql, $params];
    }

    /**
     * Build INSERT statement
     * @param string $table Table name
     * @param array $data Associative array of data
     * @return array [sql, params]
     */
    public static function buildInsert($table, $data) {
        $columns = array_keys($data);
        $values = array_values($data);

        $columnList = '`' . implode('`, `', $columns) . '`';
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));

        $sql = "INSERT INTO `{$table}` ({$columnList}) VALUES ({$placeholders})";

        return [$sql, $values];
    }

    /**
     * Build UPDATE statement
     * @param string $table Table name
     * @param array $data Associative array of data
     * @param array $conditions WHERE conditions
     * @return array [sql, params]
     */
    public static function buildUpdate($table, $data, $conditions) {
        $setClauses = [];
        $params = [];

        foreach ($data as $column => $value) {
            $setClauses[] = "`{$column}` = ?";
            $params[] = $value;
        }

        $setClause = implode(', ', $setClauses);

        list($whereClause, $whereParams) = self::buildWhereClause($conditions);
        $params = array_merge($params, $whereParams);

        $sql = "UPDATE `{$table}` SET {$setClause} {$whereClause}";

        return [$sql, $params];
    }

    /**
     * Sanitize table/column name
     * @param string $name Name to sanitize
     * @return string Sanitized name
     */
    public static function sanitizeName($name) {
        return preg_replace('/[^a-zA-Z0-9_]/', '', $name);
    }
}
