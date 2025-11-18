<?php
/**
 * 답안 제출 및 결과 저장 API
 *
 * 학생의 답안을 받아서 Moodle 데이터베이스에 저장합니다.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// POST 요청만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'POST 요청만 허용됩니다'
    ]);
    exit();
}

try {
    // JSON 데이터 받기
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('잘못된 요청 데이터');
    }

    $questionId = isset($input['questionId']) ? intval($input['questionId']) : null;
    $isCorrect = isset($input['isCorrect']) ? boolval($input['isCorrect']) : false;
    $score = isset($input['score']) ? intval($input['score']) : 0;

    // 세션에서 사용자 ID 가져오기 (실제로는 Moodle 세션 사용)
    session_start();
    $userId = $_SESSION['user_id'] ?? 1; // 개발 모드: 기본값 1

    if ($questionId === null) {
        throw new Exception('문제 ID가 필요합니다');
    }

    $database = getDatabase();
    $conn = $database->getConnection();

    if ($conn === null) {
        throw new Exception('데이터베이스 연결 실패');
    }

    // 답안 저장
    $attemptId = saveAnswer($conn, $userId, $questionId, $isCorrect, $score);

    if ($attemptId) {
        echo json_encode([
            'success' => true,
            'message' => '답안이 저장되었습니다',
            'attemptId' => $attemptId,
            'isCorrect' => $isCorrect,
            'score' => $score,
            'timestamp' => time()
        ]);
    } else {
        throw new Exception('답안 저장 실패');
    }

} catch(Exception $e) {
    error_log("Submit answer error: " . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => time()
    ]);
}

/**
 * 답안 저장
 */
function saveAnswer($conn, $userId, $questionId, $isCorrect, $score) {
    try {
        // inclusion_gate_attempts 테이블에 저장
        // (이 테이블은 별도로 생성해야 함)
        $stmt = $conn->prepare("
            INSERT INTO inclusion_gate_attempts
            (user_id, question_id, is_correct, score, attempt_time)
            VALUES
            (:user_id, :question_id, :is_correct, :score, NOW())
        ");

        $stmt->execute([
            'user_id' => $userId,
            'question_id' => $questionId,
            'is_correct' => $isCorrect ? 1 : 0,
            'score' => $score
        ]);

        return $conn->lastInsertId();

    } catch(Exception $e) {
        // 테이블이 없으면 로그만 남기고 계속 진행 (개발 모드)
        error_log("Save answer error: " . $e->getMessage());
        return null;
    }
}

/**
 * 사용자 통계 업데이트 (선택적)
 */
function updateUserStats($conn, $userId, $isCorrect, $score) {
    try {
        $stmt = $conn->prepare("
            UPDATE inclusion_gate_stats
            SET
                total_attempts = total_attempts + 1,
                correct_attempts = correct_attempts + :correct,
                total_score = total_score + :score,
                last_activity = NOW()
            WHERE user_id = :user_id
        ");

        $stmt->execute([
            'user_id' => $userId,
            'correct' => $isCorrect ? 1 : 0,
            'score' => $score
        ]);

    } catch(Exception $e) {
        error_log("Update user stats error: " . $e->getMessage());
    }
}
?>
