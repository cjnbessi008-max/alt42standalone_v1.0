<?php
/**
 * Database Configuration
 * MySQL 5.7 connection settings for Moodle integration
 */

// Database credentials
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'reflection_mode');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Create connection
try {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    // Check connection
    if ($db->connect_error) {
        throw new Exception("Connection failed: " . $db->connect_error);
    }

    // Set charset
    if (!$db->set_charset(DB_CHARSET)) {
        throw new Exception("Error setting charset: " . $db->error);
    }

    // Set timezone
    $db->query("SET time_zone = '+00:00'");

} catch (Exception $e) {
    // Log error
    error_log("Database connection error: " . $e->getMessage());

    // In production, show generic error
    if (getenv('ENVIRONMENT') === 'production') {
        die("Database connection error. Please contact administrator.");
    } else {
        die("Database error: " . $e->getMessage());
    }
}

/**
 * Prepared statement helper function
 */
function db_query($query, $types = '', $params = []) {
    global $db;

    $stmt = $db->prepare($query);

    if (!$stmt) {
        throw new Exception("Query preparation failed: " . $db->error);
    }

    if ($types && $params) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();

    return $stmt;
}

/**
 * Fetch all results from query
 */
function db_fetch_all($query, $types = '', $params = []) {
    $stmt = db_query($query, $types, $params);
    $result = $stmt->get_result();
    $data = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    return $data;
}

/**
 * Fetch single result from query
 */
function db_fetch_one($query, $types = '', $params = []) {
    $stmt = db_query($query, $types, $params);
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();
    $stmt->close();

    return $data;
}

/**
 * Insert and return last insert ID
 */
function db_insert($query, $types, $params) {
    global $db;
    $stmt = db_query($query, $types, $params);
    $insert_id = $db->insert_id;
    $stmt->close();

    return $insert_id;
}

/**
 * Update/Delete and return affected rows
 */
function db_execute($query, $types = '', $params = []) {
    global $db;
    $stmt = db_query($query, $types, $params);
    $affected_rows = $stmt->affected_rows;
    $stmt->close();

    return $affected_rows;
}

/**
 * Close database connection
 */
function db_close() {
    global $db;
    if ($db) {
        $db->close();
    }
}

// Register shutdown function to close connection
register_shutdown_function('db_close');
