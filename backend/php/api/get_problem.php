<?php
/**
 * Next Term Vision - 문제 조회 API
 * GET /api/get_problem.php
 *
 * Parameters:
 *   - student_id (required): 학생 ID
 *   - difficulty (optional): 난이도 (1-5)
 *   - type (optional): 문제 유형
 */

require_once 'config.php';

try {
    $pdo = getDbConnection();

    // 파라미터 받기
    $student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;
    $difficulty = isset($_GET['difficulty']) ? intval($_GET['difficulty']) : null;
    $type = isset($_GET['type']) ? sanitizeInput($_GET['type']) : null;

    if ($student_id <= 0) {
        sendJsonResponse(false, null, 'Invalid student_id', 400);
    }

    // 학생 진행 상황 조회
    $stmt = $pdo->prepare("
        SELECT * FROM nextterm_progress
        WHERE student_id = :student_id
    ");
    $stmt->execute(['student_id' => $student_id]);
    $progress = $stmt->fetch();

    // 진행 상황이 없으면 새로 생성
    if (!$progress) {
        $stmt = $pdo->prepare("
            INSERT INTO nextterm_progress (student_id, current_level)
            VALUES (:student_id, 1)
        ");
        $stmt->execute(['student_id' => $student_id]);
        $progress = [
            'student_id' => $student_id,
            'current_level' => 1,
            'total_problems' => 0,
            'correct_answers' => 0
        ];
    }

    // 난이도가 지정되지 않았으면 현재 레벨 사용
    if ($difficulty === null) {
        $difficulty = $progress['current_level'];
    }

    // 문제 조회 쿼리 작성
    $sql = "
        SELECT
            p.id,
            p.problem_type,
            p.sequence_data,
            p.difficulty_level,
            p.hint_text,
            p.animation_type,
            p.correct_answer
        FROM nextterm_problems p
        WHERE p.is_active = 1
        AND p.difficulty_level = :difficulty
    ";

    $params = ['difficulty' => $difficulty];

    // 문제 유형 필터
    if ($type !== null) {
        $sql .= " AND p.problem_type = :type";
        $params['type'] = $type;
    }

    // 이미 푼 문제 제외 (최근 10개)
    $sql .= "
        AND p.id NOT IN (
            SELECT problem_id FROM nextterm_responses
            WHERE student_id = :student_id
            ORDER BY submitted_at DESC
            LIMIT 10
        )
    ";
    $params['student_id'] = $student_id;

    $sql .= " ORDER BY RAND() LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $problem = $stmt->fetch();

    // 문제가 없으면 제외 조건 없이 재시도
    if (!$problem) {
        $sql = "
            SELECT
                p.id,
                p.problem_type,
                p.sequence_data,
                p.difficulty_level,
                p.hint_text,
                p.animation_type,
                p.correct_answer
            FROM nextterm_problems p
            WHERE p.is_active = 1
            AND p.difficulty_level = :difficulty
        ";

        if ($type !== null) {
            $sql .= " AND p.problem_type = :type";
        }

        $sql .= " ORDER BY RAND() LIMIT 1";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_filter($params, function($key) {
            return $key !== 'student_id';
        }, ARRAY_FILTER_USE_KEY));
        $problem = $stmt->fetch();
    }

    if (!$problem) {
        sendJsonResponse(false, null, 'No problems available', 404);
    }

    // sequence_data JSON 파싱
    $problem['sequence_data'] = json_decode($problem['sequence_data']);

    // 정답은 클라이언트에 전송하지 않음 (보안)
    $correct_answer = $problem['correct_answer'];
    unset($problem['correct_answer']);

    // 진행 상황 업데이트
    $stmt = $pdo->prepare("
        UPDATE nextterm_progress
        SET last_problem_id = :problem_id,
            updated_at = NOW()
        WHERE student_id = :student_id
    ");
    $stmt->execute([
        'problem_id' => $problem['id'],
        'student_id' => $student_id
    ]);

    // 응답 데이터 구성
    $responseData = [
        'problem' => $problem,
        'progress' => [
            'current_level' => $progress['current_level'],
            'total_problems' => intval($progress['total_problems']),
            'correct_answers' => intval($progress['correct_answers']),
            'accuracy' => $progress['total_problems'] > 0
                ? round(($progress['correct_answers'] / $progress['total_problems']) * 100, 2)
                : 0
        ]
    ];

    sendJsonResponse(true, $responseData, 'Problem retrieved successfully');

} catch (Exception $e) {
    error_log("Error in get_problem.php: " . $e->getMessage());
    sendJsonResponse(false, null, 'Internal server error', 500);
}
