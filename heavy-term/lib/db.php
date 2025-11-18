<?php
/**
 * Heavy Term Database Connection Library
 * Singleton pattern for database connection management
 */

class HeavyTermDB {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        require_once(__DIR__ . '/../config/config.php');

        try {
            $dsn = sprintf(
                "mysql:host=%s;dbname=%s;charset=utf8mb4",
                HEAVY_TERM_DB_HOST,
                HEAVY_TERM_DB_NAME
            );

            $this->pdo = new PDO(
                $dsn,
                HEAVY_TERM_DB_USER,
                HEAVY_TERM_DB_PASSWORD,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                )
            );
        } catch (PDOException $e) {
            error_log('Heavy Term DB Connection Error: ' . $e->getMessage());
            die('Database connection failed. Please check configuration.');
        }
    }

    /**
     * Get singleton instance
     * @return PDO Database connection
     */
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance->pdo;
    }

    /**
     * Prevent cloning of singleton
     */
    private function __clone() {}

    /**
     * Prevent unserialization of singleton
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
