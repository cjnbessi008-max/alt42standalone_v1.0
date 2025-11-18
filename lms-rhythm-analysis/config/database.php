<?php
/**
 * Database Configuration
 * MySQL 5.7 Connection Settings
 */

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $charset;
    public $conn;

    public function __construct() {
        // Load from environment or use defaults
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->db_name = getenv('DB_NAME') ?: 'lms_rhythm_analysis';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASS') ?: '';
        $this->charset = 'utf8mb4';
    }

    /**
     * Create database connection
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $e) {
            error_log("Connection Error: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }

        return $this->conn;
    }

    /**
     * Get configuration value from moodle_config table
     * @param string $key
     * @return string|null
     */
    public function getConfig($key) {
        try {
            $query = "SELECT config_value FROM moodle_config WHERE config_key = :key LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':key', $key);
            $stmt->execute();

            $result = $stmt->fetch();
            return $result ? $result['config_value'] : null;
        } catch(PDOException $e) {
            error_log("Config Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Update configuration value
     * @param string $key
     * @param string $value
     * @return bool
     */
    public function updateConfig($key, $value) {
        try {
            $query = "UPDATE moodle_config SET config_value = :value WHERE config_key = :key";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':key', $key);
            $stmt->bindParam(':value', $value);
            return $stmt->execute();
        } catch(PDOException $e) {
            error_log("Config Update Error: " . $e->getMessage());
            return false;
        }
    }
}
