<?php
/**
 * Session Management API
 * 세션 관리 API
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDbConnection();

    // 세션 시작 (POST)
    if ($method === 'POST') {
        $data = getPostData();

        if (!isset($data['moodle_user_id'])) {
            errorResponse('Missing moodle_user_id', 400);
        }

        $moodleUserId = (int)$data['moodle_user_id'];
        $deviceInfo = isset($data['device_info']) ? $data['device_info'] : 'Unknown';

        // 기존 활성 세션 비활성화
        $deactivateStmt = $db->prepare("
            UPDATE learning_sessions
            SET is_active = 0
            WHERE moodle_user_id = :user_id AND is_active = 1
        ");
        $deactivateStmt->execute(['user_id' => $moodleUserId]);

        // 새 세션 생성
        $sessionToken = generateSessionToken();
        $insertStmt = $db->prepare("
            INSERT INTO learning_sessions
            (moodle_user_id, session_token, device_info)
            VALUES (:user_id, :token, :device_info)
        ");
        $insertStmt->execute([
            'user_id' => $moodleUserId,
            'token' => $sessionToken,
            'device_info' => $deviceInfo
        ]);

        successResponse([
            'session_token' => $sessionToken,
            'session_id' => (int)$db->lastInsertId(),
            'expires_in' => 86400  // 24시간
        ], 'Session created successfully');
    }

    // 세션 검증 (GET)
    if ($method === 'GET') {
        $token = getParam('token');

        if (!$token) {
            errorResponse('Missing session token', 400);
        }

        $session = validateSession($token);

        if (!$session) {
            errorResponse('Invalid or expired session', 401);
        }

        // 마지막 활동 시간 업데이트
        $updateStmt = $db->prepare("
            UPDATE learning_sessions
            SET last_activity = NOW()
            WHERE session_token = :token
        ");
        $updateStmt->execute(['token' => $token]);

        successResponse([
            'session_id' => (int)$session['id'],
            'moodle_user_id' => (int)$session['moodle_user_id'],
            'started_at' => $session['started_at'],
            'is_valid' => true
        ], 'Session is valid');
    }

    // 세션 종료 (DELETE)
    if ($method === 'DELETE') {
        $data = getPostData();

        if (!isset($data['session_token'])) {
            errorResponse('Missing session token', 400);
        }

        $stmt = $db->prepare("
            UPDATE learning_sessions
            SET is_active = 0
            WHERE session_token = :token
        ");
        $stmt->execute(['token' => $data['session_token']]);

        successResponse(null, 'Session ended successfully');
    }

} catch (PDOException $e) {
    errorResponse('Database error', 500, $e->getMessage());
} catch (Exception $e) {
    errorResponse('Server error', 500, $e->getMessage());
}
