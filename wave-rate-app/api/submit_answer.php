<?php
/**
 * Submit Answer API
 * Handles student response submission
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle.php';

try {
    // POST 데이터 파싱
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    $studentId = isset($input['student_id']) ? intval($input['student_id']) : null;
    $problemId = isset($input['problem_id']) ? intval($input['problem_id']) : null;
    $responseData = isset($input['response_data']) ? $input['response_data'] : null;

    if (!$studentId || !$problemId || !$responseData) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: student_id, problem_id, response_data']);
        exit;
    }

    $db = Database::getInstance();
    $conn = $db->getConnection();

    // 문제 정보 조회
    $sql = "SELECT * FROM problems WHERE id = :id";
    $stmt = $db->query($sql, ['id' => $problemId]);
    $problem = $stmt->fetch();

    if (!$problem) {
        http_response_code(404);
        echo json_encode(['error' => 'Problem not found']);
        exit;
    }

    // 정답 검증 로직 (예시)
    $isCorrect = false;
    if (isset($responseData['wave_pattern_match'])) {
        // Wave Rate 패턴 매칭 검증
        $accuracy = floatval($responseData['wave_pattern_match']);
        $isCorrect = $accuracy >= 0.8; // 80% 이상 일치하면 정답
    }

    // 응답 저장
    $sql = "INSERT INTO student_responses
            (student_id, problem_id, response_data, is_correct)
            VALUES (:student_id, :problem_id, :response_data, :is_correct)";

    $params = [
        'student_id' => $studentId,
        'problem_id' => $problemId,
        'response_data' => json_encode($responseData),
        'is_correct' => $isCorrect ? 1 : 0
    ];

    $db->query($sql, $params);
    $responseId = $conn->lastInsertId();

    // Moodle에 성적 제출 (선택적)
    if (isset($input['moodle_attempt_id']) && MOODLE_TOKEN) {
        try {
            $moodle = new MoodleAPI();
            $moodle->submitQuizAnswer(
                $input['moodle_attempt_id'],
                $problem['moodle_question_id'],
                $isCorrect ? 1 : 0
            );
        } catch (Exception $e) {
            error_log("Moodle submission failed: " . $e->getMessage());
            // Moodle 제출 실패해도 로컬 저장은 성공
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'response_id' => $responseId,
            'is_correct' => $isCorrect,
            'accuracy' => isset($responseData['wave_pattern_match']) ? $responseData['wave_pattern_match'] : null,
            'message' => $isCorrect ? '정답입니다!' : '다시 시도해보세요.'
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
