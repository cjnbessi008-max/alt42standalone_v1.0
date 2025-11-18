<?php
/**
 * Truth Light API Endpoints
 *
 * RESTful API for Truth Light Application
 */

// CORS 설정
if (API_CORS_ENABLED) {
    header('Access-Control-Allow-Origin: ' . API_CORS_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/MoodleConnector.php';

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 400) {
    sendResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

/**
 * Get request data
 */
function getRequestData() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (strpos($contentType, 'application/json') !== false) {
        $rawData = file_get_contents('php://input');
        return json_decode($rawData, true) ?? [];
    }

    return $_POST;
}

// Parse request
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));
$endpoint = $pathParts[array_search('api.php', $pathParts) + 1] ?? '';

try {
    $db = Database::getInstance();
    $moodle = new MoodleConnector();

    // Route handling
    switch ($endpoint) {

        // GET /api/questions - 문제 목록 가져오기
        case 'questions':
            if ($requestMethod === 'GET') {
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
                $category = $_GET['category'] ?? null;

                $sql = "SELECT * FROM questions";
                $params = [];

                if ($category) {
                    $sql .= " WHERE category = ?";
                    $params[] = $category;
                }

                $sql .= " ORDER BY RAND() LIMIT ?";
                $params[] = $limit;

                $questions = $db->query($sql, $params);

                sendResponse([
                    'success' => true,
                    'data' => $questions,
                    'count' => count($questions)
                ]);
            }
            break;

        // GET /api/questions/{id} - 특정 문제 가져오기
        case 'question':
            if ($requestMethod === 'GET') {
                $questionId = $_GET['id'] ?? null;

                if (!$questionId) {
                    sendError('Question ID is required');
                }

                $question = $db->queryOne(
                    "SELECT * FROM questions WHERE id = ?",
                    [$questionId]
                );

                if (!$question) {
                    sendError('Question not found', 404);
                }

                sendResponse([
                    'success' => true,
                    'data' => $question
                ]);
            }
            break;

        // POST /api/session/start - 학습 세션 시작
        case 'session':
            if ($requestMethod === 'POST') {
                $data = getRequestData();
                $userId = $data['user_id'] ?? 1; // 기본 사용자

                // 세션 토큰 생성
                $sessionToken = bin2hex(random_bytes(32));

                $result = $db->execute(
                    "INSERT INTO learning_sessions (user_id, session_token) VALUES (?, ?)",
                    [$userId, $sessionToken]
                );

                sendResponse([
                    'success' => true,
                    'session_id' => $result['last_insert_id'],
                    'session_token' => $sessionToken,
                    'message' => '학습 세션이 시작되었습니다.'
                ]);
            }
            // PUT /api/session/end - 학습 세션 종료
            elseif ($requestMethod === 'PUT') {
                $data = getRequestData();
                $sessionId = $data['session_id'] ?? null;

                if (!$sessionId) {
                    sendError('Session ID is required');
                }

                $db->execute(
                    "UPDATE learning_sessions SET ended_at = NOW(), status = 'completed' WHERE id = ?",
                    [$sessionId]
                );

                // 세션 통계 조회
                $stats = $db->queryOne(
                    "SELECT total_questions, correct_answers,
                            ROUND((correct_answers / total_questions * 100), 2) as accuracy
                     FROM learning_sessions WHERE id = ?",
                    [$sessionId]
                );

                sendResponse([
                    'success' => true,
                    'message' => '학습 세션이 종료되었습니다.',
                    'statistics' => $stats
                ]);
            }
            break;

        // POST /api/answer - 답변 제출
        case 'answer':
            if ($requestMethod === 'POST') {
                $data = getRequestData();

                $sessionId = $data['session_id'] ?? null;
                $questionId = $data['question_id'] ?? null;
                $userAnswer = isset($data['answer']) ? (bool)$data['answer'] : null;
                $timeSpent = $data['time_spent'] ?? 0;
                $confidenceLevel = $data['confidence_level'] ?? null;

                if (!$sessionId || !$questionId || $userAnswer === null) {
                    sendError('Missing required fields');
                }

                // 정답 확인
                $question = $db->queryOne(
                    "SELECT correct_answer FROM questions WHERE id = ?",
                    [$questionId]
                );

                if (!$question) {
                    sendError('Question not found', 404);
                }

                $isCorrect = ((bool)$question['correct_answer'] === $userAnswer);

                // 조명 밝기 계산
                $lightBrightness = $isCorrect ? LIGHT_MAX_BRIGHTNESS : LIGHT_MIN_BRIGHTNESS;

                // 답변 기록 저장
                $db->execute(
                    "INSERT INTO answer_attempts
                     (session_id, question_id, user_answer, is_correct, confidence_level, time_spent_seconds, light_brightness)
                     VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [$sessionId, $questionId, $userAnswer, $isCorrect, $confidenceLevel, $timeSpent, $lightBrightness]
                );

                // 세션 통계 업데이트
                $db->execute(
                    "UPDATE learning_sessions
                     SET total_questions = total_questions + 1,
                         correct_answers = correct_answers + ?
                     WHERE id = ?",
                    [$isCorrect ? 1 : 0, $sessionId]
                );

                sendResponse([
                    'success' => true,
                    'is_correct' => $isCorrect,
                    'correct_answer' => (bool)$question['correct_answer'],
                    'light_brightness' => $lightBrightness,
                    'message' => $isCorrect ? '정답입니다! 🎉' : '오답입니다. 다시 생각해보세요.'
                ]);
            }
            break;

        // GET /api/progress - 사용자 진도 조회
        case 'progress':
            if ($requestMethod === 'GET') {
                $userId = $_GET['user_id'] ?? 1;

                $progress = $db->queryOne(
                    "SELECT * FROM user_progress WHERE user_id = ?",
                    [$userId]
                );

                if (!$progress) {
                    // 진도 데이터가 없으면 생성
                    $db->execute(
                        "INSERT INTO user_progress (user_id) VALUES (?)",
                        [$userId]
                    );
                    $progress = $db->queryOne(
                        "SELECT * FROM user_progress WHERE user_id = ?",
                        [$userId]
                    );
                }

                sendResponse([
                    'success' => true,
                    'data' => $progress
                ]);
            }
            break;

        // GET /api/moodle/test - Moodle 연결 테스트
        case 'moodle-test':
            if ($requestMethod === 'GET') {
                $isConnected = $moodle->testConnection();

                sendResponse([
                    'success' => $isConnected,
                    'message' => $isConnected ? 'Moodle 연결 성공' : 'Moodle 연결 실패',
                    'moodle_url' => MOODLE_URL
                ]);
            }
            break;

        // GET /api/categories - 문제 카테고리 목록
        case 'categories':
            if ($requestMethod === 'GET') {
                $categories = $db->query(
                    "SELECT DISTINCT category, COUNT(*) as count
                     FROM questions
                     GROUP BY category"
                );

                sendResponse([
                    'success' => true,
                    'data' => $categories
                ]);
            }
            break;

        // Default - 404
        default:
            sendError('Endpoint not found', 404);
    }

} catch (Exception $e) {
    sendError('서버 오류: ' . $e->getMessage(), 500);
}
