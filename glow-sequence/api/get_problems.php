<?php
/**
 * Get Problems API
 * Fetches sequence problems from Glow Sequence database
 * Can optionally sync with Moodle questions
 */

require_once '../config/database.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get request parameters
$difficulty = isset($_GET['difficulty']) ? sanitizeInput($_GET['difficulty']) : null;
$sequence_type = isset($_GET['type']) ? sanitizeInput($_GET['type']) : null;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

try {
    $connection = getDbConnection();

    // Build query
    $sql = "SELECT
                s.id,
                s.sequence_type,
                s.sequence_pattern,
                s.difficulty_level,
                s.hint_text,
                s.max_attempts,
                s.time_limit_seconds,
                s.glow_color_primary,
                s.glow_color_secondary,
                s.animation_speed,
                s.moodle_question_id";

    // Include progress if student_id is provided
    if ($student_id) {
        $sql .= ",
                p.status,
                p.best_score,
                p.total_attempts,
                p.mastery_level";
    }

    $sql .= " FROM glow_sequences s";

    // Join with progress if student_id is provided
    if ($student_id) {
        $sql .= " LEFT JOIN glow_progress p ON s.id = p.sequence_id AND p.student_id = ?";
    }

    $sql .= " WHERE s.is_active = TRUE";

    // Add filters
    $params = [];
    $types = '';

    if ($student_id) {
        $params[] = $student_id;
        $types .= 'i';
    }

    if ($difficulty) {
        $sql .= " AND s.difficulty_level = ?";
        $params[] = $difficulty;
        $types .= 's';
    }

    if ($sequence_type) {
        $sql .= " AND s.sequence_type = ?";
        $params[] = $sequence_type;
        $types .= 's';
    }

    $sql .= " ORDER BY s.difficulty_level, s.id LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';

    // Execute query
    $stmt = $connection->prepare($sql);
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $connection->error);
    }

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $problems = [];
    while ($row = $result->fetch_assoc()) {
        // Hide correct answer from client
        $problem = [
            'id' => intval($row['id']),
            'sequence_type' => $row['sequence_type'],
            'sequence_pattern' => $row['sequence_pattern'],
            'difficulty_level' => $row['difficulty_level'],
            'hint_text' => $row['hint_text'],
            'max_attempts' => intval($row['max_attempts']),
            'time_limit_seconds' => intval($row['time_limit_seconds']),
            'glow_color_primary' => $row['glow_color_primary'],
            'glow_color_secondary' => $row['glow_color_secondary'],
            'animation_speed' => $row['animation_speed'],
            'moodle_question_id' => $row['moodle_question_id']
        ];

        // Add progress data if available
        if ($student_id) {
            $problem['progress'] = [
                'status' => $row['status'] ?? 'not_started',
                'best_score' => intval($row['best_score'] ?? 0),
                'total_attempts' => intval($row['total_attempts'] ?? 0),
                'mastery_level' => floatval($row['mastery_level'] ?? 0.0)
            ];
        }

        $problems[] = $problem;
    }

    $stmt->close();

    // Get total count for pagination
    $countSql = "SELECT COUNT(*) as total FROM glow_sequences WHERE is_active = TRUE";
    $countParams = [];
    $countTypes = '';

    if ($difficulty) {
        $countSql .= " AND difficulty_level = ?";
        $countParams[] = $difficulty;
        $countTypes .= 's';
    }

    if ($sequence_type) {
        $countSql .= " AND sequence_type = ?";
        $countParams[] = $sequence_type;
        $countTypes .= 's';
    }

    $countStmt = $connection->prepare($countSql);
    if (!empty($countParams)) {
        $countStmt->bind_param($countTypes, ...$countParams);
    }
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $totalCount = $countResult->fetch_assoc()['total'];
    $countStmt->close();

    successResponse([
        'problems' => $problems,
        'pagination' => [
            'total' => intval($totalCount),
            'limit' => $limit,
            'offset' => $offset,
            'has_more' => ($offset + $limit) < $totalCount
        ]
    ]);

} catch (Exception $e) {
    error_log("Error in get_problems.php: " . $e->getMessage());
    errorResponse($e->getMessage(), 500);
}
