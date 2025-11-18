<?php
/**
 * Graph Chime API Endpoints
 */

header('Content-Type: application/json; charset=utf-8');

// CORS 설정
if (ALLOW_CORS) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 3600');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

require_once '../config/config.php';
require_once 'Database.php';
require_once 'MoodleAPI.php';
require_once 'GraphProblem.php';

// 요청 파싱
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '/';
$params = $_GET;
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// 응답 함수
function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function sendError($message, $status = 400) {
    sendResponse(['error' => $message], $status);
}

try {
    // 라우팅
    switch ($path) {
        // 문제 정보 가져오기
        case '/problem':
            if ($method === 'GET') {
                $moodleQuestionId = $params['moodle_question_id'] ?? null;

                if (!$moodleQuestionId) {
                    sendError('moodle_question_id가 필요합니다.');
                }

                $graphProblem = new GraphProblem();
                $problem = $graphProblem->getByMoodleId($moodleQuestionId);

                if (!$problem) {
                    // Moodle에서 문제 정보 가져오기
                    $moodleAPI = new MoodleAPI();
                    $moodleQuestion = $moodleAPI->getQuestion($moodleQuestionId);

                    if (!$moodleQuestion) {
                        sendError('문제를 찾을 수 없습니다.', 404);
                    }

                    // 방정식 파싱 (실제로는 Moodle 문제에서 가져옴)
                    // 여기서는 예시로 하드코딩
                    $equation = 'y = 2x + 3'; // 실제로는 Moodle 데이터 파싱
                    $parsed = GraphProblem::parseLinearEquation($equation);

                    // 데이터베이스에 저장
                    $data = array_merge([
                        'moodle_question_id' => $moodleQuestionId,
                        'problem_type' => 'linear',
                        'equation' => $equation,
                        'title' => '일차함수 그래프',
                        'description' => '일차함수의 y절편과 x절편을 찾아보세요.'
                    ], $parsed);

                    $graphProblem->createOrUpdate($data);
                    $problem = $graphProblem->getByMoodleId($moodleQuestionId);
                }

                sendResponse(['success' => true, 'data' => $problem]);
            }
            break;

        // 음향 정보 가져오기
        case '/audio':
            if ($method === 'GET') {
                $interceptType = $params['type'] ?? null; // 'y_intercept' or 'x_intercept'
                $value = $params['value'] ?? null;

                if (!$interceptType || $value === null) {
                    sendError('type과 value가 필요합니다.');
                }

                $graphProblem = new GraphProblem();
                $audioSettings = $graphProblem->getAudioSettings($interceptType, floatval($value));

                if (!$audioSettings) {
                    sendError('해당 값에 대한 음향 설정을 찾을 수 없습니다.', 404);
                }

                sendResponse(['success' => true, 'data' => $audioSettings]);
            }
            break;

        // 학생 응답 제출
        case '/submit':
            if ($method === 'POST') {
                $problemId = $body['problem_id'] ?? null;
                $studentId = $body['student_id'] ?? null;
                $sessionId = $body['session_id'] ?? null;
                $responseData = $body['response_data'] ?? null;

                if (!$problemId || !$studentId) {
                    sendError('problem_id와 student_id가 필요합니다.');
                }

                $db = Database::getInstance()->getConnection();

                // 응답 저장
                $sql = "INSERT INTO student_responses
                        (problem_id, student_id, session_id, response_type,
                         response_data, is_correct, score, time_spent, sound_played)
                        VALUES
                        (:problem_id, :student_id, :session_id, :response_type,
                         :response_data, :is_correct, :score, :time_spent, :sound_played)";

                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':problem_id' => $problemId,
                    ':student_id' => $studentId,
                    ':session_id' => $sessionId,
                    ':response_type' => $body['response_type'] ?? 'graph_interaction',
                    ':response_data' => json_encode($responseData, JSON_UNESCAPED_UNICODE),
                    ':is_correct' => $body['is_correct'] ?? 0,
                    ':score' => $body['score'] ?? 0,
                    ':time_spent' => $body['time_spent'] ?? 0,
                    ':sound_played' => $body['sound_played'] ?? 0
                ]);

                sendResponse([
                    'success' => true,
                    'response_id' => $db->lastInsertId()
                ]);
            }
            break;

        // 세션 로그
        case '/log':
            if ($method === 'POST') {
                $sessionId = $body['session_id'] ?? null;
                $studentId = $body['student_id'] ?? null;
                $actionType = $body['action_type'] ?? null;

                if (!$sessionId || !$studentId || !$actionType) {
                    sendError('session_id, student_id, action_type이 필요합니다.');
                }

                $db = Database::getInstance()->getConnection();

                $sql = "INSERT INTO session_logs
                        (session_id, student_id, problem_id, action_type, action_data)
                        VALUES
                        (:session_id, :student_id, :problem_id, :action_type, :action_data)";

                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':session_id' => $sessionId,
                    ':student_id' => $studentId,
                    ':problem_id' => $body['problem_id'] ?? null,
                    ':action_type' => $actionType,
                    ':action_data' => json_encode($body['action_data'] ?? [], JSON_UNESCAPED_UNICODE)
                ]);

                sendResponse(['success' => true]);
            }
            break;

        default:
            sendError('유효하지 않은 엔드포인트입니다.', 404);
    }

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendError('서버 오류가 발생했습니다: ' . $e->getMessage(), 500);
}
