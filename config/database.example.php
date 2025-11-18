<?php
/**
 * Database Configuration Example
 * Copy this file to database.php and update with your credentials
 */

// Moodle Database Configuration
define('DB_HOST', 'localhost');           // Database host (usually 'localhost')
define('DB_NAME', 'moodle');              // Moodle database name
define('DB_USER', 'moodle_user');         // Database username
define('DB_PASS', 'your_password_here');  // Database password
define('DB_CHARSET', 'utf8mb4');          // Character set

/**
 * Advanced Configuration (Optional)
 */

// Database port (default: 3306 for MySQL)
define('DB_PORT', 3306);

// Connection timeout in seconds
define('DB_TIMEOUT', 10);

// Enable persistent connections (true/false)
define('DB_PERSISTENT', false);

// Moodle table prefix (default: 'mdl_')
define('MOODLE_PREFIX', 'mdl_');

/**
 * Environment Settings
 */

// Set to 'development' or 'production'
define('ENVIRONMENT', 'development');

// Enable error reporting in development
if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

/**
 * Logging Configuration
 */

// Error log file path
define('ERROR_LOG', __DIR__ . '/../logs/error.log');

// Enable query logging (development only)
define('LOG_QUERIES', ENVIRONMENT === 'development');

/**
 * Database Class with Singleton Pattern
 */
class Database {
    private static $instance = null;
    private $connection;
    private $queryLog = array();

    private function __construct() {
        try {
            $dsn = sprintf(
                "mysql:host=%s;port=%d;dbname=%s;charset=%s",
                DB_HOST,
                DB_PORT,
                DB_NAME,
                DB_CHARSET
            );

            $options = array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => DB_TIMEOUT
            );

            if (DB_PERSISTENT) {
                $options[PDO::ATTR_PERSISTENT] = true;
            }

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);

            // Set MySQL time zone
            $this->connection->exec("SET time_zone = '+00:00'");

        } catch(PDOException $e) {
            $this->logError("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed. Please check your configuration.");
        }
    }

    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Get PDO connection
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Execute a prepared statement
     */
    public function query($sql, $params = array()) {
        try {
            $stmt = $this->connection->prepare($sql);

            foreach ($params as $key => $value) {
                $type = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $stmt->bindValue($key, $value, $type);
            }

            $startTime = microtime(true);
            $stmt->execute();
            $endTime = microtime(true);

            if (LOG_QUERIES) {
                $this->queryLog[] = array(
                    'sql' => $sql,
                    'params' => $params,
                    'time' => ($endTime - $startTime) * 1000 // in milliseconds
                );
            }

            return $stmt;

        } catch(PDOException $e) {
            $this->logError("Query failed: " . $e->getMessage() . " | SQL: " . $sql);
            throw new Exception("Database query failed");
        }
    }

    /**
     * Get query log (development only)
     */
    public function getQueryLog() {
        return $this->queryLog;
    }

    /**
     * Log error to file
     */
    private function logError($message) {
        $logDir = dirname(ERROR_LOG);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message\n";

        error_log($logMessage, 3, ERROR_LOG);
    }

    /**
     * Prevent cloning and unserialization
     */
    private function __clone() {}
    private function __wakeup() {}
}

/**
 * Helper function to get Moodle table name with prefix
 */
function moodle_table($tableName) {
    return MOODLE_PREFIX . $tableName;
}

/**
 * Test database connection
 * Uncomment and run this file directly to test your connection
 */
/*
if (php_sapi_name() === 'cli') {
    try {
        $db = Database::getInstance();
        echo "✓ Database connection successful!\n";

        // Test query
        $stmt = $db->query("SELECT VERSION() as version");
        $result = $stmt->fetch();
        echo "✓ MySQL version: " . $result['version'] . "\n";

        // Check Moodle tables
        $stmt = $db->query("SHOW TABLES LIKE :pattern", [
            ':pattern' => MOODLE_PREFIX . '%'
        ]);
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "✓ Found " . count($tables) . " Moodle tables\n";

    } catch (Exception $e) {
        echo "✗ Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}
*/
?>
