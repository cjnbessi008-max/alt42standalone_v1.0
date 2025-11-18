<?php
/**
 * API Test Endpoint
 * Verify that the API is working correctly
 */

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$tests = [
    'php_version' => phpversion(),
    'mysql_available' => extension_loaded('pdo_mysql'),
    'curl_available' => extension_loaded('curl'),
    'json_available' => extension_loaded('json'),
];

// Test database connection
try {
    $pdo = getDbConnection();
    $tests['database_connection'] = 'OK';

    // Test problem count
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM problems');
    $result = $stmt->fetch();
    $tests['problem_count'] = $result['count'];

    // Test session count
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM student_sessions');
    $result = $stmt->fetch();
    $tests['session_count'] = $result['count'];

} catch (Exception $e) {
    $tests['database_connection'] = 'FAILED: ' . $e->getMessage();
    $tests['problem_count'] = 0;
    $tests['session_count'] = 0;
}

// System info
$tests['server_software'] = $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown';
$tests['current_time'] = date('Y-m-d H:i:s');

jsonResponse([
    'success' => true,
    'message' => 'Log Gear API is running',
    'tests' => $tests
]);
