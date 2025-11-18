<?php
/**
 * API Endpoint for Choice Gesture Application
 * Provides REST API for retrieving Moodle questions
 *
 * Compatible with PHP 7.1.9+
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Autoload classes
spl_autoload_register(function ($class) {
    $prefix = 'ALT42\\';
    $base_dir = __DIR__ . '/../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

use ALT42\Services\QuestionService;

try {
    $questionService = new QuestionService();

    // Get action from query parameter
    $action = $_GET['action'] ?? 'random';

    switch ($action) {
        case 'random':
            // Get random question
            $categoryId = isset($_GET['category']) ? (int)$_GET['category'] : null;
            $question = $questionService->getRandomQuestion($categoryId);

            if ($question) {
                echo json_encode([
                    'success' => true,
                    'data' => $question
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'No questions found'
                ]);
            }
            break;

        case 'question':
            // Get specific question by ID
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

            if ($id > 0) {
                $question = $questionService->getQuestion($id);

                if ($question) {
                    echo json_encode([
                        'success' => true,
                        'data' => $question
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Question not found'
                    ]);
                }
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid question ID'
                ]);
            }
            break;

        case 'questions':
            // Get list of questions with pagination
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $categoryId = isset($_GET['category']) ? (int)$_GET['category'] : null;

            $questions = $questionService->getMultipleChoiceQuestions($limit, $offset, $categoryId);
            $totalCount = $questionService->getQuestionCount($categoryId);

            echo json_encode([
                'success' => true,
                'data' => [
                    'questions' => $questions,
                    'total' => $totalCount,
                    'limit' => $limit,
                    'offset' => $offset
                ]
            ]);
            break;

        case 'categories':
            // Get all categories
            $categories = $questionService->getCategories();

            echo json_encode([
                'success' => true,
                'data' => $categories
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid action'
            ]);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
