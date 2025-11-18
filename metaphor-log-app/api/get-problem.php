<?php
/**
 * Get Problem API
 * Retrieves logarithm problems for visualization
 */

require_once 'db.php';

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $db = getDB();

    // Get parameters
    $problemId = isset($_GET['id']) ? intval($_GET['id']) : null;
    $difficulty = isset($_GET['difficulty']) ? $_GET['difficulty'] : null;
    $moodleQuestionId = isset($_GET['moodle_question_id']) ? intval($_GET['moodle_question_id']) : null;

    // Build query
    if ($problemId) {
        // Get specific problem
        $stmt = $db->prepare("SELECT * FROM log_problems WHERE id = ?");
        $stmt->execute([$problemId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            throw new Exception("Problem not found");
        }

        echo json_encode([
            'success' => true,
            'problem' => formatProblem($problem)
        ]);

    } elseif ($moodleQuestionId) {
        // Get problem by Moodle question ID
        $stmt = $db->prepare("SELECT * FROM log_problems WHERE moodle_question_id = ?");
        $stmt->execute([$moodleQuestionId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            throw new Exception("Moodle question not found");
        }

        echo json_encode([
            'success' => true,
            'problem' => formatProblem($problem)
        ]);

    } else {
        // Get random problem with optional difficulty filter
        $query = "SELECT * FROM log_problems";
        $params = [];

        if ($difficulty && in_array($difficulty, ['easy', 'medium', 'hard'])) {
            $query .= " WHERE difficulty = ?";
            $params[] = $difficulty;
        }

        $query .= " ORDER BY RAND() LIMIT 1";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $problem = $stmt->fetch();

        if (!$problem) {
            throw new Exception("No problems found");
        }

        echo json_encode([
            'success' => true,
            'problem' => formatProblem($problem)
        ]);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Format problem data for frontend
 */
function formatProblem($problem) {
    return [
        'id' => intval($problem['id']),
        'base' => floatval($problem['base']),
        'result' => floatval($problem['result']),
        'answer' => floatval($problem['answer']),
        'difficulty' => $problem['difficulty'],
        'metaphorType' => $problem['metaphor_type'],
        'question' => sprintf('log_%s(%s) = ?', $problem['base'], $problem['result']),
        'description' => generateDescription($problem)
    ];
}

/**
 * Generate problem description in Korean
 */
function generateDescription($problem) {
    $base = $problem['base'];
    $result = $problem['result'];

    return sprintf(
        '%s를 몇 번 곱하면 %s가 될까요?',
        $base,
        $result
    );
}
