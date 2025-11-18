<?php
/**
 * List Problems API
 * Returns list of all available problems
 */

require_once 'config.php';

try {
    $db = getDBConnection();

    // Get optional filters
    $difficultyLevel = $_GET['difficulty'] ?? null;

    // Build query
    $sql = "SELECT
                id,
                title,
                description,
                difficulty_level,
                question_type
            FROM " . TABLE_PROBLEMS;

    $params = [];

    if ($difficultyLevel !== null) {
        $sql .= " WHERE difficulty_level = :difficulty";
        $params[':difficulty'] = (int)$difficultyLevel;
    }

    $sql .= " ORDER BY difficulty_level ASC, id ASC";

    $stmt = $db->prepare($sql);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, PDO::PARAM_INT);
    }

    $stmt->execute();
    $problems = $stmt->fetchAll();

    // Convert types
    foreach ($problems as &$problem) {
        $problem['id'] = (int)$problem['id'];
        $problem['difficulty_level'] = (int)$problem['difficulty_level'];
    }

    sendJSON([
        'success' => true,
        'count' => count($problems),
        'problems' => $problems
    ]);

} catch (Exception $e) {
    error_log("Error in list-problems.php: " . $e->getMessage());
    sendError('Failed to list problems: ' . $e->getMessage(), 500);
}
