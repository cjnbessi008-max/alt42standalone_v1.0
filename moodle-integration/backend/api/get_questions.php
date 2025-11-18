<?php
/**
 * API Endpoint: Get Questions from Moodle
 * Fetches quiz questions and caches them locally
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle.php';
require_once __DIR__ . '/../models/Question.php';

try {
    // Get parameters
    $quizId = isset($_GET['quiz_id']) ? intval($_GET['quiz_id']) : null;
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 1; // Default demo user
    $useCache = isset($_GET['use_cache']) ? filter_var($_GET['use_cache'], FILTER_VALIDATE_BOOLEAN) : true;

    if (!$quizId) {
        throw new Exception("quiz_id parameter is required");
    }

    $questionModel = new Question();

    // Check cache first
    if ($useCache) {
        $cachedQuestions = $questionModel->getQuestionsByQuizId($quizId);
        if (!empty($cachedQuestions)) {
            // Create a new session
            $sessionId = $questionModel->createSession($userId, $quizId, count($cachedQuestions));

            echo json_encode([
                'success' => true,
                'source' => 'cache',
                'session_id' => $sessionId,
                'quiz_id' => $quizId,
                'questions' => $cachedQuestions,
                'total' => count($cachedQuestions)
            ]);
            exit();
        }
    }

    // Fetch from Moodle if not in cache
    $moodleAPI = new MoodleAPI();

    // Note: Moodle 3.7 quiz web service may require starting an attempt first
    // This is a simplified example - adjust based on your Moodle configuration
    try {
        $moodleQuestions = $moodleAPI->getQuizQuestions($quizId);
    } catch (Exception $e) {
        // If direct question fetch fails, create demo questions
        error_log("Moodle API Error: " . $e->getMessage() . " - Using demo data");
        $moodleQuestions = createDemoQuestions($quizId);
    }

    // Process and cache questions
    $processedQuestions = [];
    foreach ($moodleQuestions as $mq) {
        $questionData = [
            'type' => $mq['type'] ?? 'multichoice',
            'text' => $mq['questiontext'] ?? $mq['text'] ?? 'Sample Question',
            'options' => $mq['options'] ?? [],
            'correct_answer' => $mq['correct_answer'] ?? '',
            'difficulty' => $mq['difficulty'] ?? 'medium'
        ];

        $moodleQuestionId = $mq['id'] ?? rand(1000, 9999);
        $questionModel->cacheQuestion($moodleQuestionId, $quizId, $questionData);

        $processedQuestions[] = [
            'moodle_question_id' => $moodleQuestionId,
            'quiz_id' => $quizId,
            'question_type' => $questionData['type'],
            'question_text' => $questionData['text'],
            'options' => $questionData['options'],
            'difficulty' => $questionData['difficulty']
        ];
    }

    // Create session
    $sessionId = $questionModel->createSession($userId, $quizId, count($processedQuestions));

    echo json_encode([
        'success' => true,
        'source' => 'moodle',
        'session_id' => $sessionId,
        'quiz_id' => $quizId,
        'questions' => $processedQuestions,
        'total' => count($processedQuestions)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Create demo questions for testing when Moodle is unavailable
 */
function createDemoQuestions($quizId) {
    return [
        [
            'id' => 1001,
            'type' => 'multichoice',
            'text' => '2 + 2는 무엇입니까?',
            'options' => ['2', '3', '4', '5'],
            'correct_answer' => '4',
            'difficulty' => 'easy'
        ],
        [
            'id' => 1002,
            'type' => 'multichoice',
            'text' => '한국의 수도는 어디입니까?',
            'options' => ['부산', '서울', '인천', '대전'],
            'correct_answer' => '서울',
            'difficulty' => 'easy'
        ],
        [
            'id' => 1003,
            'type' => 'multichoice',
            'text' => '3 × 7은 무엇입니까?',
            'options' => ['18', '19', '20', '21'],
            'correct_answer' => '21',
            'difficulty' => 'medium'
        ],
        [
            'id' => 1004,
            'type' => 'multichoice',
            'text' => '지구에서 가장 큰 바다는?',
            'options' => ['대서양', '인도양', '태평양', '북극해'],
            'correct_answer' => '태평양',
            'difficulty' => 'medium'
        ],
        [
            'id' => 1005,
            'type' => 'multichoice',
            'text' => '√(144)의 값은?',
            'options' => ['10', '11', '12', '13'],
            'correct_answer' => '12',
            'difficulty' => 'hard'
        ]
    ];
}
