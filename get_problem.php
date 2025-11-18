<?php
// Get problem data from Moodle database

require_once('../../config.php');

require_login();

header('Content-Type: application/json');

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!isset($data['sesskey']) || !confirm_sesskey($data['sesskey'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid session key']);
    exit;
}

$problemid = isset($data['problemid']) ? intval($data['problemid']) : 0;

if ($problemid <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid problem ID']);
    exit;
}

try {
    global $DB;

    $problem = $DB->get_record('local_dancingline_problems', ['id' => $problemid]);

    if (!$problem) {
        http_response_code(404);
        echo json_encode(['error' => 'Problem not found']);
        exit;
    }

    // Return problem data
    echo json_encode([
        'id' => $problem->id,
        'name' => $problem->name,
        'description' => $problem->description,
        'numbers' => $problem->numbers,
        'algorithm' => $problem->algorithm,
        'difficulty' => $problem->difficulty
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
