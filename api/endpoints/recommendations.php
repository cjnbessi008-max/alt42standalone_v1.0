<?php
/**
 * Recommendations API Endpoint
 * GET    /recommendations/{student_id} - Get personalized recommendations
 * GET    /recommendations/{student_id}/next - Get next recommended problem
 * POST   /recommendations/{student_id}/generate - Generate new recommendations
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../services/RecommendationEngine.php';
require_once __DIR__ . '/../services/LearningPatternAnalyzer.php';

$database = new Database();
$db = $database->getConnection();

$recommender = new RecommendationEngine($db);
$analyzer = new LearningPatternAnalyzer($db);

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Parse request
$uri_parts = explode('/', trim($request_uri, '/'));

try {
    if (!isset($uri_parts[2]) || !is_numeric($uri_parts[2])) {
        sendError('Student ID required', 400);
    }

    $student_id = $uri_parts[2];

    switch ($method) {
        case 'GET':
            if (isset($uri_parts[3]) && $uri_parts[3] === 'next') {
                // GET /recommendations/{student_id}/next
                $next_problem = $recommender->getNextProblem($student_id);

                if (!$next_problem) {
                    sendError('No recommendations available. Generating new ones...', 404);
                }

                // Get student's pattern for hint recommendation
                $pattern = $analyzer->getPattern($student_id);

                sendResponse(true, [
                    'problem' => $next_problem,
                    'recommended_hint_type' => $pattern['dominant_pattern'] ?? 'analytical',
                    'student_pattern' => $pattern
                ], 'Next problem retrieved successfully');

            } else {
                // GET /recommendations/{student_id}
                $stats = $recommender->getRecommendationStats($student_id);
                $difficulty_advice = $recommender->adjustDifficulty($student_id);

                sendResponse(true, [
                    'statistics' => $stats,
                    'difficulty_adjustment' => $difficulty_advice
                ], 'Recommendation statistics retrieved successfully');
            }
            break;

        case 'POST':
            if (isset($uri_parts[3]) && $uri_parts[3] === 'generate') {
                // POST /recommendations/{student_id}/generate
                $data = json_decode(file_get_contents("php://input"), true);
                $count = intval($data['count'] ?? 10);

                $recommendations = $recommender->generateRecommendations($student_id, $count);

                sendResponse(true, [
                    'recommendations' => $recommendations,
                    'count' => count($recommendations)
                ], 'Recommendations generated successfully', 201);
            } else {
                sendError('Invalid endpoint', 400);
            }
            break;

        default:
            sendError('Method not allowed', 405);
    }

} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}
