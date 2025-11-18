<?php
/**
 * Root Glow API - Moodle LMS 연동 API
 * PHP Version: 7.1.9
 * MySQL Version: 5.7
 * Moodle Version: 3.7
 */

// CORS 설정 (개발 환경용)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 세션 시작
session_start();

// 설정 파일 로드
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/moodle-connector.php';

// 데이터베이스 연결
$db = new Database();
$conn = $db->getConnection();

// Moodle 커넥터
$moodleConnector = new MoodleConnector($conn);

/**
 * API 라우터
 */
$action = isset($_POST['action']) ? $_POST['action'] : (isset($_GET['action']) ? $_GET['action'] : '');

switch ($action) {
    case 'init':
        handleInit();
        break;

    case 'getProblem':
        handleGetProblem();
        break;

    case 'getProblemList':
        handleGetProblemList();
        break;

    case 'submitAnswer':
        handleSubmitAnswer();
        break;

    case 'saveProgress':
        handleSaveProgress();
        break;

    case 'getUserInfo':
        handleGetUserInfo();
        break;

    case 'disconnect':
        handleDisconnect();
        break;

    default:
        sendResponse(false, null, 'Invalid action');
        break;
}

/**
 * 초기화
 */
function handleInit() {
    global $moodleConnector;

    try {
        // 세션 ID 생성
        $sessionId = session_id();

        // 사용자 정보 (Moodle SSO 연동 시 사용)
        $_SESSION['user_id'] = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'guest_' . time();
        $_SESSION['username'] = isset($_SESSION['username']) ? $_SESSION['username'] : 'Guest';

        // Moodle 연결 확인
        $moodleConnected = $moodleConnector->checkConnection();

        sendResponse(true, [
            'sessionId' => $sessionId,
            'userId' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'moodleConnected' => $moodleConnected,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } catch (Exception $e) {
        sendResponse(false, null, $e->getMessage());
    }
}

/**
 * 문제 가져오기
 */
function handleGetProblem() {
    global $moodleConnector;

    try {
        $problemId = isset($_POST['problemId']) ? json_decode($_POST['problemId']) : null;

        if ($problemId) {
            // 특정 문제 가져오기
            $problem = $moodleConnector->getProblemById($problemId);
        } else {
            // 랜덤 문제 가져오기
            $problem = $moodleConnector->getRandomProblem();
        }

        if ($problem) {
            sendResponse(true, ['problem' => $problem]);
        } else {
            sendResponse(false, null, 'Problem not found');
        }
    } catch (Exception $e) {
        sendResponse(false, null, $e->getMessage());
    }
}

/**
 * 문제 목록 가져오기
 */
function handleGetProblemList() {
    global $moodleConnector;

    try {
        $problems = $moodleConnector->getProblemList();
        sendResponse(true, ['problems' => $problems]);
    } catch (Exception $e) {
        sendResponse(false, null, $e->getMessage());
    }
}

/**
 * 답안 제출
 */
function handleSubmitAnswer() {
    global $moodleConnector;

    try {
        $data = json_decode($_POST['problemId'], true);
        $problemId = $data;
        $roots = json_decode($_POST['roots'], true);
        $timestamp = json_decode($_POST['timestamp'], true);

        $userId = $_SESSION['user_id'];

        // 답안 평가
        $result = $moodleConnector->evaluateAnswer($problemId, $roots, $userId);

        // 답안 저장
        $moodleConnector->saveAnswer($problemId, $userId, $roots, $result['score'], $timestamp);

        sendResponse(true, [
            'score' => $result['score'],
            'feedback' => $result['feedback'],
            'correct' => $result['correct']
        ]);
    } catch (Exception $e) {
        sendResponse(false, null, $e->getMessage());
    }
}

/**
 * 진행 상황 저장
 */
function handleSaveProgress() {
    global $moodleConnector;

    try {
        $data = json_decode($_POST['problemId'], true);
        $problemId = $data;
        $roots = json_decode($_POST['roots'], true);
        $timestamp = json_decode($_POST['timestamp'], true);

        $userId = $_SESSION['user_id'];

        // 진행 상황 저장
        $saved = $moodleConnector->saveProgress($problemId, $userId, $roots, $timestamp);

        sendResponse(true, ['saved' => $saved]);
    } catch (Exception $e) {
        sendResponse(false, null, $e->getMessage());
    }
}

/**
 * 사용자 정보 가져오기
 */
function handleGetUserInfo() {
    global $moodleConnector;

    try {
        $userId = $_SESSION['user_id'];
        $userInfo = $moodleConnector->getUserInfo($userId);

        sendResponse(true, ['user' => $userInfo]);
    } catch (Exception $e) {
        sendResponse(false, null, $e->getMessage());
    }
}

/**
 * 연결 해제
 */
function handleDisconnect() {
    try {
        session_destroy();
        sendResponse(true, ['message' => 'Disconnected successfully']);
    } catch (Exception $e) {
        sendResponse(false, null, $e->getMessage());
    }
}

/**
 * JSON 응답 전송
 */
function sendResponse($success, $data = null, $error = null) {
    $response = [
        'success' => $success,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    if ($data !== null) {
        $response = array_merge($response, $data);
    }

    if ($error !== null) {
        $response['error'] = $error;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}
