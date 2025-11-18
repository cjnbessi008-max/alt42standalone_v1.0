<?php
/**
 * 답안 제출 및 Moodle에 저장 API
 */
require_once '../config.php';

header('Content-Type: application/json');

try {
    // POST 데이터 받기
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('잘못된 요청 데이터입니다.');
    }

    $problemId = isset($input['problem_id']) ? intval($input['problem_id']) : null;
    $lowerBound = isset($input['lower_bound']) ? floatval($input['lower_bound']) : null;
    $upperBound = isset($input['upper_bound']) ? floatval($input['upper_bound']) : null;
    $timestamp = isset($input['timestamp']) ? $input['timestamp'] : date('Y-m-d H:i:s');

    if ($lowerBound === null || $upperBound === null) {
        throw new Exception('경계값이 필요합니다.');
    }

    if ($lowerBound >= $upperBound) {
        throw new Exception('하한이 상한보다 작아야 합니다.');
    }

    $pdo = getDBConnection();

    if (!$pdo) {
        throw new Exception('데이터베이스 연결 실패');
    }

    // 세션에서 사용자 ID 가져오기 (Moodle 세션 연동)
    session_start();
    $userId = isset($_SESSION['USER']->id) ? $_SESSION['USER']->id : 1; // 데모: 기본값 1

    // 문제의 정답 확인
    $stmt = $pdo->prepare("
        SELECT correct_lower, correct_upper, tolerance
        FROM mdl_boundary_problems
        WHERE id = :problem_id
    ");
    $stmt->execute(['problem_id' => $problemId]);
    $problem = $stmt->fetch();

    $isCorrect = false;
    $score = 0;

    if ($problem) {
        $tolerance = floatval($problem['tolerance'] ?: 0.1);
        $correctLower = floatval($problem['correct_lower']);
        $correctUpper = floatval($problem['correct_upper']);

        // 허용 오차 범위 내에서 정답 확인
        $lowerCorrect = abs($lowerBound - $correctLower) <= $tolerance;
        $upperCorrect = abs($upperBound - $correctUpper) <= $tolerance;

        $isCorrect = $lowerCorrect && $upperCorrect;
        $score = $isCorrect ? 100 : 0;
    }

    // 답안 저장
    $stmt = $pdo->prepare("
        INSERT INTO mdl_boundary_answers
        (problem_id, user_id, lower_bound, upper_bound, is_correct, score, submitted_at)
        VALUES
        (:problem_id, :user_id, :lower_bound, :upper_bound, :is_correct, :score, :submitted_at)
    ");

    $stmt->execute([
        'problem_id' => $problemId,
        'user_id' => $userId,
        'lower_bound' => $lowerBound,
        'upper_bound' => $upperBound,
        'is_correct' => $isCorrect ? 1 : 0,
        'score' => $score,
        'submitted_at' => $timestamp
    ]);

    $answerId = $pdo->lastInsertId();

    // Moodle 성적부에 기록 (선택적)
    if ($problemId && $isCorrect) {
        // Moodle grades API 호출 로직 추가 가능
        // require_once(MOODLE_DIR . '/lib/gradelib.php');
    }

    $response = [
        'success' => true,
        'message' => $isCorrect ? '정답입니다!' : '오답입니다. 다시 시도해보세요.',
        'data' => [
            'answer_id' => $answerId,
            'is_correct' => $isCorrect,
            'score' => $score,
            'submitted_bounds' => [
                'lower' => $lowerBound,
                'upper' => $upperBound
            ]
        ]
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
