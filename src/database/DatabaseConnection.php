<?php
/**
 * Database Connection Manager
 * MySQL 5.7 compatible
 */

class DatabaseConnection {
    private static $instance = null;
    private $connection;

    /**
     * Private constructor (Singleton pattern)
     *
     * @param array $config Database configuration
     */
    private function __construct(array $config) {
        $host = $config['host'] ?? 'localhost';
        $port = $config['port'] ?? 3306;
        $dbname = $config['database'] ?? 'thinking_patterns';
        $charset = $config['charset'] ?? 'utf8mb4';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

        try {
            $this->connection = new PDO(
                $dsn,
                $config['username'],
                $config['password'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset}"
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    /**
     * Get database instance (Singleton)
     *
     * @param array $config Database configuration
     * @return PDO Database connection
     */
    public static function getInstance(array $config = []) {
        if (self::$instance === null) {
            if (empty($config)) {
                // Load from config file or environment
                $config = self::loadConfig();
            }
            self::$instance = new self($config);
        }

        return self::$instance->connection;
    }

    /**
     * Load database configuration
     *
     * @return array Configuration
     */
    private static function loadConfig() {
        $configFile = __DIR__ . '/../../config/database.php';

        if (file_exists($configFile)) {
            return require $configFile;
        }

        // Fallback to environment variables
        return [
            'host' => getenv('DB_HOST') ?: 'localhost',
            'port' => getenv('DB_PORT') ?: 3306,
            'database' => getenv('DB_NAME') ?: 'thinking_patterns',
            'username' => getenv('DB_USER') ?: 'root',
            'password' => getenv('DB_PASS') ?: '',
            'charset' => 'utf8mb4'
        ];
    }

    /**
     * Prevent cloning of the instance
     */
    private function __clone() {}

    /**
     * Prevent unserialization of the instance
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
