<?php
/**
 * Moodle에서 문제 정보 가져오기 API
 */
require_once '../config.php';

header('Content-Type: application/json');

try {
    $problemId = isset($_GET['id']) ? intval($_GET['id']) : null;

    if (!$problemId) {
        throw new Exception('문제 ID가 필요합니다.');
    }

    $pdo = getDBConnection();

    if (!$pdo) {
        throw new Exception('데이터베이스 연결 실패');
    }

    // Moodle 문제 테이블에서 데이터 가져오기
    $stmt = $pdo->prepare("
        SELECT
            p.id,
            p.title,
            p.description,
            p.function_expression,
            p.min_bound,
            p.max_bound,
            p.step_size,
            p.initial_lower,
            p.initial_upper,
            p.correct_lower,
            p.correct_upper,
            q.name as quiz_name,
            c.fullname as course_name,
            c.shortname as course_code
        FROM mdl_boundary_problems p
        LEFT JOIN mdl_quiz q ON p.quiz_id = q.id
        LEFT JOIN mdl_course c ON q.course = c.id
        WHERE p.id = :problem_id
    ");

    $stmt->execute(['problem_id' => $problemId]);
    $problem = $stmt->fetch();

    if (!$problem) {
        throw new Exception('문제를 찾을 수 없습니다.');
    }

    // 응답 데이터 구성
    $response = [
        'success' => true,
        'problem' => [
            'id' => $problem['id'],
            'title' => $problem['title'],
            'description' => $problem['description'],
            'function' => $problem['function_expression'],
            'min_bound' => floatval($problem['min_bound']),
            'max_bound' => floatval($problem['max_bound']),
            'step' => floatval($problem['step_size']),
            'initial_lower' => floatval($problem['initial_lower']),
            'initial_upper' => floatval($problem['initial_upper']),
            'subject' => '미적분학',
            'difficulty' => '중급',
            'quiz_name' => $problem['quiz_name'],
            'course_name' => $problem['course_name'],
            'course_code' => $problem['course_code']
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
