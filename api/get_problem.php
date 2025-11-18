<?php
/**
 * API Endpoint: Get Problem
 * Retrieves a color pattern problem for the student
 */

require_once __DIR__ . '/../vendor/autoload.php';

use ColorPattern\Models\Pattern;
use ColorPattern\Utils\Validator;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $patternModel = new Pattern();

    // Get parameters
    $problemId = $_GET['problem_id'] ?? null;
    $moodleQuestionId = $_GET['moodle_question_id'] ?? null;
    $patternType = $_GET['pattern_type'] ?? null;
    $difficultyLevel = $_GET['difficulty_level'] ?? null;
    $random = $_GET['random'] ?? false;

    $problem = null;

    if ($problemId) {
        // Get specific problem by ID
        $problem = $patternModel->getById($problemId);
    } elseif ($moodleQuestionId) {
        // Get problem by Moodle question ID
        $problem = $patternModel->getByMoodleQuestionId($moodleQuestionId);
    } elseif ($random || $patternType || $difficultyLevel) {
        // Get random problem with optional filters
        $problem = $patternModel->getRandom($patternType, $difficultyLevel);
    } else {
        throw new InvalidArgumentException('Please provide problem_id, moodle_question_id, or use random=1');
    }

    if (!$problem) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Problem not found'
        ]);
        exit;
    }

    // Get pattern templates for color mapping
    $templates = $patternModel->getPatternTemplates();

    // Remove correct answer from response (security)
    $problemForClient = $problem;
    unset($problemForClient['correct_answer']);

    // Get problem statistics
    $stats = $patternModel->getStatistics($problem['id']);

    echo json_encode([
        'success' => true,
        'problem' => $problemForClient,
        'templates' => $templates,
        'statistics' => $stats
    ]);

} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
    error_log("Get Problem Error: " . $e->getMessage());
}
