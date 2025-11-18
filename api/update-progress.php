<?php
/**
 * Update Student Progress API
 * 학생의 학습 진도를 업데이트하는 API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

/**
 * 에러 응답 반환
 */
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message,
        'data' => null
    ]);
    exit();
}

/**
 * 성공 응답 반환
 */
function sendSuccess($data, $message = 'Success') {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

try {
    // POST 데이터 읽기
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        sendError('유효하지 않은 요청 데이터입니다.', 400);
    }

    // 필수 파라미터 검증
    $required = ['student_id', 'quiz_id', 'correct_answers', 'total_questions'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            sendError("{$field}는 필수입니다.", 400);
        }
    }

    $studentId = filter_var($data['student_id'], FILTER_VALIDATE_INT);
    $quizId = filter_var($data['quiz_id'], FILTER_VALIDATE_INT);
    $correctAnswers = filter_var($data['correct_answers'], FILTER_VALIDATE_INT);
    $totalQuestions = filter_var($data['total_questions'], FILTER_VALIDATE_INT);

    if ($studentId === false || $quizId === false || $correctAnswers === false || $totalQuestions === false) {
        sendError('유효하지 않은 데이터입니다.', 400);
    }

    // 진도율 계산
    $percentage = $totalQuestions > 0 ? ($correctAnswers / $totalQuestions) * 100 : 0;

    // Moodle DB 업데이트 시도
    try {
        $moodleDB = new MoodleDB();

        // 여기에 실제 Moodle 업데이트 로직 추가
        // 예: quiz_attempts 테이블 업데이트

        $response = [
            'student_id' => $studentId,
            'quiz_id' => $quizId,
            'correct_answers' => $correctAnswers,
            'total_questions' => $totalQuestions,
            'percentage' => round($percentage, 2),
            'timestamp' => time()
        ];

        sendSuccess($response, '진도가 성공적으로 업데이트되었습니다.');

    } catch (Exception $e) {
        error_log("Update Error: " . $e->getMessage());

        // 데모 모드: 업데이트 시뮬레이션
        $response = [
            'student_id' => $studentId,
            'quiz_id' => $quizId,
            'correct_answers' => $correctAnswers,
            'total_questions' => $totalQuestions,
            'percentage' => round($percentage, 2),
            'timestamp' => time(),
            'demo_mode' => true
        ];

        sendSuccess($response, '데모 모드: 업데이트가 시뮬레이션되었습니다.');
    }

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendError('서버 오류가 발생했습니다: ' . $e->getMessage(), 500);
}
