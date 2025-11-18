<?php
/**
 * Moodle에 답안 제출
 * POST /php/submit_answer.php
 */

require_once 'config.php';

// POST 요청 확인
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('Invalid request method', 405);
}

// JSON 데이터 파싱
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    sendErrorResponse('Invalid JSON data');
}

// 필수 파라미터 확인
$problemId = isset($data['problemId']) ? intval($data['problemId']) : 0;
$answer = isset($data['answer']) ? $data['answer'] : null;
$userId = isset($data['userId']) ? intval($data['userId']) : 0;
$timestamp = isset($data['timestamp']) ? $data['timestamp'] : date('c');

if ($problemId <= 0 || $answer === null) {
    sendErrorResponse('Missing required parameters');
}

// 데이터베이스 연결
$db = getDBConnection();
if (!$db) {
    sendErrorResponse('Database connection failed', 500);
}

try {
    // 정답 조회
    $stmt = $db->prepare("
        SELECT
            q.id,
            q.questiontext,
            q.defaultmark
        FROM " . MOODLE_TABLE_PREFIX . "question q
        WHERE q.id = :problemId
        LIMIT 1
    ");

    $stmt->execute([':problemId' => $problemId]);
    $problem = $stmt->fetch();

    if (!$problem) {
        sendErrorResponse('Problem not found', 404);
    }

    // 정답 계산
    $questionData = parseQuestionText($problem['questiontext']);
    $correctAnswer = array_diff($questionData['setA'], $questionData['setB']);
    $correctAnswer = array_values($correctAnswer); // 재인덱싱

    // 답안 비교
    sort($answer);
    sort($correctAnswer);

    $isCorrect = ($answer === $correctAnswer);
    $score = $isCorrect ? $problem['defaultmark'] : 0;

    // 답안 저장 (커스텀 테이블)
    // 주의: 실제 환경에서는 Moodle의 question_attempts 등에 저장
    $tableName = MOODLE_TABLE_PREFIX . 'waveminus_attempts';

    // 테이블이 없으면 생성
    createAttemptsTableIfNotExists($db, $tableName);

    $stmt = $db->prepare("
        INSERT INTO $tableName
        (problemid, userid, answer, is_correct, score, submitted_at)
        VALUES
        (:problemId, :userId, :answer, :isCorrect, :score, :timestamp)
    ");

    $stmt->execute([
        ':problemId' => $problemId,
        ':userId' => $userId,
        ':answer' => json_encode($answer),
        ':isCorrect' => $isCorrect ? 1 : 0,
        ':score' => $score,
        ':timestamp' => $timestamp
    ]);

    $attemptId = $db->lastInsertId();

    // 피드백 생성
    $feedback = generateFeedback($isCorrect, $answer, $correctAnswer);

    // 응답 데이터
    $response = [
        'success' => true,
        'attemptId' => $attemptId,
        'isCorrect' => $isCorrect,
        'score' => $score,
        'maxScore' => $problem['defaultmark'],
        'feedback' => $feedback,
        'correctAnswer' => $correctAnswer,
        'timestamp' => date('c')
    ];

    sendJsonResponse($response);

} catch (PDOException $e) {
    logError('Submit error: ' . $e->getMessage());
    sendErrorResponse('Failed to submit answer', 500);
}

/**
 * 답안 제출 테이블 생성
 */
function createAttemptsTableIfNotExists($db, $tableName) {
    $sql = "
        CREATE TABLE IF NOT EXISTS $tableName (
            id INT AUTO_INCREMENT PRIMARY KEY,
            problemid INT NOT NULL,
            userid INT DEFAULT 0,
            answer TEXT NOT NULL,
            is_correct TINYINT(1) DEFAULT 0,
            score DECIMAL(10,5) DEFAULT 0,
            submitted_at VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_problemid (problemid),
            INDEX idx_userid (userid)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";

    $db->exec($sql);
}

/**
 * 문제 텍스트 파싱 (get_problem.php와 동일)
 */
function parseQuestionText($questionText) {
    if (preg_match('/\{.*"setA".*"setB".*\}/', $questionText, $matches)) {
        $data = json_decode($matches[0], true);
        if ($data) {
            return $data;
        }
    }

    if (preg_match('/A=\{([^}]+)\}.*B=\{([^}]+)\}/', $questionText, $matches)) {
        $setA = array_map('intval', array_map('trim', explode(',', $matches[1])));
        $setB = array_map('intval', array_map('trim', explode(',', $matches[2])));

        return [
            'setA' => $setA,
            'setB' => $setB
        ];
    }

    return [
        'setA' => [1, 2, 3, 4, 5, 6, 7],
        'setB' => [4, 5, 6, 7, 8, 9, 10]
    ];
}

/**
 * 피드백 메시지 생성
 */
function generateFeedback($isCorrect, $userAnswer, $correctAnswer) {
    if ($isCorrect) {
        return '정답입니다! 🎉 차집합을 올바르게 구했습니다.';
    }

    $missing = array_diff($correctAnswer, $userAnswer);
    $extra = array_diff($userAnswer, $correctAnswer);

    $feedback = '아쉽게도 틀렸습니다. ';

    if (!empty($missing)) {
        $feedback .= '빠진 원소: ' . implode(', ', $missing) . '. ';
    }

    if (!empty($extra)) {
        $feedback .= '불필요한 원소: ' . implode(', ', $extra) . '. ';
    }

    $feedback .= '다시 한번 생각해보세요!';

    return $feedback;
}
?>
