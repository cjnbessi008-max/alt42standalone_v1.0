<?php
/**
 * Get Problem API Endpoint
 * Retrieves problem data for the frontend
 * Compatible with PHP 7.1.9, MySQL 5.7
 */

require_once __DIR__ . '/../config/config.php';

set_cors_headers();

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed', 405);
}

// Get problem ID from query string
$problem_id = isset($_GET['problem_id']) ? $_GET['problem_id'] : null;

if (!$problem_id) {
    send_error('Missing problem_id parameter', 400);
}

try {
    $pdo = get_db_connection();

    // Get problem from database
    $sql = "SELECT * FROM problems WHERE moodle_problem_id = ? OR id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$problem_id, $problem_id]);

    $problem = $stmt->fetch();

    if (!$problem) {
        send_error('Problem not found', 404);
    }

    // Decode JSON problem_data
    if ($problem['problem_data']) {
        $problem['problem_data'] = json_decode($problem['problem_data'], true);
    }

    // Get constellation config
    $sql = "SELECT * FROM constellation_configs WHERE config_name = 'default'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $config = $stmt->fetch();

    // Return problem data with config
    send_json([
        'success' => true,
        'problem' => $problem,
        'config' => $config
    ]);

} catch (PDOException $e) {
    send_error('Database error: ' . $e->getMessage(), 500);
}
