<?php
/**
 * Database Configuration for Twin Shape Glow
 * Moodle LMS Integration - MySQL 5.7
 */

// Moodle Database Configuration
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_DB_PREFIX', 'mdl_');

// Twin Shape Glow Database Configuration
define('TSG_DB_HOST', 'localhost');
define('TSG_DB_NAME', 'twin_shape_glow');
define('TSG_DB_USER', 'tsg_user');
define('TSG_DB_PASS', 'tsg_password');

// Database Connection Class
class Database {
    private $moodle_conn;
    private $tsg_conn;

    public function __construct() {
        $this->connectMoodle();
        $this->connectTSG();
    }

    private function connectMoodle() {
        $this->moodle_conn = new mysqli(
            MOODLE_DB_HOST,
            MOODLE_DB_USER,
            MOODLE_DB_PASS,
            MOODLE_DB_NAME
        );

        if ($this->moodle_conn->connect_error) {
            die("Moodle Connection failed: " . $this->moodle_conn->connect_error);
        }

        $this->moodle_conn->set_charset("utf8mb4");
    }

    private function connectTSG() {
        $this->tsg_conn = new mysqli(
            TSG_DB_HOST,
            TSG_DB_USER,
            TSG_DB_PASS,
            TSG_DB_NAME
        );

        if ($this->tsg_conn->connect_error) {
            die("TSG Connection failed: " . $this->tsg_conn->connect_error);
        }

        $this->tsg_conn->set_charset("utf8mb4");
    }

    public function getMoodleConnection() {
        return $this->moodle_conn;
    }

    public function getTSGConnection() {
        return $this->tsg_conn;
    }

    public function close() {
        if ($this->moodle_conn) {
            $this->moodle_conn->close();
        }
        if ($this->tsg_conn) {
            $this->tsg_conn->close();
        }
    }
}
?>
