<?php
/**
 * Problem Loader API
 * Fetches problem data from database
 */

require_once 'config.php';

// Get problem ID from query parameter
$problemId = $_GET['id'] ?? null;

if (!$problemId) {
    sendError('Problem ID is required', 400);
}

try {
    $db = getDBConnection();

    // Prepare query
    $sql = "SELECT
                id,
                title,
                description,
                initial_position,
                initial_velocity,
                acceleration,
                simulation_duration,
                question_type,
                question_time,
                correct_answer,
                tolerance,
                difficulty_level
            FROM " . TABLE_PROBLEMS . "
            WHERE id = :id
            LIMIT 1";

    $stmt = $db->prepare($sql);
    $stmt->bindParam(':id', $problemId, PDO::PARAM_INT);
    $stmt->execute();

    $problem = $stmt->fetch();

    if (!$problem) {
        sendError('Problem not found', 404);
    }

    // Convert numeric strings to proper types
    $problem['id'] = (int)$problem['id'];
    $problem['initial_position'] = (float)$problem['initial_position'];
    $problem['initial_velocity'] = (float)$problem['initial_velocity'];
    $problem['acceleration'] = (float)$problem['acceleration'];
    $problem['simulation_duration'] = (float)$problem['simulation_duration'];
    $problem['difficulty_level'] = (int)$problem['difficulty_level'];

    if ($problem['question_time'] !== null) {
        $problem['question_time'] = (float)$problem['question_time'];
    }

    if ($problem['correct_answer'] !== null) {
        $problem['correct_answer'] = (float)$problem['correct_answer'];
    }

    if ($problem['tolerance'] !== null) {
        $problem['tolerance'] = (float)$problem['tolerance'];
    }

    // Send response
    sendJSON($problem);

} catch (Exception $e) {
    error_log("Error in problem-loader.php: " . $e->getMessage());
    sendError('Failed to load problem: ' . $e->getMessage(), 500);
}
