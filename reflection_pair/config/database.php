<?php
/**
 * Database Configuration for Reflection Pair
 * Compatible with MySQL 5.7 and PHP 7.1.9
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'moodle_reflection_pair';
    private $username = 'moodle_user';
    private $password = '';
    private $conn = null;

    /**
     * Get database connection
     * @return PDO|null
     */
    public function getConnection() {
        if ($this->conn !== null) {
            return $this->conn;
        }

        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);

        } catch(PDOException $e) {
            error_log("Connection Error: " . $e->getMessage());
            return null;
        }

        return $this->conn;
    }

    /**
     * Load configuration from external file if exists
     */
    public function loadConfig($config_file = null) {
        if ($config_file === null) {
            $config_file = __DIR__ . '/db_config.ini';
        }

        if (file_exists($config_file)) {
            $config = parse_ini_file($config_file);
            $this->host = $config['host'] ?? $this->host;
            $this->db_name = $config['db_name'] ?? $this->db_name;
            $this->username = $config['username'] ?? $this->username;
            $this->password = $config['password'] ?? $this->password;
        }
    }
}
