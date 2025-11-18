<?php
/**
 * Database Configuration and Connection
 *
 * @package DataShuffle
 * @version 1.0.0
 */

namespace DataShuffle\Config;

class Database
{
    /**
     * @var \PDO|null Singleton database connection
     */
    private static $connection = null;

    /**
     * Database configuration
     */
    private static $config = [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'data_shuffle',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
        'options' => [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            \PDO::ATTR_EMULATE_PREPARES => false,
            \PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ]
    ];

    /**
     * Get database connection (singleton)
     *
     * @return \PDO
     * @throws \PDOException
     */
    public static function getConnection()
    {
        if (self::$connection === null) {
            self::$connection = self::createConnection();
        }

        return self::$connection;
    }

    /**
     * Create new database connection
     *
     * @return \PDO
     * @throws \PDOException
     */
    private static function createConnection()
    {
        // Load configuration from environment variables if available
        $host = getenv('DB_HOST') ?: self::$config['host'];
        $port = getenv('DB_PORT') ?: self::$config['port'];
        $database = getenv('DB_DATABASE') ?: self::$config['database'];
        $username = getenv('DB_USERNAME') ?: self::$config['username'];
        $password = getenv('DB_PASSWORD') ?: self::$config['password'];
        $charset = getenv('DB_CHARSET') ?: self::$config['charset'];

        $dsn = "mysql:host={$host};port={$port};dbname={$database};charset={$charset}";

        try {
            $pdo = new \PDO($dsn, $username, $password, self::$config['options']);

            // Test connection
            $pdo->query('SELECT 1');

            return $pdo;

        } catch (\PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new \PDOException("Could not connect to database: " . $e->getMessage());
        }
    }

    /**
     * Load configuration from file
     *
     * @param string $configFile Path to configuration file
     */
    public static function loadConfig($configFile)
    {
        if (file_exists($configFile)) {
            $config = require $configFile;
            self::$config = array_merge(self::$config, $config);
        }
    }

    /**
     * Set configuration value
     *
     * @param string $key Configuration key
     * @param mixed $value Configuration value
     */
    public static function setConfig($key, $value)
    {
        self::$config[$key] = $value;
    }

    /**
     * Close database connection
     */
    public static function closeConnection()
    {
        self::$connection = null;
    }

    /**
     * Check if database connection is active
     *
     * @return bool
     */
    public static function isConnected()
    {
        try {
            if (self::$connection !== null) {
                self::$connection->query('SELECT 1');
                return true;
            }
            return false;
        } catch (\PDOException $e) {
            return false;
        }
    }

    /**
     * Get database configuration (excluding password)
     *
     * @return array
     */
    public static function getConfig()
    {
        $config = self::$config;
        unset($config['password']);
        return $config;
    }
}
