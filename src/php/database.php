<?php
/**
 * Database Handler
 * Manages MySQL connections for Moodle integration
 */

class Database {
    private $connection;
    private $host;
    private $username;
    private $password;
    private $database;
    private $port;

    public function __construct() {
        $this->host = DB_HOST;
        $this->username = DB_USER;
        $this->password = DB_PASS;
        $this->database = DB_NAME;
        $this->port = DB_PORT ?? 3306;

        $this->connect();
    }

    /**
     * Establish database connection
     */
    private function connect() {
        try {
            $this->connection = new mysqli(
                $this->host,
                $this->username,
                $this->password,
                $this->database,
                $this->port
            );

            // Check connection
            if ($this->connection->connect_error) {
                throw new Exception('Database connection failed: ' . $this->connection->connect_error);
            }

            // Set charset to UTF-8
            $this->connection->set_charset('utf8mb4');

        } catch (Exception $e) {
            error_log('Database Connection Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get the database connection
     */
    public function getConnection() {
        // Check if connection is still alive
        if (!$this->connection->ping()) {
            $this->connect();
        }
        return $this->connection;
    }

    /**
     * Execute a query
     */
    public function query($sql, $params = []) {
        $conn = $this->getConnection();

        // Prepare statement
        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            throw new Exception('Query preparation failed: ' . $conn->error);
        }

        // Bind parameters if provided
        if (!empty($params)) {
            $types = $this->getParamTypes($params);
            $stmt->bind_param($types, ...$params);
        }

        // Execute
        if (!$stmt->execute()) {
            throw new Exception('Query execution failed: ' . $stmt->error);
        }

        // Get results
        $result = $stmt->get_result();

        $stmt->close();

        return $result;
    }

    /**
     * Fetch single row
     */
    public function fetchOne($sql, $params = []) {
        $result = $this->query($sql, $params);

        if ($result && $result->num_rows > 0) {
            return $result->fetch_assoc();
        }

        return null;
    }

    /**
     * Fetch all rows
     */
    public function fetchAll($sql, $params = []) {
        $result = $this->query($sql, $params);

        if (!$result) {
            return [];
        }

        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * Insert data
     */
    public function insert($table, $data) {
        $conn = $this->getConnection();

        $columns = array_keys($data);
        $values = array_values($data);

        $columnList = '`' . implode('`, `', $columns) . '`';
        $placeholders = implode(', ', array_fill(0, count($values), '?'));

        $sql = "INSERT INTO `{$table}` ({$columnList}) VALUES ({$placeholders})";

        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            throw new Exception('Insert preparation failed: ' . $conn->error);
        }

        $types = $this->getParamTypes($values);
        $stmt->bind_param($types, ...$values);

        if (!$stmt->execute()) {
            throw new Exception('Insert execution failed: ' . $stmt->error);
        }

        $insertId = $stmt->insert_id;
        $stmt->close();

        return $insertId;
    }

    /**
     * Update data
     */
    public function update($table, $data, $where, $whereParams = []) {
        $conn = $this->getConnection();

        $setParts = [];
        $values = [];

        foreach ($data as $column => $value) {
            $setParts[] = "`{$column}` = ?";
            $values[] = $value;
        }

        $setClause = implode(', ', $setParts);
        $sql = "UPDATE `{$table}` SET {$setClause} WHERE {$where}";

        // Merge values and where parameters
        $allParams = array_merge($values, $whereParams);

        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            throw new Exception('Update preparation failed: ' . $conn->error);
        }

        $types = $this->getParamTypes($allParams);
        $stmt->bind_param($types, ...$allParams);

        if (!$stmt->execute()) {
            throw new Exception('Update execution failed: ' . $stmt->error);
        }

        $affectedRows = $stmt->affected_rows;
        $stmt->close();

        return $affectedRows;
    }

    /**
     * Delete data
     */
    public function delete($table, $where, $whereParams = []) {
        $conn = $this->getConnection();

        $sql = "DELETE FROM `{$table}` WHERE {$where}";

        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            throw new Exception('Delete preparation failed: ' . $conn->error);
        }

        if (!empty($whereParams)) {
            $types = $this->getParamTypes($whereParams);
            $stmt->bind_param($types, ...$whereParams);
        }

        if (!$stmt->execute()) {
            throw new Exception('Delete execution failed: ' . $stmt->error);
        }

        $affectedRows = $stmt->affected_rows;
        $stmt->close();

        return $affectedRows;
    }

    /**
     * Get parameter types for bind_param
     */
    private function getParamTypes($params) {
        $types = '';

        foreach ($params as $param) {
            if (is_int($param)) {
                $types .= 'i';
            } elseif (is_float($param)) {
                $types .= 'd';
            } elseif (is_string($param)) {
                $types .= 's';
            } else {
                $types .= 'b'; // blob
            }
        }

        return $types;
    }

    /**
     * Begin transaction
     */
    public function beginTransaction() {
        $this->getConnection()->begin_transaction();
    }

    /**
     * Commit transaction
     */
    public function commit() {
        $this->getConnection()->commit();
    }

    /**
     * Rollback transaction
     */
    public function rollback() {
        $this->getConnection()->rollback();
    }

    /**
     * Escape string
     */
    public function escape($string) {
        return $this->getConnection()->real_escape_string($string);
    }

    /**
     * Get last insert ID
     */
    public function lastInsertId() {
        return $this->getConnection()->insert_id;
    }

    /**
     * Close connection
     */
    public function close() {
        if ($this->connection) {
            $this->connection->close();
            $this->connection = null;
        }
    }

    /**
     * Destructor - close connection
     */
    public function __destruct() {
        $this->close();
    }
}
