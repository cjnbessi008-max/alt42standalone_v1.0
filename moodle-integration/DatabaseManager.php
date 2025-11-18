<?php
/**
 * Database Manager
 * Handles MySQL database connections and operations
 */

class DatabaseManager {
    private $config;
    private $connection;

    /**
     * Constructor
     *
     * @param array $config Database configuration
     */
    public function __construct(array $config) {
        $this->config = $config;
    }

    /**
     * Get database connection
     *
     * @return PDO Database connection
     * @throws Exception on connection failure
     */
    public function getConnection() {
        if ($this->connection !== null) {
            return $this->connection;
        }

        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $this->config['host'],
                $this->config['port'],
                $this->config['database'],
                $this->config['charset']
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $this->connection = new PDO(
                $dsn,
                $this->config['username'],
                $this->config['password'],
                $options
            );

            return $this->connection;
        } catch (PDOException $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }

    /**
     * Close database connection
     */
    public function close() {
        $this->connection = null;
    }

    /**
     * Execute schema file
     *
     * @param string $schemaFile Path to schema SQL file
     * @throws Exception on error
     */
    public function executeSchema($schemaFile) {
        if (!file_exists($schemaFile)) {
            throw new Exception("Schema file not found: $schemaFile");
        }

        $sql = file_get_contents($schemaFile);
        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
            function($stmt) {
                return !empty($stmt) && strpos($stmt, '--') !== 0;
            }
        );

        $db = $this->getConnection();

        foreach ($statements as $statement) {
            try {
                $db->exec($statement);
            } catch (PDOException $e) {
                throw new Exception("Schema execution error: " . $e->getMessage());
            }
        }
    }
}
