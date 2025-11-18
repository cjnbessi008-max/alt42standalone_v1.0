<?php
/**
 * Vector 3D Sense - Database Connector
 * Handles connection to Vector 3D Sense database
 *
 * @package    vector3d_sense
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

class Vector3DDatabase {
    private $connection;
    private static $instance = null;

    private function __construct() {
        global $CFG;

        $this->connection = new mysqli(
            $CFG->vector3d_dbhost,
            $CFG->vector3d_dbuser,
            $CFG->vector3d_dbpass,
            $CFG->vector3d_dbname,
            $CFG->vector3d_dbport
        );

        if ($this->connection->connect_error) {
            throw new Exception("Vector3D DB Connection failed: " . $this->connection->connect_error);
        }

        $this->connection->set_charset('utf8mb4');
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Vector3DDatabase();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    /**
     * Execute a prepared statement with parameters
     */
    public function execute($query, $types = '', $params = array()) {
        $stmt = $this->connection->prepare($query);

        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->connection->error);
        }

        if (!empty($types) && !empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        return $stmt;
    }

    /**
     * Fetch all results as associative array
     */
    public function fetchAll($query, $types = '', $params = array()) {
        $stmt = $this->execute($query, $types, $params);
        $result = $stmt->get_result();
        $data = array();

        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        $stmt->close();
        return $data;
    }

    /**
     * Fetch single row as associative array
     */
    public function fetchOne($query, $types = '', $params = array()) {
        $stmt = $this->execute($query, $types, $params);
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        $stmt->close();
        return $data;
    }

    /**
     * Get last inserted ID
     */
    public function getLastInsertId() {
        return $this->connection->insert_id;
    }

    /**
     * Close connection
     */
    public function close() {
        if ($this->connection) {
            $this->connection->close();
        }
    }

    public function __destruct() {
        $this->close();
    }
}
