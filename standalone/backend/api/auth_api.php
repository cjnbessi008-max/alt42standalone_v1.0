<?php
/**
 * 인증 API 엔드포인트
 * POST /api/auth_api.php?action=register|login|logout|me
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth/auth.php';

$pdo = getDbConnection();
$auth = new Auth($pdo);

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// POST 데이터 받기
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'register':
        if ($method !== 'POST') {
            sendJsonResponse(false, null, 'Method not allowed', 405);
        }

        validateRequired($input, ['username', 'email', 'password', 'full_name']);

        $result = $auth->register(
            $input['username'],
            $input['email'],
            $input['password'],
            $input['full_name'],
            $input['grade_level'] ?? 1
        );

        sendJsonResponse($result['success'], $result['user_id'] ?? null, $result['message']);
        break;

    case 'login':
        if ($method !== 'POST') {
            sendJsonResponse(false, null, 'Method not allowed', 405);
        }

        validateRequired($input, ['username', 'password']);

        $result = $auth->login($input['username'], $input['password']);

        sendJsonResponse($result['success'], $result['user'] ?? null, $result['message']);
        break;

    case 'logout':
        $result = $auth->logout();
        sendJsonResponse($result['success'], null, $result['message']);
        break;

    case 'me':
        $auth->requireAuth();

        $user = $auth->getCurrentUser();
        sendJsonResponse(true, $user, 'User info retrieved');
        break;

    case 'change-password':
        if ($method !== 'POST') {
            sendJsonResponse(false, null, 'Method not allowed', 405);
        }

        $auth->requireAuth();
        validateRequired($input, ['old_password', 'new_password']);

        $result = $auth->changePassword(
            $_SESSION['user_id'],
            $input['old_password'],
            $input['new_password']
        );

        sendJsonResponse($result['success'], null, $result['message']);
        break;

    case 'update-profile':
        if ($method !== 'POST') {
            sendJsonResponse(false, null, 'Method not allowed', 405);
        }

        $auth->requireAuth();

        $result = $auth->updateProfile($_SESSION['user_id'], $input);
        sendJsonResponse($result['success'], null, $result['message']);
        break;

    default:
        sendJsonResponse(false, null, 'Invalid action', 400);
}
