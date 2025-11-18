<?php
/**
 * Problem API Endpoint
 * Receives problem data from Moodle and stores in database
 * Compatible with PHP 7.1.9, MySQL 5.7
 */

require_once __DIR__ . '/../config/config.php';

set_cors_headers();

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed', 405);
}

// Validate API key
if (!validate_api_key()) {
    send_error('Invalid API key', 401);
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    send_error('Invalid JSON data', 400);
}

// Validate required fields
$required_fields = [
    'moodle_problem_id',
    'moodle_course_id',
    'moodle_user_id',
    'problem_type',
    'number_range_start',
    'number_range_end'
];

foreach ($required_fields as $field) {
    if (!isset($data[$field])) {
        send_error("Missing required field: $field", 400);
    }
}

// Validate problem type
$valid_types = ['prime', 'multiple', 'natural', 'composite', 'mixed'];
if (!in_array($data['problem_type'], $valid_types)) {
    send_error('Invalid problem type', 400);
}

// Validate difficulty level
$difficulty = isset($data['difficulty_level']) ? $data['difficulty_level'] : 'medium';
$valid_difficulties = ['easy', 'medium', 'hard'];
if (!in_array($difficulty, $valid_difficulties)) {
    $difficulty = 'medium';
}

// Prepare problem data
$problem_data = isset($data['problem_data']) ? $data['problem_data'] : '{}';
if (is_array($problem_data)) {
    $problem_data = json_encode($problem_data);
}

try {
    $pdo = get_db_connection();

    // Insert problem into database
    $sql = "INSERT INTO problems (
        moodle_problem_id,
        moodle_course_id,
        moodle_user_id,
        problem_type,
        number_range_start,
        number_range_end,
        difficulty_level,
        problem_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['moodle_problem_id'],
        $data['moodle_course_id'],
        $data['moodle_user_id'],
        $data['problem_type'],
        $data['number_range_start'],
        $data['number_range_end'],
        $difficulty,
        $problem_data
    ]);

    $problem_id = $pdo->lastInsertId();

    // Return success response
    send_json([
        'success' => true,
        'problem_id' => $problem_id,
        'moodle_problem_id' => $data['moodle_problem_id'],
        'message' => 'Problem created successfully'
    ], 201);

} catch (PDOException $e) {
    send_error('Database error: ' . $e->getMessage(), 500);
}
