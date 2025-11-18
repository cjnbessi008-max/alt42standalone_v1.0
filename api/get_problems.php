<?php
/**
 * API Endpoint: Get Problems
 * Retrieves math problems from database and Moodle
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../classes/MoodleConnector.php';

try {
    $db = Database::getInstance()->getConnection();

    // Check if requesting a specific problem
    $problemId = isset($_GET['id']) ? intval($_GET['id']) : null;

    if ($problemId) {
        // Get specific problem with ranges
        $response = getProblemById($db, $problemId);
    } else {
        // Get all problems with statistics
        $response = getAllProblems($db);
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

function getAllProblems($db) {
    // Get all problems
    $stmt = $db->prepare("
        SELECT
            id,
            moodle_question_id,
            moodle_quiz_id,
            title,
            description,
            problem_type,
            min_value,
            max_value,
            graph_data,
            created_at
        FROM problems
        ORDER BY created_at DESC
    ");

    $stmt->execute();
    $problems = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Parse graph_data JSON
    foreach ($problems as &$problem) {
        if ($problem['graph_data']) {
            $problem['graph_data'] = json_decode($problem['graph_data'], true);
        }
    }

    // Get statistics
    $statistics = getStatistics($db);

    return [
        'success' => true,
        'problems' => $problems,
        'statistics' => $statistics
    ];
}

function getProblemById($db, $problemId) {
    // Get problem details
    $stmt = $db->prepare("
        SELECT
            id,
            moodle_question_id,
            moodle_quiz_id,
            title,
            description,
            problem_type,
            min_value,
            max_value,
            graph_data,
            created_at
        FROM problems
        WHERE id = :id
    ");

    $stmt->execute(['id' => $problemId]);
    $problem = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$problem) {
        return [
            'success' => false,
            'message' => 'Problem not found'
        ];
    }

    // Parse graph_data JSON
    if ($problem['graph_data']) {
        $problem['graph_data'] = json_decode($problem['graph_data'], true);
    }

    // Get ranges for this problem
    $stmt = $db->prepare("
        SELECT
            id,
            range_start,
            range_end,
            range_type,
            color,
            opacity,
            display_order
        FROM graph_ranges
        WHERE problem_id = :problem_id
        ORDER BY display_order ASC
    ");

    $stmt->execute(['problem_id' => $problemId]);
    $ranges = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert string values to numbers
    foreach ($ranges as &$range) {
        $range['range_start'] = floatval($range['range_start']);
        $range['range_end'] = floatval($range['range_end']);
        $range['opacity'] = floatval($range['opacity']);
        $range['display_order'] = intval($range['display_order']);
    }

    $problem['ranges'] = $ranges;

    return [
        'success' => true,
        'problem' => $problem
    ];
}

function getStatistics($db) {
    // Total problems
    $stmt = $db->query("SELECT COUNT(*) as total FROM problems");
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Total attempts
    $stmt = $db->query("SELECT COUNT(*) as attempts FROM student_attempts");
    $attempts = $stmt->fetch(PDO::FETCH_ASSOC)['attempts'];

    // Accuracy
    $stmt = $db->query("
        SELECT
            COUNT(*) as total_attempts,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts
        FROM student_attempts
    ");
    $accuracyData = $stmt->fetch(PDO::FETCH_ASSOC);

    $accuracy = 0;
    if ($accuracyData['total_attempts'] > 0) {
        $accuracy = round(($accuracyData['correct_attempts'] / $accuracyData['total_attempts']) * 100, 1);
    }

    return [
        'total' => intval($total),
        'attempts' => intval($attempts),
        'accuracy' => $accuracy
    ];
}
