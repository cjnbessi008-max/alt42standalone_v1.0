<?php
/**
 * Database Configuration for Log Network Map
 * MySQL 5.7 Connection
 */

class Database {
    private $host = "localhost";
    private $db_name = "log_network_map";
    private $username = "root";
    private $password = "";
    private $charset = "utf8mb4";
    public $conn;

    /**
     * Get database connection
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
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Database connection failed"
            ]);
            exit;
        }

        return $this->conn;
    }

    /**
     * Load configuration from environment or config file
     */
    public function loadConfig($configFile = null) {
        if ($configFile && file_exists($configFile)) {
            $config = parse_ini_file($configFile);
            $this->host = $config['DB_HOST'] ?? $this->host;
            $this->db_name = $config['DB_NAME'] ?? $this->db_name;
            $this->username = $config['DB_USER'] ?? $this->username;
            $this->password = $config['DB_PASS'] ?? $this->password;
        }
    }
}
