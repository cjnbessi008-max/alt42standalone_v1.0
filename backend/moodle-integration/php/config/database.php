<?php
/**
 * Database Configuration for Moodle Integration
 * MySQL 5.7 connection settings
 */

defined('MOODLE_INTERNAL') || die();

// Database configuration
$CFG = new stdClass();

// MySQL 5.7 database settings
$CFG->dbtype    = 'mysqli';
$CFG->dblibrary = 'native';
$CFG->dbhost    = getenv('DB_HOST') ?: 'localhost';
$CFG->dbname    = getenv('DB_NAME') ?: 'moodle';
$CFG->dbuser    = getenv('DB_USER') ?: 'moodleuser';
$CFG->dbpass    = getenv('DB_PASS') ?: '';
$CFG->prefix    = 'mdl_';
$CFG->dboptions = array(
    'dbpersist' => false,
    'dbsocket'  => false,
    'dbport'    => getenv('DB_PORT') ?: '3306',
    'dbcollation' => 'utf8mb4_unicode_ci',
);

// API Backend URL
$CFG->api_backend_url = getenv('API_BACKEND_URL') ?: 'http://localhost:8000';

/**
 * Get database connection
 */
function get_db_connection() {
    global $CFG;

    $mysqli = new mysqli(
        $CFG->dbhost,
        $CFG->dbuser,
        $CFG->dbpass,
        $CFG->dbname,
        (int)$CFG->dboptions['dbport']
    );

    if ($mysqli->connect_error) {
        throw new Exception('Database connection failed: ' . $mysqli->connect_error);
    }

    $mysqli->set_charset('utf8mb4');

    return $mysqli;
}

/**
 * Close database connection
 */
function close_db_connection($mysqli) {
    if ($mysqli) {
        $mysqli->close();
    }
}
