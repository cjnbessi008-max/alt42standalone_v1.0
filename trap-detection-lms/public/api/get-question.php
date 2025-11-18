<?php
/**
 * Get Question API Endpoint
 * Retrieves question with traps and options
 * Trap Detection LMS
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../src/models/Question.php';

try {
    // Only allow GET requests
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception("Only GET requests are allowed");
    }

    // Get question ID from query parameter
    if (!isset($_GET['id'])) {
        throw new Exception("Missing required parameter: id");
    }

    $questionId = intval($_GET['id']);
    $includeTraps = isset($_GET['include_traps']) && $_GET['include_traps'] === 'true';

    // Get question
    $questionModel = new Question();

    if ($includeTraps) {
        $question = $questionModel->getWithTraps($questionId);
    } else {
        $question = $questionModel->getWithOptions($questionId);
    }

    if (!$question) {
        throw new Exception("Question not found");
    }

    // Return response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $question,
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
