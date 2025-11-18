<?php
/**
 * Moodle API Integration
 * Moodle LMS와 Root Wave 앱 간의 API
 *
 * Requirements:
 * - PHP 7.1.9+
 * - MySQL 5.7+
 * - Moodle 3.7+
 */

// CORS 헤더 설정 (개발 환경)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 설정 파일 로드
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/moodle-integration.php';

/**
 * 에러 응답 전송
 */
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'timestamp' => time()
    ]);
    exit();
}

/**
 * 성공 응답 전송
 */
function sendSuccess($data) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $data,
        'timestamp' => time()
    ]);
    exit();
}

/**
 * 입력 데이터 검증
 */
function validateInput($data, $required_fields) {
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendError("필수 필드 누락: {$field}");
        }
    }
    return true;
}

// POST 데이터 파싱
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    sendError('잘못된 JSON 형식');
}

$action = $data['action'] ?? null;

if (!$action) {
    sendError('action 필드가 필요합니다');
}

// 액션 처리
try {
    switch ($action) {
        case 'ping':
            // 연결 테스트
            sendSuccess([
                'status' => 'ok',
                'message' => 'Moodle API 연결 성공',
                'server_time' => date('Y-m-d H:i:s')
            ]);
            break;

        case 'get_problem':
            // 문제 정보 가져오기
            $sessionId = $data['sessionId'] ?? null;
            $userId = $data['userId'] ?? null;
            $courseId = $data['courseId'] ?? null;

            // Moodle에서 현재 문제 가져오기
            $moodleIntegration = new MoodleIntegration();
            $problem = $moodleIntegration->getCurrentProblem($userId, $courseId);

            if ($problem) {
                sendSuccess([
                    'problem' => $problem
                ]);
            } else {
                sendSuccess([
                    'problem' => null,
                    'message' => '현재 할당된 문제가 없습니다'
                ]);
            }
            break;

        case 'submit_answer':
            // 학생 응답 제출
            validateInput($data, ['sessionId', 'answer']);

            $sessionId = $data['sessionId'];
            $userId = $data['userId'] ?? null;
            $answer = $data['answer'];
            $timestamp = $data['timestamp'] ?? time();

            $moodleIntegration = new MoodleIntegration();
            $result = $moodleIntegration->submitAnswer($userId, $answer, $timestamp);

            sendSuccess([
                'result' => $result,
                'message' => '응답이 제출되었습니다'
            ]);
            break;

        case 'get_history':
            // 문제 기록 가져오기
            $userId = $data['userId'] ?? null;
            $limit = $data['limit'] ?? 20;

            $moodleIntegration = new MoodleIntegration();
            $history = $moodleIntegration->getHistory($userId, $limit);

            sendSuccess([
                'history' => $history
            ]);
            break;

        case 'save_root_change':
            // 근 변화 기록 저장
            validateInput($data, ['equation', 'oldCount', 'newCount']);

            $equation = $data['equation'];
            $oldCount = intval($data['oldCount']);
            $newCount = intval($data['newCount']);
            $roots = $data['roots'] ?? [];
            $userId = $data['userId'] ?? null;

            $moodleIntegration = new MoodleIntegration();
            $saved = $moodleIntegration->saveRootChange([
                'equation' => $equation,
                'old_count' => $oldCount,
                'new_count' => $newCount,
                'roots' => json_encode($roots),
                'user_id' => $userId,
                'timestamp' => time()
            ]);

            sendSuccess([
                'saved' => $saved,
                'message' => '근 변화가 기록되었습니다'
            ]);
            break;

        default:
            sendError('알 수 없는 액션: ' . $action);
            break;
    }
} catch (Exception $e) {
    sendError('서버 오류: ' . $e->getMessage(), 500);
}
