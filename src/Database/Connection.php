<?php
/**
 * Database Connection Manager for Moodle Integration
 *
 * Provides efficient, singleton-based MySQL connection
 * Compatible with MySQL 5.7 and PHP 7.1.9
 */

namespace MoodleIntegration\Database;

use PDO;
use PDOException;

class Connection
{
    private static $instance = null;
    private $pdo;
    private $config;

    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct(array $config)
    {
        $this->config = $config;
        $this->connect();
    }

    /**
     * Prevent cloning of the instance
     */
    private function __clone() {}

    /**
     * Get singleton instance
     */
    public static function getInstance(array $config = null)
    {
        if (self::$instance === null) {
            if ($config === null) {
                throw new \Exception('Configuration required for first connection');
            }
            self::$instance = new self($config);
        }
        return self::$instance;
    }

    /**
     * Establish database connection
     */
    private function connect()
    {
        $dbConfig = $this->config['moodle_db'];

        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                $dbConfig['host'],
                $dbConfig['port'],
                $dbConfig['database'],
                $dbConfig['charset']
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false, // Use real prepared statements
                PDO::ATTR_PERSISTENT => false, // Avoid persistent connections for better resource management
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$dbConfig['charset']}", // MySQL 5.7 compatible
            ];

            $this->pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $options);

        } catch (PDOException $e) {
            throw new \Exception('Database connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Get PDO instance
     */
    public function getPdo()
    {
        return $this->pdo;
    }

    /**
     * Get table prefix
     */
    public function getPrefix()
    {
        return $this->config['moodle_db']['prefix'];
    }

    /**
     * Execute a prepared statement with parameters
     *
     * @param string $query SQL query with placeholders
     * @param array $params Parameters to bind
     * @return \PDOStatement
     */
    public function execute($query, array $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            throw new \Exception('Query execution failed: ' . $e->getMessage());
        }
    }

    /**
     * Fetch all rows from query
     */
    public function fetchAll($query, array $params = [])
    {
        $stmt = $this->execute($query, $params);
        return $stmt->fetchAll();
    }

    /**
     * Fetch single row from query
     */
    public function fetchOne($query, array $params = [])
    {
        $stmt = $this->execute($query, $params);
        return $stmt->fetch();
    }

    /**
     * Get row count
     */
    public function count($query, array $params = [])
    {
        $stmt = $this->execute($query, $params);
        return (int) $stmt->fetchColumn();
    }
}
