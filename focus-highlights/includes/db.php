<?php
/**
 * Database Connection Handler
 * Focus Highlights System
 */

require_once __DIR__ . '/../config/database.php';

class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, DB_OPTIONS);
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }

    /**
     * Execute a query and return results
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Database query error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Fetch all results
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Fetch single row
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    /**
     * Insert record and return last insert ID
     */
    public function insert($table, $data) {
        $keys = array_keys($data);
        $fields = implode(', ', $keys);
        $placeholders = ':' . implode(', :', $keys);

        $sql = "INSERT INTO $table ($fields) VALUES ($placeholders)";
        $this->query($sql, $data);

        return $this->pdo->lastInsertId();
    }

    /**
     * Update record
     */
    public function update($table, $data, $where, $whereParams = []) {
        $set = [];
        foreach ($data as $key => $value) {
            $set[] = "$key = :$key";
        }
        $setClause = implode(', ', $set);

        $sql = "UPDATE $table SET $setClause WHERE $where";
        $params = array_merge($data, $whereParams);

        return $this->query($sql, $params);
    }

    /**
     * Delete record
     */
    public function delete($table, $where, $params = []) {
        $sql = "DELETE FROM $table WHERE $where";
        return $this->query($sql, $params);
    }

    /**
     * Get configuration value
     */
    public function getConfig($key, $default = null) {
        $sql = "SELECT config_value FROM fh_config WHERE config_key = :key";
        $result = $this->fetchOne($sql, ['key' => $key]);

        return $result ? $result['config_value'] : $default;
    }

    /**
     * Set configuration value
     */
    public function setConfig($key, $value, $description = '') {
        $sql = "INSERT INTO fh_config (config_key, config_value, description)
                VALUES (:key, :value, :desc)
                ON DUPLICATE KEY UPDATE config_value = :value, description = :desc";

        return $this->query($sql, [
            'key' => $key,
            'value' => $value,
            'desc' => $description
        ]);
    }
}
