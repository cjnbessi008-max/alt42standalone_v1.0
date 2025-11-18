<?php
/**
 * Get Student Progress API
 * 학생의 학습 진도를 조회하는 API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS 요청 처리 (CORS preflight)
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
        // GET 파라미터 확인
        $data = $_GET;
    }

    // 필수 파라미터 검증
    if (!isset($data['student_id']) || !isset($data['quiz_id'])) {
        sendError('student_id와 quiz_id는 필수입니다.', 400);
    }

    $studentId = filter_var($data['student_id'], FILTER_VALIDATE_INT);
    $quizId = filter_var($data['quiz_id'], FILTER_VALIDATE_INT);

    if ($studentId === false || $quizId === false) {
        sendError('유효하지 않은 ID입니다.', 400);
    }

    // Moodle DB 연결 시도
    try {
        $moodleDB = new MoodleDB();

        // 학생 정보 조회
        $student = $moodleDB->getStudent($studentId);
        if (!$student) {
            sendError('학생을 찾을 수 없습니다.', 404);
        }

        // 퀴즈 정보 조회
        $quiz = $moodleDB->getQuiz($quizId);
        if (!$quiz) {
            sendError('퀴즈를 찾을 수 없습니다.', 404);
        }

        // 진도율 계산
        $progress = $moodleDB->calculateProgress($studentId, $quizId);

        if (!$progress) {
            // 아직 시도하지 않은 경우
            $progress = [
                'total_questions' => $moodleDB->getQuizQuestionCount($quizId),
                'correct_answers' => 0,
                'percentage' => 0,
                'grade' => 0,
                'maxgrade' => $quiz['sumgrades'],
                'state' => 'not_started',
                'attempt_number' => 0
            ];
        }

        // 응답 데이터 구성
        $response = [
            'student_id' => $student['id'],
            'student_name' => $student['firstname'] . ' ' . $student['lastname'],
            'student_email' => $student['email'],
            'quiz_id' => $quiz['id'],
            'quiz_name' => $quiz['name'],
            'total_questions' => $progress['total_questions'],
            'correct_answers' => $progress['correct_answers'],
            'percentage' => round($progress['percentage'], 2),
            'grade' => $progress['grade'],
            'maxgrade' => $progress['maxgrade'],
            'state' => $progress['state'],
            'attempt_number' => $progress['attempt_number'],
            'timestamp' => time()
        ];

        sendSuccess($response, '진도 정보를 성공적으로 조회했습니다.');

    } catch (Exception $e) {
        // DB 연결 실패 시 데모 데이터 반환
        error_log("Moodle DB Error: " . $e->getMessage());

        // 데모 데이터
        $demoData = [
            'student_id' => $studentId,
            'student_name' => '김철수',
            'student_email' => 'demo@example.com',
            'quiz_id' => $quizId,
            'quiz_name' => '분수 학습 퀴즈',
            'total_questions' => 15,
            'correct_answers' => 8,
            'percentage' => 53.33,
            'grade' => 8.0,
            'maxgrade' => 15.0,
            'state' => 'inprogress',
            'attempt_number' => 1,
            'timestamp' => time(),
            'demo_mode' => true
        ];

        sendSuccess($demoData, '데모 데이터를 반환합니다. (DB 연결 실패)');
    }

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendError('서버 오류가 발생했습니다: ' . $e->getMessage(), 500);
}
