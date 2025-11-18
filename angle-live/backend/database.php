<?php
/**
 * Angle Live - Database Connection Class
 * PHP 7.1.9 Compatible - Uses MySQLi
 */

require_once 'config.php';

class Database {
    private $conn;
    private $moodle_conn;

    /**
     * Get database connection
     */
    public function getConnection() {
        if ($this->conn === null) {
            try {
                $this->conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

                if ($this->conn->connect_error) {
                    throw new Exception("Connection failed: " . $this->conn->connect_error);
                }

                $this->conn->set_charset(DB_CHARSET);
            } catch (Exception $e) {
                error_log("Database connection error: " . $e->getMessage());
                return null;
            }
        }

        return $this->conn;
    }

    /**
     * Get Moodle database connection
     */
    public function getMoodleConnection() {
        if ($this->moodle_conn === null) {
            try {
                $this->moodle_conn = new mysqli(MOODLE_DB_HOST, MOODLE_DB_USER, MOODLE_DB_PASS, MOODLE_DB_NAME);

                if ($this->moodle_conn->connect_error) {
                    throw new Exception("Moodle connection failed: " . $this->moodle_conn->connect_error);
                }

                $this->moodle_conn->set_charset(DB_CHARSET);
            } catch (Exception $e) {
                error_log("Moodle database connection error: " . $e->getMessage());
                return null;
            }
        }

        return $this->moodle_conn;
    }

    /**
     * Close connections
     */
    public function closeConnections() {
        if ($this->conn !== null) {
            $this->conn->close();
        }
        if ($this->moodle_conn !== null) {
            $this->moodle_conn->close();
        }
    }

    /**
     * Escape string for SQL
     */
    public function escape($value) {
        $conn = $this->getConnection();
        if ($conn) {
            return $conn->real_escape_string($value);
        }
        return addslashes($value);
    }
}
