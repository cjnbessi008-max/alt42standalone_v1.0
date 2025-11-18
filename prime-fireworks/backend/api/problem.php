<?php
/**
 * Prime Fireworks API - 문제 조회
 * GET /api/problem.php?user_id={id}&level={difficulty}
 *
 * @author Prime Fireworks Team
 * @version 1.0.0
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/PrimeFactorizer.php';
require_once __DIR__ . '/../moodle-integration/MoodleClient.php';

// 메서드 검증
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendErrorResponse('Method not allowed', 405);
}

// 데이터베이스 연결
$db = getDbConnection();
if (!$db) {
    sendErrorResponse('Database connection failed', 500);
}

// 파라미터 가져오기
$userId = getParam('user_id');
$level = getParam('level', 'medium');

// 유효성 검증
if (!$userId) {
    sendErrorResponse('user_id parameter is required', 400);
}

// 난이도 검증
$validLevels = ['easy', 'medium', 'hard'];
if (!in_array($level, $validLevels)) {
    $level = 'medium';
}

try {
    // 1. 사용자가 아직 풀지 않은 문제 조회
    $stmt = $db->prepare("
        SELECT p.*
        FROM prime_problems p
        LEFT JOIN (
            SELECT problem_id, MAX(submitted_at) as last_attempt
            FROM student_progress
            WHERE moodle_user_id = ? AND is_correct = TRUE
            GROUP BY problem_id
        ) sp ON p.id = sp.problem_id
        WHERE p.is_active = TRUE
            AND p.difficulty_level = ?
            AND sp.problem_id IS NULL
        ORDER BY RAND()
        LIMIT 1
    ");

    if (!$stmt) {
        throw new Exception('Query preparation failed: ' . $db->error);
    }

    $stmt->bind_param('is', $userId, $level);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        // 해당 난이도의 모든 문제를 풀었으면 랜덤으로 제공
        $stmt = $db->prepare("
            SELECT * FROM prime_problems
            WHERE is_active = TRUE AND difficulty_level = ?
            ORDER BY RAND()
            LIMIT 1
        ");
        $stmt->bind_param('s', $level);
        $stmt->execute();
        $result = $stmt->get_result();
    }

    if ($result->num_rows === 0) {
        sendErrorResponse('No problems available for this difficulty level', 404);
    }

    $problem = $result->fetch_assoc();
    $stmt->close();

    // 2. Moodle 연동 (선택적)
    $moodleClient = MoodleHelper::createClient($db);
    $moodleUser = null;

    if ($moodleClient) {
        $moodleUser = $moodleClient->getUser($userId);
    }

    // 3. 응답 데이터 구성
    $responseData = [
        'problem_id' => intval($problem['id']),
        'number' => intval($problem['number_to_factor']),
        'difficulty' => $problem['difficulty_level'],
        'instruction' => "{$problem['number_to_factor']}을(를) 소수의 곱으로 나타내세요",
        'hint' => $problem['hint'],
        'time_limit_seconds' => intval($problem['time_limit_seconds']),
        'user' => [
            'id' => $userId,
            'name' => $moodleUser ? $moodleUser['fullname'] : 'Guest'
        ]
    ];

    // 4. 로그 기록
    logMessage("User $userId requested a problem: Level $level, Number {$problem['number_to_factor']}", 'INFO');

    // 5. 성공 응답
    sendSuccessResponse($responseData);

} catch (Exception $e) {
    logMessage('Error in problem.php: ' . $e->getMessage(), 'ERROR');
    sendErrorResponse('An error occurred while fetching problem', 500);
}

$db->close();
