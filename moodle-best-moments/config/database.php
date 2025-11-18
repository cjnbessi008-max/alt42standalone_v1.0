<?php
/**
 * Database connection configuration for Best Thinking Moments plugin
 *
 * @package    local_bestmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Database Configuration
 *
 * This plugin uses Moodle's existing database connection.
 * For MySQL 5.7 compatibility, specific settings are configured below.
 */

class bestmoments_db_config {

    /**
     * MySQL 5.7 specific settings
     */
    const DB_TYPE = 'mysqli';
    const DB_CHARSET = 'utf8mb4';
    const DB_COLLATION = 'utf8mb4_unicode_ci';

    /**
     * Connection settings optimized for MySQL 5.7
     */
    private static $connection_options = array(
        'connecttimeout' => 10,
        'readonly' => false,
        'dbcollation' => self::DB_COLLATION,
    );

    /**
     * Get database connection using Moodle's $DB global
     *
     * @return object Moodle database object
     */
    public static function get_connection() {
        global $DB;
        return $DB;
    }

    /**
     * Execute a query with error handling
     *
     * @param string $sql SQL query
     * @param array $params Query parameters
     * @return mixed Query results
     */
    public static function execute_query($sql, $params = array()) {
        global $DB;

        try {
            return $DB->get_records_sql($sql, $params);
        } catch (dml_exception $e) {
            if (BESTMOMENTS_DEBUG_MODE) {
                error_log("BestMoments DB Error: " . $e->getMessage());
            }
            throw $e;
        }
    }

    /**
     * Get table name with Moodle prefix
     *
     * @param string $table Table name without prefix
     * @return string Full table name with prefix
     */
    public static function get_table_name($table) {
        global $CFG;
        return $CFG->prefix . BESTMOMENTS_TABLE_PREFIX . $table;
    }

    /**
     * Check MySQL version compatibility
     *
     * @return bool True if MySQL 5.7+ is detected
     */
    public static function check_mysql_version() {
        global $DB;

        $version = $DB->get_server_info();
        $mysql_version = floatval($version['version']);

        return $mysql_version >= 5.7;
    }

    /**
     * Set MySQL 5.7 specific SQL modes
     */
    public static function set_mysql_modes() {
        global $DB;

        // MySQL 5.7에서 권장되는 SQL 모드 설정
        $sql = "SET SESSION sql_mode = 'TRADITIONAL,NO_AUTO_VALUE_ON_ZERO'";

        try {
            $DB->execute($sql);
        } catch (dml_exception $e) {
            if (BESTMOMENTS_DEBUG_MODE) {
                error_log("Failed to set SQL mode: " . $e->getMessage());
            }
        }
    }
}
