<?php
/**
 * API Endpoint for AJAX Requests
 *
 * Provides JSON responses for dynamic question loading
 */

header('Content-Type: application/json');

// Load autoloader
require_once __DIR__ . '/../src/autoload.php';

// Load configuration
$config = require __DIR__ . '/../config/config.php';

use MoodleIntegration\Database\Connection;
use MoodleIntegration\Services\CacheService;
use MoodleIntegration\Services\QuestionService;
use MoodleIntegration\Services\DuplicateBarrierService;

try {
    // Initialize services
    $db = Connection::getInstance($config);
    $cache = new CacheService($config);
    $questionService = new QuestionService($db, $cache, $config);
    $barrierService = new DuplicateBarrierService($db, $config);

    // Get action from request
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'questions':
            // Get questions list
            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $categoryId = isset($_GET['category']) ? (int)$_GET['category'] : null;
            $perPage = $config['display']['per_page'];
            $offset = ($page - 1) * $perPage;

            $options = [
                'limit' => $perPage,
                'offset' => $offset,
                'category' => $categoryId,
            ];

            $questions = $questionService->getQuestions($options);
            $totalQuestions = $questionService->getTotalCount($options);
            $totalPages = ceil($totalQuestions / $perPage);

            echo json_encode([
                'success' => true,
                'data' => [
                    'questions' => $questions,
                    'pagination' => [
                        'current_page' => $page,
                        'total_pages' => $totalPages,
                        'total_questions' => $totalQuestions,
                        'per_page' => $perPage,
                    ],
                ],
            ]);
            break;

        case 'question':
            // Get single question
            $questionId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

            if ($questionId <= 0) {
                throw new Exception('Invalid question ID');
            }

            $question = $questionService->getQuestionById($questionId);

            if (!$question) {
                throw new Exception('Question not found');
            }

            echo json_encode([
                'success' => true,
                'data' => $question,
            ]);
            break;

        case 'categories':
            // Get all categories
            $categories = $questionService->getCategories();

            echo json_encode([
                'success' => true,
                'data' => $categories,
            ]);
            break;

        case 'quiz_questions':
            // Get questions by quiz ID
            $quizId = isset($_GET['quiz_id']) ? (int)$_GET['quiz_id'] : 0;

            if ($quizId <= 0) {
                throw new Exception('Invalid quiz ID');
            }

            $questions = $questionService->getQuestionsByQuiz($quizId);

            echo json_encode([
                'success' => true,
                'data' => $questions,
            ]);
            break;

        case 'clear_cache':
            // Clear all cache (admin function)
            $cache->clear();

            echo json_encode([
                'success' => true,
                'message' => 'Cache cleared successfully',
            ]);
            break;

        case 'mark_viewed':
            // Mark question as viewed (duplicate barrier)
            $input = json_decode(file_get_contents('php://input'), true);
            $questionId = isset($input['question_id']) ? (int)$input['question_id'] : 0;

            if ($questionId <= 0) {
                throw new Exception('Invalid question ID');
            }

            $success = $barrierService->markAsViewed($questionId);

            echo json_encode([
                'success' => $success,
                'message' => 'Question marked as viewed',
                'question_id' => $questionId,
            ]);
            break;

        case 'check_duplicate':
            // Check if question is duplicate
            $questionId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

            if ($questionId <= 0) {
                throw new Exception('Invalid question ID');
            }

            $duplicateInfo = $barrierService->checkDuplicate($questionId);

            echo json_encode([
                'success' => true,
                'data' => $duplicateInfo,
            ]);
            break;

        case 'clear_viewed':
            // Clear viewed questions
            $clearDb = isset($_GET['clear_db']) ? (bool)$_GET['clear_db'] : false;
            $success = $barrierService->clearViewed($clearDb);

            echo json_encode([
                'success' => $success,
                'message' => 'Viewed questions cleared',
            ]);
            break;

        case 'get_statistics':
            // Get duplicate barrier statistics
            $stats = $barrierService->getStatistics();

            echo json_encode([
                'success' => true,
                'data' => $stats,
            ]);
            break;

        case 'cleanup_old_records':
            // Cleanup old view records (maintenance)
            $daysOld = isset($_GET['days']) ? (int)$_GET['days'] : 30;
            $deletedCount = $barrierService->cleanupOldRecords($daysOld);

            echo json_encode([
                'success' => true,
                'message' => "Deleted $deletedCount old records",
                'deleted_count' => $deletedCount,
            ]);
            break;

        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
