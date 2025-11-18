<?php
/**
 * Database Configuration
 * MySQL 5.7 Connection Settings
 */

class Database {
    private $host = 'localhost';
    private $port = 3306;
    private $db_name = 'dmn_drift_tracker';
    private $username = 'root';
    private $password = '';
    private $charset = 'utf8mb4';
    private $conn;

    /**
     * Get database connection
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->charset} COLLATE utf8mb4_unicode_ci"
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }

        return $this->conn;
    }

    /**
     * Load configuration from environment file
     */
    public function loadConfig($configFile = '../config/.env') {
        if (file_exists($configFile)) {
            $lines = file($configFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);

                switch($key) {
                    case 'DB_HOST':
                        $this->host = $value;
                        break;
                    case 'DB_PORT':
                        $this->port = (int)$value;
                        break;
                    case 'DB_NAME':
                        $this->db_name = $value;
                        break;
                    case 'DB_USER':
                        $this->username = $value;
                        break;
                    case 'DB_PASS':
                        $this->password = $value;
                        break;
                }
            }
        }
    }
}
