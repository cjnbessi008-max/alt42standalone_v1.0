<?php
/**
 * Truth Rhythm - Authentication API
 */

require_once 'config.php';
require_once 'moodle-connector.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$requestData = getRequestData();
$pdo = getDbConnection();

/**
 * POST /auth - Login
 */
if ($method === 'POST') {
    $action = $_GET['action'] ?? 'login';

    if ($action === 'login') {
        validateParams($requestData, ['username']);

        $username = sanitizeInput($requestData['username']);
        $moodleUserId = $requestData['moodle_user_id'] ?? null;

        // Moodle 사용자 정보 가져오기 (선택사항)
        if (!$moodleUserId) {
            $connector = new MoodleConnector();
            $moodleUser = $connector->getUserInfo($username);

            if ($moodleUser) {
                $moodleUserId = $moodleUser['id'];
                $email = $moodleUser['email'];
            } else {
                // Moodle에서 사용자를 찾을 수 없으면 로컬 사용자로 처리
                $moodleUserId = 0;
                $email = $requestData['email'] ?? $username . '@example.com';
            }
        } else {
            $email = $requestData['email'] ?? $username . '@example.com';
        }

        // 로컬 데이터베이스에서 사용자 확인
        $stmt = $pdo->prepare("
            SELECT * FROM users WHERE username = ?
        ");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        // 사용자가 없으면 생성
        if (!$user) {
            $stmt = $pdo->prepare("
                INSERT INTO users (moodle_user_id, username, email)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$moodleUserId, $username, $email]);
            $userId = $pdo->lastInsertId();

            // 사용자 진도 초기화
            $stmt = $pdo->prepare("
                INSERT INTO user_progress (user_id)
                VALUES (?)
            ");
            $stmt->execute([$userId]);
        } else {
            $userId = $user['id'];

            // Moodle 사용자 ID 업데이트
            if ($moodleUserId && $user['moodle_user_id'] != $moodleUserId) {
                $stmt = $pdo->prepare("
                    UPDATE users SET moodle_user_id = ? WHERE id = ?
                ");
                $stmt->execute([$moodleUserId, $userId]);
            }
        }

        // 세션 설정
        setCurrentUser($userId);

        // 사용자 정보 및 진도 조회
        $stmt = $pdo->prepare("
            SELECT u.*, up.total_questions_attempted, up.total_correct,
                   up.accuracy_rate, up.current_streak, up.best_streak
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $userInfo = $stmt->fetch();

        successResponse([
            'user' => [
                'id' => $userInfo['id'],
                'username' => $userInfo['username'],
                'email' => $userInfo['email'],
                'moodle_user_id' => $userInfo['moodle_user_id']
            ],
            'progress' => [
                'total_questions_attempted' => (int)$userInfo['total_questions_attempted'],
                'total_correct' => (int)$userInfo['total_correct'],
                'accuracy_rate' => (float)$userInfo['accuracy_rate'],
                'current_streak' => (int)$userInfo['current_streak'],
                'best_streak' => (int)$userInfo['best_streak']
            ]
        ], 'Login successful');
    }

    elseif ($action === 'logout') {
        session_destroy();
        successResponse([], 'Logout successful');
    }

    else {
        errorResponse('Invalid action', 400);
    }
}

/**
 * GET /auth - Check session
 */
elseif ($method === 'GET') {
    if (isLoggedIn()) {
        $userId = getCurrentUserId();

        $stmt = $pdo->prepare("
            SELECT u.*, up.total_questions_attempted, up.total_correct,
                   up.accuracy_rate, up.current_streak, up.best_streak
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $userInfo = $stmt->fetch();

        if ($userInfo) {
            successResponse([
                'logged_in' => true,
                'user' => [
                    'id' => $userInfo['id'],
                    'username' => $userInfo['username'],
                    'email' => $userInfo['email']
                ],
                'progress' => [
                    'total_questions_attempted' => (int)$userInfo['total_questions_attempted'],
                    'total_correct' => (int)$userInfo['total_correct'],
                    'accuracy_rate' => (float)$userInfo['accuracy_rate'],
                    'current_streak' => (int)$userInfo['current_streak'],
                    'best_streak' => (int)$userInfo['best_streak']
                ]
            ]);
        }
    }

    successResponse(['logged_in' => false]);
}

else {
    errorResponse('Method not allowed', 405);
}
