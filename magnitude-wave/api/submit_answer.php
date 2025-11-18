<?php
/**
 * Submit Answer API
 * 학습자의 답안을 Moodle로 제출하는 API
 */

require_once(__DIR__ . '/../config.php');

try {
    // POST 데이터 읽기
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('잘못된 JSON 형식입니다.');
    }

    // 필수 필드 확인
    if (!isset($data['problem_id']) || !isset($data['magnitude'])) {
        throw new Exception('필수 필드가 누락되었습니다.');
    }

    $problemId = intval($data['problem_id']);
    $magnitude = floatval($data['magnitude']);
    $vectorData = $data['vector'] ?? null;
    $timestamp = $data['timestamp'] ?? date('c');

    logDebug("Submitting answer for problem {$problemId}: magnitude={$magnitude}");

    // 데이터베이스 연결
    $db = getDbConnection();

    if (!$db) {
        throw new Exception('데이터베이스 연결에 실패했습니다.');
    }

    if (defined('STANDALONE_MODE') && STANDALONE_MODE) {
        // 독립 모드: 로컬 데이터베이스에 저장
        $result = saveAnswerToLocalDb($db, $problemId, $magnitude, $vectorData, $timestamp);
    } else {
        // Moodle 모드: Moodle 시스템에 제출
        $result = saveAnswerToMoodle($db, $problemId, $magnitude, $vectorData, $timestamp);
    }

    if ($result) {
        sendJsonResponse([
            'success' => true,
            'message' => '답안이 성공적으로 제출되었습니다.',
            'submission_id' => $result,
            'timestamp' => date('c')
        ]);
    } else {
        throw new Exception('답안 저장에 실패했습니다.');
    }

} catch (Exception $e) {
    logError($e->getMessage());

    sendJsonResponse([
        'success' => false,
        'error' => $e->getMessage()
    ], 400);
}

/**
 * 로컬 데이터베이스에 답안 저장
 */
function saveAnswerToLocalDb($db, $problemId, $magnitude, $vectorData, $timestamp) {
    try {
        $stmt = $db->prepare("
            INSERT INTO submissions
            (problem_id, user_id, magnitude_answer, vector_data, submitted_at, created_at)
            VALUES
            (:problem_id, :user_id, :magnitude, :vector_data, :submitted_at, NOW())
        ");

        $userId = $_SESSION['user_id'] ?? 1; // 데모용 기본값

        $stmt->execute([
            'problem_id' => $problemId,
            'user_id' => $userId,
            'magnitude' => $magnitude,
            'vector_data' => json_encode($vectorData),
            'submitted_at' => $timestamp
        ]);

        return $db->lastInsertId();

    } catch (PDOException $e) {
        logError("Database insert error: " . $e->getMessage());
        return false;
    }
}

/**
 * Moodle 시스템에 답안 제출
 */
function saveAnswerToMoodle($db, $problemId, $magnitude, $vectorData, $timestamp) {
    global $DB, $USER;

    try {
        // Moodle의 question_attempts 테이블에 저장
        // 실제 구현은 Moodle의 Question Engine API를 사용해야 함

        $attempt = new stdClass();
        $attempt->questionid = $problemId;
        $attempt->userid = $USER->id;
        $attempt->timemodified = time();
        $attempt->responsesummary = "Magnitude: {$magnitude}";

        // custom data 저장 (vector 정보)
        if ($vectorData) {
            $attempt->responsedata = json_encode([
                'magnitude' => $magnitude,
                'vector' => $vectorData
            ]);
        }

        $attemptId = $DB->insert_record('question_attempts', $attempt);

        // 추가로 quiz_attempts나 다른 관련 테이블 업데이트 필요
        // 실제 Moodle 연동 시 Question Engine API 사용 권장

        return $attemptId;

    } catch (Exception $e) {
        logError("Moodle submission error: " . $e->getMessage());
        return false;
    }
}
