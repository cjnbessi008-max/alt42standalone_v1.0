<?php
/**
 * Moodle Integration API
 * Sync problems and user data from Moodle 3.7 LMS
 */

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Call Moodle Web Service
 * @param string $function Moodle web service function name
 * @param array $params Parameters
 * @return array|false
 */
function callMoodleWS($function, $params = []) {
    if (empty(MOODLE_TOKEN)) {
        return false;
    }

    $serverUrl = MOODLE_URL . '/webservice/rest/server.php';

    $params['wstoken'] = MOODLE_TOKEN;
    $params['wsfunction'] = $function;
    $params['moodlewsrestformat'] = 'json';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $serverUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return false;
    }

    return json_decode($response, true);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'sync_questions':
        syncQuestionsFromMoodle();
        break;

    case 'validate_user':
        validateMoodleUser();
        break;

    case 'send_grade':
        sendGradeToMoodle();
        break;

    default:
        jsonResponse(['error' => 'Invalid action. Available: sync_questions, validate_user, send_grade'], 400);
}

/**
 * Sync questions from Moodle quiz
 * GET /api/moodle.php?action=sync_questions&quiz_id=123
 */
function syncQuestionsFromMoodle() {
    global $pdo;

    if (!isset($_GET['quiz_id'])) {
        jsonResponse(['error' => 'quiz_id parameter required'], 400);
    }

    $quizId = (int)$_GET['quiz_id'];

    // Get quiz questions from Moodle
    $questions = callMoodleWS('mod_quiz_get_quiz_questions', [
        'quizid' => $quizId
    ]);

    if ($questions === false || isset($questions['exception'])) {
        jsonResponse(['error' => 'Failed to fetch questions from Moodle'], 500);
    }

    $pdo = getDbConnection();
    $imported = 0;

    foreach ($questions as $question) {
        // Parse question for log gear format
        // Expected format: "Calculate X × Y using log gears" or similar
        if (!isset($question['questiontext'])) {
            continue;
        }

        // Extract operands and operation from question text
        $text = strip_tags($question['questiontext']);
        preg_match('/(\d+\.?\d*)\s*([×x\*÷\/])\s*(\d+\.?\d*)/', $text, $matches);

        if (count($matches) < 4) {
            continue; // Skip if format doesn't match
        }

        $operand1 = (float)$matches[1];
        $operator = $matches[2];
        $operand2 = (float)$matches[3];

        $operation = (in_array($operator, ['÷', '/'])) ? 'divide' : 'multiply';
        $answer = ($operation === 'multiply') ? $operand1 * $operand2 : $operand1 / $operand2;

        // Insert or update problem
        $stmt = $pdo->prepare('
            INSERT INTO problems (problem_text, operand1, operand2, operation, answer, moodle_question_id, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                problem_text = VALUES(problem_text),
                operand1 = VALUES(operand1),
                operand2 = VALUES(operand2),
                operation = VALUES(operation),
                answer = VALUES(answer)
        ');

        $difficulty = 'medium'; // Default, can be enhanced with quiz difficulty analysis

        $stmt->execute([
            $text,
            $operand1,
            $operand2,
            $operation,
            $answer,
            $question['id'] ?? null,
            $difficulty
        ]);

        $imported++;
    }

    jsonResponse([
        'success' => true,
        'message' => "Imported $imported questions from Moodle quiz $quizId",
        'data' => ['imported_count' => $imported]
    ]);
}

/**
 * Validate Moodle user
 * POST /api/moodle.php?action=validate_user
 * Body: {"username": "user", "token": "xxx"}
 */
function validateMoodleUser() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['token'])) {
        jsonResponse(['error' => 'Token required'], 400);
    }

    // Get user info from Moodle
    $userInfo = callMoodleWS('core_webservice_get_site_info', []);

    if ($userInfo === false || isset($userInfo['exception'])) {
        jsonResponse(['error' => 'Invalid Moodle token'], 401);
    }

    jsonResponse([
        'success' => true,
        'data' => [
            'user_id' => $userInfo['userid'] ?? null,
            'username' => $userInfo['username'] ?? null,
            'fullname' => $userInfo['fullname'] ?? null
        ]
    ]);
}

/**
 * Send grade back to Moodle
 * POST /api/moodle.php?action=send_grade
 * Body: {"user_id": 123, "quiz_id": 456, "grade": 85.5}
 */
function sendGradeToMoodle() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['user_id'], $input['quiz_id'], $input['grade'])) {
        jsonResponse(['error' => 'user_id, quiz_id, and grade required'], 400);
    }

    // Send grade to Moodle gradebook
    $result = callMoodleWS('core_grades_update_grades', [
        'source' => 'log_gear_app',
        'courseid' => $input['course_id'] ?? 0,
        'component' => 'mod_quiz',
        'activityid' => $input['quiz_id'],
        'itemnumber' => 0,
        'grades' => [
            [
                'studentid' => $input['user_id'],
                'grade' => $input['grade']
            ]
        ]
    ]);

    if ($result === false || isset($result['exception'])) {
        jsonResponse(['error' => 'Failed to send grade to Moodle'], 500);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Grade sent to Moodle successfully'
    ]);
}
